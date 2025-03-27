#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
语义检索演示：使用FAISS索引进行语义检索，
并从MongoDB获取对应的文章详情
"""

import os
import sys
import json
import numpy as np
import argparse
from pymongo import MongoClient
import faiss
from tqdm import tqdm

# 添加项目根目录到系统路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 向量维度
VECTOR_DIM = 768  # BERT/Sentence-BERT的标准维度

def generate_query_vector(query_text=None):
    """
    生成查询向量
    """
    try:
        # 尝试导入 sentence-transformers 进行真实语义编码
        from sentence_transformers import SentenceTransformer
        
        # 使用多语言模型，同时支持中英文
        model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        
        if query_text is None:
            # 生成随机单位向量作为示例
            vec = np.random.randn(VECTOR_DIM).astype('float32')
            vec = vec / np.linalg.norm(vec)
            return vec
        else:
            # 使用模型编码查询文本
            print("使用语义模型编码查询文本...")
            vec = model.encode(query_text)
            return vec.astype('float32')
            
    except ImportError:
        print("警告: sentence-transformers 库未安装，使用随机向量代替")
        print("请安装: pip install sentence-transformers")
        # 回退到随机向量
        vec = np.random.randn(VECTOR_DIM).astype('float32')
        vec = vec / np.linalg.norm(vec)
        return vec

def search_similar_documents(query_vector, faiss_index_path, id_map_path, mongo_uri, k=5, threshold=0.6):
    """
    使用FAISS进行语义检索，并返回MongoDB中的文档
    
    Args:
        query_vector: 查询向量
        faiss_index_path: FAISS索引文件路径
        id_map_path: ID映射文件路径
        mongo_uri: MongoDB连接URI
        k: 返回的最相似文档数量
        threshold: 相似度阈值，只返回相似度高于此值的文档
    
    Returns:
        结果列表，每个结果包含文档和相似度分数
    """
    results = []
    
    try:
        # 加载ID映射
        with open(id_map_path, 'r', encoding='utf-8') as f:
            id_map = json.load(f)
        
        # 加载FAISS索引
        index = faiss.read_index(faiss_index_path)
        
        # 将查询向量转为正确的形状
        query_vector = np.array([query_vector]).astype('float32')
        
        # 执行搜索
        D, I = index.search(query_vector, k)
        
        # D是距离数组，I是索引数组
        distances = D[0]  # 取第一个查询结果（因为只有一个查询）
        indices = I[0]
        
        # 连接MongoDB
        client = MongoClient(mongo_uri)
        db = client.news_system
        collection = db.articles
        
        # 获取对应的文档
        for i, (idx, score) in enumerate(zip(indices, distances)):
            if idx < 0 or idx >= len(id_map):
                continue  # 越界检查
                
            doc_id = id_map[str(idx)]
            
            # 只返回相似度超过阈值的结果
            if score < threshold:
                continue
                
            # 从MongoDB获取完整文档
            document = collection.find_one({"_id": doc_id})
            
            if document:
                # 将ObjectId转为字符串（JSON可序列化）
                if '_id' in document:
                    document['_id'] = str(document['_id'])
                
                # 处理日期对象
                if 'publishDate' in document:
                    document['publishDate'] = document['publishDate'].isoformat()
                if 'createdAt' in document:
                    document['createdAt'] = document['createdAt'].isoformat()
                if 'updatedAt' in document:
                    document['updatedAt'] = document['updatedAt'].isoformat()
                
                results.append({
                    "document": document,
                    "similarity": float(score),
                    "rank": i + 1
                })
    
    except Exception as e:
        print(f"检索过程中发生错误: {e}")
    
    return results

def main():
    parser = argparse.ArgumentParser(description="使用FAISS和MongoDB进行语义检索演示")
    parser.add_argument('--query', type=str, default="希望这样资源决定简介威望最新.", 
                        help='搜索查询文本')
    parser.add_argument('--k', type=int, default=5, help='返回的最相似文档数量')
    parser.add_argument('--threshold', type=float, default=0.6, help='相似度阈值')
    parser.add_argument('--mongo_uri', type=str, default="mongodb://localhost:27017/", 
                        help='MongoDB连接URI')
    parser.add_argument('--faiss_path', type=str, default="./data/news_vectors.index", 
                        help='FAISS索引文件路径')
    
    args = parser.parse_args()
    
    # ID映射文件路径
    id_map_path = f"{args.faiss_path}.map.json"
    
    # 生成查询向量
    print(f"生成查询向量: {'随机向量' if args.query is None else args.query}")
    query_vector = generate_query_vector(args.query)
    
    # 执行搜索
    print("执行语义检索...")
    results = search_similar_documents(
        query_vector=query_vector,
        faiss_index_path=args.faiss_path,
        id_map_path=id_map_path,
        mongo_uri=args.mongo_uri,
        k=args.k,
        threshold=args.threshold
    )
    
    # 打印结果
    print(f"\n找到 {len(results)} 条相似文档:")
    for res in results:
        doc = res["document"]
        print(f"\n[{res['rank']}] 相似度: {res['similarity']:.4f}")
        print(f"标题: {doc['title']}")
        print(f"语言: {doc['language']}")
        print(f"来源: {doc['source']}")
        print(f"日期: {doc['publishDate']}")
        print(f"摘要: {doc['summary'][:100]}...")

if __name__ == "__main__":
    main()
