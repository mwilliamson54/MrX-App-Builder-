from tree_sitter_languages import get_parser
from typing import List, Dict, Any, Optional
from pathlib import Path
from utils.logger import logger

class TreeSitterParser:
    """Base Tree-Sitter parser for code analysis"""
    
    def __init__(self):
        self.parsers = {}
        self.languages = {}
        self._init_parsers()
        
    def _init_parsers(self):
        """Initialize parsers for supported languages"""
        try:
            # Store language identifiers (parsers created on-demand)
            self.languages['java'] = 'java'
            self.languages['kotlin'] = 'kotlin'
            self.languages['xml'] = 'xml'
            
            logger.info("Tree-Sitter parsers initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize parsers: {str(e)}")
            raise
            
    def get_parser(self, language: str):
        """Get parser for specified language"""
        if language not in self.languages:
            raise ValueError(f"Unsupported language: {language}")
        return get_parser(language)
        
    def parse_file(self, file_path: Path, language: str) -> Optional[Any]:
        """
        Parse file and return AST
        
        Args:
            file_path: Path to source file
            language: Language identifier (java, kotlin, xml)
            
        Returns:
            Tree-sitter tree object or None
        """
        try:
            # Read file content
            with open(file_path, 'rb') as f:
                content = f.read()
                
            # Get parser
            parser = get_parser(language)
            
            # Parse
            tree = parser.parse(content)
            
            return tree
            
        except Exception as e:
            logger.error(
                f"Failed to parse file: {file_path}",
                meta={"error": str(e)}
            )
            return None
            
    def extract_nodes(
        self,
        tree,
        node_types: List[str]
    ) -> List[Any]:
        """
        Extract nodes of specific types from AST
        
        Args:
            tree: Tree-sitter tree
            node_types: List of node type names to extract
            
        Returns:
            List of matching nodes
        """
        if not tree:
            return []
            
        nodes = []
        
        def traverse(node):
            if node.type in node_types:
                nodes.append(node)
            for child in node.children:
                traverse(child)
                
        traverse(tree.root_node)
        return nodes
        
    def get_node_text(self, node, source_bytes: bytes) -> str:
        """Get text content of a node"""
        return source_bytes[node.start_byte:node.end_byte].decode('utf-8')
        
    def get_node_metadata(self, node, source_bytes: bytes) -> Dict[str, Any]:
        """
        Extract metadata from node
        
        Returns:
            Dict with node info (type, position, text)
        """
        return {
            "type": node.type,
            "startLine": node.start_point[0],
            "endLine": node.end_point[0],
            "startColumn": node.start_point[1],
            "endColumn": node.end_point[1],
            "text": self.get_node_text(node, source_bytes)
        }
        
    def detect_language(self, file_path: Path) -> Optional[str]:
        """
        Detect language from file extension
        
        Returns:
            Language identifier or None
        """
        ext = file_path.suffix.lower()
        
        mapping = {
            '.java': 'java',
            '.kt': 'kotlin',
            '.kts': 'kotlin',
            '.xml': 'xml',
            '.gradle': 'groovy',
            '.gradle.kts': 'kotlin'
        }
        
        return mapping.get(ext)
        
    def is_supported_file(self, file_path: Path) -> bool:
        """Check if file type is supported"""
        return self.detect_language(file_path) is not None
        
    def get_function_signature(self, node, source_bytes: bytes) -> Optional[str]:
        """
        Extract function/method signature
        
        Args:
            node: Method/function node
            source_bytes: Source file bytes
            
        Returns:
            Function signature or None
        """
        try:
            # Find identifier child (function name)
            name = None
            for child in node.children:
                if child.type == 'identifier':
                    name = self.get_node_text(child, source_bytes)
                    break
                    
            if not name:
                return None
                
            # Get modifiers and return type
            signature_parts = []
            for child in node.children:
                if child.type in ['modifiers', 'type_identifier', 'simple_type']:
                    text = self.get_node_text(child, source_bytes).strip()
                    if text:
                        signature_parts.append(text)
                        
            signature_parts.append(name)
            
            # Get parameters
            for child in node.children:
                if child.type == 'parameter_list' or child.type == 'formal_parameters':
                    params = self.get_node_text(child, source_bytes)
                    signature_parts.append(params)
                    break
                    
            return ' '.join(signature_parts)
            
        except Exception as e:
            logger.warning(f"Failed to extract function signature: {str(e)}")
            return None

# Global parser instance
ts_parser = TreeSitterParser()
