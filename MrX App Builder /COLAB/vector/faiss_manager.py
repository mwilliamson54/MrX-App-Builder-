import faiss
import numpy as np
import pickle
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from config.settings import settings
from utils.logger import logger
from storage.kv_client import kv_client

class FAISSIndex:
    """FAISS vector index manager"""
    
    def __init__(self, project_id: str, dimension: int):
        self.project_id = project_id
        self.dimension = dimension
        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict[str, Any]] = []
        self.version = 0
        self.index_path = settings.FAISS_DIR / f"{project_id}.index"
        self.metadata_path = settings.FAISS_DIR / f"{project_id}_meta.pkl"
        
    def create_index(self, index_type: str = None) -> bool:
        """
        Create new FAISS index
        
        Args:
            index_type: "flat" or "hnsw"
        """
        try:
            index_type = index_type or settings.FAISS_INDEX_TYPE
            
            if index_type == "IndexFlatL2" or index_type == "flat":
                # Simple L2 distance index (exact search)
                self.index = faiss.IndexFlatL2(self.dimension)
                logger.info("Created IndexFlatL2")
                
            elif index_type == "HNSW" or index_type == "hnsw":
                # HNSW index for faster approximate search
                self.index = faiss.IndexHNSWFlat(self.dimension, 32)
                self.index.hnsw.efConstruction = 40
                self.index.hnsw.efSearch = 16
                logger.info("Created HNSW index")
                
            else:
                raise ValueError(f"Unsupported index type: {index_type}")
                
            self.version = 1
            self.metadata = []
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to create index: {str(e)}")
            return False
            
    def add_vectors(
        self,
        vectors: np.ndarray,
        chunk_metadata: List[Dict[str, Any]]
    ) -> bool:
        """
        Add vectors to index
        
        Args:
            vectors: Numpy array of vectors (N x dimension)
            chunk_metadata: List of metadata dicts for each vector
        """
        try:
            if self.index is None:
                raise RuntimeError("Index not created")
                
            if len(vectors) != len(chunk_metadata):
                raise ValueError("Vector count must match metadata count")
                
            # Ensure vectors are float32
            vectors = vectors.astype('float32')
            
            # Add to index
            self.index.add(vectors)
            
            # Store metadata
            self.metadata.extend(chunk_metadata)
            
            logger.info(
                f"Added {len(vectors)} vectors to index",
                meta={
                    "total_vectors": self.index.ntotal,
                    "dimension": self.dimension
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to add vectors: {str(e)}")
            return False
            
    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = None
    ) -> List[Tuple[Dict[str, Any], float]]:
        """
        Search for similar vectors
        
        Args:
            query_vector: Query embedding vector
            top_k: Number of results to return
            
        Returns:
            List of (metadata, distance) tuples
        """
        try:
            if self.index is None or self.index.ntotal == 0:
                logger.warning("Index is empty")
                return []
                
            top_k = top_k or settings.TOP_K_CHUNKS
            top_k = min(top_k, self.index.ntotal)
            
            # Ensure query is 2D float32
            if query_vector.ndim == 1:
                query_vector = query_vector.reshape(1, -1)
            query_vector = query_vector.astype('float32')
            
            # Search
            distances, indices = self.index.search(query_vector, top_k)
            
            # Build results
            results = []
            for idx, dist in zip(indices[0], distances[0]):
                if idx < len(self.metadata):
                    results.append((self.metadata[idx], float(dist)))
                    
            logger.debug(
                f"Search returned {len(results)} results",
                meta={"top_k": top_k}
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return []
            
    def save(self) -> bool:
        """Save index and metadata to disk"""
        try:
            if self.index is None:
                logger.warning("No index to save")
                return False
                
            # Create directory
            settings.FAISS_DIR.mkdir(parents=True, exist_ok=True)
            
            # Save FAISS index
            faiss.write_index(self.index, str(self.index_path))
            
            # Save metadata
            with open(self.metadata_path, 'wb') as f:
                pickle.dump({
                    'metadata': self.metadata,
                    'version': self.version,
                    'dimension': self.dimension
                }, f)
                
            logger.info(
                f"Index saved",
                meta={
                    "path": str(self.index_path),
                    "vectors": self.index.ntotal
                }
            )
            
            # Update manifest in KV
            self._update_manifest()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to save index: {str(e)}")
            return False
            
    def load(self) -> bool:
        """Load index and metadata from disk"""
        try:
            if not self.index_path.exists():
                logger.warning("Index file not found")
                return False
                
            # Load FAISS index
            self.index = faiss.read_index(str(self.index_path))
            
            # Load metadata
            with open(self.metadata_path, 'rb') as f:
                data = pickle.load(f)
                self.metadata = data['metadata']
                self.version = data['version']
                self.dimension = data['dimension']
                
            logger.info(
                f"Index loaded",
                meta={
                    "vectors": self.index.ntotal,
                    "version": self.version
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to load index: {str(e)}")
            return False
            
    def clear(self):
        """Clear index and metadata"""
        self.index = None
        self.metadata = []
        self.version = 0
        
    def get_stats(self) -> Dict[str, Any]:
        """Get index statistics"""
        return {
            "project_id": self.project_id,
            "dimension": self.dimension,
            "total_vectors": self.index.ntotal if self.index else 0,
            "version": self.version,
            "metadata_count": len(self.metadata)
        }
        
    def _update_manifest(self):
        """Update index manifest in KV"""
        try:
            manifest = {
                "indexVersion": str(self.version),
                "numChunks": self.index.ntotal if self.index else 0,
                "dimension": self.dimension,
                "lastUpdated": datetime.utcnow().isoformat() + "Z"
            }
            
            kv_client.update_faiss_manifest(self.project_id, manifest)
            
        except Exception as e:
            logger.warning(f"Failed to update manifest: {str(e)}")

# Index cache
_indexes: Dict[str, FAISSIndex] = {}

def get_faiss_index(project_id: str, dimension: int) -> FAISSIndex:
    """Get or create FAISS index for project"""
    if project_id not in _indexes:
        index = FAISSIndex(project_id, dimension)
        
        # Try to load existing index
        if not index.load():
            # Create new index
            index.create_index()
            
        _indexes[project_id] = index
        
    return _indexes[project_id]