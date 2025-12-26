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
        self.session_token = None
        
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
            
            logger.info("🔐 Authenticating with backend...")
            logger.info(f"Backend URL: {self.backend_url}")
            logger.info(f"Colab ID: {self.colab_id}")
            
            response = requests.post(
                url,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 401:
                raise AuthenticationError("Invalid claim secret")
            
            if response.status_code != 200:
                raise AuthenticationError(f"Authentication failed with status {response.status_code}")
                
            auth_data = response.json()
            
            logger.info("✅ Authentication successful")
            logger.info(f"Response: {auth_data}")
            
            # Store session token if provided
            if "sessionToken" in auth_data:
                self.session_token = auth_data["sessionToken"]
            else:
                # Use claim_secret as fallback
                self.session_token = self.claim_secret
                
            self.is_authenticated = True
            return True
            
        except Exception as e:
            logger.error(f"❌ Authentication failed: {str(e)}")
            raise AuthenticationError(f"Failed to authenticate: {e}")
            
    def validate_credentials(self) -> Dict[str, bool]:
        """
        Validate that all required credentials are available
        Returns dict with validation status
        """
        validation = {
            "github_pat": secret_manager.has_secret("github_pat"),
            "backend_connection": self.is_authenticated,
            "claim_secret": bool(self.claim_secret)
        }
        
        logger.info("📋 Credential validation:", meta=validation)
        
        return validation
        
    def setup_session(self) -> bool:
        """
        Complete setup: authenticate + load secrets + validate
        Returns True if all steps succeed
        """
        try:
            logger.info("=" * 60)
            logger.info("🚀 Starting Colab Agent Setup")
            logger.info("=" * 60)
            
            # Step 1: Authenticate
            logger.info("Step 1/3: Authenticating with backend...")
            self.authenticate()
            logger.info("✅ Authentication complete")
            
            # Step 2: Load from environment
            logger.info("Step 2/3: Loading secrets from environment...")
            secret_manager.load_from_env()
            logger.info("✅ Secrets loaded")
            
            # Step 3: Validate
            logger.info("Step 3/3: Validating credentials...")
            validation = self.validate_credentials()
            
            if not validation["github_pat"]:
                logger.warning("⚠️ GitHub PAT not available")
                logger.warning("Some features may not work without GitHub access")
                
            if not validation["backend_connection"]:
                raise AuthenticationError("Backend connection not established")
                
            if not validation["claim_secret"]:
                raise AuthenticationError("Claim secret not configured")
            
            logger.info("=" * 60)
            logger.info("✅ Session setup completed successfully")
            logger.info("=" * 60)
            return True
            
        except Exception as e:
            logger.error("=" * 60)
            logger.error(f"❌ Session setup failed: {str(e)}")
            logger.error("=" * 60)
            return False

# Global authenticator instance
authenticator = BackendAuthenticator()
