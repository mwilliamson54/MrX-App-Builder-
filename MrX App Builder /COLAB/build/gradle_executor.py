import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from config.settings import settings
from utils.logger import logger

class GradleExecutor:
    """Execute Gradle build commands"""
    
    def __init__(self, project_path: Path):
        self.project_path = project_path
        self.gradlew = self._find_gradlew()
        
    def _find_gradlew(self) -> Optional[Path]:
        """Find gradlew executable"""
        gradlew_path = self.project_path / "gradlew"
        
        if gradlew_path.exists():
            # Make executable
            import os
            os.chmod(gradlew_path, 0o755)
            return gradlew_path
            
        logger.warning("gradlew not found")
        return None
        
    def build(
        self,
        variant: str = None,
        clean: bool = False
    ) -> Tuple[bool, str, str]:
        """
        Run Gradle build
        
        Args:
            variant: Build variant (release/debug)
            clean: Run clean before build
            
        Returns:
            Tuple of (success, stdout, stderr)
        """
        if not self.gradlew:
            return False, "", "gradlew not found"
            
        variant = variant or settings.BUILD_VARIANT
        
        # Build command
        commands = []
        
        if clean:
            commands.append("clean")
            
        if variant == "release":
            commands.append("assembleRelease")
        else:
            commands.append("assembleDebug")
            
        logger.info(f"Running Gradle: {' '.join(commands)}")
        
        return self._execute_gradle(commands)
        
    def lint(self) -> Tuple[bool, str, str]:
        """Run lint checks"""
        logger.info("Running Gradle lint")
        return self._execute_gradle(["lint"])
        
    def test(self) -> Tuple[bool, str, str]:
        """Run tests"""
        logger.info("Running Gradle tests")
        return self._execute_gradle(["test"])
        
    def _execute_gradle(
        self,
        commands: list
    ) -> Tuple[bool, str, str]:
        """
        Execute Gradle command
        
        Returns:
            Tuple of (success, stdout, stderr)
        """
        try:
            # Build full command
            cmd = [str(self.gradlew)] + commands
            
            # Run command
            process = subprocess.Popen(
                cmd,
                cwd=str(self.project_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait with timeout
            try:
                stdout, stderr = process.communicate(
                    timeout=settings.GRADLE_TIMEOUT
                )
            except subprocess.TimeoutExpired:
                process.kill()
                stdout, stderr = process.communicate()
                logger.error("Gradle command timed out")
                return False, stdout, stderr + "\n\nError: Build timed out"
                
            success = process.returncode == 0
            
            if success:
                logger.info("Gradle build successful")
            else:
                logger.error(
                    f"Gradle build failed (exit code: {process.returncode})"
                )
                
            return success, stdout, stderr
            
        except Exception as e:
            error_msg = f"Gradle execution failed: {str(e)}"
            logger.error(error_msg)
            return False, "", error_msg

class ErrorParser:
    """Parse Gradle build errors"""
    
    @staticmethod
    def parse_errors(stderr: str, stdout: str) -> list:
        """
        Extract structured error information
        
        Returns:
            List of error dicts with file, line, message
        """
        errors = []
        
        # Combine output
        output = stderr + "\n" + stdout
        
        # Look for error patterns
        import re
        
        # Pattern: file.kt:123: error: message
        pattern1 = r'([^:]+\.(?:kt|java)):(\d+):\s*error:\s*(.+)'
        
        for match in re.finditer(pattern1, output):
            errors.append({
                "file": match.group(1),
                "line": int(match.group(2)),
                "message": match.group(3).strip(),
                "type": "compile_error"
            })
            
        # Pattern: Task :app:compile failed
        pattern2 = r'(Task\s+:\w+:\w+)\s+FAILED'
        
        for match in re.finditer(pattern2, output):
            errors.append({
                "task": match.group(1),
                "message": "Task failed",
                "type": "task_failure"
            })
            
        return errors
        
    @staticmethod
    def get_error_summary(errors: list) -> str:
        """Create human-readable error summary"""
        if not errors:
            return "No errors found"
            
        parts = [f"Found {len(errors)} error(s):\n"]
        
        for i, error in enumerate(errors[:5], 1):  # Show first 5
            if error.get("file"):
                parts.append(
                    f"{i}. {error['file']}:{error.get('line', '?')}\n"
                    f"   {error.get('message', 'Unknown error')}"
                )
            else:
                parts.append(
                    f"{i}. {error.get('task', 'Unknown task')}\n"
                    f"   {error.get('message', 'Unknown error')}"
                )
                
        if len(errors) > 5:
            parts.append(f"\n... and {len(errors) - 5} more errors")
            
        return "\n".join(parts)

class APKCollector:
    """Find and collect built APK files"""
    
    def __init__(self, project_path: Path):
        self.project_path = project_path
        
    def find_apks(self, variant: str = None) -> list:
        """
        Find built APK files
        
        Args:
            variant: Build variant (release/debug)
            
        Returns:
            List of APK file paths
        """
        variant = variant or settings.BUILD_VARIANT
        
        # Search path
        output_dir = (
            self.project_path / "app" / "build" / "outputs" / "apk" / variant
        )
        
        if not output_dir.exists():
            logger.warning(f"APK output directory not found: {output_dir}")
            return []
            
        # Find APK files
        apks = list(output_dir.glob("*.apk"))
        
        logger.info(f"Found {len(apks)} APK file(s)")
        
        return apks
        
    def get_apk_metadata(self, apk_path: Path) -> Dict[str, Any]:
        """Get APK metadata"""
        import hashlib
        
        # Calculate SHA256
        sha256 = hashlib.sha256()
        with open(apk_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256.update(chunk)
                
        return {
            "name": apk_path.name,
            "path": str(apk_path),
            "size": apk_path.stat().st_size,
            "sha256": sha256.hexdigest()
        }

# Convenience functions
def build_project(
    project_path: Path,
    variant: str = None,
    clean: bool = False
) -> Tuple[bool, str, list]:
    """
    Build project and return results
    
    Returns:
        Tuple of (success, stdout, apk_paths)
    """
    executor = GradleExecutor(project_path)
    success, stdout, stderr = executor.build(variant, clean)
    
    apks = []
    if success:
        collector = APKCollector(project_path)
        apks = collector.find_apks(variant)
        
    return success, stdout + "\n" + stderr, apks