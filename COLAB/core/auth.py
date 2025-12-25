# COLAB/core/auth.py
import requests
from typing import Dict, Optional
from config.settings import settings
from config.secrets import secret_manager
from utils.logger import logger
from utils.retry import retry_decorator

class AuthenticationError(Exception):
    """Raised when authentication fails"""
    pass

class BackendAuthenticator:
    """Handle authentication with backend and secret retrieval"""
    
    def __init__(self):
        self.backend_url = settings.BACKEND_URL
        self.colab_id = settings.COLAB_ID
        self.claim_secret = settings.CLAIM_SECRET
        self.is_authenticated = False
        self.session_token = None  # ← ADD THIS LINE
        
    @retry_decorator(max_retries=3, base_delay=2)
    def authenticate(self) -> bool:
        """
        Authenticate with backend using claim secret
        Returns True if successful
        """
        try:
            url = f"{self.backend_url}/api/colab/authenticate"
            
            payload = {
                "colabId": self.colab_id,
                "claimSecret": self.claim_secret
            }
            
            logger.info("Authenticating with backend...")
            
            response = requests.post(
                url,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 401:
                raise AuthenticationError("Invalid claim secret")
                
            response.raise_for_status()
            
            auth_data = response.json()
            
            logger.info("Authentication successful")
            
            # Store session token if provided (optional for now)
            if "sessionToken" in auth_data:
                self.session_token = auth_data["sessionToken"]
            else:
                # Use claim_secret as fallback
                self.session_token = self.claim_secret
                
            self.is_authenticated = True
            return True
            
        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            raise AuthenticationError(f"Failed to authenticate: {e}")
            
    @retry_decorator(max_retries=3, base_delay=2)
    def fetch_secrets(self) -> bool:
        """
        Fetch encrypted secrets from backend
        Requires prior authentication
        """
        if not self.is_authenticated:
            raise AuthenticationError("Must authenticate before fetching secrets")
            
        try:
            # For now, we'll skip fetching secrets from backend
            # and use environment variables directly
            logger.info("Using secrets from environment variables")
            
            # The secrets are already loaded in secret_manager from environment
            # No need to fetch from backend for basic setup
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to fetch secrets: {str(e)}")
            # Don't fail completely - we can work with env vars
            logger.warning("Continuing with environment variable secrets only")
            return True
            
    def validate_credentials(self) -> Dict[str, bool]:
        """
        Validate that all required credentials are available
        Returns dict with validation status
        """
        validation = {
            "github_pat": secret_manager.has_secret("github_pat"),
            "drive_credentials": secret_manager.has_secret("drive_credentials"),
            "llm_configured": (
                secret_manager.has_secret("llm_endpoint") or 
                secret_manager.has_secret("openai_key")
            )
        }
        
        all_valid = all(validation.values())
        
        logger.info(
            "Credential validation",
            meta=validation
        )
        
        return validation
        
    def setup_session(self) -> bool:
        """
        Complete setup: authenticate + fetch secrets + validate
        Returns True if all steps succeed
        """
        try:
            # Step 1: Authenticate
            self.authenticate()
            
            # Step 2: Load from environment as primary source
            secret_manager.load_from_env()
            
            # Step 3: Try to fetch additional secrets from backend (optional)
            try:
                self.fetch_secrets()
            except Exception as e:
                logger.warning(f"Could not fetch additional secrets from backend: {e}")
                logger.info("Continuing with environment variable secrets")
            
            # Step 4: Validate
            validation = self.validate_credentials()
            
            if not validation["github_pat"]:
                raise AuthenticationError("GitHub PAT not available")
                
            if not validation["drive_credentials"]:
                logger.warning("Google Drive credentials not available")
                
            if not validation["llm_configured"]:
                logger.warning("No LLM endpoint configured")
                
            logger.info("Session setup completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Session setup failed: {str(e)}")
            return False

# Global authenticator instance
authenticator = BackendAuthenticator()
