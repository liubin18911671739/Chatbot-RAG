from typing import List, Dict, Union, Optional
import faiss
import numpy as np
import os
import uuid
from sentence_transformers import SentenceTransformer
import pickle

class VectorDatabase:
    def __init__(self, index_file: str, embedding_model: str = "all-MiniLM-L6-v2", metadata_file: str = None):
        """
        初始化向量数据库
        :param index_file: FAISS索引文件路径
        :param embedding_model: 用于文本嵌入的模型名称
        :param metadata_file: 用于存储文档元数据的文件路径
        """
        self.index_file = index_file
        self.metadata_file = metadata_file or f"{os.path.splitext(index_file)[0]}_metadata.pkl"
        self.index = self.load_index()
        self.metadata = self.load_metadata()
        
        # 初始化嵌入模型
        self.embedding_model = SentenceTransformer(embedding_model)

    def load_index(self):
        if os.path.exists(self.index_file):
            return faiss.read_index(self.index_file)
        else:
            return None
            
    def load_metadata(self):
        """加载文档元数据"""
        if os.path.exists(self.metadata_file):
            with open(self.metadata_file, 'rb') as f:
                return pickle.load(f)
        else:
            return {}

    def save_index(self):
        """保存FAISS索引到文件"""
        if self.index is not None:
            # 确保目录存在
            os.makedirs(os.path.dirname(self.index_file), exist_ok=True)
            faiss.write_index(self.index, self.index_file)
            
    def save_metadata(self):
        """保存文档元数据"""
        # 确保目录存在
        os.makedirs(os.path.dirname(self.metadata_file), exist_ok=True)
        with open(self.metadata_file, 'wb') as f:
            pickle.dump(self.metadata, f)

    def add_vectors(self, vectors: np.ndarray, ids: List[str]):
        if self.index is None:
            dimension = vectors.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
        self.index.add(vectors)
        # Optionally, you can store the ids in a separate structure if needed

    def search(self, query_vector: np.ndarray, k: int) -> Dict[str, float]:
        if self.index is None:
            raise ValueError("Index not initialized.")
        distances, indices = self.index.search(query_vector, k)
        
        # 返回检索结果和对应的元数据
        results = []
        for i, (idx, dist) in enumerate(zip(indices[0], distances[0])):
            if idx < 0:  # FAISS可能返回-1表示没有足够的匹配
                continue
            doc_id = str(idx)
            if doc_id in self.metadata:
                results.append({
                    "id": doc_id,
                    "distance": float(dist),
                    "metadata": self.metadata.get(doc_id, {}),
                    "content": self.metadata.get(doc_id, {}).get("content", "")
                })
                
        return results

    def clear(self):
        self.index = None
        self.metadata = {}
        if os.path.exists(self.index_file):
            os.remove(self.index_file)
        if os.path.exists(self.metadata_file):
            os.remove(self.metadata_file)
            
    def upload_document(self, 
                       content: str, 
                       metadata: Optional[Dict] = None, 
                       chunk_size: int = 1000, 
                       overlap: int = 200) -> List[str]:
        """
        上传文档并将其存储在向量数据库中
        
        :param content: 文档内容
        :param metadata: 文档元数据，如标题、作者等
        :param chunk_size: 文档分块大小（字符数）
        :param overlap: 文档分块重叠大小（字符数）
        :return: 存储的文档块ID列表
        """
        if metadata is None:
            metadata = {}
            
        # 将文档分成较小的块
        chunks = self._split_text(content, chunk_size, overlap)
        
        # 为每个块生成唯一ID
        chunk_ids = [str(self.index.ntotal + i) if self.index else str(i) for i in range(len(chunks))]
        
        # 使用嵌入模型将文本转换为向量
        embeddings = self.embedding_model.encode(chunks)
        embeddings = np.array(embeddings).astype('float32')
        
        # 将向量添加到索引中
        self.add_vectors(embeddings, chunk_ids)
        
        # 存储文档块元数据
        for i, chunk_id in enumerate(chunk_ids):
            self.metadata[chunk_id] = {
                "content": chunks[i],
                "document_metadata": metadata,
                "chunk_index": i,
                "total_chunks": len(chunks)
            }
        
        # 保存索引和元数据
        self.save_index()
        self.save_metadata()
        
        return chunk_ids
    
    def _split_text(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """
        将文本分割成重叠的块
        
        :param text: 要分割的文本
        :param chunk_size: 每个块的最大大小
        :param overlap: 块之间的重叠大小
        :return: 文本块列表
        """
        if len(text) <= chunk_size:
            return [text]
            
        chunks = []
        start = 0
        while start < len(text):
            # 确保我们不会越界
            end = min(start + chunk_size, len(text))
            
            # 如果不是最后一块，尝试在句子或段落边界处分割
            if end < len(text):
                # 尝试在句号、问号或感叹号后分割
                for sep in [". ", "? ", "! ", "\n\n"]:
                    last_sep = text[start:end].rfind(sep)
                    if last_sep != -1:
                        end = start + last_sep + len(sep)
                        break
            
            chunks.append(text[start:end])
            start = end - overlap
        
        return chunks

if __name__ == "__main__":
    # 创建测试目录
    os.makedirs("faiss/index", exist_ok=True)
    
    # 示例用法
    db = VectorDatabase("faiss/index/index.faiss")

    # 上传文档
    document_content = (
    '''项目简介
该项目是一个基于 Docker 的问答系统，利用前后端分离架构，实现了前端展示、后端业务，以及数据库和模型服务之间的协同工作。

架构说明
Frontend: 构建前端显示界面，服务于用户请求。侦听端口 8080，并通过 Nginx 提供静态资源。
Backend: 后端服务，处理业务逻辑，侦听端口 5000，依赖于 MySQL 数据库和 RAG 模型服务。
MySQL: 数据库服务，用于存储应用数据。
vllm: RAG 模型服务，提供问答生成接口。''')

    document_metadata = {
        "title": "示例文档",
        "author": "张三",
        "source": "内部知识库",
        "category": "通用场景"
    }

    chunk_ids = db.upload_document(
        content=document_content,
        metadata=document_metadata,
        chunk_size=1000,  # 每块最多1000个字符
        overlap=200       # 块之间重叠200个字符
    )

    # 搜索相关内容
    query = "太阳?"
    query_vector = db.embedding_model.encode([query])[0].reshape(1, -1).astype('float32')
    results = db.search(query_vector, k=3)  # 检索最相关的3个文档块

    for result in results:
        print(f"相关度: {1.0 - result['distance']/100:.2f}")
        print(f"内容: {result['content'][:100]}...")
        print("---")