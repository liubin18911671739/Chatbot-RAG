"""
RAG 服务单元测试
测试向量检索、提示词构建、LLM 调用等功能
"""

import unittest
import sys
import os
from unittest.mock import Mock, patch, MagicMock
import numpy as np

# 添加路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.rag_service import RAGService
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService


class TestRAGService(unittest.TestCase):
    """测试 RAG 服务核心功能"""
    
    def setUp(self):
        """测试前准备"""
        # 创建模拟的服务
        self.mock_embedding_service = Mock(spec=EmbeddingService)
        self.mock_vector_service = Mock(spec=VectorService)
        
        # 设置模拟返回值
        self.mock_embedding_service.get_embedding.return_value = np.random.rand(384).astype(np.float32)
        self.mock_embedding_service.embedding_dimension = 384
        
        # 创建 RAG 服务（不使用真实的 Gemini API）
        self.rag_service = RAGService(
            embedding_service=self.mock_embedding_service,
            vector_service=self.mock_vector_service,
            use_gemini=False  # 测试时不使用真实 API
        )
    
    def test_initialization(self):
        """测试服务初始化"""
        self.assertIsNotNone(self.rag_service)
        self.assertEqual(self.rag_service.top_k, RAGService.DEFAULT_TOP_K)
        self.assertEqual(self.rag_service.score_threshold, RAGService.DEFAULT_SCORE_THRESHOLD)
        self.assertIsNone(self.rag_service.gemini_client)  # use_gemini=False
    
    def test_scene_prompts_complete(self):
        """测试场景提示词配置完整性"""
        expected_scenes = [
            "db_sizheng", "db_xuexizhidao", "db_zhihuisizheng",
            "db_keyanfuzhu", "db_wangshangbanshiting", "default"
        ]
        
        for scene_id in expected_scenes:
            self.assertIn(scene_id, RAGService.SCENE_PROMPTS)
            config = RAGService.SCENE_PROMPTS[scene_id]
            self.assertIn('name', config)
            self.assertIn('system', config)
            self.assertIn('context_prefix', config)
    
    def test_retrieve_no_vector_service(self):
        """测试向量服务未初始化时的检索"""
        rag_service = RAGService(vector_service=None, use_gemini=False)
        results = rag_service.retrieve("测试查询")
        self.assertEqual(results, [])
    
    def test_retrieve_with_results(self):
        """测试向量检索返回结果"""
        # 模拟检索结果
        mock_results = [
            (0, 0.95, {
                'content': '这是第一个文档内容',
                'source': '文档1.pdf',
                'page': 1,
                'chunk_index': 0,
                'scene_id': 'db_sizheng'
            }),
            (1, 0.85, {
                'content': '这是第二个文档内容',
                'source': '文档2.pdf',
                'page': 2,
                'chunk_index': 1,
                'scene_id': 'db_sizheng'
            }),
            (2, 0.25, {  # 这个相似度低于阈值
                'content': '这是第三个文档内容',
                'source': '文档3.pdf',
                'page': 3,
                'chunk_index': 2,
                'scene_id': 'db_sizheng'
            })
        ]
        
        self.mock_vector_service.search.return_value = mock_results
        
        # 执行检索
        results = self.rag_service.retrieve(
            query="什么是思政？",
            scene_id="db_sizheng",
            top_k=5,
            score_threshold=0.3
        )
        
        # 验证结果
        self.assertEqual(len(results), 2)  # 第三个被过滤掉
        self.assertEqual(results[0]['content'], '这是第一个文档内容')
        self.assertEqual(results[0]['score'], 0.95)
        self.assertEqual(results[0]['source'], '文档1.pdf')
    
    def test_retrieve_scene_filtering(self):
        """测试场景过滤功能"""
        mock_results = [
            (0, 0.95, {
                'content': '思政内容',
                'source': '文档1.pdf',
                'scene_id': 'db_sizheng'
            }),
            (1, 0.85, {
                'content': '学习指导内容',
                'source': '文档2.pdf',
                'scene_id': 'db_xuexizhidao'
            })
        ]
        
        self.mock_vector_service.search.return_value = mock_results
        
        # 只检索思政场景
        results = self.rag_service.retrieve(
            query="测试",
            scene_id="db_sizheng",
            score_threshold=0.3
        )
        
        # 应该只返回思政场景的文档
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['content'], '思政内容')
    
    def test_build_prompt_with_docs(self):
        """测试构建包含检索文档的提示词"""
        retrieved_docs = [
            {
                'content': '中国特色社会主义是改革开放以来党的全部理论和实践的主题。',
                'score': 0.95,
                'source': '思政教材.pdf',
                'page': 10,
                'chunk_index': 0
            }
        ]
        
        system_instruction, user_prompt = self.rag_service.build_prompt(
            query="什么是中国特色社会主义？",
            retrieved_docs=retrieved_docs,
            scene_id="db_sizheng"
        )
        
        # 验证系统指令
        self.assertIn("思政", system_instruction)
        
        # 验证用户提示词包含必要信息
        self.assertIn("中国特色社会主义", user_prompt)
        self.assertIn("思政教材.pdf", user_prompt)
        self.assertIn("第10页", user_prompt)
        self.assertIn("什么是中国特色社会主义", user_prompt)
    
    def test_build_prompt_without_docs(self):
        """测试构建无检索文档时的提示词"""
        system_instruction, user_prompt = self.rag_service.build_prompt(
            query="什么是人工智能？",
            retrieved_docs=[],
            scene_id="default"
        )
        
        # 验证系统指令
        self.assertIn("AI助手", system_instruction)
        
        # 验证用户提示词包含无参考资料的提示
        self.assertIn("没有找到相关的参考资料", user_prompt)
        self.assertIn("什么是人工智能", user_prompt)
    
    def test_build_prompt_with_history(self):
        """测试构建包含对话历史的提示词"""
        history = [
            {'user': '你好', 'assistant': '你好！有什么可以帮助你的吗？'},
            {'user': '什么是思政？', 'assistant': '思想政治教育是...'}
        ]
        
        system_instruction, user_prompt = self.rag_service.build_prompt(
            query="能详细说说吗？",
            retrieved_docs=[],
            scene_id="db_sizheng",
            history=history
        )
        
        # 验证对话历史被包含
        self.assertIn("对话历史", user_prompt)
        self.assertIn("你好", user_prompt)
        self.assertIn("什么是思政", user_prompt)
    
    def test_build_prompt_different_scenes(self):
        """测试不同场景的提示词"""
        scenes_to_test = ["db_sizheng", "db_xuexizhidao", "db_keyanfuzhu", "default"]
        
        for scene_id in scenes_to_test:
            system_instruction, user_prompt = self.rag_service.build_prompt(
                query="测试问题",
                retrieved_docs=[],
                scene_id=scene_id
            )
            
            # 验证每个场景都有对应的系统指令
            self.assertIsNotNone(system_instruction)
            self.assertGreater(len(system_instruction), 0)
    
    @patch('services.rag_service.genai.Client')
    def test_generate_with_gemini(self, mock_gemini_client_class):
        """测试使用 Gemini 生成回答"""
        # 创建模拟的 Gemini 客户端
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "这是生成的回答内容"
        mock_client.models.generate_content.return_value = mock_response
        mock_gemini_client_class.return_value = mock_client
        
        # 创建启用 Gemini 的 RAG 服务
        rag_service = RAGService(
            embedding_service=self.mock_embedding_service,
            vector_service=self.mock_vector_service,
            use_gemini=True
        )
        rag_service.gemini_client = mock_client
        
        # 调用生成
        response_text = rag_service.generate(
            system_instruction="你是AI助手",
            user_prompt="测试问题"
        )
        
        # 验证
        self.assertEqual(response_text, "这是生成的回答内容")
        mock_client.models.generate_content.assert_called_once()
    
    def test_generate_without_llm(self):
        """测试没有 LLM 服务时的生成"""
        # RAG 服务未启用 LLM
        with self.assertRaises(Exception) as context:
            self.rag_service.generate(
                system_instruction="测试",
                user_prompt="测试"
            )
        
        self.assertIn("没有可用的 LLM 服务", str(context.exception))
    
    def test_generate_response_no_vector_service(self):
        """测试没有向量服务时的完整流程"""
        rag_service = RAGService(
            vector_service=None,
            use_gemini=False
        )
        
        # 不会抛出异常，应该返回错误响应
        result = rag_service.generate_response(
            prompt="测试问题",
            scene_id="default"
        )
        
        self.assertEqual(result['status'], 'error')
        self.assertEqual(result['retrieved_count'], 0)
    
    def test_backward_compatible_function(self):
        """测试向后兼容的函数接口"""
        from services.rag_service import generate_response
        
        result = generate_response(
            prompt="测试问题",
            scene_id="db_sizheng"
        )
        
        # 应该返回警告状态（因为没有真实的向量服务）
        self.assertIn('response', result)
        self.assertIn('status', result)


class TestPromptEngineering(unittest.TestCase):
    """测试提示词工程"""
    
    def setUp(self):
        """测试前准备"""
        self.rag_service = RAGService(
            embedding_service=Mock(),
            vector_service=Mock(),
            use_gemini=False
        )
    
    def test_prompt_includes_source_citation(self):
        """测试提示词包含来源引用"""
        docs = [
            {
                'content': '测试内容',
                'score': 0.9,
                'source': '测试.pdf',
                'page': 5
            }
        ]
        
        _, user_prompt = self.rag_service.build_prompt(
            query="测试",
            retrieved_docs=docs
        )
        
        # 验证来源引用格式
        self.assertIn("来源", user_prompt)
        self.assertIn("测试.pdf", user_prompt)
        self.assertIn("第5页", user_prompt)
        self.assertIn("相关度", user_prompt)
    
    def test_prompt_includes_instruction_to_cite(self):
        """测试提示词包含引用指令"""
        docs = [{'content': '测试', 'score': 0.9, 'source': '测试.pdf'}]
        
        _, user_prompt = self.rag_service.build_prompt(
            query="测试",
            retrieved_docs=docs
        )
        
        self.assertIn("注明信息来源", user_prompt)
    
    def test_prompt_history_limit(self):
        """测试对话历史长度限制"""
        # 创建10轮对话
        history = [
            {'user': f'问题{i}', 'assistant': f'回答{i}'}
            for i in range(10)
        ]
        
        _, user_prompt = self.rag_service.build_prompt(
            query="当前问题",
            retrieved_docs=[],
            history=history
        )
        
        # 只应该保留最近5轮
        self.assertIn("问题6", user_prompt)  # 第6轮应该在
        self.assertNotIn("问题0", user_prompt)  # 第0轮应该不在


class TestScoreThreshold(unittest.TestCase):
    """测试相似度阈值功能"""
    
    def test_threshold_filtering(self):
        """测试阈值过滤"""
        mock_vector_service = Mock()
        mock_embedding_service = Mock()
        mock_embedding_service.get_embedding.return_value = np.random.rand(384).astype(np.float32)
        
        # 模拟检索结果，包含不同相似度的文档
        mock_results = [
            (0, 0.9, {'content': '高相似度', 'source': 'doc1.pdf', 'scene_id': 'test'}),
            (1, 0.5, {'content': '中相似度', 'source': 'doc2.pdf', 'scene_id': 'test'}),
            (2, 0.2, {'content': '低相似度', 'source': 'doc3.pdf', 'scene_id': 'test'})
        ]
        mock_vector_service.search.return_value = mock_results
        
        rag_service = RAGService(
            embedding_service=mock_embedding_service,
            vector_service=mock_vector_service,
            score_threshold=0.4,  # 设置阈值为0.4
            use_gemini=False
        )
        
        results = rag_service.retrieve("测试查询")
        
        # 只有相似度 >= 0.4 的结果应该被保留
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['content'], '高相似度')
        self.assertEqual(results[1]['content'], '中相似度')


if __name__ == '__main__':
    # 运行测试
    unittest.main(verbosity=2)
