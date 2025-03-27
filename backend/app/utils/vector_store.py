import numpy as np
import faiss
from typing import List, Dict, Any
import os
import pickle
from flask import Blueprint, request, jsonify, current_app
from app.utils.text_processor import TextProcessor  # Import TextProcessor
from app.models.news import NewsDocument
from ..models.document import Document

search_bp = Blueprint('search', __name__)

class VectorStore:
    """向量存储接口，用于文档的向量化和检索"""
    
    def __init__(self):
        # 这里应该初始化实际的向量存储，如Faiss、Chroma、Pinecone等
        # 这里使用简化版实现作为示例
        self.index = {}
        self.document_chunks = {}
        self.embeddings = {}
        
        # 初始化加载已有文档的向量
        self._load_existing_documents()
    
    def _load_existing_documents(self):
        """加载数据库中已有的文档向量"""
        try:
            documents = Document.query.all()
            for doc in documents:
                # 在实际系统中，应从向量数据库加载向量
                # 这里简单模拟
                self._add_document_to_index(doc)
        except Exception as e:
            current_app.logger.error(f"加载文档向量失败: {str(e)}")
    
    def _generate_embeddings(self, text):
        """生成文本的嵌入向量
        
        在实际系统中，这里应调用OpenAI等API生成嵌入
        这里简化为随机向量
        """
        # 模拟生成1536维的向量（OpenAI嵌入的维度）
        return np.random.randn(1536).astype(np.float32)
    
    def _chunk_text(self, text, chunk_size=1000, overlap=200):
        """将文本分割成重叠的块"""
        chunks = []
        if not text:
            return chunks
            
        # 简单的文本分块策略，在实际系统中应使用更复杂的逻辑
        for i in range(0, len(text), chunk_size - overlap):
            chunk = text[i:i + chunk_size]
            if chunk:
                chunks.append(chunk)
                
        return chunks
    
    def _add_document_to_index(self, document):
        """将文档添加到索引"""
        try:
            if document.id in self.index:
                return  # 已存在则跳过
                
            # 读取文档内容
            full_content = ""
            if os.path.exists(document.file_path):
                with open(document.file_path, 'r', encoding='utf-8') as f:
                    full_content = f.read()
            else:
                full_content = document.content or ""
            
            # 分块
            chunks = self._chunk_text(full_content)
            
            # 为每个块生成嵌入
            doc_embeddings = []
            for i, chunk in enumerate(chunks):
                chunk_id = f"{document.id}_chunk_{i}"
                embedding = self._generate_embeddings(chunk)
                self.embeddings[chunk_id] = embedding
                doc_embeddings.append((chunk_id, embedding))
                
            self.document_chunks[document.id] = {
                'chunks': chunks,
                'chunk_ids': [item[0] for item in doc_embeddings]
            }
            
            self.index[document.id] = {
                'title': document.original_name,
                'embeddings': doc_embeddings
            }
            
            # 更新数据库中的分块数量
            document.chunk_count = len(chunks)
            document.save()
            
        except Exception as e:
            current_app.logger.error(f"将文档添加到索引失败: {str(e)}")
    
    def add_document(self, document):
        """添加文档到向量存储"""
        self._add_document_to_index(document)
    
    def delete_document(self, document_id):
        """从向量存储中删除文档"""
        if document_id in self.index:
            # 删除所有相关的块和嵌入
            if document_id in self.document_chunks:
                for chunk_id in self.document_chunks[document_id]['chunk_ids']:
                    if chunk_id in self.embeddings:
                        del self.embeddings[chunk_id]
                del self.document_chunks[document_id]
            
            # 从索引中删除文档
            del self.index[document_id]
    
    def search(self, query, limit=5):
        """搜索相关文档"""
        if not self.index:
            return []
            
        # 生成查询的嵌入向量
        query_embedding = self._generate_embeddings(query)
        
        # 计算相似度并排序（实际系统中应使用更高效的近邻搜索）
        chunk_scores = []
        for doc_id, doc_data in self.index.items():
            for chunk_id, embedding in doc_data['embeddings']:
                # 计算余弦相似度 (dot product of normalized vectors)
                similarity = np.dot(query_embedding, embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(embedding)
                )
                chunk_scores.append((doc_id, chunk_id, similarity))
        
        # 按相似度排序
        chunk_scores.sort(key=lambda x: x[2], reverse=True)
        
        # 获取前N个最相关的文档块
        top_chunks = chunk_scores[:limit]
        
        # 构建返回结果
        results = []
        for doc_id, chunk_id, score in top_chunks:
            chunk_index = int(chunk_id.split('_')[-1])
            document = Document.query.get(doc_id)
            if document and doc_id in self.document_chunks:
                chunk_content = self.document_chunks[doc_id]['chunks'][chunk_index]
                
                # 创建一个包含文档信息和相关度的对象
                doc_result = type('DocumentResult', (), {
                    'id': doc_id,
                    'title': document.original_name,
                    'content': chunk_content,
                    'filename': document.filename,
                    'relevance_score': score
                })
                results.append(doc_result)
        
        return results

@search_bp.route('/search/semantic', methods=['POST'])
def semantic_search():
    data = request.json
    keyword = data.get('keyword')
    threshold = data.get('threshold', 0.7)
    country = data.get('country', None)

    try:
        # 创建文本处理器并生成查询向量
        processor = TextProcessor()
        vector = processor.text_to_vector(keyword)
        
        # 使用向量存储查找相似内容
        vector_store = VectorStore()
        
        # 假设向量存储已经被填充了数据，否则会返回空结果
        # 在实际使用前，需要确保向量存储已经加载或初始化
        try:
            # 尝试加载向量存储
            config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                                    'data', 'vector_db', 'news_vectors')
            vector_store.load(config_path)
            
            similar_news = vector_store.find_similar(vector, threshold)
            
            # 如果指定了国家，进行过滤
            if country and similar_news:
                similar_news = [news for news in similar_news if news.get('country') == country]
                
            return jsonify({
                'status': 'success',
                'query': keyword,
                'count': len(similar_news),
                'results': similar_news
            })
            
        except Exception as e:
            # 如果向量存储不可用，返回空结果
            print(f"向量存储加载失败: {e}")
            return jsonify({
                'status': 'warning',
                'message': '语义搜索尚未初始化，请先导入数据',
                'query': keyword,
                'count': 0,
                'results': []
            })
    except Exception as e:
        print(f"语义搜索错误: {e}")
        return jsonify({
            'status': 'error',
            'message': f'语义搜索发生错误: {str(e)}',
            'query': keyword
        }), 500