"""
FAISS 向量存储服务
提供向量索引的增删查改和持久化功能
"""

import os
import pickle
import logging
from typing import List, Tuple, Optional, Dict, Any
import numpy as np
import faiss

logger = logging.getLogger(__name__)


class VectorService:
    """FAISS 向量存储服务"""
    
    def __init__(
        self,
        dimension: int,
        index_type: str = "Flat",
        metric: str = "L2",
        persist_dir: Optional[str] = None
    ):
        """
        初始化向量服务
        
        Args:
            dimension: 向量维度
            index_type: 索引类型，支持 'Flat', 'IVFFlat', 'HNSW'
            metric: 距离度量，'L2' 或 'IP' (内积)
            persist_dir: 持久化目录，默认为 ./vector_store
        """
        self.dimension = dimension
        self.index_type = index_type
        self.metric = metric
        self.persist_dir = persist_dir or os.path.join(
            os.path.dirname(__file__), '..', 'vector_store'
        )
        
        # 确保持久化目录存在
        os.makedirs(self.persist_dir, exist_ok=True)
        
        # 初始化索引
        self.index = self._create_index()
        
        # 元数据存储 (id -> metadata)
        self.metadata: Dict[int, Dict[str, Any]] = {}
        
        # 当前ID计数器
        self.current_id = 0
        
        logger.info(
            f"初始化向量服务 - 维度: {dimension}, "
            f"索引类型: {index_type}, 度量: {metric}"
        )
    
    def _create_index(self) -> faiss.Index:
        """创建 FAISS 索引"""
        if self.metric == "L2":
            # L2 距离（欧几里得距离）
            if self.index_type == "Flat":
                index = faiss.IndexFlatL2(self.dimension)
            elif self.index_type == "IVFFlat":
                # IVF索引需要先训练
                quantizer = faiss.IndexFlatL2(self.dimension)
                index = faiss.IndexIVFFlat(quantizer, self.dimension, 100)
            elif self.index_type == "HNSW":
                index = faiss.IndexHNSWFlat(self.dimension, 32)
            else:
                raise ValueError(f"不支持的索引类型: {self.index_type}")
        
        elif self.metric == "IP":
            # 内积（适合归一化后的向量，等价于余弦相似度）
            if self.index_type == "Flat":
                index = faiss.IndexFlatIP(self.dimension)
            elif self.index_type == "IVFFlat":
                quantizer = faiss.IndexFlatIP(self.dimension)
                index = faiss.IndexIVFFlat(quantizer, self.dimension, 100)
            elif self.index_type == "HNSW":
                index = faiss.IndexHNSWFlat(self.dimension, 32)
                # HNSW 需要手动设置为IP度量
                index.metric_type = faiss.METRIC_INNER_PRODUCT
            else:
                raise ValueError(f"不支持的索引类型: {self.index_type}")
        else:
            raise ValueError(f"不支持的度量类型: {self.metric}")
        
        return index
    
    def add_vectors(
        self,
        embeddings: np.ndarray,
        metadata: Optional[List[Dict[str, Any]]] = None
    ) -> List[int]:
        """
        添加向量到索引
        
        Args:
            embeddings: 向量数组，形状为 (n, dimension)
            metadata: 元数据列表，长度应与embeddings匹配
            
        Returns:
            添加的向量ID列表
        """
        if embeddings.ndim == 1:
            embeddings = embeddings.reshape(1, -1)
        
        n_vectors = embeddings.shape[0]
        
        # 验证维度
        if embeddings.shape[1] != self.dimension:
            raise ValueError(
                f"向量维度不匹配: 期望 {self.dimension}, "
                f"实际 {embeddings.shape[1]}"
            )
        
        # 确保数据类型为 float32
        embeddings = embeddings.astype(np.float32)
        
        # 对于IVF索引，如果未训练则先训练
        if self.index_type == "IVFFlat" and not self.index.is_trained:
            logger.info("训练IVF索引...")
            self.index.train(embeddings)
            logger.info("IVF索引训练完成")
        
        # 生成ID
        ids = list(range(self.current_id, self.current_id + n_vectors))
        
        # 添加向量
        self.index.add(embeddings)
        
        # 存储元数据
        if metadata:
            if len(metadata) != n_vectors:
                raise ValueError("元数据数量与向量数量不匹配")
            for idx, meta in zip(ids, metadata):
                self.metadata[idx] = meta
        else:
            for idx in ids:
                self.metadata[idx] = {}
        
        self.current_id += n_vectors
        
        logger.info(f"成功添加 {n_vectors} 个向量，当前总数: {self.index.ntotal}")
        
        return ids
    
    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 5,
        return_metadata: bool = True
    ) -> List[Dict[str, Any]]:
        """
        搜索最相似的向量
        
        Args:
            query_vector: 查询向量，形状为 (dimension,) 或 (1, dimension)
            top_k: 返回Top-K个结果
            return_metadata: 是否返回元数据
            
        Returns:
            搜索结果列表，每个结果包含 id, score, metadata
        """
        if self.index.ntotal == 0:
            logger.warning("索引为空，无法搜索")
            return []
        
        # 确保是2D数组
        if query_vector.ndim == 1:
            query_vector = query_vector.reshape(1, -1)
        
        # 确保数据类型
        query_vector = query_vector.astype(np.float32)
        
        # 搜索
        distances, indices = self.index.search(query_vector, min(top_k, self.index.ntotal))
        
        # 构建结果
        results = []
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx == -1:  # FAISS 返回-1表示无效结果
                continue
            
            result = {
                "id": int(idx),
                "score": self._distance_to_score(float(dist)),
                "distance": float(dist)
            }
            
            if return_metadata and idx in self.metadata:
                result["metadata"] = self.metadata[idx]
            
            results.append(result)
        
        return results
    
    def batch_search(
        self,
        query_vectors: np.ndarray,
        top_k: int = 5,
        return_metadata: bool = True
    ) -> List[List[Dict[str, Any]]]:
        """
        批量搜索
        
        Args:
            query_vectors: 查询向量数组，形状为 (n, dimension)
            top_k: 每个查询返回Top-K个结果
            return_metadata: 是否返回元数据
            
        Returns:
            搜索结果列表的列表
        """
        if self.index.ntotal == 0:
            logger.warning("索引为空，无法搜索")
            return [[] for _ in range(len(query_vectors))]
        
        query_vectors = query_vectors.astype(np.float32)
        
        distances, indices = self.index.search(
            query_vectors,
            min(top_k, self.index.ntotal)
        )
        
        all_results = []
        for query_idx in range(len(query_vectors)):
            results = []
            for dist, idx in zip(distances[query_idx], indices[query_idx]):
                if idx == -1:
                    continue
                
                result = {
                    "id": int(idx),
                    "score": self._distance_to_score(float(dist)),
                    "distance": float(dist)
                }
                
                if return_metadata and idx in self.metadata:
                    result["metadata"] = self.metadata[idx]
                
                results.append(result)
            
            all_results.append(results)
        
        return all_results
    
    def _distance_to_score(self, distance: float) -> float:
        """
        将距离转换为分数（分数越高越相似）
        
        Args:
            distance: FAISS返回的距离
            
        Returns:
            相似度分数
        """
        if self.metric == "IP":
            # 内积已经是相似度（越大越相似）
            return distance
        else:
            # L2距离转换为相似度
            return 1.0 / (1.0 + distance)
    
    def remove_vectors(self, ids: List[int]) -> int:
        """
        删除向量（注意：FAISS Flat索引不支持删除，需要重建索引）
        
        Args:
            ids: 要删除的向量ID列表
            
        Returns:
            成功删除的数量
        """
        logger.warning("FAISS Flat索引不支持原地删除，需要重建索引")
        
        # 从元数据中删除
        removed_count = 0
        for idx in ids:
            if idx in self.metadata:
                del self.metadata[idx]
                removed_count += 1
        
        return removed_count
    
    def rebuild_index(self, exclude_ids: Optional[List[int]] = None):
        """
        重建索引（排除指定ID）
        
        Args:
            exclude_ids: 要排除的向量ID列表
        """
        logger.info("开始重建索引...")
        
        # 收集所有需要保留的向量
        kept_vectors = []
        kept_metadata = []
        
        # 注意：这需要能够从原始索引中提取向量
        # 对于简单实现，我们假设有备份数据
        # 实际应用中需要维护原始向量数据
        
        logger.warning("索引重建功能需要维护原始向量数据，当前为简化实现")
    
    def save(self, index_path: Optional[str] = None, metadata_path: Optional[str] = None):
        """
        保存索引和元数据到磁盘
        
        Args:
            index_path: 索引文件路径（支持 str 或 Path）
            metadata_path: 元数据文件路径（支持 str 或 Path）
        """
        index_path = str(index_path) if index_path else os.path.join(self.persist_dir, "faiss.index")
        metadata_path = str(metadata_path) if metadata_path else os.path.join(self.persist_dir, "metadata.pkl")
        
        # 保存FAISS索引
        faiss.write_index(self.index, str(index_path))
        logger.info(f"索引已保存到: {index_path}")
        
        # 保存元数据
        save_data = {
            "metadata": self.metadata,
            "current_id": self.current_id,
            "dimension": self.dimension,
            "index_type": self.index_type,
            "metric": self.metric
        }
        
        with open(metadata_path, 'wb') as f:
            pickle.dump(save_data, f)
        logger.info(f"元数据已保存到: {metadata_path}")
    
    def load(self, index_path: Optional[str] = None, metadata_path: Optional[str] = None):
        """
        从磁盘加载索引和元数据
        
        Args:
            index_path: 索引文件路径（支持 str 或 Path）
            metadata_path: 元数据文件路径（支持 str 或 Path）
        """
        index_path = str(index_path) if index_path else os.path.join(self.persist_dir, "faiss.index")
        metadata_path = str(metadata_path) if metadata_path else os.path.join(self.persist_dir, "metadata.pkl")
        
        if not os.path.exists(index_path):
            raise FileNotFoundError(f"索引文件不存在: {index_path}")
        
        if not os.path.exists(metadata_path):
            raise FileNotFoundError(f"元数据文件不存在: {metadata_path}")
        
        # 加载FAISS索引
        self.index = faiss.read_index(str(index_path))
        logger.info(f"索引已加载: {index_path}, 向量数: {self.index.ntotal}")
        
        # 加载元数据
        with open(metadata_path, 'rb') as f:
            save_data = pickle.load(f)
        
        self.metadata = save_data["metadata"]
        self.current_id = save_data["current_id"]
        
        # 验证维度
        if save_data["dimension"] != self.dimension:
            logger.warning(
                f"维度不匹配: 保存的 {save_data['dimension']}, "
                f"当前 {self.dimension}"
            )
        
        logger.info(f"元数据已加载: {len(self.metadata)} 条")
    
    def get_stats(self) -> dict:
        """获取索引统计信息"""
        return {
            "total_vectors": self.index.ntotal,
            "dimension": self.dimension,
            "index_type": self.index_type,
            "metric": self.metric,
            "metadata_count": len(self.metadata),
            "is_trained": self.index.is_trained if hasattr(self.index, 'is_trained') else True
        }
    
    def clear(self):
        """清空索引"""
        self.index.reset()
        self.metadata.clear()
        self.current_id = 0
        logger.info("索引已清空")


if __name__ == "__main__":
    # 测试代码
    logging.basicConfig(level=logging.INFO)
    
    # 创建服务
    dimension = 384  # 示例维度
    service = VectorService(dimension=dimension, metric="IP")
    
    # 生成测试向量
    np.random.seed(42)
    test_vectors = np.random.randn(10, dimension).astype(np.float32)
    # 归一化（用于IP度量）
    test_vectors = test_vectors / np.linalg.norm(test_vectors, axis=1, keepdims=True)
    
    # 添加向量
    metadata = [{"text": f"文档{i}", "source": "test"} for i in range(10)]
    ids = service.add_vectors(test_vectors, metadata)
    print(f"添加了 {len(ids)} 个向量，IDs: {ids}")
    
    # 搜索
    query = test_vectors[0]  # 使用第一个向量作为查询
    results = service.search(query, top_k=3)
    print(f"\n搜索结果:")
    for r in results:
        print(f"  ID: {r['id']}, Score: {r['score']:.4f}, Metadata: {r['metadata']}")
    
    # 统计信息
    print(f"\n索引统计: {service.get_stats()}")
    
    # 保存和加载
    service.save()
    print("\n索引已保存")
    
    # 创建新服务并加载
    service2 = VectorService(dimension=dimension, metric="IP")
    service2.load()
    print(f"索引已加载，统计: {service2.get_stats()}")
