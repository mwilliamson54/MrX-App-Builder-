from typing import List, Dict, Any, Optional
from config.settings import settings
from utils.logger import logger

class PromptBuilder:
    """Build retrieval-augmented prompts for LLM"""
    
    SYSTEM_PROMPT = """You are an expert Android developer assistant. You help developers by:
1. Analyzing code and suggesting improvements
2. Generating patches to fix bugs or add features
3. Writing clean, idiomatic Kotlin/Java code
4. Following Android best practices and Material Design guidelines

When generating patches:
- Always provide complete, valid code
- Use unified diff format when possible
- Be conservative - only change what's necessary
- Maintain existing code style and conventions
- Add comments for complex changes

Format your response as:
<file>path/to/file.kt</file>
<before>
// original code
</before>
<after>
// modified code
</after>"""
    
    def __init__(self):
        self.max_tokens = settings.MAX_CONTEXT_TOKENS
        
    def build_prompt(
        self,
        user_message: str,
        retrieved_chunks: List[tuple],
        chat_history: Optional[List[Dict]] = None,
        project_config: Optional[Dict] = None
    ) -> List[Dict[str, str]]:
        """
        Build complete prompt with RAG context
        
        Args:
            user_message: User's request
            retrieved_chunks: List of (chunk_metadata, distance) tuples
            chat_history: Recent chat messages
            project_config: Project configuration from mrx-config.json
            
        Returns:
            List of message dicts for LLM API
        """
        messages = []
        
        # System message
        system_content = self.SYSTEM_PROMPT
        
        # Add project context
        if project_config:
            system_content += self._format_project_context(project_config)
            
        messages.append({
            "role": "system",
            "content": system_content
        })
        
        # Add chat history (summarized if too long)
        if chat_history:
            history_content = self._format_chat_history(chat_history)
            if history_content:
                messages.append({
                    "role": "user",
                    "content": f"Previous conversation context:\n{history_content}"
                })
        
        # Build user message with retrieved context
        user_content = self._build_user_message(user_message, retrieved_chunks)
        
        messages.append({
            "role": "user",
            "content": user_content
        })
        
        # Estimate and log token count
        estimated_tokens = self._estimate_tokens(messages)
        logger.info(
            "Prompt built",
            meta={"estimated_tokens": estimated_tokens}
        )
        
        return messages
        
    def _format_project_context(self, config: Dict) -> str:
        """Format project configuration"""
        parts = ["\n\nProject Configuration:"]
        
        if "packageName" in config:
            parts.append(f"- Package: {config['packageName']}")
            
        if "minSdk" in config:
            parts.append(f"- Min SDK: {config['minSdk']}")
            
        if "targetSdk" in config:
            parts.append(f"- Target SDK: {config['targetSdk']}")
            
        return "\n".join(parts)
        
    def _format_chat_history(self, history: List[Dict]) -> str:
        """Format and optionally summarize chat history"""
        # Take last N messages to stay within token budget
        max_history = 5
        recent = history[-max_history:] if len(history) > max_history else history
        
        formatted = []
        for msg in recent:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            # Truncate long messages
            if len(content) > 500:
                content = content[:500] + "..."
                
            formatted.append(f"{role}: {content}")
            
        return "\n".join(formatted)
        
    def _build_user_message(
        self,
        message: str,
        chunks: List[tuple]
    ) -> str:
        """Build user message with retrieved code context"""
        parts = []
        
        # Add retrieved code context
        if chunks:
            parts.append("Relevant code from the project:\n")
            
            for i, (metadata, distance) in enumerate(chunks, 1):
                path = metadata.get("path", "unknown")
                node_type = metadata.get("nodeType", "code")
                start_line = metadata.get("startLine", 0)
                tokens = metadata.get("tokens", "")
                
                # Truncate very long chunks
                if len(tokens) > 1000:
                    tokens = tokens[:1000] + "\n... (truncated)"
                    
                parts.append(
                    f"\n--- Chunk {i} ---\n"
                    f"File: {path}\n"
                    f"Type: {node_type}\n"
                    f"Line: {start_line}\n"
                    f"```\n{tokens}\n```\n"
                )
        
        # Add user's actual request
        parts.append(f"\nUser Request:\n{message}")
        
        return "\n".join(parts)
        
    def _estimate_tokens(self, messages: List[Dict]) -> int:
        """Rough token estimation (1 token ≈ 4 characters)"""
        total_chars = sum(
            len(msg.get("content", ""))
            for msg in messages
        )
        return total_chars // 4
        
    def build_error_fix_prompt(
        self,
        error_message: str,
        failed_code: str,
        attempt: int
    ) -> List[Dict[str, str]]:
        """
        Build prompt for error fixing
        
        Args:
            error_message: Error from compiler
            failed_code: Code that caused error
            attempt: Current fix attempt number
        """
        messages = [
            {
                "role": "system",
                "content": self.SYSTEM_PROMPT + "\n\nYou are now in error-fixing mode. Analyze the error and provide a corrected version."
            },
            {
                "role": "user",
                "content": f"""The following code produced a build error:

```
{failed_code}
```

Error message:
```
{error_message}
```

This is fix attempt {attempt}/3. Please provide corrected code that resolves this error.
"""
            }
        ]
        
        return messages

# Global prompt builder
prompt_builder = PromptBuilder()