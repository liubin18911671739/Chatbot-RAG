#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
构建语义检索索引：
1. 从MongoDB读取文章
2. 使用Sentence-BERT生成语义向量
3. 构建FAISS索引
4. 保存索引和ID映射
"""

import os
import sys
import json
import numpy as np
import argparse
from tqdm import tqdm
from pymongo import MongoClient
import faiss

# 添加项目根目录到系统路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 向量维度
VECTOR_DIM = 768  # BERT/Sentence-BERT的标准维度

def encode_documents(documents, model=None, batch_size=32, debug=False):
    """
    批量编码文档生成向量表示
    
    Args:
        documents: 文档列表，每个文档包含text和id
        model: 语义编码模型
        batch_size: 批处理大小
        debug: 是否显示详细信息
    
    Returns:
        vectors: 文档向量表示
        id_map: 索引到文档ID的映射
    """
    try:
        if model is None:
            # 导入sentence-transformers
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            print(f"使用模型: {model.get_sentence_embedding_dimension()}维")
    except ImportError:
        print("错误: 请先安装sentence-transformers库")
        print("pip install sentence-transformers")
        sys.exit(1)
    
    vectors = []
    id_map = {}
    
    # 收集用于编码的文本
    texts = []
    doc_ids = []
    
    for i, doc in enumerate(documents):
        # 提取标题和摘要，用于生成语义向量
        text = f"{doc['title']} {doc['summary']}"
        texts.append(text)
        doc_ids.append(str(doc['_id']))
        id_map[str(i)] = str(doc['_id'])
        
        # 批处理编码
        if len(texts) >= batch_size or i == len(documents) - 1:
            if debug:
                print(f"编码批次: {len(texts)} 文本")
                
            # 使用模型编码文本
            batch_vectors = model.encode(texts, show_progress_bar=debug)
            
            # 添加到结果向量集
            for vec in batch_vectors:
                vectors.append(vec.astype('float32'))
            
            # 清空批次
            texts = []
    
    print(f"成功编码 {len(vectors)} 篇文档")
    return np.array(vectors), id_map

def build_faiss_index(vectors, nlist=100):
    """
    构建FAISS索引
    
    Args:
        vectors: 文档向量表示
        nlist: 聚类中心数量，影响检索精度和速度
        
    Returns:
        index: FAISS索引
    """
    d = vectors.shape[1]  # 向量维度
    
    # 创建索引类型
    if vectors.shape[0] < 10000:
        # 数据集较小时使用精确检索
        print("使用精确检索索引 (IndexFlatIP)")
        index = faiss.IndexFlatIP(d)
    else:
        # 数据集较大时使用近似检索
        print(f"使用IVF索引 (IndexIVFFlat), nlist={nlist}")
        quantizer = faiss.IndexFlatIP(d)
        index = faiss.IndexIVFFlat(quantizer, d, nlist, faiss.METRIC_INNER_PRODUCT)
        
        # 训练索引
        print("训练索引...")
        index.train(vectors)
    
    # 添加向量到索引
    print(f"添加 {vectors.shape[0]} 个向量到索引")
    index.add(vectors)
    
    return index

def main():
    parser = argparse.ArgumentParser(description="构建文章语义检索索引")
    parser.add_argument('--mongo_uri', type=str, default="mongodb://localhost:27017/",
                        help='MongoDB连接URI')
    parser.add_argument('--db_name', type=str, default="news_system",
                        help='MongoDB数据库名称')
    parser.add_argument('--collection', type=str, default="articles",
                        help='MongoDB集合名称')
    parser.add_argument('--limit', type=int, default=0,
                        help='限制文档数量，0表示不限制')
    parser.add_argument('--output_dir', type=str, default="./data",
                        help='输出目录，用于保存索引文件')
    parser.add_argument('--index_name', type=str, default="news_vectors.index",
                        help='索引文件名称')
    parser.add_argument('--batch_size', type=int, default=32,
                        help='编码批处理大小')
    parser.add_argument('--debug', action='store_true',
                        help='显示详细信息')
    
    args = parser.parse_args()
    
    # 确保输出目录存在
    os.makedirs(args.output_dir, exist_ok=True)
    
    # 文件路径
    index_path = os.path.join(args.output_dir, args.index_name)
    id_map_path = f"{index_path}.map.json"
    
    # 连接MongoDB
    print(f"连接到MongoDB: {args.mongo_uri}")
    client = MongoClient(args.mongo_uri)
    db = client[args.db_name]
    collection = db[args.collection]
    
    # 查询文档数量
    total_docs = collection.count_documents({})
    print(f"找到 {total_docs} 篇文档")
    
    if args.limit > 0:
        limit = min(args.limit, total_docs)
        print(f"将处理前 {limit} 篇文档")
    else:
        limit = total_docs
    
    # 读取文档
    print("从MongoDB读取文档...")
    query = {}  # 可以添加查询条件
    documents = list(collection.find(query).limit(limit))
    
    if not documents:
        print("错误: 未找到任何文档")
        return
    
    print(f"读取了 {len(documents)} 篇文档")
    
    # 编码文档
    print("生成文档的语义向量表示...")
    vectors, id_map = encode_documents(
        documents, 
        batch_size=args.batch_size,
        debug=args.debug
    )
    
    # 归一化向量，在使用内积计算相似度时，归一化相当于余弦相似度
    print("归一化向量...")
    faiss.normalize_L2(vectors)
    
    # 构建索引
    print("构建FAISS索引...")
    index = build_faiss_index(vectors)
    
    # 保存索引
    print(f"保存索引到: {index_path}")
    faiss.write_index(index, index_path)
    
    # 保存ID映射
    print(f"保存ID映射到: {id_map_path}")
    with open(id_map_path, 'w', encoding='utf-8') as f:
        json.dump(id_map, f, ensure_ascii=False, indent=2)
    
    print("完成! 索引构建成功")
    print(f"索引包含 {index.ntotal} 个向量")
    print(f"向量维度: {VECTOR_DIM}")
    print(f"索引文件: {index_path}")
    print(f"ID映射文件: {id_map_path}")
    
    # 简单测试
    print("\n执行简单测试...")
    D, I = index.search(vectors[:1], 5)
    print(f"测试查询结果: {I[0]}")
    print(f"测试相似度分数: {D[0]}")
    
    print("\n现在您可以使用semantic_search_demo.py脚本进行语义检索测试")
    print("示例: python scripts/semantic_search_demo.py --query \"您的查询文本\"")

if __name__ == "__main__":
    main()