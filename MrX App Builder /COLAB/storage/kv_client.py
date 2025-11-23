import requests
import json
from typing import Optional, Dict, Any, List
from config.settings import settings
from utils.logger import logger
from utils.retry import retry_decorator

class KVClient:
    """Workers KV API client for metadata and log storage"""
    
    def __init__(self, backend_url: str = None):
        self.backend_url = backend_url or settings.BACKEND_URL
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json"
        })
        
    def _build_url(self, endpoint: str) -> str:
        """Build full API URL"""
        return f"{self.backend_url}/api/kv{endpoint}"
        
    @retry_decorator(max_retries=3, base_delay=1)
    def get(self, key: str) -> Optional[Any]:
        """Get value from KV"""
        try:
            url = self._build_url(f"/{key}")
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 404:
                return None
                
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            logger.error(f"KV GET failed for key: {key}", meta={"error": str(e)})
            raise
            
    @retry_decorator(max_retries=3, base_delay=1)
    def put(self, key: str, value: Any) -> bool:
        """Put value to KV"""
        try:
            url = self._build_url(f"/{key}")
            
            # Ensure value is JSON serializable
            if not isinstance(value, str):
                value = json.dumps(value)
                
            response = self.session.put(
                url,
                json={"value": value},
                timeout=10
            )
            
            response.raise_for_status()
            
            logger.debug(f"KV PUT success: {key}")
            return True
            
        except Exception as e:
            logger.error(f"KV PUT failed for key: {key}", meta={"error": str(e)})
            raise
            
    @retry_decorator(max_retries=3, base_delay=1)
    def append(self, key: str, value: Any) -> bool:
        """Append value to KV list (for logs)"""
        try:
            url = self._build_url(f"/{key}/append")
            
            if not isinstance(value, str):
                value = json.dumps(value)
                
            response = self.session.post(
                url,
                json={"value": value},
                timeout=10
            )
            
            response.raise_for_status()
            return True
            
        except Exception as e:
            logger.error(f"KV APPEND failed for key: {key}", meta={"error": str(e)})
            raise
            
    @retry_decorator(max_retries=3, base_delay=1)
    def delete(self, key: str) -> bool:
        """Delete key from KV"""
        try:
            url = self._build_url(f"/{key}")
            response = self.session.delete(url, timeout=10)
            
            response.raise_for_status()
            logger.debug(f"KV DELETE success: {key}")
            return True
            
        except Exception as e:
            logger.error(f"KV DELETE failed for key: {key}", meta={"error": str(e)})
            raise
            
    def get_project_meta(self, project_id: str) -> Optional[Dict]:
        """Get project metadata"""
        return self.get(f"project:{project_id}:meta")
        
    def update_job_state(
        self, 
        project_id: str, 
        job_id: str, 
        state: str,
        result: Optional[Dict] = None
    ) -> bool:
        """Update job state"""
        job_data = {
            "state": state,
            "updatedAt": self._get_timestamp()
        }
        
        if result:
            job_data["result"] = result
            
        return self.put(f"project:{project_id}:job:{job_id}", job_data)
        
    def append_log_segment(
        self,
        project_id: str,
        job_id: str,
        segment_num: int,
        log_lines: List[Dict]
    ) -> bool:
        """Append log segment"""
        key = f"project:{project_id}:logs:{job_id}:segment:{segment_num}"
        return self.put(key, log_lines)
        
    def update_faiss_manifest(
        self,
        project_id: str,
        manifest: Dict
    ) -> bool:
        """Update FAISS index manifest"""
        key = f"project:{project_id}:faiss:manifest"
        return self.put(key, manifest)
        
    def store_artifact_metadata(
        self,
        project_id: str,
        build_id: str,
        metadata: Dict
    ) -> bool:
        """Store artifact metadata"""
        key = f"artifact:{project_id}:{build_id}"
        return self.put(key, metadata)
        
    @staticmethod
    def _get_timestamp() -> str:
        """Get current UTC timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"

# Global KV client instance
kv_client = KVClient()