import requests
from typing import List, Dict, Any, Optional
from config.settings import settings
from config.secrets import secret_manager
from utils.logger import logger
from utils.retry import retry_decorator

class LLMClient:
    """Client for LLM API calls (custom endpoint or OpenAI)"""
    
    def __init__(self):
        self.llm_config = secret_manager.get_llm_config()
        
    @retry_decorator(max_retries=2, base_delay=3)
    def call_llm(
        self,
        messages: List[Dict[str, str]],
        model: str = "gpt-4",
        max_tokens: int = None,
        temperature: float = None
    ) -> Optional[str]:
        """
        Call LLM API
        
        Args:
            messages: List of message dicts
            model: Model name
            max_tokens: Max tokens in response
            temperature: Sampling temperature
            
        Returns:
            Response text or None on error
        """
        max_tokens = max_tokens or settings.LLM_MAX_TOKENS
        temperature = temperature or settings.LLM_TEMPERATURE
        
        # Determine which endpoint to use
        if self.llm_config.get("endpoint"):
            return self._call_custom_llm(
                messages, model, max_tokens, temperature
            )
        elif self.llm_config.get("openai_key"):
            return self._call_openai(
                messages, model, max_tokens, temperature
            )
        else:
            logger.error("No LLM endpoint or API key configured")
            return None
            
    def _call_custom_llm(
        self,
        messages: List[Dict[str, str]],
        model: str,
        max_tokens: int,
        temperature: float
    ) -> Optional[str]:
        """Call custom LLM endpoint"""
        try:
            endpoint = self.llm_config["endpoint"]
            api_key = self.llm_config.get("key", "")
            
            logger.info(f"Calling custom LLM: {endpoint}")
            
            headers = {
                "Content-Type": "application/json"
            }
            
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
                
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            response = requests.post(
                endpoint,
                headers=headers,
                json=payload,
                timeout=settings.LLM_TIMEOUT
            )
            
            response.raise_for_status()
            
            data = response.json()
            
            # Extract response text (handle different response formats)
            if "choices" in data:
                return data["choices"][0]["message"]["content"]
            elif "content" in data:
                return data["content"]
            else:
                logger.error("Unexpected response format")
                return None
                
        except Exception as e:
            logger.error(f"Custom LLM call failed: {str(e)}")
            raise
            
    def _call_openai(
        self,
        messages: List[Dict[str, str]],
        model: str,
        max_tokens: int,
        temperature: float
    ) -> Optional[str]:
        """Call OpenAI API"""
        try:
            api_key = self.llm_config["openai_key"]
            
            logger.info(f"Calling OpenAI API: {model}")
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=settings.LLM_TIMEOUT
            )
            
            response.raise_for_status()
            
            data = response.json()
            
            return data["choices"][0]["message"]["content"]
            
        except Exception as e:
            logger.error(f"OpenAI API call failed: {str(e)}")
            raise

class ResponseParser:
    """Parse LLM responses to extract code patches"""
    
    @staticmethod
    def extract_patches(response: str) -> List[Dict[str, str]]:
        """
        Extract file patches from LLM response
        
        Returns:
            List of patch dicts with keys: file, before, after
        """
        patches = []
        
        # Look for <file>, <before>, <after> tags
        import re
        
        # Pattern to match file blocks
        pattern = r'<file>(.*?)</file>\s*<before>(.*?)</before>\s*<after>(.*?)</after>'
        
        matches = re.findall(pattern, response, re.DOTALL)
        
        for file_path, before, after in matches:
            patches.append({
                "file": file_path.strip(),
                "before": before.strip(),
                "after": after.strip()
            })
            
        if not patches:
            logger.warning("No patches found in LLM response")
            
        return patches
        
    @staticmethod
    def extract_code_blocks(response: str) -> List[str]:
        """Extract code from markdown code blocks"""
        import re
        
        pattern = r'```(?:\w+)?\n(.*?)```'
        matches = re.findall(pattern, response, re.DOTALL)
        
        return [m.strip() for m in matches]

# Global LLM client
llm_client = LLMClient()
response_parser = ResponseParser()