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
        self.id = data["id"]
        self.project_id = data["projectId"]
        self.type = data["type"]
        self.state = data.get("state", "pending")
        self.payload = data.get("payload", {})
        self.created_at = data.get("createdAt")
        self.claimed_at = None
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
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
            
            payload = {
                "colabId": self.colab_id,
                "claimSecret": self.claim_secret
            }
            
            response = self.session.post(
                url,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 204:
                # No jobs available
                return None
                
            response.raise_for_status()
            
            job_data = response.json()
            
            if not job_data:
                return None
                
            job = Job(job_data)
            job.claimed_at = datetime.utcnow().isoformat() + "Z"
            
            self.current_job = job
            
            logger.info(
                f"Claimed job: {job.id}",
                meta={
                    "job_id": job.id,
                    "project_id": job.project_id,
                    "type": job.type
                }
            )
            
            # Immediately update state to 'claimed'
            self.update_job_state("claimed")
            
            return job
            
        except requests.exceptions.RequestException as e:
            logger.debug(f"Job claim failed (will retry): {str(e)}")
            return None
            
        except Exception as e:
            logger.error(f"Unexpected error claiming job: {str(e)}")
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
            
            payload = {
                "state": state,
                "updatedAt": datetime.utcnow().isoformat() + "Z"
            }
            
            if result:
                payload["result"] = result
                
            if error:
                payload["error"] = error
                
            response = self.session.patch(
                url,
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            
            self.current_job.state = state
            
            logger.info(
                f"Job state updated: {state}",
                meta={"job_id": self.current_job.id}
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update job state: {str(e)}")
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
        
        logger.info(f"Starting job polling loop (interval: {interval}s)")
        
        while True:
            try:
                job = self.claim_job()
                
                if job:
                    # Execute callback with job
                    try:
                        callback(job)
                    except Exception as e:
                        logger.error(
                            f"Job execution failed: {str(e)}",
                            meta={"job_id": job.id}
                        )
                        self.mark_failed(str(e))
                    finally:
                        self.release_job()
                else:
                    # No job available, wait
                    logger.debug("No jobs available, waiting...")
                    
                time.sleep(interval)
                
            except KeyboardInterrupt:
                logger.info("Polling loop interrupted")
                break
                
            except Exception as e:
                logger.error(f"Error in polling loop: {str(e)}")
                time.sleep(interval)

# Global job manager instance
job_manager = JobManager()