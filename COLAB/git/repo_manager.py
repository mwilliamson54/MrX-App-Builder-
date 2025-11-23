import git
from pathlib import Path
from typing import Optional
from config.settings import settings
from config.secrets import secret_manager
from utils.logger import logger
from utils.retry import retry_decorator

class RepoManager:
    """Manage Git repository operations"""
    
    def __init__(self, project_id: str, repo_url: str):
        self.project_id = project_id
        self.repo_url = repo_url
        self.repo_path = settings.WORKSPACE_DIR / project_id
        self.repo: Optional[git.Repo] = None
        
    def _get_authenticated_url(self) -> str:
        """Get repository URL with authentication"""
        github_pat = secret_manager.get_github_pat()
        
        if not github_pat:
            raise ValueError("GitHub PAT not available")
            
        # Convert HTTPS URL to authenticated URL
        if self.repo_url.startswith("https://github.com/"):
            repo_path = self.repo_url.replace("https://github.com/", "")
            return f"https://{github_pat}@github.com/{repo_path}"
            
        return self.repo_url
        
    @retry_decorator(max_retries=3, base_delay=2)
    def clone(self, shallow: bool = True) -> bool:
        """
        Clone repository
        
        Args:
            shallow: Perform shallow clone (depth=1)
        """
        try:
            if self.repo_path.exists():
                logger.info(f"Repository already exists: {self.repo_path}")
                return self.load()
                
            logger.info(f"Cloning repository: {self.repo_url}")
            
            auth_url = self._get_authenticated_url()
            
            # Clone options
            clone_kwargs = {
                'depth': 1 if shallow else None,
                'single_branch': True if shallow else False
            }
            
            self.repo = git.Repo.clone_from(
                auth_url,
                str(self.repo_path),
                **{k: v for k, v in clone_kwargs.items() if v is not None}
            )
            
            logger.info("Repository cloned successfully")
            
            # Configure Git
            self._configure_git()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to clone repository: {str(e)}")
            return False
            
    def load(self) -> bool:
        """Load existing repository"""
        try:
            if not self.repo_path.exists():
                return False
                
            self.repo = git.Repo(str(self.repo_path))
            
            logger.info(f"Repository loaded: {self.repo_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to load repository: {str(e)}")
            return False
            
    @retry_decorator(max_retries=3, base_delay=1)
    def fetch(self) -> bool:
        """Fetch latest changes"""
        try:
            if not self.repo:
                return False
                
            logger.info("Fetching latest changes")
            
            self.repo.remotes.origin.fetch()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to fetch: {str(e)}")
            return False
            
    @retry_decorator(max_retries=3, base_delay=1)
    def pull(self, branch: str = None) -> bool:
        """
        Pull latest changes
        
        Args:
            branch: Branch to pull (default: current branch)
        """
        try:
            if not self.repo:
                return False
                
            branch = branch or self.repo.active_branch.name
            
            logger.info(f"Pulling branch: {branch}")
            
            self.repo.remotes.origin.pull(branch)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to pull: {str(e)}")
            return False
            
    def get_current_branch(self) -> Optional[str]:
        """Get current branch name"""
        if self.repo:
            return self.repo.active_branch.name
        return None
        
    def get_latest_commit(self) -> Optional[str]:
        """Get latest commit SHA"""
        if self.repo:
            return self.repo.head.commit.hexsha
        return None
        
    def _configure_git(self):
        """Configure Git user"""
        try:
            if self.repo:
                config = self.repo.config_writer()
                config.set_value("user", "name", settings.GIT_USER_NAME)
                config.set_value("user", "email", settings.GIT_USER_EMAIL)
                config.release()
                
        except Exception as e:
            logger.warning(f"Failed to configure Git: {str(e)}")
            
    def is_initialized(self) -> bool:
        """Check if repository is initialized"""
        return self.repo is not None and self.repo_path.exists()
        
    def get_repo_path(self) -> Path:
        """Get repository path"""
        return self.repo_path

# Repository cache
_repos: dict = {}

def get_repo_manager(project_id: str, repo_url: str) -> RepoManager:
    """Get or create repository manager"""
    if project_id not in _repos:
        manager = RepoManager(project_id, repo_url)
        _repos[project_id] = manager
        
    return _repos[project_id]