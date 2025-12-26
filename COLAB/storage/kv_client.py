import requests
import json
from typing import Optional, Dict, Any, List
from config.settings import settings
from config.secrets import secret_manager
from utils.logger import logger
from utils.retry import retry_decorator

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
        return f"{self.backend_url}{endpoint}"
        
    @retry_decorator(max_retries=3, base_delay=1)
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from backend (simulating KV)
        NOTE: This is NOT real KV access - it's an API call
        """
        logger.warning(f"Attempted KV GET for key: {key}")
        logger.warning("Colab cannot access KV directly - use backend API instead!")
        return None
            
    @retry_decorator(max_retries=3, base_delay=1)
    def put(self, key: str, value: Any) -> bool:
        """
        Put value to backend (simulating KV)
        NOTE: This is NOT real KV access - it's an API call
        """
        logger.warning(f"Attempted KV PUT for key: {key}")
        logger.warning("Colab cannot access KV directly - use backend API instead!")
        return False
            
    def get_project_meta(self, project_id: str) -> Optional[Dict]:
        """Get project metadata via backend API"""
        try:
            url = self._build_url(f"/api/projects/{project_id}")
            
            logger.debug(f"Fetching project metadata: {url}")
            
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 404:
                logger.warning(f"Project not found: {project_id}")
                return None
            
            if response.status_code != 200:
                logger.error(f"Failed to get project: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return None
            
            data = response.json()
            logger.info(f"✅ Got project metadata: {project_id}")
            return data
            
        except Exception as e:
            logger.error(f"Failed to get project metadata: {str(e)}")
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
            url = self._build_url(f"/api/jobs/{job_id}")
            
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
        log_entry: Dict
    ) -> bool:
        """Append log segment via backend API"""
        try:
            url = self._build_url(f"/api/jobs/{job_id}/logs")
            
            logger.debug(f"Appending log for job: {job_id}")
            
            response = self.session.post(url, json=log_entry, timeout=30)
            
            if response.status_code not in [200, 201]:
                logger.warning(f"Failed to append log: {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            logger.warning(f"Failed to append log: {str(e)}")
            return False
        
    def update_faiss_manifest(
        self,
        project_id: str,
        manifest: Dict
    ) -> bool:
        """
        Update FAISS index manifest
        NOTE: This would need a backend endpoint - for now just log
        """
        logger.info(f"FAISS manifest update requested for {project_id}")
        logger.debug(f"Manifest: {manifest}")
        # TODO: Create backend endpoint for FAISS manifest updates
        return True
        
    def store_artifact_metadata(
        self,
        project_id: str,
        build_id: str,
        metadata: Dict
    ) -> bool:
        """
        Store artifact metadata
        NOTE: This would need a backend endpoint - for now just log
        """
        logger.info(f"Artifact metadata storage requested for {project_id}/{build_id}")
        logger.debug(f"Metadata: {metadata}")
        # TODO: Create backend endpoint for artifact metadata
        return True
        
    @staticmethod
    def _get_timestamp() -> str:
        """Get current UTC timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"

# Global KV client instance
kv_client = KVClient()
