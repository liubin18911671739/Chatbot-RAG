"""
Embedding 生成服务
使用 sentence-transformers 生成文本向量
"""

import os
import logging
from typing import List, Union, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from functools import lru_cache

logger = logging.getLogger(__name__)


class EmbeddingService:
    """文本向量化服务"""
    
    # 默认使用的模型
    DEFAULT_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"
    
    def __init__(self, model_name: Optional[str] = None, cache_folder: Optional[str] = None):
        """
        初始化 Embedding 服务
        
        Args:
            model_name: 模型名称，默认为 paraphrase-multilingual-MiniLM-L12-v2
            cache_folder: 模型缓存目录，默认为 ./models
        """
        self.model_name = model_name or self.DEFAULT_MODEL
        self.cache_folder = cache_folder or os.path.join(
            os.path.dirname(__file__), '..', 'models'
        )
        
        # 确保缓存目录存在
        os.makedirs(self.cache_folder, exist_ok=True)
        
        self._model = None
        self._embedding_dimension = None
        
        logger.info(f"初始化 Embedding 服务，模型: {self.model_name}")
    
    @property
    def model(self) -> SentenceTransformer:
        """懒加载模型"""
        if self._model is None:
            logger.info(f"加载模型: {self.model_name}")
            try:
                self._model = SentenceTransformer(
                    self.model_name,
                    cache_folder=self.cache_folder
                )
                logger.info(f"模型加载成功，维度: {self._model.get_sentence_embedding_dimension()}")
            except Exception as e:
                logger.error(f"模型加载失败: {str(e)}")
                raise
        return self._model
    
    @property
    def embedding_dimension(self) -> int:
        """获取向量维度"""
        if self._embedding_dimension is None:
            self._embedding_dimension = self.model.get_sentence_embedding_dimension()
        return self._embedding_dimension
    
    def get_embedding(self, text: str, normalize: bool = True) -> np.ndarray:
        """
        生成单个文本的向量
        
        Args:
            text: 输入文本
            normalize: 是否归一化向量，默认True
            
        Returns:
            numpy数组，形状为 (embedding_dimension,)
        """
        if not text or not text.strip():
            logger.warning("输入文本为空，返回零向量")
            return np.zeros(self.embedding_dimension, dtype=np.float32)
        
        try:
            embedding = self.model.encode(
                text,
                normalize_embeddings=normalize,
                show_progress_bar=False
            )
            return embedding.astype(np.float32)
        except Exception as e:
            logger.error(f"向量化失败: {str(e)}")
            raise
    
    def get_embeddings(
        self,
        texts: List[str],
        batch_size: int = 32,
        normalize: bool = True,
        show_progress: bool = False
    ) -> np.ndarray:
        """
        批量生成文本向量
        
        Args:
            texts: 文本列表
            batch_size: 批处理大小
            normalize: 是否归一化向量
            show_progress: 是否显示进度条
            
        Returns:
            numpy数组，形状为 (num_texts, embedding_dimension)
        """
        if not texts:
            logger.warning("文本列表为空")
            return np.array([], dtype=np.float32).reshape(0, self.embedding_dimension)
        
        # 过滤空文本
        valid_texts = [t if t and t.strip() else " " for t in texts]
        
        try:
            embeddings = self.model.encode(
                valid_texts,
                batch_size=batch_size,
                normalize_embeddings=normalize,
                show_progress_bar=show_progress
            )
            return embeddings.astype(np.float32)
        except Exception as e:
            logger.error(f"批量向量化失败: {str(e)}")
            raise
    
    @lru_cache(maxsize=1000)
    def get_embedding_cached(self, text: str, normalize: bool = True) -> tuple:
        """
        带缓存的向量生成（用于频繁查询的文本）
        
        Args:
            text: 输入文本
            normalize: 是否归一化
            
        Returns:
            向量的tuple形式（用于缓存）
        """
        embedding = self.get_embedding(text, normalize)
        return tuple(embedding.tolist())
    
    def clear_cache(self):
        """清除缓存"""
        self.get_embedding_cached.cache_clear()
        logger.info("已清除embedding缓存")
    
    def compute_similarity(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray,
        metric: str = "cosine"
    ) -> float:
        """
        计算两个向量的相似度
        
        Args:
            embedding1: 向量1
            embedding2: 向量2
            metric: 相似度度量方式，支持 'cosine', 'dot', 'euclidean'
            
        Returns:
            相似度分数
        """
        if metric == "cosine":
            # 余弦相似度
            return float(np.dot(embedding1, embedding2) / 
                        (np.linalg.norm(embedding1) * np.linalg.norm(embedding2)))
        elif metric == "dot":
            # 点积（假设向量已归一化）
            return float(np.dot(embedding1, embedding2))
        elif metric == "euclidean":
            # 欧几里得距离（转换为相似度）
            distance = np.linalg.norm(embedding1 - embedding2)
            return 1.0 / (1.0 + distance)
        else:
            raise ValueError(f"不支持的相似度度量: {metric}")
    
    def get_model_info(self) -> dict:
        """获取模型信息"""
        return {
            "model_name": self.model_name,
            "embedding_dimension": self.embedding_dimension,
            "cache_folder": self.cache_folder,
            "max_seq_length": self.model.max_seq_length
        }


# 全局单例实例
_embedding_service_instance = None


def get_embedding_service(
    model_name: Optional[str] = None,
    cache_folder: Optional[str] = None
) -> EmbeddingService:
    """
    获取 Embedding 服务单例
    
    Args:
        model_name: 模型名称
        cache_folder: 缓存目录
        
    Returns:
        EmbeddingService 实例
    """
    global _embedding_service_instance
    
    if _embedding_service_instance is None:
        _embedding_service_instance = EmbeddingService(
            model_name=model_name,
            cache_folder=cache_folder
        )
    
    return _embedding_service_instance


if __name__ == "__main__":
    # 测试代码
    logging.basicConfig(level=logging.INFO)
    
    # 创建服务
    service = EmbeddingService()
    
    # 测试单个文本
    text = "这是一个测试文本"
    embedding = service.get_embedding(text)
    print(f"单个文本向量维度: {embedding.shape}")
    print(f"向量前5个值: {embedding[:5]}")
    
    # 测试批量文本
    texts = [
        "机器学习是人工智能的一个分支",
        "深度学习使用神经网络",
        "自然语言处理是AI的重要应用"
    ]
    embeddings = service.get_embeddings(texts)
    print(f"\n批量向量维度: {embeddings.shape}")
    
    # 测试相似度
    sim = service.compute_similarity(embeddings[0], embeddings[1])
    print(f"\n文本1和文本2的相似度: {sim:.4f}")
    
    # 模型信息
    print(f"\n模型信息: {service.get_model_info()}")
