import time
import requests
from typing import Optional, Dict, Any
from datetime import datetime
from config.settings import settings
from utils.logger import logger
from utils.retry import retry_decorator

class Job:
    """Job data model"""
    
    def __init__(self, data: Dict[str, Any]):
        self.id = data["jobId"]
        self.project_id = data["projectId"]
        self.type = data["type"]
        self.state = data.get("state", "pending")
        self.payload = data.get("payload", {})
        self.created_at = data.get("createdAt")
        self.claimed_at = None
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "projectId": self.project_id,
            "type": self.type,
            "state": self.state,
            "payload": self.payload,
            "createdAt": self.created_at,
            "claimedAt": self.claimed_at
        }

class JobManager:
    """Manage job lifecycle: claim, execute, update, complete"""
    
    def __init__(self):
        self.backend_url = settings.BACKEND_URL
        self.colab_id = settings.COLAB_ID
        self.claim_secret = settings.CLAIM_SECRET
        self.current_job: Optional[Job] = None
        self.session = requests.Session()
        
    @retry_decorator(max_retries=3, base_delay=2)
    def claim_job(self) -> Optional[Job]:
        """
        Poll backend to claim next available job
        Returns Job object or None if no jobs available
        """
        try:
            url = f"{self.backend_url}/api/jobs/claim"
            
            # FIXED: Proper authentication headers
            headers = {
                "Content-Type": "application/json",
                "X-Colab-Secret": self.claim_secret,
                "X-Colab-Id": self.colab_id
            }
            
            logger.debug(f"Attempting to claim job from {url}")
            logger.debug(f"Headers: Colab-Id={self.colab_id}, Secret={'*' * 20}")
            
            response = self.session.post(
                url,
                headers=headers,
                timeout=30
            )
            
            logger.debug(f"Response status: {response.status_code}")
            
            # FIXED: Handle 204 (no jobs) correctly
            if response.status_code == 204:
                logger.debug("No jobs available (204)")
                return None
            
            # FIXED: Handle 200 with proper error checking
            if response.status_code == 200:
                try:
                    job_data = response.json()
                    logger.debug(f"Response data: {job_data}")
                    
                    # FIXED: Check if job is actually present
                    if not job_data:
                        logger.debug("Empty response body")
                        return None
                    
                    # FIXED: Handle both {job: {...}} and direct job object
                    if "job" in job_data:
                        job_info = job_data["job"]
                        if job_info is None:
                            logger.debug("Job field is null")
                            return None
                    else:
                        # Response might be the job directly
                        job_info = job_data
                    
                    # FIXED: Validate required fields
                    required_fields = ["jobId", "projectId", "type"]
                    for field in required_fields:
                        if field not in job_info:
                            logger.error(f"Missing required field: {field}")
                            logger.error(f"Job data: {job_info}")
                            return None
                    
                    job = Job(job_info)
                    job.claimed_at = datetime.utcnow().isoformat() + "Z"
                    
                    self.current_job = job
                    
                    logger.info(
                        f"✅ Claimed job: {job.id}",
                        meta={
                            "job_id": job.id,
                            "project_id": job.project_id,
                            "type": job.type
                        }
                    )
                    
                    # Immediately update state to 'running'
                    self.update_job_state("running")
                    
                    return job
                    
                except Exception as e:
                    logger.error(f"Failed to parse job response: {str(e)}")
                    logger.error(f"Response text: {response.text}")
                    return None
            
            # FIXED: Handle authentication errors
            if response.status_code == 401:
                logger.error("❌ Authentication failed - check COLAB_AGENT_SECRET")
                logger.error("Response: " + response.text)
                return None
            
            # Handle other errors
            logger.error(f"Unexpected status code: {response.status_code}")
            logger.error(f"Response: {response.text}")
            return None
                
        except requests.exceptions.Timeout:
            logger.error("Request timeout while claiming job")
            return None
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Job claim request failed: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response body: {e.response.text}")
            return None
            
        except Exception as e:
            logger.error(f"❌ Unexpected error claiming job: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return None
            
    @retry_decorator(max_retries=3, base_delay=1)
    def update_job_state(
        self,
        state: str,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ) -> bool:
        """Update job state in backend"""
        if not self.current_job:
            logger.warning("No current job to update")
            return False
            
        try:
            url = f"{self.backend_url}/api/jobs/{self.current_job.id}"
            
            headers = {
                "Content-Type": "application/json",
                "X-Colab-Secret": self.claim_secret,
                "X-Colab-Id": self.colab_id
            }
            
            payload = {
                "state": state,
                "updatedAt": datetime.utcnow().isoformat() + "Z"
            }
            
            if result:
                payload["result"] = result
                
            if error:
                payload["error"] = error
            
            logger.debug(f"Updating job state to: {state}")
            
            response = self.session.patch(
                url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to update job state: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return False
            
            self.current_job.state = state
            
            logger.info(
                f"✅ Job state updated: {state}",
                meta={"job_id": self.current_job.id}
            )
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to update job state: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            return False
            
    def mark_running(self) -> bool:
        """Mark job as running"""
        return self.update_job_state("running")
        
    def mark_completed(self, result: Dict[str, Any]) -> bool:
        """Mark job as completed with result"""
        return self.update_job_state("completed", result=result)
        
    def mark_failed(self, error: str) -> bool:
        """Mark job as failed with error"""
        return self.update_job_state("failed", error=error)
        
    def release_job(self):
        """Release current job"""
        if self.current_job:
            logger.info(f"Releasing job: {self.current_job.id}")
            self.current_job = None
            
    def poll_loop(self, callback, interval: int = None):
        """
        Main polling loop
        
        Args:
            callback: Function to call when job is claimed
            interval: Poll interval in seconds (default from settings)
        """
        interval = interval or settings.POLL_INTERVAL
        
        logger.info(f"🚀 Starting job polling loop (interval: {interval}s)")
        logger.info(f"Backend: {self.backend_url}")
        logger.info(f"Colab ID: {self.colab_id}")
        
        consecutive_failures = 0
        consecutive_empty = 0
        
        while True:
            try:
                logger.debug(f"Polling for jobs (attempt {consecutive_empty + 1})...")
                
                job = self.claim_job()
                
                if job:
                    # Reset counters on success
                    consecutive_failures = 0
                    consecutive_empty = 0
                    
                    logger.info(f"📋 Executing job: {job.id} (type: {job.type})")
                    
                    # Execute callback with job
                    try:
                        callback(job)
                        logger.info(f"✅ Job {job.id} completed successfully")
                    except Exception as e:
                        logger.error(
                            f"❌ Job execution failed: {str(e)}",
                            meta={"job_id": job.id}
                        )
                        import traceback
                        logger.error(traceback.format_exc())
                        self.mark_failed(str(e))
                    finally:
                        self.release_job()
                else:
                    consecutive_empty += 1
                    
                    if consecutive_empty == 1:
                        logger.debug("No jobs available")
                    elif consecutive_empty == 10:
                        logger.info("⏳ Still waiting for jobs (10 attempts)")
                    elif consecutive_empty % 50 == 0:
                        logger.info(f"⏳ Still polling... ({consecutive_empty} attempts)")
                    
                time.sleep(interval)
                
            except KeyboardInterrupt:
                logger.info("🛑 Polling loop interrupted by user")
                break
                
            except Exception as e:
                consecutive_failures += 1
                logger.error(f"❌ Error in polling loop (failure {consecutive_failures}): {str(e)}")
                import traceback
                logger.error(traceback.format_exc())
                
                if consecutive_failures >= 5:
                    logger.error("❌ Too many consecutive failures, stopping")
                    break
                
                time.sleep(interval * 2)  # Wait longer after error

# Global job manager instance
job_manager = JobManager()
