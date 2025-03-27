#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
语义搜索API路由
"""

import os
import json
import numpy as np
from flask import Blueprint, request, jsonify
from pymongo import MongoClient
import faiss
from datetime import datetime

# 创建Blueprint
search_bp = Blueprint('search', __name__, url_prefix='/api/search')

# 全局配置
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
FAISS_INDEX_PATH = os.environ.get('FAISS_INDEX_PATH', './data/news_vectors.index')
ID_MAP_PATH = f"{FAISS_INDEX_PATH}.map.json"
VECTOR_DIM = 768

# 加载FAISS索引和ID映射（懒加载）
_index = None
_id_map = None

def get_index():
    """获取FAISS索引"""
    global _index
    if _index is None:
        _index = faiss.read_index(FAISS_INDEX_PATH)
    return _index

def get_id_map():
    """获取ID映射"""
    global _id_map
    if _id_map is None:
        with open(ID_MAP_PATH, 'r', encoding='utf-8') as f:
            _id_map = json.load(f)
    return _id_map

def generate_query_vector(query_text):
    """
    生成查询向量
    在实际应用中，应当使用与构建索引相同的模型来生成向量
    这里为了演示，使用随机向量
    """
    # 实际应用中应当使用: 
    # model = SentenceTransformer('model_name')
    # return model.encode(query_text)
    
    # 生成随机向量作为演示
    vec = np.random.randn(VECTOR_DIM).astype('float32')
    vec = vec / np.linalg.norm(vec)
    return vec

@search_bp.route('/semantic', methods=['POST'])
def semantic_search():
    """语义搜索API端点"""
    try:
        # 解析请求数据
        data = request.get_json()
        query = data.get('query', '')
        threshold = float(data.get('threshold', 0.5))
        k = int(data.get('limit', 10))
        
        # 可选过滤参数
        language = data.get('language')
        start_date = data.get('startDate')
        end_date = data.get('endDate')
        source = data.get('source')
        
        # 参数验证
        if not query.strip():
            return jsonify({"error": "查询不能为空"}), 400
        
        if threshold < 0 or threshold > 1:
            return jsonify({"error": "阈值必须在0到1之间"}), 400
        
        # 生成查询向量
        query_vector = generate_query_vector(query)
        
        # 获取FAISS索引和ID映射
        index = get_index()
        id_map = get_id_map()
        
        # 查询向量必须是二维数组
        query_vector = np.array([query_vector]).astype('float32')
        
        # 执行搜索
        D, I = index.search(query_vector, k)
        
        # 取第一个查询的结果
        distances = D[0] 
        indices = I[0]
        
        # 准备MongoDB查询
        client = MongoClient(MONGO_URI)
        db = client.news_system
        collection = db.articles
        
        # 构建过滤条件
        mongo_filter = {}
        if language:
            mongo_filter['language'] = language
        if source:
            mongo_filter['source'] = source
        
        # 日期过滤
        date_filter = {}
        if start_date:
            date_filter['$gte'] = datetime.fromisoformat(start_date)
        if end_date:
            date_filter['$lte'] = datetime.fromisoformat(end_date)
        if date_filter:
            mongo_filter['publishDate'] = date_filter
        
        # 获取匹配的文档
        results = []
        for i, (idx, score) in enumerate(zip(indices, distances)):
            if idx < 0 or str(idx) not in id_map:
                continue  # 无效索引
            
            # 只包含相似度大于阈值的结果
            if score < threshold:
                continue
            
            doc_id = id_map[str(idx)]
            
            # 添加ID条件到过滤器的副本
            doc_filter = mongo_filter.copy()
            doc_filter['_id'] = doc_id
            
            # 查询MongoDB
            document = collection.find_one(doc_filter)
            
            if document:
                # 转换ID和日期为可序列化格式
                document['_id'] = str(document['_id'])
                if 'publishDate' in document:
                    document['publishDate'] = document['publishDate'].isoformat()
                if 'createdAt' in document:
                    document['createdAt'] = document['createdAt'].isoformat()
                if 'updatedAt' in document:
                    document['updatedAt'] = document['updatedAt'].isoformat()
                
                # 添加到结果
                results.append({
                    "id": document['_id'],
                    "title": document['title'],
                    "summary": document['summary'],
                    "content": document.get('content', ''),
                    "source": document.get('source', ''),
                    "publishDate": document.get('publishDate', ''),
                    "language": document.get('language', ''),
                    "category": document.get('category', ''),
                    "similarity": float(score)
                })
        
        # 关闭MongoDB连接
        client.close()
        
        return jsonify({
            "query": query,
            "threshold": threshold,
            "count": len(results),
            "results": results
        })
    
    except Exception as e:
        return jsonify({"error": f"搜索处理失败: {str(e)}"}), 500

@search_bp.route('/info', methods=['GET'])
def search_info():
    """获取搜索系统信息"""
    try:
        # 获取索引信息
        index = get_index()
        index_size = index.ntotal
        
        return jsonify({
            "status": "ok",
            "indexSize": index_size,
            "vectorDimension": VECTOR_DIM,
            "indexType": type(index).__name__
        })
    
    except Exception as e:
        return jsonify({"error": f"获取搜索信息失败: {str(e)}"}), 500

def init_app(app):
    """初始化并注册Blueprint"""
    app.register_blueprint(search_bp)
