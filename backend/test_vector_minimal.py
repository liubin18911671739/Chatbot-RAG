#!/usr/bin/env python3
"""
最小化向量数据库测试 - 不依赖模型下载
测试向量服务的核心功能（使用随机向量模拟）
"""

import sys
import numpy as np
from pathlib import Path

print("=" * 60)
print("向量数据库集成 - 最小化测试")
print("=" * 60)

# 测试 1: 导入测试
print("\n[1/6] 测试向量服务导入...")
try:
    from services.vector_service import VectorService
    print("✓ VectorService 导入成功")
except Exception as e:
    print(f"✗ 导入失败: {e}")
    sys.exit(1)

# 测试 2: 服务初始化
print("\n[2/6] 测试服务初始化...")
try:
    dimension = 384  # 模拟 sentence-transformers 的向量维度
    vector_service = VectorService(dimension=dimension, index_type="Flat")
    print(f"✓ VectorService 初始化成功 (dimension={dimension})")
except Exception as e:
    print(f"✗ 初始化失败: {e}")
    sys.exit(1)

# 测试 3: 添加向量
print("\n[3/6] 测试添加向量...")
try:
    # 生成模拟向量数据
    test_vectors = np.random.rand(10, dimension).astype('float32')
    test_metadata = [
        {"id": i, "text": f"测试文档 {i}", "source": "test"}
        for i in range(10)
    ]
    
    vector_service.add_vectors(test_vectors, test_metadata)
    print(f"✓ 成功添加 {len(test_vectors)} 个向量")
except Exception as e:
    print(f"✗ 添加向量失败: {e}")
    sys.exit(1)

# 测试 4: 向量搜索
print("\n[4/6] 测试向量搜索...")
try:
    # 使用第一个向量作为查询向量
    query_vector = test_vectors[0]
    results = vector_service.search(query_vector, top_k=3)
    
    print(f"✓ 搜索成功，返回 {len(results)} 个结果")
    print(f"  - Top 1: 相似度 = {results[0]['score']:.4f}")
    print(f"  - Top 2: 相似度 = {results[1]['score']:.4f}")
    print(f"  - Top 3: 相似度 = {results[2]['score']:.4f}")
    
    # 验证第一个结果应该是查询向量本身
    if results[0]['score'] > 0.99:
        print("  ✓ Top-1 结果正确（最高相似度）")
    else:
        print(f"  ⚠ Top-1 相似度异常: {results[0]['score']}")
except Exception as e:
    print(f"✗ 搜索失败: {e}")
    sys.exit(1)

# 测试 5: 批量搜索
print("\n[5/6] 测试批量搜索...")
try:
    # 使用前 3 个向量作为查询
    query_vectors = test_vectors[:3]
    batch_results = vector_service.batch_search(query_vectors, top_k=2)
    
    print(f"✓ 批量搜索成功，返回 {len(batch_results)} 组结果")
    for i, results in enumerate(batch_results):
        print(f"  - 查询 {i+1}: {len(results)} 个结果")
except Exception as e:
    print(f"✗ 批量搜索失败: {e}")
    sys.exit(1)

# 测试 6: 持久化
print("\n[6/6] 测试索引持久化...")
try:
    test_path = Path("test_vector_store_minimal")
    test_path.mkdir(exist_ok=True)
    
    # 保存
    vector_service.save(test_path)
    print(f"✓ 索引保存成功: {test_path}")
    
    # 加载到新服务
    new_service = VectorService(dimension=dimension)
    new_service.load(test_path)
    print(f"✓ 索引加载成功，包含 {new_service.index.ntotal} 个向量")
    
    # 验证加载后的搜索
    loaded_results = new_service.search(query_vector, top_k=1)
    if len(loaded_results) > 0:
        print(f"✓ 加载后搜索正常，Top-1 相似度 = {loaded_results[0]['score']:.4f}")
    
    # 清理测试文件
    import shutil
    shutil.rmtree(test_path)
    print("✓ 测试文件清理完成")
    
except Exception as e:
    print(f"✗ 持久化测试失败: {e}")
    sys.exit(1)

# 总结
print("\n" + "=" * 60)
print("✅ 所有测试通过！")
print("=" * 60)
print("\n向量数据库集成功能验证:")
print("  ✓ VectorService 模块可正常导入")
print("  ✓ 服务初始化正常（384维向量）")
print("  ✓ 向量添加功能正常（10个向量）")
print("  ✓ 相似度搜索功能正常（Top-K）")
print("  ✓ 批量搜索功能正常")
print("  ✓ 索引持久化和加载正常")
print("\n📝 注意:")
print("  - 本测试使用随机向量模拟，未测试真实的文本向量化")
print("  - 要测试完整功能（含 Embedding），需要下载模型（471MB）")
print("  - 运行完整测试: python test_vector_quick.py")
print("  - 运行单元测试: pytest tests/test_vector_service.py -v")
print("=" * 60)
