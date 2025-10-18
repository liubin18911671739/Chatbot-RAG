"""
文档处理服务
负责文档解析、文本分片、向量化和存储的完整管线
"""

import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from abc import ABC, abstractmethod
from datetime import datetime

# 文档解析库
import PyPDF2
from docx import Document as DocxDocument

# 文本分片
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    CharacterTextSplitter
)

# 内部服务
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DocumentParser(ABC):
    """文档解析器抽象基类"""
    
    @abstractmethod
    def parse(self, file_path: str) -> Dict[str, Any]:
        """
        解析文档
        
        Args:
            file_path: 文档文件路径
            
        Returns:
            Dict: {
                'text': str,  # 提取的文本
                'metadata': dict  # 元数据（页数、作者等）
            }
        """
        pass
    
    @abstractmethod
    def supports(self, file_extension: str) -> bool:
        """检查是否支持该文件类型"""
        pass


class PDFParser(DocumentParser):
    """PDF 文档解析器"""
    
    def supports(self, file_extension: str) -> bool:
        return file_extension.lower() in ['.pdf']
    
    def parse(self, file_path: str) -> Dict[str, Any]:
        """解析 PDF 文件"""
        logger.info(f"开始解析 PDF: {file_path}")
        
        text_content = []
        metadata = {
            'file_path': file_path,
            'file_name': os.path.basename(file_path),
            'file_type': 'pdf',
            'pages': 0,
            'parsed_at': datetime.now().isoformat()
        }
        
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                metadata['pages'] = len(pdf_reader.pages)
                
                # 提取 PDF 元数据
                if pdf_reader.metadata:
                    metadata['title'] = pdf_reader.metadata.get('/Title', '')
                    metadata['author'] = pdf_reader.metadata.get('/Author', '')
                    metadata['subject'] = pdf_reader.metadata.get('/Subject', '')
                
                # 提取每页文本
                for page_num, page in enumerate(pdf_reader.pages, 1):
                    try:
                        page_text = page.extract_text()
                        if page_text.strip():
                            text_content.append({
                                'text': page_text,
                                'page': page_num
                            })
                    except Exception as e:
                        logger.warning(f"解析第 {page_num} 页失败: {e}")
                        continue
            
            # 合并所有文本
            full_text = '\n\n'.join([item['text'] for item in text_content])
            
            logger.info(f"PDF 解析完成: {metadata['pages']} 页, {len(full_text)} 字符")
            
            return {
                'text': full_text,
                'metadata': metadata,
                'pages': text_content  # 保留页码信息
            }
        
        except Exception as e:
            logger.error(f"解析 PDF 失败: {e}")
            raise ValueError(f"PDF 解析失败: {str(e)}")


class DOCXParser(DocumentParser):
    """DOCX 文档解析器"""
    
    def supports(self, file_extension: str) -> bool:
        return file_extension.lower() in ['.docx', '.doc']
    
    def parse(self, file_path: str) -> Dict[str, Any]:
        """解析 DOCX 文件"""
        logger.info(f"开始解析 DOCX: {file_path}")
        
        metadata = {
            'file_path': file_path,
            'file_name': os.path.basename(file_path),
            'file_type': 'docx',
            'paragraphs': 0,
            'parsed_at': datetime.now().isoformat()
        }
        
        try:
            doc = DocxDocument(file_path)
            
            # 提取文档属性
            core_properties = doc.core_properties
            if core_properties:
                metadata['title'] = core_properties.title or ''
                metadata['author'] = core_properties.author or ''
                metadata['subject'] = core_properties.subject or ''
            
            # 提取段落文本
            paragraphs = []
            for para in doc.paragraphs:
                text = para.text.strip()
                if text:
                    paragraphs.append(text)
            
            metadata['paragraphs'] = len(paragraphs)
            full_text = '\n\n'.join(paragraphs)
            
            logger.info(f"DOCX 解析完成: {metadata['paragraphs']} 段落, {len(full_text)} 字符")
            
            return {
                'text': full_text,
                'metadata': metadata
            }
        
        except Exception as e:
            logger.error(f"解析 DOCX 失败: {e}")
            raise ValueError(f"DOCX 解析失败: {str(e)}")


class TXTParser(DocumentParser):
    """纯文本文档解析器"""
    
    def supports(self, file_extension: str) -> bool:
        return file_extension.lower() in ['.txt', '.text']
    
    def parse(self, file_path: str) -> Dict[str, Any]:
        """解析 TXT 文件"""
        logger.info(f"开始解析 TXT: {file_path}")
        
        metadata = {
            'file_path': file_path,
            'file_name': os.path.basename(file_path),
            'file_type': 'txt',
            'parsed_at': datetime.now().isoformat()
        }
        
        try:
            # 尝试多种编码
            encodings = ['utf-8', 'gbk', 'gb2312', 'latin-1']
            text = None
            
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as file:
                        text = file.read()
                    metadata['encoding'] = encoding
                    break
                except UnicodeDecodeError:
                    continue
            
            if text is None:
                raise ValueError("无法识别文件编码")
            
            metadata['lines'] = len(text.split('\n'))
            
            logger.info(f"TXT 解析完成: {metadata['lines']} 行, {len(text)} 字符")
            
            return {
                'text': text,
                'metadata': metadata
            }
        
        except Exception as e:
            logger.error(f"解析 TXT 失败: {e}")
            raise ValueError(f"TXT 解析失败: {str(e)}")


class MarkdownParser(DocumentParser):
    """Markdown 文档解析器"""
    
    def supports(self, file_extension: str) -> bool:
        return file_extension.lower() in ['.md', '.markdown']
    
    def parse(self, file_path: str) -> Dict[str, Any]:
        """解析 Markdown 文件"""
        logger.info(f"开始解析 Markdown: {file_path}")
        
        metadata = {
            'file_path': file_path,
            'file_name': os.path.basename(file_path),
            'file_type': 'markdown',
            'parsed_at': datetime.now().isoformat()
        }
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            
            # 提取标题（第一行 # 开头）
            lines = text.split('\n')
            for line in lines:
                if line.startswith('#'):
                    metadata['title'] = line.lstrip('#').strip()
                    break
            
            metadata['lines'] = len(lines)
            
            logger.info(f"Markdown 解析完成: {metadata['lines']} 行, {len(text)} 字符")
            
            return {
                'text': text,
                'metadata': metadata
            }
        
        except Exception as e:
            logger.error(f"解析 Markdown 失败: {e}")
            raise ValueError(f"Markdown 解析失败: {str(e)}")


class DocumentService:
    """
    文档处理服务
    完整的文档处理管线：解析 -> 分片 -> 向量化 -> 存储
    """
    
    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        vector_service: Optional[VectorService] = None,
        chunk_size: int = 500,
        chunk_overlap: int = 50
    ):
        """
        初始化文档处理服务
        
        Args:
            embedding_service: Embedding 服务实例
            vector_service: 向量存储服务实例
            chunk_size: 分片大小（字符数）
            chunk_overlap: 分片重叠大小
        """
        self.embedding_service = embedding_service
        self.vector_service = vector_service
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # 注册文档解析器
        self.parsers: List[DocumentParser] = [
            PDFParser(),
            DOCXParser(),
            TXTParser(),
            MarkdownParser()
        ]
        
        # 创建文本分片器
        self._init_splitters()
        
        logger.info(f"文档服务初始化完成 (chunk_size={chunk_size}, overlap={chunk_overlap})")
    
    def _init_splitters(self):
        """初始化文本分片器"""
        # 递归字符分片器（推荐，保持语义完整性）
        self.recursive_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", "。", "！", "？", ". ", "! ", "? ", "；", "; ", "，", ", ", " ", ""]
        )
        
        # 简单字符分片器
        self.char_splitter = CharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separator="\n"
        )
    
    def get_parser(self, file_path: str) -> Optional[DocumentParser]:
        """
        根据文件路径获取合适的解析器
        
        Args:
            file_path: 文件路径
            
        Returns:
            DocumentParser: 解析器实例，如果不支持则返回 None
        """
        file_extension = Path(file_path).suffix
        
        for parser in self.parsers:
            if parser.supports(file_extension):
                return parser
        
        return None
    
    def parse_document(self, file_path: str) -> Dict[str, Any]:
        """
        解析文档
        
        Args:
            file_path: 文档文件路径
            
        Returns:
            Dict: 解析结果 {'text': str, 'metadata': dict}
            
        Raises:
            ValueError: 不支持的文件类型或解析失败
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        parser = self.get_parser(file_path)
        if parser is None:
            file_ext = Path(file_path).suffix
            raise ValueError(f"不支持的文件类型: {file_ext}")
        
        return parser.parse(file_path)
    
    def chunk_text(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        strategy: str = "recursive"
    ) -> List[Dict[str, Any]]:
        """
        将文本分片
        
        Args:
            text: 待分片的文本
            metadata: 文档元数据
            strategy: 分片策略 ('recursive' 或 'simple')
            
        Returns:
            List[Dict]: 分片列表，每个元素包含 {'text': str, 'metadata': dict, 'chunk_index': int}
        """
        logger.info(f"开始文本分片 (策略={strategy}, 文本长度={len(text)})")
        
        # 选择分片器
        splitter = self.recursive_splitter if strategy == "recursive" else self.char_splitter
        
        # 执行分片
        chunks = splitter.split_text(text)
        
        # 构建分片列表
        chunk_list = []
        for i, chunk_text in enumerate(chunks):
            chunk_metadata = {
                'chunk_index': i,
                'chunk_size': len(chunk_text),
                'total_chunks': len(chunks)
            }
            
            # 合并原始元数据
            if metadata:
                chunk_metadata.update(metadata)
            
            chunk_list.append({
                'text': chunk_text,
                'metadata': chunk_metadata,
                'chunk_index': i
            })
        
        logger.info(f"文本分片完成: {len(chunk_list)} 个分片")
        return chunk_list
    
    def ingest_document(
        self,
        file_path: str,
        document_id: Optional[str] = None,
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        完整的文档入库流程
        1. 解析文档
        2. 文本分片
        3. 向量化
        4. 存储到向量数据库
        
        Args:
            file_path: 文档文件路径
            document_id: 文档ID（可选）
            additional_metadata: 额外元数据
            
        Returns:
            Dict: 入库结果 {
                'document_id': str,
                'chunks_count': int,
                'vectors_count': int,
                'status': str,
                'metadata': dict
            }
            
        Raises:
            ValueError: 解析、分片或向量化失败
        """
        logger.info(f"开始文档入库流程: {file_path}")
        
        result = {
            'document_id': document_id or Path(file_path).stem,
            'file_path': file_path,
            'status': 'failed',
            'error': None
        }
        
        try:
            # 步骤 1: 解析文档
            logger.info("步骤 1/4: 解析文档...")
            parse_result = self.parse_document(file_path)
            text = parse_result['text']
            metadata = parse_result['metadata']
            
            # 添加额外元数据
            if additional_metadata:
                metadata.update(additional_metadata)
            
            result['metadata'] = metadata
            
            # 步骤 2: 文本分片
            logger.info("步骤 2/4: 文本分片...")
            chunks = self.chunk_text(text, metadata)
            result['chunks_count'] = len(chunks)
            
            # 步骤 3: 向量化（如果提供了 embedding 服务）
            if self.embedding_service:
                logger.info("步骤 3/4: 文本向量化...")
                chunk_texts = [chunk['text'] for chunk in chunks]
                embeddings = self.embedding_service.get_embeddings(chunk_texts)
                result['vectors_count'] = len(embeddings)
                
                # 步骤 4: 存储到向量数据库（如果提供了 vector 服务）
                if self.vector_service:
                    logger.info("步骤 4/4: 存储向量...")
                    chunk_metadata = [chunk['metadata'] for chunk in chunks]
                    vector_ids = self.vector_service.add_vectors(embeddings, chunk_metadata)
                    result['vector_ids'] = vector_ids
                    result['status'] = 'success'
                    logger.info(f"文档入库成功: {len(vector_ids)} 个向量")
                else:
                    result['status'] = 'partial'
                    result['embeddings'] = embeddings
                    logger.info("向量化完成，但未存储（缺少 vector_service）")
            else:
                result['status'] = 'partial'
                result['chunks'] = chunks
                logger.info("分片完成，但未向量化（缺少 embedding_service）")
            
            return result
        
        except Exception as e:
            logger.error(f"文档入库失败: {e}")
            result['error'] = str(e)
            raise
    
    def batch_ingest_documents(
        self,
        file_paths: List[str],
        progress_callback: Optional[callable] = None
    ) -> List[Dict[str, Any]]:
        """
        批量处理文档
        
        Args:
            file_paths: 文档文件路径列表
            progress_callback: 进度回调函数 callback(current, total, file_path)
            
        Returns:
            List[Dict]: 每个文档的处理结果
        """
        logger.info(f"开始批量处理 {len(file_paths)} 个文档")
        
        results = []
        total = len(file_paths)
        
        for i, file_path in enumerate(file_paths, 1):
            try:
                if progress_callback:
                    progress_callback(i, total, file_path)
                
                result = self.ingest_document(file_path)
                results.append(result)
                
            except Exception as e:
                logger.error(f"处理文档失败 {file_path}: {e}")
                results.append({
                    'file_path': file_path,
                    'status': 'failed',
                    'error': str(e)
                })
        
        success_count = sum(1 for r in results if r['status'] == 'success')
        logger.info(f"批量处理完成: {success_count}/{total} 成功")
        
        return results
    
    def get_supported_extensions(self) -> List[str]:
        """获取支持的文件扩展名列表"""
        extensions = []
        for parser in self.parsers:
            # 获取解析器支持的扩展名
            if hasattr(parser, 'supports'):
                test_extensions = ['.pdf', '.docx', '.doc', '.txt', '.text', '.md', '.markdown']
                for ext in test_extensions:
                    if parser.supports(ext):
                        extensions.append(ext)
        
        return list(set(extensions))


# 单例实例（可选）
_document_service_instance: Optional[DocumentService] = None


def get_document_service(
    embedding_service: Optional[EmbeddingService] = None,
    vector_service: Optional[VectorService] = None,
    chunk_size: int = 500,
    chunk_overlap: int = 50
) -> DocumentService:
    """
    获取文档服务单例
    
    Args:
        embedding_service: Embedding 服务实例
        vector_service: 向量存储服务实例
        chunk_size: 分片大小
        chunk_overlap: 分片重叠
        
    Returns:
        DocumentService: 文档服务实例
    """
    global _document_service_instance
    
    if _document_service_instance is None:
        _document_service_instance = DocumentService(
            embedding_service=embedding_service,
            vector_service=vector_service,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
    
    return _document_service_instance
