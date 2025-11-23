import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
from parsers.tree_sitter_parser import ts_parser
from utils.logger import logger

class Chunk:
    """Code chunk data model"""
    
    def __init__(
        self,
        chunk_id: str,
        project_id: str,
        path: str,
        node_type: str,
        start_line: int,
        end_line: int,
        tokens: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.chunk_id = chunk_id
        self.project_id = project_id
        self.path = path
        self.node_type = node_type
        self.start_line = start_line
        self.end_line = end_line
        self.tokens = tokens
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "chunkId": self.chunk_id,
            "projectId": self.project_id,
            "path": self.path,
            "nodeType": self.node_type,
            "startLine": self.start_line,
            "endLine": self.end_line,
            "tokens": self.tokens,
            "metadata": self.metadata,
            "timestamp": self.timestamp
        }
        
    @staticmethod
    def generate_id(project_id: str, path: str, start_line: int) -> str:
        """Generate unique chunk ID"""
        content = f"{project_id}:{path}:{start_line}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]

class CodeChunker:
    """Main chunking orchestrator"""
    
    # Node types to extract for each language
    JAVA_NODES = [
        'class_declaration',
        'method_declaration',
        'constructor_declaration',
        'interface_declaration',
        'enum_declaration'
    ]
    
    KOTLIN_NODES = [
        'class_declaration',
        'function_declaration',
        'object_declaration',
        'companion_object',
        'property_declaration'
    ]
    
    XML_NODES = [
        'element'  # View elements
    ]
    
    def __init__(self, project_id: str, project_root: Path):
        self.project_id = project_id
        self.project_root = project_root
        self.chunks: List[Chunk] = []
        
    def chunk_project(self, filters: Optional[Dict[str, Any]] = None) -> List[Chunk]:
        """
        Chunk entire project
        
        Args:
            filters: Optional filters (folders, packages, paths)
            
        Returns:
            List of chunks
        """
        logger.info(f"Starting project chunking: {self.project_id}")
        
        # Find all source files
        source_files = self._find_source_files(filters)
        
        logger.info(f"Found {len(source_files)} source files to chunk")
        
        # Chunk each file
        for file_path in source_files:
            self._chunk_file(file_path)
            
        logger.info(f"Created {len(self.chunks)} chunks")
        
        return self.chunks
        
    def _find_source_files(self, filters: Optional[Dict[str, Any]] = None) -> List[Path]:
        """Find all relevant source files"""
        source_files = []
        
        # Standard Android project paths
        search_paths = [
            self.project_root / "app" / "src" / "main" / "java",
            self.project_root / "app" / "src" / "main" / "kotlin",
            self.project_root / "app" / "src" / "main" / "res" / "layout",
        ]
        
        # Apply folder filters if provided
        if filters and "folders" in filters:
            search_paths = [
                self.project_root / folder 
                for folder in filters["folders"]
            ]
        
        for search_path in search_paths:
            if not search_path.exists():
                continue
                
            # Find files recursively
            for ext in ['.java', '.kt', '.xml']:
                source_files.extend(search_path.rglob(f"*{ext}"))
                
        # Apply path filters
        if filters and "paths" in filters:
            allowed_paths = filters["paths"]
            source_files = [
                f for f in source_files 
                if any(str(f).endswith(p) for p in allowed_paths)
            ]
            
        return source_files
        
    def _chunk_file(self, file_path: Path):
        """Chunk a single file"""
        try:
            # Detect language
            language = ts_parser.detect_language(file_path)
            if not language:
                return
                
            # Parse file
            tree = ts_parser.parse_file(file_path, language)
            if not tree:
                return
                
            # Read source
            with open(file_path, 'rb') as f:
                source_bytes = f.read()
                
            # Get relevant node types
            node_types = self._get_node_types(language)
            
            # Extract nodes
            nodes = ts_parser.extract_nodes(tree, node_types)
            
            # Create chunks from nodes
            for node in nodes:
                self._create_chunk_from_node(
                    file_path,
                    node,
                    source_bytes,
                    language
                )
                
        except Exception as e:
            logger.warning(
                f"Failed to chunk file: {file_path}",
                meta={"error": str(e)}
            )
            
    def _get_node_types(self, language: str) -> List[str]:
        """Get node types for language"""
        if language == 'java':
            return self.JAVA_NODES
        elif language == 'kotlin':
            return self.KOTLIN_NODES
        elif language == 'xml':
            return self.XML_NODES
        return []
        
    def _create_chunk_from_node(
        self,
        file_path: Path,
        node: Any,
        source_bytes: bytes,
        language: str
    ):
        """Create chunk from AST node"""
        try:
            # Get relative path
            rel_path = file_path.relative_to(self.project_root)
            
            # Extract text
            text = ts_parser.get_node_text(node, source_bytes)
            
            # Generate chunk ID
            chunk_id = Chunk.generate_id(
                self.project_id,
                str(rel_path),
                node.start_point[0]
            )
            
            # Extract metadata
            metadata = {
                "language": language,
                "nodeType": node.type,
            }
            
            # Try to get function signature
            if node.type in ['method_declaration', 'function_declaration']:
                signature = ts_parser.get_function_signature(node, source_bytes)
                if signature:
                    metadata["signature"] = signature
            
            # Create chunk
            chunk = Chunk(
                chunk_id=chunk_id,
                project_id=self.project_id,
                path=str(rel_path),
                node_type=node.type,
                start_line=node.start_point[0],
                end_line=node.end_point[0],
                tokens=text,
                metadata=metadata
            )
            
            self.chunks.append(chunk)
            
        except Exception as e:
            logger.debug(f"Failed to create chunk: {str(e)}")
            
    def get_chunks(self) -> List[Chunk]:
        """Get all chunks"""
        return self.chunks
        
    def get_chunk_count(self) -> int:
        """Get total chunk count"""
        return len(self.chunks)
        
    def clear_chunks(self):
        """Clear all chunks"""
        self.chunks.clear()