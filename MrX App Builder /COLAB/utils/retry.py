import time
import random
from typing import Callable, Any, Optional, Type
from functools import wraps
from utils.logger import logger

class RetryError(Exception):
    """Raised when max retries exceeded"""
    pass

def exponential_backoff_with_jitter(
    func: Callable,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exceptions: tuple = (Exception,),
    on_retry: Optional[Callable] = None
) -> Any:
    """
    Retry function with exponential backoff and jitter
    
    Args:
        func: Function to retry
        max_retries: Maximum number of retry attempts
        base_delay: Base delay in seconds
        max_delay: Maximum delay in seconds
        exceptions: Tuple of exceptions to catch
        on_retry: Callback function on each retry
    """
    last_exception = None
    
    for attempt in range(max_retries + 1):
        try:
            return func()
        except exceptions as e:
            last_exception = e
            
            if attempt == max_retries:
                logger.error(
                    f"Max retries ({max_retries}) exceeded",
                    meta={"function": func.__name__, "error": str(e)}
                )
                raise RetryError(f"Failed after {max_retries} retries: {e}")
                
            # Calculate delay with exponential backoff and jitter
            delay = min(base_delay * (2 ** attempt), max_delay)
            jitter = random.uniform(0, delay * 0.1)
            total_delay = delay + jitter
            
            logger.warning(
                f"Retry attempt {attempt + 1}/{max_retries}",
                meta={
                    "function": func.__name__,
                    "error": str(e),
                    "delay": total_delay
                }
            )
            
            if on_retry:
                on_retry(attempt, e)
                
            time.sleep(total_delay)
            
    raise last_exception

def retry_decorator(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exceptions: tuple = (Exception,)
):
    """
    Decorator for automatic retry with exponential backoff
    
    Usage:
        @retry_decorator(max_retries=3, base_delay=2)
        def my_function():
            # function that might fail
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            return exponential_backoff_with_jitter(
                lambda: func(*args, **kwargs),
                max_retries=max_retries,
                base_delay=base_delay,
                max_delay=max_delay,
                exceptions=exceptions
            )
        return wrapper
    return decorator

class RetryContext:
    """Context manager for retry logic"""
    
    def __init__(
        self,
        operation_name: str,
        max_retries: int = 3,
        base_delay: float = 1.0,
        exceptions: tuple = (Exception,)
    ):
        self.operation_name = operation_name
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.exceptions = exceptions
        self.attempt = 0
        
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type and issubclass(exc_type, self.exceptions):
            self.attempt += 1
            
            if self.attempt <= self.max_retries:
                delay = min(self.base_delay * (2 ** (self.attempt - 1)), 60)
                jitter = random.uniform(0, delay * 0.1)
                
                logger.warning(
                    f"{self.operation_name} failed, retrying",
                    meta={
                        "attempt": self.attempt,
                        "max_retries": self.max_retries,
                        "delay": delay + jitter
                    }
                )
                
                time.sleep(delay + jitter)
                return True  # Suppress exception, will retry
            else:
                logger.error(
                    f"{self.operation_name} failed after max retries",
                    meta={"attempts": self.attempt}
                )
                return False  # Propagate exception
        return False