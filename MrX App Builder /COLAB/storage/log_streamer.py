from typing import List, Dict, Any
from utils.logger import logger
from storage.kv_client import kv_client
from config.settings import settings

class LogStreamer:
    """Stream logs to Workers KV in chunks"""
    
    def __init__(self, project_id: str, job_id: str):
        self.project_id = project_id
        self.job_id = job_id
        self.current_segment = 0
        self.buffer: List[Dict[str, Any]] = []
        self.total_logs = 0
        
    def add_log(self, log_entry: Dict[str, Any]):
        """Add log entry to buffer"""
        self.buffer.append(log_entry)
        self.total_logs += 1
        
        # Auto-flush if buffer is full
        if self._should_flush():
            self.flush()
            
    def add_multiple(self, log_entries: List[Dict[str, Any]]):
        """Add multiple log entries"""
        for entry in log_entries:
            self.add_log(entry)
            
    def _should_flush(self) -> bool:
        """Check if buffer should be flushed"""
        if len(self.buffer) >= settings.LOG_CHUNK_SIZE:
            return True
            
        # Check size
        import json
        buffer_size = len(json.dumps(self.buffer))
        if buffer_size >= settings.LOG_MAX_SIZE:
            return True
            
        return False
        
    def flush(self) -> bool:
        """Flush buffer to KV"""
        if not self.buffer:
            return True
            
        try:
            success = kv_client.append_log_segment(
                self.project_id,
                self.job_id,
                self.current_segment,
                self.buffer
            )
            
            if success:
                logger.debug(
                    f"Flushed log segment {self.current_segment}",
                    meta={
                        "project_id": self.project_id,
                        "job_id": self.job_id,
                        "log_count": len(self.buffer)
                    }
                )
                
                self.current_segment += 1
                self.buffer.clear()
                return True
            else:
                logger.error("Failed to flush log segment")
                return False
                
        except Exception as e:
            logger.error(
                f"Error flushing logs: {str(e)}",
                meta={"segment": self.current_segment}
            )
            return False
            
    def get_stats(self) -> Dict[str, Any]:
        """Get streaming statistics"""
        return {
            "project_id": self.project_id,
            "job_id": self.job_id,
            "current_segment": self.current_segment,
            "buffer_size": len(self.buffer),
            "total_logs": self.total_logs
        }
        
    def finalize(self) -> bool:
        """Final flush before closing"""
        if self.buffer:
            return self.flush()
        return True

class LogStreamingContext:
    """Context manager for log streaming"""
    
    def __init__(self, project_id: str, job_id: str):
        self.streamer = LogStreamer(project_id, job_id)
        
    def __enter__(self):
        return self.streamer
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Ensure final flush
        self.streamer.finalize()
        
        # Log stats
        stats = self.streamer.get_stats()
        logger.info(
            "Log streaming completed",
            meta=stats
        )
        
        return False