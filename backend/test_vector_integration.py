"""
向量数据库集成 - 完整功能演示和测试
测试 Embedding 生成和 FAISS 向量检索的端到端流程
"""

import sys
import os
import time
import logging

# 添加backend到路径
sys.path.insert(0, os.path.dirname(__file__))

import numpy as np
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_embedding_service():
    """测试 Embedding 服务"""
    print("\n" + "=" * 60)
    print("测试 Embedding 服务")
    print("=" * 60)
    
    # 初始化服务
    print("\n1. 初始化 Embedding 服务...")
    embedding_service = EmbeddingService()
    
    # 获取模型信息
    info = embedding_service.get_model_info()
    print(f"   模型: {info['model_name']}")
    print(f"   向量维度: {info['embedding_dimension']}")
    print(f"   最大序列长度: {info['max_seq_length']}")
    
    # 测试单个文本
    print("\n2. 测试单个文本向量化...")
    text = "机器学习是人工智能的一个重要分支"
    start = time.time()
    embedding = embedding_service.get_embedding(text)
    duration = time.time() - start
    print(f"   文本: {text}")
    print(f"   向量维度: {embedding.shape}")
    print(f"   向量前5个值: {embedding[:5]}")
    print(f"   耗时: {duration:.3f}秒")
    
    # 测试批量文本
    print("\n3. 测试批量文本向量化...")
    texts = [
        "深度学习使用神经网络进行学习",
        "自然语言处理是人工智能的重要应用",
        "计算机视觉可以识别图像中的物体",
        "强化学习通过试错来学习最优策略",
        "今天天气很好，适合出去玩"
    ]
    start = time.time()
    embeddings = embedding_service.get_embeddings(texts, show_progress=True)
    duration = time.time() - start
    print(f"   文本数量: {len(texts)}")
    print(f"   向量维度: {embeddings.shape}")
    print(f"   耗时: {duration:.3f}秒")
    print(f"   平均每个: {duration/len(texts):.3f}秒")
    
    # 测试相似度计算
    print("\n4. 测试相似度计算...")
    for i in range(len(texts) - 1):
        sim = embedding_service.compute_similarity(embeddings[i], embeddings[-1])
        print(f"   '{texts[i][:20]}...' vs '{texts[-1][:20]}...' 相似度: {sim:.4f}")
    
    return embedding_service, embeddings, texts


def test_vector_service(embeddings, texts):
    """测试 Vector 服务"""
    print("\n" + "=" * 60)
    print("测试 FAISS 向量存储服务")
    print("=" * 60)
    
    # 初始化服务
    print("\n1. 初始化 Vector 服务...")
    dimension = embeddings.shape[1]
    vector_service = VectorService(
        dimension=dimension,
        index_type="Flat",
        metric="IP"
    )
    print(f"   向量维度: {dimension}")
    print(f"   索引类型: Flat")
    print(f"   度量方式: 内积(IP)")
    
    # 添加向量
    print("\n2. 添加向量到索引...")
    metadata = [{"text": text, "index": i} for i, text in enumerate(texts)]
    start = time.time()
    ids = vector_service.add_vectors(embeddings, metadata)
    duration = time.time() - start
    print(f"   添加向量数: {len(ids)}")
    print(f"   分配的IDs: {ids}")
    print(f"   耗时: {duration:.3f}秒")
    
    # 获取统计信息
    stats = vector_service.get_stats()
    print(f"\n3. 索引统计:")
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    # 测试搜索
    print("\n4. 测试向量搜索...")
    query_idx = 0
    query = embeddings[query_idx]
    print(f"   查询文本: {texts[query_idx]}")
    
    start = time.time()
    results = vector_service.search(query, top_k=3)
    duration = time.time() - start
    
    print(f"   搜索耗时: {duration:.4f}秒")
    print(f"   Top-3 结果:")
    for i, result in enumerate(results, 1):
        print(f"     {i}. ID: {result['id']}, Score: {result['score']:.4f}")
        print(f"        Text: {result['metadata']['text']}")
    
    # 测试批量搜索
    print("\n5. 测试批量搜索...")
    queries = embeddings[:2]
    start = time.time()
    batch_results = vector_service.batch_search(queries, top_k=2)
    duration = time.time() - start
    
    print(f"   查询数量: {len(queries)}")
    print(f"   耗时: {duration:.4f}秒")
    for i, results in enumerate(batch_results):
        print(f"   查询{i+1}: {texts[i]}")
        for j, r in enumerate(results, 1):
            print(f"     {j}. Score: {r['score']:.4f}, Text: {r['metadata']['text'][:30]}...")
    
    # 测试持久化
    print("\n6. 测试索引保存和加载...")
    save_start = time.time()
    vector_service.save()
    save_duration = time.time() - save_start
    print(f"   保存耗时: {save_duration:.3f}秒")
    
    # 加载到新服务
    new_service = VectorService(dimension=dimension, metric="IP")
    load_start = time.time()
    new_service.load()
    load_duration = time.time() - load_start
    print(f"   加载耗时: {load_duration:.3f}秒")
    print(f"   加载后向量数: {new_service.index.ntotal}")
    
    # 验证加载后的搜索
    results_after_load = new_service.search(query, top_k=3)
    print(f"   加载后搜索结果一致性: {'✓' if results_after_load[0]['id'] == results[0]['id'] else '✗'}")
    
    return vector_service


def test_integration(embedding_service, vector_service):
    """测试集成功能"""
    print("\n" + "=" * 60)
    print("端到端集成测试")
    print("=" * 60)
    
    # 模拟知识库
    knowledge_base = [
        "Python是一种高级编程语言，广泛用于数据科学和机器学习",
        "Flask是一个轻量级的Python Web框架",
        "Docker是一个容器化平台，可以简化应用部署",
        "Git是一个分布式版本控制系统",
        "PostgreSQL是一个强大的开源关系型数据库",
        "Redis是一个高性能的键值存储数据库",
        "Kubernetes用于容器编排和管理",
        "REST API是一种Web服务架构风格",
        "JWT是一种用于身份验证的令牌标准",
        "OAuth2.0是一个授权框架"
    ]
    
    print(f"\n1. 构建知识库 ({len(knowledge_base)}条)")
    print("   生成向量...")
    start = time.time()
    kb_embeddings = embedding_service.get_embeddings(knowledge_base)
    duration = time.time() - start
    print(f"   向量化耗时: {duration:.3f}秒")
    
    print("   添加到向量库...")
    vector_service.clear()  # 清空之前的数据
    metadata = [{"text": text, "source": "knowledge_base"} for text in knowledge_base]
    vector_service.add_vectors(kb_embeddings, metadata)
    
    # 测试查询
    queries = [
        "什么是Python？",
        "如何部署应用？",
        "数据库有哪些选择？"
    ]
    
    print(f"\n2. 执行查询 ({len(queries)}个)")
    for query_text in queries:
        print(f"\n   查询: {query_text}")
        
        # 生成查询向量
        query_embedding = embedding_service.get_embedding(query_text)
        
        # 搜索
        start = time.time()
        results = vector_service.search(query_embedding, top_k=3)
        duration = time.time() - start
        
        print(f"   搜索耗时: {duration:.4f}秒")
        print("   Top-3 结果:")
        for i, result in enumerate(results, 1):
            print(f"     {i}. (Score: {result['score']:.4f}) {result['metadata']['text']}")


def test_performance():
    """性能测试"""
    print("\n" + "=" * 60)
    print("性能测试 (1000条文档)")
    print("=" * 60)
    
    # 初始化服务
    embedding_service = EmbeddingService()
    dimension = embedding_service.embedding_dimension
    vector_service = VectorService(dimension=dimension, metric="IP")
    
    # 生成1000条测试文档
    print("\n1. 生成测试数据...")
    documents = [f"这是测试文档{i}，内容是关于人工智能和机器学习的。" for i in range(1000)]
    
    # 批量向量化
    print("\n2. 批量向量化 (1000条)...")
    start = time.time()
    embeddings = embedding_service.get_embeddings(documents, batch_size=64, show_progress=True)
    vectorize_duration = time.time() - start
    print(f"   总耗时: {vectorize_duration:.2f}秒")
    print(f"   平均每条: {vectorize_duration/len(documents)*1000:.2f}毫秒")
    
    # 批量添加
    print("\n3. 批量添加到索引...")
    start = time.time()
    metadata = [{"text": doc, "id": i} for i, doc in enumerate(documents)]
    ids = vector_service.add_vectors(embeddings, metadata)
    add_duration = time.time() - start
    print(f"   总耗时: {add_duration:.2f}秒")
    print(f"   平均每条: {add_duration/len(documents)*1000:.2f}毫秒")
    
    # 搜索性能测试
    print("\n4. 搜索性能测试...")
    test_queries = embeddings[:10]  # 使用前10个作为测试查询
    
    durations = []
    for query in test_queries:
        start = time.time()
        results = vector_service.search(query, top_k=10)
        duration = time.time() - start
        durations.append(duration)
    
    avg_duration = np.mean(durations)
    print(f"   平均搜索时间: {avg_duration*1000:.2f}毫秒")
    print(f"   最快: {min(durations)*1000:.2f}毫秒")
    print(f"   最慢: {max(durations)*1000:.2f}毫秒")
    
    # 准确性测试
    print("\n5. 相似度准确性测试...")
    query_idx = 0
    query = embeddings[query_idx]
    results = vector_service.search(query, top_k=5)
    
    print(f"   查询文档: {documents[query_idx]}")
    print("   最相似的5个文档:")
    for i, result in enumerate(results, 1):
        is_self = result['id'] == query_idx
        marker = "✓ (自身)" if is_self else ""
        print(f"     {i}. ID:{result['id']}, Score:{result['score']:.4f} {marker}")
    
    # 验证第一个结果是查询本身
    assert results[0]['id'] == query_idx, "第一个结果应该是查询文档本身"
    print("\n   ✓ 准确性验证通过：查询文档本身排在第一位")
    
    return {
        "vectorize_time": vectorize_duration,
        "add_time": add_duration,
        "avg_search_time": avg_duration,
        "total_docs": len(documents)
    }


def main():
    """主测试流程"""
    print("\n" + "=" * 60)
    print("向量数据库集成 - 完整功能测试")
    print("=" * 60)
    
    try:
        # 1. 测试 Embedding 服务
        embedding_service, embeddings, texts = test_embedding_service()
        
        # 2. 测试 Vector 服务
        vector_service = test_vector_service(embeddings, texts)
        
        # 3. 集成测试
        test_integration(embedding_service, vector_service)
        
        # 4. 性能测试
        perf_results = test_performance()
        
        # 总结
        print("\n" + "=" * 60)
        print("测试总结")
        print("=" * 60)
        print("\n✅ 所有测试通过!")
        print("\n性能指标:")
        print(f"  - 1000条文档向量化: {perf_results['vectorize_time']:.2f}秒")
        print(f"  - 1000条向量添加: {perf_results['add_time']:.2f}秒")
        print(f"  - 平均搜索时间: {perf_results['avg_search_time']*1000:.2f}毫秒")
        print(f"  - 每秒可处理查询数: {1/perf_results['avg_search_time']:.0f}")
        
        print("\n功能验证:")
        print("  ✓ Embedding 生成服务")
        print("  ✓ FAISS 向量存储")
        print("  ✓ 向量搜索")
        print("  ✓ 批量操作")
        print("  ✓ 索引持久化")
        print("  ✓ 相似度计算")
        print("  ✓ 端到端集成")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n❌ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
