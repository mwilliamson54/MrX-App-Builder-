import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum

class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class StructuredLogger:
    """Structured JSON logger for streaming to KV"""
    
    def __init__(self, component: str = "colab-agent"):
        self.component = component
        self.buffer = []
        self.max_buffer_size = 100
        
        # Setup standard logger
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(component)
        
    def _create_log_entry(
        self, 
        level: LogLevel, 
        message: str, 
        meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create structured log entry"""
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level.value,
            "component": self.component,
            "message": message
        }
        
        if meta:
            entry["meta"] = meta
            
        return entry
        
    def _log(self, level: LogLevel, message: str, meta: Optional[Dict[str, Any]] = None):
        """Internal logging method"""
        entry = self._create_log_entry(level, message, meta)
        
        # Add to buffer for streaming
        self.buffer.append(entry)
        
        # Also log to console
        log_line = json.dumps(entry)
        
        if level == LogLevel.DEBUG:
            self.logger.debug(log_line)
        elif level == LogLevel.INFO:
            self.logger.info(log_line)
        elif level == LogLevel.WARNING:
            self.logger.warning(log_line)
        elif level == LogLevel.ERROR:
            self.logger.error(log_line)
        elif level == LogLevel.CRITICAL:
            self.logger.critical(log_line)
            
    def debug(self, message: str, meta: Optional[Dict[str, Any]] = None):
        """Log debug message"""
        self._log(LogLevel.DEBUG, message, meta)
        
    def info(self, message: str, meta: Optional[Dict[str, Any]] = None):
        """Log info message"""
        self._log(LogLevel.INFO, message, meta)
        
    def warning(self, message: str, meta: Optional[Dict[str, Any]] = None):
        """Log warning message"""
        self._log(LogLevel.WARNING, message, meta)
        
    def error(self, message: str, meta: Optional[Dict[str, Any]] = None):
        """Log error message"""
        self._log(LogLevel.ERROR, message, meta)
        
    def critical(self, message: str, meta: Optional[Dict[str, Any]] = None):
        """Log critical message"""
        self._log(LogLevel.CRITICAL, message, meta)
        
    def get_buffer(self) -> list:
        """Get current log buffer"""
        return self.buffer.copy()
        
    def clear_buffer(self):
        """Clear log buffer"""
        self.buffer.clear()
        
    def should_flush(self) -> bool:
        """Check if buffer should be flushed"""
        return len(self.buffer) >= self.max_buffer_size

# Global logger instance
logger = StructuredLogger()