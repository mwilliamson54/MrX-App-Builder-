from sentence_transformers import SentenceTransformer
from typing import List, Optional, Any
import numpy as np
from config.settings import settings
from utils.logger import logger

class EmbeddingModel:
    """Wrapper for local embedding models"""
    
    # Supported models
    MODELS = {
        "mini": "sentence-transformers/all-MiniLM-L6-v2",  # Default, fast
        "bge-small": "BAAI/bge-small-en-v1.5",
        "bge-base": "BAAI/bge-base-en-v1.5",
        "mpnet": "sentence-transformers/all-mpnet-base-v2",
        "instructor": "hkunlp/instructor-large"
    }
    
    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.DEFAULT_EMBEDDING_MODEL
        self.model: Optional[SentenceTransformer] = None
        self.dimension: int = 0
        self._loaded = False
        
    def load(self) -> bool:
        """Load embedding model"""
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            
            # Resolve model path
            if self.model_name in self.MODELS:
                model_path = self.MODELS[self.model_name]
            else:
                model_path = self.model_name
                
            # Load model
            self.model = SentenceTransformer(
                model_path,
                cache_folder=str(settings.MODELS_DIR)
            )
            
            # Get embedding dimension
            self.dimension = self.model.get_sentence_embedding_dimension()
            
            # Warm up model with dummy input
            _ = self.model.encode(["test"], show_progress_bar=False)
            
            self._loaded = True
            
            logger.info(
                f"Model loaded successfully",
                meta={
                    "model": self.model_name,
                    "dimension": self.dimension
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            return False
            
    def encode(
        self,
        texts: List[str],
        batch_size: int = None,
        show_progress: bool = False
    ) -> np.ndarray:
        """
        Encode texts to embeddings
        
        Args:
            texts: List of text strings
            batch_size: Batch size for encoding
            show_progress: Show progress bar
            
        Returns:
            Numpy array of embeddings
        """
        if not self._loaded:
            raise RuntimeError("Model not loaded. Call load() first.")
            
        batch_size = batch_size or settings.EMBEDDING_BATCH_SIZE
        
        try:
            embeddings = self.model.encode(
                texts,
                batch_size=batch_size,
                show_progress_bar=show_progress,
                convert_to_numpy=True,
                normalize_embeddings=True  # L2 normalization
            )
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Encoding failed: {str(e)}")
            raise
            
    def encode_single(self, text: str) -> np.ndarray:
        """Encode single text"""
        return self.encode([text])[0]
        
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self._loaded
        
    def get_dimension(self) -> int:
        """Get embedding dimension"""
        return self.dimension
        
    def get_model_name(self) -> str:
        """Get model name"""
        return self.model_name

class BatchEmbedder:
    """Batch embedding generator with progress tracking"""
    
    def __init__(self, model: EmbeddingModel):
        self.model = model
        
    def embed_chunks(
        self,
        chunks: List[Any],
        batch_size: int = None
    ) -> np.ndarray:
        """
        Generate embeddings for chunks
        
        Args:
            chunks: List of Chunk objects
            batch_size: Batch size
            
        Returns:
            Numpy array of embeddings
        """
        if not chunks:
            return np.array([])
            
        logger.info(f"Generating embeddings for {len(chunks)} chunks")
        
        # Extract text from chunks
        texts = [chunk.tokens for chunk in chunks]
        
        # Truncate if needed
        max_length = settings.EMBEDDING_MAX_LENGTH
        texts = [
            text[:max_length * 4] if len(text) > max_length * 4 else text
            for text in texts
        ]
        
        # Generate embeddings
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress=True
        )
        
        logger.info(
            f"Embeddings generated",
            meta={
                "count": len(embeddings),
                "dimension": embeddings.shape[1] if len(embeddings) > 0 else 0
            }
        )
        
        return embeddings
        
    def embed_query(self, query: str) -> np.ndarray:
        """Generate embedding for search query"""
        return self.model.encode_single(query)

# Global model instance (lazy loaded)
_embedding_model: Optional[EmbeddingModel] = None

def get_embedding_model(model_name: str = None) -> EmbeddingModel:
    """Get or create global embedding model"""
    global _embedding_model
    
    if _embedding_model is None:
        _embedding_model = EmbeddingModel(model_name)
        _embedding_model.load()
        
    return _embedding_model
