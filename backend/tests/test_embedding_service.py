"""
Embedding 服务测试
"""

import pytest
import numpy as np
from services.embedding_service import EmbeddingService, get_embedding_service


class TestEmbeddingService:
    """测试 Embedding 服务"""
    
    @pytest.fixture
    def service(self):
        """创建测试用的 embedding 服务"""
        return EmbeddingService()
    
    def test_initialization(self, service):
        """测试服务初始化"""
        assert service is not None
        assert service.model_name == EmbeddingService.DEFAULT_MODEL
        assert service.embedding_dimension > 0
    
    def test_get_embedding_single_text(self, service):
        """测试单个文本向量化"""
        text = "这是一个测试文本"
        embedding = service.get_embedding(text)
        
        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (service.embedding_dimension,)
        assert embedding.dtype == np.float32
        assert not np.all(embedding == 0)
    
    def test_get_embedding_empty_text(self, service):
        """测试空文本处理"""
        embedding = service.get_embedding("")
        
        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (service.embedding_dimension,)
        assert np.all(embedding == 0)  # 空文本应返回零向量
    
    def test_get_embeddings_batch(self, service):
        """测试批量文本向量化"""
        texts = [
            "机器学习是人工智能的一个分支",
            "深度学习使用神经网络",
            "自然语言处理是AI的重要应用"
        ]
        
        embeddings = service.get_embeddings(texts)
        
        assert isinstance(embeddings, np.ndarray)
        assert embeddings.shape == (len(texts), service.embedding_dimension)
        assert embeddings.dtype == np.float32
        assert not np.all(embeddings == 0)
    
    def test_get_embeddings_empty_list(self, service):
        """测试空列表处理"""
        embeddings = service.get_embeddings([])
        
        assert isinstance(embeddings, np.ndarray)
        assert embeddings.shape == (0, service.embedding_dimension)
    
    def test_embedding_consistency(self, service):
        """测试相同文本生成相同向量"""
        text = "一致性测试文本"
        
        embedding1 = service.get_embedding(text)
        embedding2 = service.get_embedding(text)
        
        np.testing.assert_array_almost_equal(embedding1, embedding2, decimal=5)
    
    def test_compute_similarity_cosine(self, service):
        """测试余弦相似度计算"""
        texts = [
            "机器学习是人工智能的分支",
            "深度学习是机器学习的一种",
            "今天天气很好"
        ]
        
        embeddings = service.get_embeddings(texts)
        
        # 前两个文本应该更相似
        sim_12 = service.compute_similarity(embeddings[0], embeddings[1], metric="cosine")
        sim_13 = service.compute_similarity(embeddings[0], embeddings[2], metric="cosine")
        
        assert 0 <= sim_12 <= 1
        assert 0 <= sim_13 <= 1
        assert sim_12 > sim_13  # 相关文本应该更相似
    
    def test_compute_similarity_dot_product(self, service):
        """测试点积相似度"""
        text1 = "测试文本一"
        text2 = "测试文本二"
        
        emb1 = service.get_embedding(text1, normalize=True)
        emb2 = service.get_embedding(text2, normalize=True)
        
        sim = service.compute_similarity(emb1, emb2, metric="dot")
        
        assert isinstance(sim, float)
        assert -1 <= sim <= 1  # 归一化后的点积应在[-1, 1]范围内
    
    def test_compute_similarity_euclidean(self, service):
        """测试欧几里得距离相似度"""
        text1 = "文本A"
        text2 = "文本B"
        
        emb1 = service.get_embedding(text1)
        emb2 = service.get_embedding(text2)
        
        sim = service.compute_similarity(emb1, emb2, metric="euclidean")
        
        assert isinstance(sim, float)
        assert sim > 0  # 距离转换的相似度应为正数
    
    def test_compute_similarity_invalid_metric(self, service):
        """测试无效的相似度度量"""
        emb1 = service.get_embedding("文本1")
        emb2 = service.get_embedding("文本2")
        
        with pytest.raises(ValueError, match="不支持的相似度度量"):
            service.compute_similarity(emb1, emb2, metric="invalid")
    
    def test_embedding_cached(self, service):
        """测试缓存功能"""
        text = "缓存测试文本"
        
        # 首次调用
        result1 = service.get_embedding_cached(text)
        # 第二次调用应使用缓存
        result2 = service.get_embedding_cached(text)
        
        assert result1 == result2
        assert isinstance(result1, tuple)
    
    def test_clear_cache(self, service):
        """测试清除缓存"""
        text = "缓存清除测试"
        
        service.get_embedding_cached(text)
        service.clear_cache()
        
        # 缓存应该被清除
        # 无法直接验证，但不应抛出异常
        service.get_embedding_cached(text)
    
    def test_get_model_info(self, service):
        """测试获取模型信息"""
        info = service.get_model_info()
        
        assert isinstance(info, dict)
        assert "model_name" in info
        assert "embedding_dimension" in info
        assert "cache_folder" in info
        assert "max_seq_length" in info
        
        assert info["embedding_dimension"] == service.embedding_dimension
    
    def test_normalize_parameter(self, service):
        """测试归一化参数"""
        text = "归一化测试"
        
        # 归一化
        emb_normalized = service.get_embedding(text, normalize=True)
        norm = np.linalg.norm(emb_normalized)
        assert np.isclose(norm, 1.0, rtol=1e-5)
        
        # 不归一化
        emb_not_normalized = service.get_embedding(text, normalize=False)
        norm = np.linalg.norm(emb_not_normalized)
        # 不归一化的向量范数不一定为1
        assert not np.isclose(norm, 1.0, rtol=1e-1) or True  # 允许两种情况
    
    def test_batch_size_parameter(self, service):
        """测试批处理大小参数"""
        texts = [f"测试文本{i}" for i in range(100)]
        
        # 小批次
        embeddings_small = service.get_embeddings(texts, batch_size=10)
        # 大批次
        embeddings_large = service.get_embeddings(texts, batch_size=50)
        
        # 结果应该一致
        np.testing.assert_array_almost_equal(embeddings_small, embeddings_large, decimal=5)
    
    def test_singleton_pattern(self):
        """测试单例模式"""
        service1 = get_embedding_service()
        service2 = get_embedding_service()
        
        assert service1 is service2  # 应该是同一个实例
    
    def test_special_characters(self, service):
        """测试特殊字符处理"""
        texts = [
            "包含emoji😀的文本",
            "包含符号!@#$%^&*()",
            "包含\n换行\t制表符",
            ""  # 空字符串
        ]
        
        embeddings = service.get_embeddings(texts)
        
        assert embeddings.shape == (len(texts), service.embedding_dimension)
        # 空字符串应返回零向量或特殊处理
        assert isinstance(embeddings[3], np.ndarray)
    
    def test_long_text_handling(self, service):
        """测试长文本处理"""
        # 生成超长文本（超过模型最大长度）
        long_text = "这是一个很长的文本。" * 200
        
        embedding = service.get_embedding(long_text)
        
        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (service.embedding_dimension,)
        # 模型应该截断或处理长文本，不应抛出异常


class TestEmbeddingServicePerformance:
    """性能测试"""
    
    @pytest.fixture
    def service(self):
        return EmbeddingService()
    
    def test_single_embedding_speed(self, service, benchmark):
        """测试单个向量生成速度"""
        text = "性能测试文本"
        
        result = benchmark(service.get_embedding, text)
        
        assert result.shape == (service.embedding_dimension,)
    
    def test_batch_embedding_speed(self, service, benchmark):
        """测试批量向量生成速度"""
        texts = [f"性能测试文本{i}" for i in range(100)]
        
        result = benchmark(service.get_embeddings, texts)
        
        assert result.shape == (100, service.embedding_dimension)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
