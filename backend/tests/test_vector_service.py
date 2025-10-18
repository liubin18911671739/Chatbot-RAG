"""
Vector 服务测试
"""

import pytest
import numpy as np
import os
import tempfile
import shutil
from services.vector_service import VectorService


class TestVectorService:
    """测试 Vector 服务"""
    
    @pytest.fixture
    def dimension(self):
        """测试向量维度"""
        return 128
    
    @pytest.fixture
    def temp_dir(self):
        """创建临时目录"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        # 清理
        shutil.rmtree(temp_dir, ignore_errors=True)
    
    @pytest.fixture
    def service(self, dimension, temp_dir):
        """创建测试用的向量服务"""
        return VectorService(
            dimension=dimension,
            index_type="Flat",
            metric="IP",
            persist_dir=temp_dir
        )
    
    @pytest.fixture
    def sample_vectors(self, dimension):
        """生成示例向量"""
        np.random.seed(42)
        vectors = np.random.randn(10, dimension).astype(np.float32)
        # 归一化（用于IP度量）
        vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
        return vectors
    
    def test_initialization(self, service, dimension):
        """测试服务初始化"""
        assert service.dimension == dimension
        assert service.index_type == "Flat"
        assert service.metric == "IP"
        assert service.index is not None
        assert service.index.ntotal == 0
    
    def test_add_single_vector(self, service, dimension):
        """测试添加单个向量"""
        vector = np.random.randn(dimension).astype(np.float32)
        vector = vector / np.linalg.norm(vector)
        
        metadata = [{"text": "测试文档", "source": "test"}]
        ids = service.add_vectors(vector, metadata)
        
        assert len(ids) == 1
        assert service.index.ntotal == 1
        assert ids[0] in service.metadata
    
    def test_add_multiple_vectors(self, service, sample_vectors):
        """测试添加多个向量"""
        metadata = [{"text": f"文档{i}", "id": i} for i in range(len(sample_vectors))]
        
        ids = service.add_vectors(sample_vectors, metadata)
        
        assert len(ids) == len(sample_vectors)
        assert service.index.ntotal == len(sample_vectors)
        assert all(idx in service.metadata for idx in ids)
    
    def test_add_vectors_without_metadata(self, service, sample_vectors):
        """测试不带元数据添加向量"""
        ids = service.add_vectors(sample_vectors)
        
        assert len(ids) == len(sample_vectors)
        assert all(idx in service.metadata for idx in ids)
        assert all(service.metadata[idx] == {} for idx in ids)
    
    def test_add_vectors_dimension_mismatch(self, service):
        """测试维度不匹配的向量"""
        wrong_dimension = service.dimension + 10
        vectors = np.random.randn(5, wrong_dimension).astype(np.float32)
        
        with pytest.raises(ValueError, match="向量维度不匹配"):
            service.add_vectors(vectors)
    
    def test_search_basic(self, service, sample_vectors):
        """测试基本搜索功能"""
        # 添加向量
        metadata = [{"text": f"文档{i}"} for i in range(len(sample_vectors))]
        service.add_vectors(sample_vectors, metadata)
        
        # 使用第一个向量作为查询
        query = sample_vectors[0]
        results = service.search(query, top_k=3)
        
        assert len(results) <= 3
        assert all("id" in r for r in results)
        assert all("score" in r for r in results)
        assert all("distance" in r for r in results)
        assert all("metadata" in r for r in results)
        
        # 第一个结果应该是查询向量本身（最相似）
        assert results[0]["score"] >= results[1]["score"]
    
    def test_search_empty_index(self, service, dimension):
        """测试空索引搜索"""
        query = np.random.randn(dimension).astype(np.float32)
        results = service.search(query, top_k=5)
        
        assert results == []
    
    def test_search_without_metadata(self, service, sample_vectors):
        """测试不返回元数据的搜索"""
        service.add_vectors(sample_vectors)
        
        query = sample_vectors[0]
        results = service.search(query, top_k=3, return_metadata=False)
        
        assert len(results) <= 3
        assert all("metadata" not in r for r in results)
    
    def test_search_top_k_larger_than_index(self, service, sample_vectors):
        """测试top_k大于索引大小"""
        service.add_vectors(sample_vectors[:3])  # 只添加3个向量
        
        query = sample_vectors[0]
        results = service.search(query, top_k=10)
        
        assert len(results) == 3  # 应该只返回3个结果
    
    def test_batch_search(self, service, sample_vectors):
        """测试批量搜索"""
        # 添加向量
        service.add_vectors(sample_vectors)
        
        # 使用前3个向量作为查询
        queries = sample_vectors[:3]
        results = service.batch_search(queries, top_k=2)
        
        assert len(results) == 3  # 3个查询
        assert all(len(r) <= 2 for r in results)  # 每个查询最多2个结果
    
    def test_save_and_load(self, service, sample_vectors, temp_dir):
        """测试保存和加载"""
        # 添加数据
        metadata = [{"text": f"文档{i}"} for i in range(len(sample_vectors))]
        original_ids = service.add_vectors(sample_vectors, metadata)
        
        # 保存
        service.save()
        
        # 创建新服务并加载
        new_service = VectorService(
            dimension=service.dimension,
            index_type=service.index_type,
            metric=service.metric,
            persist_dir=temp_dir
        )
        new_service.load()
        
        # 验证数据
        assert new_service.index.ntotal == len(sample_vectors)
        assert len(new_service.metadata) == len(sample_vectors)
        assert new_service.current_id == service.current_id
        
        # 验证搜索功能
        query = sample_vectors[0]
        results = new_service.search(query, top_k=3)
        assert len(results) > 0
    
    def test_save_custom_paths(self, service, sample_vectors, temp_dir):
        """测试自定义保存路径"""
        service.add_vectors(sample_vectors)
        
        index_path = os.path.join(temp_dir, "custom.index")
        metadata_path = os.path.join(temp_dir, "custom.pkl")
        
        service.save(index_path, metadata_path)
        
        assert os.path.exists(index_path)
        assert os.path.exists(metadata_path)
    
    def test_load_nonexistent_file(self, service, temp_dir):
        """测试加载不存在的文件"""
        with pytest.raises(FileNotFoundError):
            service.load(
                os.path.join(temp_dir, "nonexistent.index"),
                os.path.join(temp_dir, "nonexistent.pkl")
            )
    
    def test_get_stats(self, service, sample_vectors):
        """测试获取统计信息"""
        stats = service.get_stats()
        
        assert "total_vectors" in stats
        assert "dimension" in stats
        assert "index_type" in stats
        assert "metric" in stats
        assert "metadata_count" in stats
        
        assert stats["total_vectors"] == 0
        
        # 添加向量后
        service.add_vectors(sample_vectors)
        stats = service.get_stats()
        
        assert stats["total_vectors"] == len(sample_vectors)
        assert stats["metadata_count"] == len(sample_vectors)
    
    def test_clear(self, service, sample_vectors):
        """测试清空索引"""
        service.add_vectors(sample_vectors)
        
        assert service.index.ntotal > 0
        assert len(service.metadata) > 0
        
        service.clear()
        
        assert service.index.ntotal == 0
        assert len(service.metadata) == 0
        assert service.current_id == 0
    
    def test_distance_to_score_ip(self, service):
        """测试IP度量的分数转换"""
        distance = 0.9
        score = service._distance_to_score(distance)
        
        assert score == distance  # IP度量直接返回距离
    
    def test_distance_to_score_l2(self, dimension, temp_dir):
        """测试L2度量的分数转换"""
        service = VectorService(
            dimension=dimension,
            metric="L2",
            persist_dir=temp_dir
        )
        
        distance = 1.0
        score = service._distance_to_score(distance)
        
        assert score == 0.5  # 1/(1+1) = 0.5
        assert 0 <= score <= 1
    
    def test_remove_vectors(self, service, sample_vectors):
        """测试删除向量"""
        metadata = [{"text": f"文档{i}"} for i in range(len(sample_vectors))]
        ids = service.add_vectors(sample_vectors, metadata)
        
        # 删除前几个
        remove_ids = ids[:3]
        removed_count = service.remove_vectors(remove_ids)
        
        assert removed_count == 3
        assert all(idx not in service.metadata for idx in remove_ids)
    
    def test_l2_metric_initialization(self, dimension, temp_dir):
        """测试L2度量初始化"""
        service = VectorService(
            dimension=dimension,
            metric="L2",
            persist_dir=temp_dir
        )
        
        assert service.metric == "L2"
        assert service.index is not None
    
    def test_hnsw_index_type(self, dimension, temp_dir):
        """测试HNSW索引类型"""
        service = VectorService(
            dimension=dimension,
            index_type="HNSW",
            metric="IP",
            persist_dir=temp_dir
        )
        
        assert service.index_type == "HNSW"
        
        # 测试基本功能
        vectors = np.random.randn(5, dimension).astype(np.float32)
        vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
        
        ids = service.add_vectors(vectors)
        assert len(ids) == 5
    
    def test_invalid_index_type(self, dimension, temp_dir):
        """测试无效的索引类型"""
        with pytest.raises(ValueError, match="不支持的索引类型"):
            VectorService(
                dimension=dimension,
                index_type="InvalidType",
                persist_dir=temp_dir
            )
    
    def test_invalid_metric(self, dimension, temp_dir):
        """测试无效的度量类型"""
        with pytest.raises(ValueError, match="不支持的度量类型"):
            VectorService(
                dimension=dimension,
                metric="InvalidMetric",
                persist_dir=temp_dir
            )


class TestVectorServicePerformance:
    """性能测试"""
    
    @pytest.fixture
    def dimension(self):
        return 384
    
    @pytest.fixture
    def large_vectors(self, dimension):
        """生成大量向量用于性能测试"""
        np.random.seed(42)
        vectors = np.random.randn(1000, dimension).astype(np.float32)
        vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
        return vectors
    
    @pytest.fixture
    def service_with_data(self, dimension, large_vectors):
        """创建包含数据的服务"""
        temp_dir = tempfile.mkdtemp()
        service = VectorService(dimension=dimension, metric="IP", persist_dir=temp_dir)
        service.add_vectors(large_vectors)
        yield service
        shutil.rmtree(temp_dir, ignore_errors=True)
    
    def test_add_performance(self, dimension):
        """测试批量添加性能"""
        import time
        
        temp_dir = tempfile.mkdtemp()
        service = VectorService(dimension=dimension, persist_dir=temp_dir)
        
        vectors = np.random.randn(1000, dimension).astype(np.float32)
        vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
        
        start = time.time()
        service.add_vectors(vectors)
        duration = time.time() - start
        
        print(f"\n添加1000个向量耗时: {duration:.2f}秒")
        assert duration < 5.0  # 应在5秒内完成
        
        shutil.rmtree(temp_dir, ignore_errors=True)
    
    def test_search_performance(self, service_with_data, dimension):
        """测试搜索性能"""
        import time
        
        query = np.random.randn(dimension).astype(np.float32)
        query = query / np.linalg.norm(query)
        
        start = time.time()
        results = service_with_data.search(query, top_k=10)
        duration = time.time() - start
        
        print(f"\n在1000个向量中搜索耗时: {duration:.4f}秒")
        assert duration < 0.1  # 应在100ms内完成
        assert len(results) == 10
    
    def test_batch_search_performance(self, service_with_data, dimension):
        """测试批量搜索性能"""
        import time
        
        queries = np.random.randn(100, dimension).astype(np.float32)
        queries = queries / np.linalg.norm(queries, axis=1, keepdims=True)
        
        start = time.time()
        results = service_with_data.batch_search(queries, top_k=5)
        duration = time.time() - start
        
        print(f"\n批量搜索100个查询耗时: {duration:.2f}秒")
        assert duration < 2.0  # 应在2秒内完成
        assert len(results) == 100


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short", "-s"])
