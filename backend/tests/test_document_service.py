"""
文档处理服务单元测试
测试文档解析、分片和入库功能
"""

import os
import unittest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import tempfile

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.document_service import (
    DocumentService,
    PDFParser,
    DOCXParser,
    TXTParser,
    MarkdownParser
)


class TestDocumentParsers(unittest.TestCase):
    """测试文档解析器"""
    
    def setUp(self):
        """设置测试环境"""
        self.test_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        """清理测试文件"""
        import shutil
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def test_txt_parser_supports(self):
        """测试 TXT 解析器支持的文件类型"""
        parser = TXTParser()
        self.assertTrue(parser.supports('.txt'))
        self.assertTrue(parser.supports('.text'))
        self.assertFalse(parser.supports('.pdf'))
    
    def test_txt_parser_parse(self):
        """测试 TXT 文件解析"""
        parser = TXTParser()
        
        # 创建测试文件
        test_file = os.path.join(self.test_dir, 'test.txt')
        test_content = "这是第一行\n这是第二行\n这是第三行"
        
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_content)
        
        # 解析
        result = parser.parse(test_file)
        
        self.assertIn('text', result)
        self.assertIn('metadata', result)
        self.assertEqual(result['text'], test_content)
        self.assertEqual(result['metadata']['file_type'], 'txt')
        self.assertEqual(result['metadata']['lines'], 3)
    
    def test_markdown_parser_supports(self):
        """测试 Markdown 解析器支持的文件类型"""
        parser = MarkdownParser()
        self.assertTrue(parser.supports('.md'))
        self.assertTrue(parser.supports('.markdown'))
        self.assertFalse(parser.supports('.txt'))
    
    def test_markdown_parser_parse(self):
        """测试 Markdown 文件解析"""
        parser = MarkdownParser()
        
        # 创建测试文件
        test_file = os.path.join(self.test_dir, 'test.md')
        test_content = """# 测试标题

这是内容段落1。

这是内容段落2。
"""
        
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_content)
        
        # 解析
        result = parser.parse(test_file)
        
        self.assertIn('text', result)
        self.assertIn('metadata', result)
        self.assertEqual(result['text'], test_content)
        self.assertEqual(result['metadata']['file_type'], 'markdown')
        self.assertEqual(result['metadata']['title'], '测试标题')
    
    @patch('PyPDF2.PdfReader')
    def test_pdf_parser_supports(self, mock_pdf_reader):
        """测试 PDF 解析器支持的文件类型"""
        parser = PDFParser()
        self.assertTrue(parser.supports('.pdf'))
        self.assertFalse(parser.supports('.txt'))
    
    def test_docx_parser_supports(self):
        """测试 DOCX 解析器支持的文件类型"""
        parser = DOCXParser()
        self.assertTrue(parser.supports('.docx'))
        self.assertTrue(parser.supports('.doc'))
        self.assertFalse(parser.supports('.pdf'))


class TestDocumentService(unittest.TestCase):
    """测试文档服务"""
    
    def setUp(self):
        """设置测试环境"""
        self.test_dir = tempfile.mkdtemp()
        
        # 创建 mock 服务
        self.mock_embedding_service = Mock()
        self.mock_vector_service = Mock()
        
        # 创建文档服务
        self.doc_service = DocumentService(
            embedding_service=self.mock_embedding_service,
            vector_service=self.mock_vector_service,
            chunk_size=100,
            chunk_overlap=20
        )
    
    def tearDown(self):
        """清理测试文件"""
        import shutil
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def test_init(self):
        """测试初始化"""
        self.assertIsNotNone(self.doc_service)
        self.assertEqual(self.doc_service.chunk_size, 100)
        self.assertEqual(self.doc_service.chunk_overlap, 20)
        self.assertEqual(len(self.doc_service.parsers), 4)  # PDF, DOCX, TXT, Markdown
    
    def test_get_supported_extensions(self):
        """测试获取支持的文件扩展名"""
        extensions = self.doc_service.get_supported_extensions()
        
        self.assertIn('.pdf', extensions)
        self.assertIn('.docx', extensions)
        self.assertIn('.txt', extensions)
        self.assertIn('.md', extensions)
    
    def test_get_parser(self):
        """测试获取解析器"""
        # TXT
        parser = self.doc_service.get_parser('test.txt')
        self.assertIsInstance(parser, TXTParser)
        
        # Markdown
        parser = self.doc_service.get_parser('test.md')
        self.assertIsInstance(parser, MarkdownParser)
        
        # 不支持的类型
        parser = self.doc_service.get_parser('test.unknown')
        self.assertIsNone(parser)
    
    def test_parse_document_txt(self):
        """测试解析 TXT 文档"""
        # 创建测试文件
        test_file = os.path.join(self.test_dir, 'test.txt')
        test_content = "测试内容123"
        
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_content)
        
        # 解析
        result = self.doc_service.parse_document(test_file)
        
        self.assertEqual(result['text'], test_content)
        self.assertEqual(result['metadata']['file_type'], 'txt')
    
    def test_parse_document_unsupported(self):
        """测试解析不支持的文件类型"""
        test_file = os.path.join(self.test_dir, 'test.unknown')
        
        with open(test_file, 'w') as f:
            f.write('test')
        
        with self.assertRaises(ValueError) as context:
            self.doc_service.parse_document(test_file)
        
        self.assertIn('不支持的文件类型', str(context.exception))
    
    def test_parse_document_not_found(self):
        """测试解析不存在的文件"""
        with self.assertRaises(FileNotFoundError):
            self.doc_service.parse_document('nonexistent.txt')
    
    def test_chunk_text_simple(self):
        """测试简单文本分片"""
        # 创建足够长的文本，确保会被分片（每段50字符，重复20次，加换行符）
        text = "这是第一段测试文本，包含足够的字符来触发分片功能。\n" * 20
        
        chunks = self.doc_service.chunk_text(text, strategy="simple")
        
        # 至少应该有1个分片
        self.assertGreaterEqual(len(chunks), 1)
        self.assertEqual(chunks[0]['chunk_index'], 0)
        self.assertIn('text', chunks[0])
        self.assertIn('metadata', chunks[0])
    
    def test_chunk_text_recursive(self):
        """测试递归分片"""
        text = "第一段。\n\n第二段。\n\n第三段。" * 20
        
        chunks = self.doc_service.chunk_text(text, strategy="recursive")
        
        self.assertGreater(len(chunks), 1)
        
        # 验证分片元数据
        for chunk in chunks:
            self.assertIn('chunk_index', chunk['metadata'])
            self.assertIn('chunk_size', chunk['metadata'])
            self.assertIn('total_chunks', chunk['metadata'])
    
    def test_chunk_text_with_metadata(self):
        """测试带元数据的文本分片"""
        text = "测试" * 100
        metadata = {'file_name': 'test.txt', 'author': 'tester'}
        
        chunks = self.doc_service.chunk_text(text, metadata=metadata)
        
        # 验证元数据被传递到每个分片
        for chunk in chunks:
            self.assertEqual(chunk['metadata']['file_name'], 'test.txt')
            self.assertEqual(chunk['metadata']['author'], 'tester')
    
    def test_ingest_document_full_pipeline(self):
        """测试完整的文档入库流程"""
        # 创建测试文件
        test_file = os.path.join(self.test_dir, 'test.txt')
        test_content = "这是测试文档。" * 50
        
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_content)
        
        # 配置 mock
        import numpy as np
        mock_embeddings = [np.random.rand(384).astype('float32') for _ in range(5)]
        self.mock_embedding_service.get_embeddings.return_value = mock_embeddings
        self.mock_vector_service.add_vectors.return_value = [0, 1, 2, 3, 4]
        
        # 执行入库
        result = self.doc_service.ingest_document(test_file, document_id='test-doc-1')
        
        # 验证结果
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['document_id'], 'test-doc-1')
        self.assertGreater(result['chunks_count'], 0)
        self.assertGreater(result['vectors_count'], 0)
        
        # 验证服务被调用
        self.mock_embedding_service.get_embeddings.assert_called_once()
        self.mock_vector_service.add_vectors.assert_called_once()
    
    def test_ingest_document_without_vector_service(self):
        """测试没有向量服务的文档入库"""
        doc_service = DocumentService(
            embedding_service=self.mock_embedding_service,
            vector_service=None
        )
        
        # 创建测试文件
        test_file = os.path.join(self.test_dir, 'test.txt')
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write("测试内容" * 20)
        
        # 配置 mock
        import numpy as np
        mock_embeddings = [np.random.rand(384).astype('float32') for _ in range(2)]
        self.mock_embedding_service.get_embeddings.return_value = mock_embeddings
        
        # 执行入库
        result = doc_service.ingest_document(test_file)
        
        # 验证状态为 partial（部分完成）
        self.assertEqual(result['status'], 'partial')
        self.assertIn('embeddings', result)
    
    def test_ingest_document_without_embedding_service(self):
        """测试没有 Embedding 服务的文档入库"""
        doc_service = DocumentService(
            embedding_service=None,
            vector_service=self.mock_vector_service
        )
        
        # 创建测试文件
        test_file = os.path.join(self.test_dir, 'test.txt')
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write("测试内容" * 20)
        
        # 执行入库
        result = doc_service.ingest_document(test_file)
        
        # 验证状态为 partial
        self.assertEqual(result['status'], 'partial')
        self.assertIn('chunks', result)
    
    def test_batch_ingest_documents(self):
        """测试批量文档处理"""
        # 创建多个测试文件
        test_files = []
        for i in range(3):
            test_file = os.path.join(self.test_dir, f'test{i}.txt')
            with open(test_file, 'w', encoding='utf-8') as f:
                f.write(f"测试内容{i}" * 20)
            test_files.append(test_file)
        
        # 配置 mock
        import numpy as np
        self.mock_embedding_service.get_embeddings.return_value = [
            np.random.rand(384).astype('float32') for _ in range(2)
        ]
        self.mock_vector_service.add_vectors.return_value = [0, 1]
        
        # 批量处理
        results = self.doc_service.batch_ingest_documents(test_files)
        
        # 验证结果
        self.assertEqual(len(results), 3)
        for result in results:
            self.assertIn('status', result)
    
    def test_batch_ingest_with_callback(self):
        """测试带进度回调的批量处理"""
        # 创建测试文件
        test_files = []
        for i in range(2):
            test_file = os.path.join(self.test_dir, f'test{i}.txt')
            with open(test_file, 'w', encoding='utf-8') as f:
                f.write(f"内容{i}" * 10)
            test_files.append(test_file)
        
        # 配置 mock
        import numpy as np
        self.mock_embedding_service.get_embeddings.return_value = [
            np.random.rand(384).astype('float32')
        ]
        self.mock_vector_service.add_vectors.return_value = [0]
        
        # 进度回调
        progress_calls = []
        
        def callback(current, total, file_path):
            progress_calls.append((current, total, file_path))
        
        # 批量处理
        results = self.doc_service.batch_ingest_documents(test_files, progress_callback=callback)
        
        # 验证回调被调用
        self.assertEqual(len(progress_calls), 2)
        self.assertEqual(progress_calls[0], (1, 2, test_files[0]))
        self.assertEqual(progress_calls[1], (2, 2, test_files[1]))


if __name__ == '__main__':
    # 运行测试
    unittest.main(verbosity=2)
