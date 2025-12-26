import requests
import json
from typing import Optional, Dict, Any
from config.settings import settings
from utils.logger import logger

class KVClient:
    """
    Backend API client (NOT direct KV access)
    Colab cannot access KV directly - must go through backend API
    """
    
    def __init__(self, backend_url: str = None):
        self.backend_url = backend_url or settings.BACKEND_URL
        self.session = requests.Session()
        
        # Get authentication headers
        self.colab_id = settings.COLAB_ID
        self.claim_secret = settings.CLAIM_SECRET
        
        # Set default headers
        self.session.headers.update({
            "Content-Type": "application/json",
            "X-Colab-Secret": self.claim_secret,
            "X-Colab-Id": self.colab_id
        })
        
    def _build_url(self, endpoint: str) -> str:
        """Build full API URL"""
        # Ensure no double slashes
        endpoint = endpoint.lstrip('/')
        return f"{self.backend_url}/{endpoint}"
        
    def get(self, key: str) -> Optional[Any]:
        """
        Legacy method - DO NOT USE
        Colab cannot access KV directly!
        """
        logger.error(f"❌ CRITICAL: Attempted direct KV access for key: {key}")
        logger.error("Colab CANNOT access KV directly - this is a bug!")
        logger.error("Use get_project_meta() or other API methods instead")
        raise RuntimeError(f"Direct KV access not allowed from Colab. Key: {key}")
            
    def put(self, key: str, value: Any) -> bool:
        """
        Legacy method - DO NOT USE
        Colab cannot access KV directly!
        """
        logger.error(f"❌ CRITICAL: Attempted direct KV write for key: {key}")
        logger.error("Colab CANNOT access KV directly - this is a bug!")
        raise RuntimeError(f"Direct KV access not allowed from Colab. Key: {key}")
            
    def get_project_meta(self, project_id: str) -> Optional[Dict]:
        """Get project metadata via backend API (Colab-specific endpoint)"""
        try:
            # Use Colab-specific endpoint that accepts Colab auth
            url = self._build_url(f"api/colab/projects/{project_id}")
            
            logger.info(f"🔍 Fetching project metadata from: {url}")
            logger.debug(f"Headers: X-Colab-Id={self.colab_id}")
            
            response = self.session.get(url, timeout=30)
            
            logger.debug(f"Response status: {response.status_code}")
            logger.debug(f"Response headers: {dict(response.headers)}")
            logger.debug(f"Response body (first 500 chars): {response.text[:500]}")
            
            # Handle different status codes
            if response.status_code == 404:
                logger.warning(f"⚠️ Project not found: {project_id}")
                return None
            
            if response.status_code == 401:
                logger.error("❌ Authentication failed!")
                logger.error("Check that COLAB_AGENT_SECRET matches Cloudflare")
                logger.error(f"Response: {response.text}")
                return None
            
            if response.status_code == 403:
                logger.error("❌ Forbidden - insufficient permissions")
                logger.error(f"Response: {response.text}")
                return None
                
            if response.status_code != 200:
                logger.error(f"❌ Unexpected status code: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return None
            
            # Try to parse JSON
            try:
                data = response.json()
                logger.info(f"✅ Got project metadata: {project_id}")
                logger.debug(f"Project data: {data}")
                return data
            except Exception as json_err:
                logger.error(f"❌ Failed to parse JSON response")
                logger.error(f"Response text: {response.text}")
                logger.error(f"JSON error: {str(json_err)}")
                return None
            
        except requests.exceptions.Timeout:
            logger.error(f"❌ Request timeout for project {project_id}")
            raise
        except requests.exceptions.ConnectionError as e:
            logger.error(f"❌ Connection error: {str(e)}")
            logger.error(f"Backend URL: {self.backend_url}")
            logger.error("Check that backend is accessible")
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error getting project metadata: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise
        
    def update_job_state(
        self, 
        project_id: str, 
        job_id: str, 
        state: str,
        result: Optional[Dict] = None
    ) -> bool:
        """Update job state via backend API"""
        try:
            url = self._build_url(f"api/jobs/{job_id}")
            
            payload = {
                "state": state,
                "updatedAt": self._get_timestamp()
            }
            
            if result:
                payload["result"] = result
            
            logger.debug(f"Updating job state: {job_id} -> {state}")
            
            response = self.session.patch(url, json=payload, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"Failed to update job: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return False
            
            logger.info(f"✅ Updated job state: {job_id} -> {state}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update job state: {str(e)}")
            return False
        
    def append_log_segment(
        self,
        project_id: str,
        job_id: str,
        segment_num: int,
        log_lines: list
    ) -> bool:
        """
        Append log segment via backend API
        NOTE: Backend expects individual log entries, not segments
        """
        try:
            url = self._build_url(f"api/jobs/{job_id}/logs")
            
            # Send each log entry individually
            success = True
            for log_entry in log_lines:
                response = self.session.post(url, json=log_entry, timeout=30)
                if response.status_code not in [200, 201]:
                    logger.warning(f"Failed to append log: {response.status_code}")
                    success = False
            
            return success
            
        except Exception as e:
            logger.warning(f"Failed to append logs: {str(e)}")
            return False
        
    def update_faiss_manifest(
        self,
        project_id: str,
        manifest: Dict
    ) -> bool:
        """
        Update FAISS index manifest
        NOTE: This would need a backend endpoint
        """
        logger.debug(f"FAISS manifest update for {project_id}: {manifest}")
        # For now, just return True since we don't have backend endpoint
        return True
        
    def store_artifact_metadata(
        self,
        project_id: str,
        build_id: str,
        metadata: Dict
    ) -> bool:
        """
        Store artifact metadata
        NOTE: This would need a backend endpoint
        """
        logger.debug(f"Artifact metadata for {project_id}/{build_id}: {metadata}")
        # For now, just return True since we don't have backend endpoint
        return True
        
    @staticmethod
    def _get_timestamp() -> str:
        """Get current UTC timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"

# Global KV client instance
kv_client = KVClient()
