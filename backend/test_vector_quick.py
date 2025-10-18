"""
向量数据库快速测试
验证基本功能是否正常
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

print("开始测试...")

# 测试 1: 导入模块
print("\n1. 测试模块导入...")
try:
    from services.embedding_service import EmbeddingService
    from services.vector_service import VectorService
    print("   ✓ 模块导入成功")
except Exception as e:
    print(f"   ✗ 模块导入失败: {e}")
    sys.exit(1)

# 测试 2: 创建服务
print("\n2. 测试服务初始化...")
try:
    print("   正在加载模型（首次运行需要下载，请耐心等待）...")
    embedding_service = EmbeddingService()
    dimension = embedding_service.embedding_dimension
    vector_service = VectorService(dimension=dimension, metric="IP")
    print(f"   ✓ 服务初始化成功 (维度: {dimension})")
except Exception as e:
    print(f"   ✗ 服务初始化失败: {e}")
    sys.exit(1)

# 测试 3: 生成向量
print("\n3. 测试向量生成...")
try:
    text = "这是一个测试文本"
    embedding = embedding_service.get_embedding(text)
    print(f"   ✓ 向量生成成功 (形状: {embedding.shape})")
except Exception as e:
    print(f"   ✗ 向量生成失败: {e}")
    sys.exit(1)

# 测试 4: 批量向量生成
print("\n4. 测试批量向量生成...")
try:
    texts = [
        "机器学习是人工智能的分支",
        "深度学习使用神经网络",
        "自然语言处理很重要"
    ]
    embeddings = embedding_service.get_embeddings(texts)
    print(f"   ✓ 批量生成成功 (形状: {embeddings.shape})")
except Exception as e:
    print(f"   ✗ 批量生成失败: {e}")
    sys.exit(1)

# 测试 5: 添加向量到索引
print("\n5. 测试添加向量...")
try:
    metadata = [{"text": t, "id": i} for i, t in enumerate(texts)]
    ids = vector_service.add_vectors(embeddings, metadata)
    print(f"   ✓ 添加成功 (IDs: {ids}, 总数: {vector_service.index.ntotal})")
except Exception as e:
    print(f"   ✗ 添加失败: {e}")
    sys.exit(1)

# 测试 6: 搜索
print("\n6. 测试向量搜索...")
try:
    query = embeddings[0]
    results = vector_service.search(query, top_k=2)
    print(f"   ✓ 搜索成功 (找到 {len(results)} 个结果)")
    for i, r in enumerate(results, 1):
        print(f"      {i}. Score: {r['score']:.4f}, Text: {r['metadata']['text']}")
except Exception as e:
    print(f"   ✗ 搜索失败: {e}")
    sys.exit(1)

# 测试 7: 相似度计算
print("\n7. 测试相似度计算...")
try:
    sim = embedding_service.compute_similarity(embeddings[0], embeddings[1])
    print(f"   ✓ 相似度计算成功 (相似度: {sim:.4f})")
except Exception as e:
    print(f"   ✗ 相似度计算失败: {e}")
    sys.exit(1)

# 测试 8: 持久化
print("\n8. 测试索引持久化...")
try:
    vector_service.save()
    print("   ✓ 保存成功")
    
    new_service = VectorService(dimension=dimension, metric="IP")
    new_service.load()
    print(f"   ✓ 加载成功 (向量数: {new_service.index.ntotal})")
except Exception as e:
    print(f"   ✗ 持久化失败: {e}")
    sys.exit(1)

print("\n" + "="*50)
print("✅ 所有测试通过!")
print("="*50)
print("\n功能清单:")
print("  ✓ Embedding 生成 (单个)")
print("  ✓ Embedding 生成 (批量)")
print("  ✓ 向量添加")
print("  ✓ 向量搜索")
print("  ✓ 相似度计算")
print("  ✓ 索引持久化")
print("\n向量数据库集成完成! 🎉")
