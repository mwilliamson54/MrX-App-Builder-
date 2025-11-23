import os
import json
import base64
from typing import Optional, Dict
from cryptography.fernet import Fernet

class SecretManager:
    """Secure credential handling - stores only in runtime memory"""
    
    def __init__(self):
        self._secrets: Dict[str, str] = {}
        self._initialized = False
        
    def set_secret(self, key: str, value: str):
        """Store secret in memory"""
        self._secrets[key] = value
        
    def get_secret(self, key: str) -> Optional[str]:
        """Retrieve secret from memory"""
        return self._secrets.get(key)
        
    def has_secret(self, key: str) -> bool:
        """Check if secret exists"""
        return key in self._secrets
        
    def load_from_env(self):
        """Load secrets from environment variables"""
        # GitHub
        if gh_pat := os.getenv("GITHUB_PAT"):
            self.set_secret("github_pat", gh_pat)
            
        # Google Drive
        if drive_creds := os.getenv("GOOGLE_DRIVE_CREDENTIALS"):
            self.set_secret("drive_credentials", drive_creds)
            
        # OpenAI (optional)
        if openai_key := os.getenv("OPENAI_API_KEY"):
            self.set_secret("openai_key", openai_key)
            
        # Custom LLM (optional)
        if llm_endpoint := os.getenv("CUSTOM_LLM_ENDPOINT"):
            self.set_secret("llm_endpoint", llm_endpoint)
        if llm_key := os.getenv("CUSTOM_LLM_KEY"):
            self.set_secret("llm_key", llm_key)
            
        self._initialized = True
        
    def load_from_backend(self, backend_response: Dict):
        """Load encrypted secrets from backend admin endpoint"""
        try:
            # Backend returns encrypted secrets
            if "github_pat" in backend_response:
                self.set_secret("github_pat", backend_response["github_pat"])
                
            if "drive_credentials" in backend_response:
                self.set_secret("drive_credentials", backend_response["drive_credentials"])
                
            if "llm_config" in backend_response:
                llm_cfg = backend_response["llm_config"]
                if "endpoint" in llm_cfg:
                    self.set_secret("llm_endpoint", llm_cfg["endpoint"])
                if "key" in llm_cfg:
                    self.set_secret("llm_key", llm_cfg["key"])
                    
            self._initialized = True
            return True
        except Exception as e:
            print(f"Failed to load secrets from backend: {e}")
            return False
            
    def get_github_pat(self) -> Optional[str]:
        """Get GitHub Personal Access Token"""
        return self.get_secret("github_pat")
        
    def get_drive_credentials(self) -> Optional[Dict]:
        """Get Google Drive credentials as dict"""
        creds_json = self.get_secret("drive_credentials")
        if creds_json:
            try:
                return json.loads(creds_json)
            except:
                return None
        return None
        
    def get_llm_config(self) -> Dict:
        """Get LLM configuration"""
        return {
            "endpoint": self.get_secret("llm_endpoint"),
            "key": self.get_secret("llm_key"),
            "openai_key": self.get_secret("openai_key")
        }
        
    def clear_all(self):
        """Clear all secrets from memory"""
        self._secrets.clear()
        self._initialized = False
        
    def is_initialized(self) -> bool:
        """Check if secrets are loaded"""
        return self._initialized and len(self._secrets) > 0

# Singleton instance
secret_manager = SecretManager()