import os
from pathlib import Path
from pydantic import BaseModel
from typing import Optional

class Settings(BaseModel):
    """Central configuration for MrX Colab Agent"""
    
    # Backend Configuration
    BACKEND_URL: str = os.getenv("BACKEND_URL", "https://your-app.pages.dev")
    COLAB_ID: str = os.getenv("COLAB_ID", "colab-default")
    CLAIM_SECRET: str = os.getenv("CLAIM_SECRET", "")
    
    # Workspace Directories
    WORKSPACE_DIR: Path = Path("/content/workspace")
    MODELS_DIR: Path = Path("/content/models")
    FAISS_DIR: Path = Path("/content/faiss")
    BUILD_DIR: Path = Path("/content/build")
    LOGS_DIR: Path = Path("/content/logs")
    
    # Embedding Model Configuration
    DEFAULT_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_BATCH_SIZE: int = 32
    EMBEDDING_MAX_LENGTH: int = 512
    
    # FAISS Configuration
    FAISS_INDEX_TYPE: str = "IndexFlatL2"  # or "HNSW"
    TOP_K_CHUNKS: int = 15
    FAISS_NPROBE: int = 10  # For HNSW
    
    # LLM Configuration
    LLM_MAX_TOKENS: int = 1800
    LLM_TEMPERATURE: float = 0.2
    LLM_TIMEOUT: int = 60
    MAX_CONTEXT_TOKENS: int = 8000
    
    # Build Configuration
    GRADLE_TIMEOUT: int = 600  # 10 minutes
    MAX_AUTO_FIX_ATTEMPTS: int = 3
    BUILD_VARIANT: str = "release"  # or "debug"
    
    # Job Configuration
    POLL_INTERVAL: int = 30  # seconds
    CLAIM_TTL: int = 3600  # 1 hour
    MAX_JOB_RETRIES: int = 3
    RETRY_BASE_DELAY: int = 2  # seconds
    
    # Cleanup Configuration
    KEEP_LAST_N_INDEXES: int = 3
    BRANCH_TTL_DAYS: int = 14
    CLEANUP_INTERVAL: int = 3600  # 1 hour
    
    # Git Configuration
    GIT_USER_NAME: str = "MrX Bot"
    GIT_USER_EMAIL: str = "bot@mrxapp.dev"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_CHUNK_SIZE: int = 100  # lines per chunk
    LOG_MAX_SIZE: int = 5120  # bytes per chunk
    
    # Drive Configuration
    DRIVE_FOLDER_ROOT: str = "MrX App Builder"
    APK_UPLOAD_TIMEOUT: int = 300  # 5 minutes
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    def create_directories(self):
        """Create all required workspace directories"""
        for dir_path in [
            self.WORKSPACE_DIR,
            self.MODELS_DIR,
            self.FAISS_DIR,
            self.BUILD_DIR,
            self.LOGS_DIR
        ]:
            dir_path.mkdir(parents=True, exist_ok=True)

# Singleton instance
settings = Settings()