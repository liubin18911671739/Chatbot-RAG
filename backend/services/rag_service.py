"""
RAG (Retrieval-Augmented Generation) 检索生成服务
提供向量检索、提示词工程和 LLM 生成的完整管线
"""

import os
import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from google import genai
from google.genai import types

from services.embedding_service import EmbeddingService
from services.vector_service import VectorService

logger = logging.getLogger(__name__)


class RAGService:
    """RAG 检索生成服务"""
    
    # 默认配置
    DEFAULT_TOP_K = 5  # 默认检索前5个相关文档
    DEFAULT_SCORE_THRESHOLD = 0.3  # 默认相似度阈值
    DEFAULT_TEMPERATURE = 0.7  # LLM 温度参数
    DEFAULT_MAX_TOKENS = 2000  # 最大生成 token 数
    
    # LLM API 配置
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyAZqjyE7wN3Mh81S-bfITb98lA0SISANBY')
    DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
    
    # 场景特定提示词
    SCENE_PROMPTS = {
        "db_sizheng": {
            "name": "思政学习",
            "system": "你是北京第二外国语学院的思政学习助手，请基于提供的知识库内容，提供准确、严谨的思政知识解答。",
            "context_prefix": "以下是相关的思政学习资料："
        },
        "db_xuexizhidao": {
            "name": "学习指导",
            "system": "你是北京第二外国语学院的学习指导助手，请基于提供的学习资料，提供有效的学习方法和建议。",
            "context_prefix": "以下是相关的学习指导材料："
        },
        "db_zhihuisizheng": {
            "name": "智慧思政",
            "system": "你是北京第二外国语学院的智慧思政助手，请结合知识库内容，深入浅出地解答思政相关问题。",
            "context_prefix": "以下是相关的思政知识:"
        },
        "db_keyanfuzhu": {
            "name": "科研辅助",
            "system": "你是北京第二外国语学院的科研辅助助手，请基于提供的资料，提供科研方法和学术写作指导。",
            "context_prefix": "以下是相关的科研资料："
        },
        "db_wangshangbanshiting": {
            "name": "校园服务",
            "system": "你是北京第二外国语学院的8001助手，请基于校园服务知识库，提供准确的校园事务办理指南。",
            "context_prefix": "以下是相关的校园服务信息："
        },
        "default": {
            "name": "通用助手",
            "system": "你是北京第二外国语学院的AI助手，请基于提供的知识库内容，提供准确、有帮助的回答。",
            "context_prefix": "以下是相关的参考资料："
        }
    }
    
    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        vector_service: Optional[VectorService] = None,
        top_k: int = DEFAULT_TOP_K,
        score_threshold: float = DEFAULT_SCORE_THRESHOLD,
        use_gemini: bool = True,
        use_deepseek_fallback: bool = False
    ):
        """
        初始化 RAG 服务
        
        Args:
            embedding_service: Embedding 服务实例
            vector_service: 向量服务实例
            top_k: 检索返回的文档数量
            score_threshold: 相似度阈值，低于此值的结果会被过滤
            use_gemini: 是否使用 Gemini API
            use_deepseek_fallback: 是否在 Gemini 失败时使用 DeepSeek 备份
        """
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_service = vector_service
        self.top_k = top_k
        self.score_threshold = score_threshold
        self.use_gemini = use_gemini
        self.use_deepseek_fallback = use_deepseek_fallback
        
        # 初始化 Gemini 客户端
        if self.use_gemini and self.GEMINI_API_KEY:
            try:
                self.gemini_client = genai.Client(api_key=self.GEMINI_API_KEY)
                logger.info("Gemini API 客户端初始化成功")
            except Exception as e:
                logger.error(f"Gemini API 初始化失败: {str(e)}")
                self.gemini_client = None
        else:
            self.gemini_client = None
        
        logger.info(
            f"初始化 RAG 服务 - Top-K: {top_k}, "
            f"阈值: {score_threshold}, LLM: {'Gemini' if use_gemini else 'None'}"
        )
    
    def retrieve(
        self,
        query: str,
        scene_id: Optional[str] = None,
        top_k: Optional[int] = None,
        score_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        检索相关文档
        
        Args:
            query: 用户查询
            scene_id: 场景ID，用于过滤特定场景的文档
            top_k: 返回的文档数量
            score_threshold: 相似度阈值
            
        Returns:
            检索结果列表，每个结果包含 content, score, metadata
        """
        if not self.vector_service:
            logger.warning("向量服务未初始化，无法进行检索")
            return []
        
        # 使用默认值
        top_k = top_k or self.top_k
        score_threshold = score_threshold or self.score_threshold
        
        try:
            # 1. 生成查询向量
            query_vector = self.embedding_service.get_embedding(query, normalize=True)
            
            # 2. 向量检索
            results = self.vector_service.search(
                query_vector=query_vector,
                top_k=top_k * 2,  # 多检索一些以便过滤
                return_metadata=True
            )
            
            # 3. 过滤和格式化结果
            filtered_results = []
            for idx, score, metadata in results:
                # 过滤低于阈值的结果
                if score < score_threshold:
                    continue
                
                # 场景过滤（如果指定了场景）
                if scene_id and metadata.get('scene_id') != scene_id:
                    continue
                
                filtered_results.append({
                    'content': metadata.get('content', ''),
                    'score': float(score),
                    'metadata': metadata,
                    'source': metadata.get('source', '未知来源'),
                    'page': metadata.get('page', None),
                    'chunk_index': metadata.get('chunk_index', None)
                })
                
                # 达到所需数量后停止
                if len(filtered_results) >= top_k:
                    break
            
            logger.info(f"检索完成: 查询='{query[:50]}...', 返回 {len(filtered_results)} 个结果")
            return filtered_results
            
        except Exception as e:
            logger.error(f"检索失败: {str(e)}")
            return []
    
    def build_prompt(
        self,
        query: str,
        retrieved_docs: List[Dict[str, Any]],
        scene_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[str, str]:
        """
        构建 LLM 提示词
        
        Args:
            query: 用户查询
            retrieved_docs: 检索到的文档列表
            scene_id: 场景ID
            history: 对话历史
            
        Returns:
            (system_instruction, user_prompt) 元组
        """
        # 获取场景配置
        scene_config = self.SCENE_PROMPTS.get(
            scene_id,
            self.SCENE_PROMPTS['default']
        )
        
        # 系统提示词
        system_instruction = scene_config['system']
        
        # 构建用户提示词
        user_prompt_parts = []
        
        # 1. 添加检索到的上下文
        if retrieved_docs:
            user_prompt_parts.append(scene_config['context_prefix'])
            user_prompt_parts.append("")
            
            for i, doc in enumerate(retrieved_docs, 1):
                source_info = f"[来源: {doc['source']}"
                if doc.get('page'):
                    source_info += f", 第{doc['page']}页"
                source_info += f", 相关度: {doc['score']:.2f}]"
                
                user_prompt_parts.append(f"参考资料 {i}: {source_info}")
                user_prompt_parts.append(doc['content'])
                user_prompt_parts.append("")
            
            user_prompt_parts.append("---")
            user_prompt_parts.append("")
        
        # 2. 添加对话历史（如果有）
        if history and isinstance(history, list):
            user_prompt_parts.append("对话历史:")
            for msg in history[-5:]:  # 只保留最近5轮对话
                if 'user' in msg and msg['user']:
                    user_prompt_parts.append(f"用户: {msg['user']}")
                if 'assistant' in msg and msg['assistant']:
                    user_prompt_parts.append(f"助手: {msg['assistant']}")
            user_prompt_parts.append("")
        
        # 3. 添加当前问题和指令
        if retrieved_docs:
            user_prompt_parts.append(
                "请基于上述参考资料回答以下问题。"
                "如果参考资料中没有相关信息，请明确告知用户。"
                "回答时请注明信息来源。"
            )
        else:
            user_prompt_parts.append(
                "注意：当前没有找到相关的参考资料，"
                "请根据你的知识谨慎回答，并告知用户这不是基于校园知识库的回答。"
            )
        
        user_prompt_parts.append("")
        user_prompt_parts.append(f"用户问题: {query}")
        
        user_prompt = "\n".join(user_prompt_parts)
        
        return system_instruction, user_prompt
    
    def generate(
        self,
        system_instruction: str,
        user_prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        调用 LLM 生成回答
        
        Args:
            system_instruction: 系统指令
            user_prompt: 用户提示词
            temperature: 温度参数
            max_tokens: 最大 token 数
            
        Returns:
            生成的回答文本
        """
        temperature = temperature or self.DEFAULT_TEMPERATURE
        max_tokens = max_tokens or self.DEFAULT_MAX_TOKENS
        
        # 尝试使用 Gemini
        if self.use_gemini and self.gemini_client:
            try:
                response = self.gemini_client.models.generate_content(
                    model="gemini-2.0-flash",
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=temperature,
                        max_output_tokens=max_tokens
                    ),
                    contents=user_prompt
                )
                return response.text
                
            except Exception as e:
                logger.error(f"Gemini API 调用失败: {str(e)}")
                
                # 如果启用了 DeepSeek 备份
                if self.use_deepseek_fallback and self.DEEPSEEK_API_KEY:
                    logger.info("尝试使用 DeepSeek 备份...")
                    try:
                        # TODO: 实现 DeepSeek API 调用
                        pass
                    except Exception as e2:
                        logger.error(f"DeepSeek API 调用失败: {str(e2)}")
                
                raise Exception(f"LLM API 调用失败: {str(e)}")
        
        raise Exception("没有可用的 LLM 服务")
    
    def generate_response(
        self,
        prompt: str,
        scene_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        top_k: Optional[int] = None,
        score_threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        完整的 RAG 生成流程
        
        Args:
            prompt: 用户问题
            scene_id: 场景ID
            history: 对话历史
            top_k: 检索文档数量
            score_threshold: 相似度阈值
            
        Returns:
            包含回答、来源等信息的字典
        """
        try:
            # 1. 向量检索
            logger.info(f"开始 RAG 流程 - 查询: '{prompt[:50]}...', 场景: {scene_id}")
            retrieved_docs = self.retrieve(
                query=prompt,
                scene_id=scene_id,
                top_k=top_k,
                score_threshold=score_threshold
            )
            
            # 2. 构建提示词
            system_instruction, user_prompt = self.build_prompt(
                query=prompt,
                retrieved_docs=retrieved_docs,
                scene_id=scene_id,
                history=history
            )
            
            # 3. LLM 生成
            response_text = self.generate(
                system_instruction=system_instruction,
                user_prompt=user_prompt
            )
            
            # 4. 构建响应
            response = {
                "response": response_text,
                "attachment_data": [
                    {
                        "source": doc['source'],
                        "content": doc['content'][:200] + "..." if len(doc['content']) > 200 else doc['content'],
                        "score": doc['score'],
                        "page": doc.get('page'),
                        "chunk_index": doc.get('chunk_index')
                    }
                    for doc in retrieved_docs
                ],
                "special_note": "" if retrieved_docs else "此回答未基于校园知识库，仅供参考。",
                "status": "success",
                "retrieved_count": len(retrieved_docs),
                "scene_id": scene_id
            }
            
            logger.info(f"RAG 流程完成 - 检索到 {len(retrieved_docs)} 个文档")
            return response
            
        except Exception as e:
            logger.error(f"RAG 生成失败: {str(e)}")
            
            # Fallback: 返回错误信息
            return {
                "response": f"抱歉，生成回答时出现错误。请稍后再试。",
                "attachment_data": [],
                "special_note": f"错误详情: {str(e)}",
                "status": "error",
                "retrieved_count": 0,
                "scene_id": scene_id
            }


# 向后兼容的函数接口
def generate_response(prompt, scene_id=None):
    """
    向后兼容的函数接口
    
    Args:
        prompt (str): 用户输入的问题
        scene_id (str, optional): 场景ID
        
    Returns:
        dict: 包含响应信息的字典
    """
    # 创建 RAG 服务实例（不初始化向量服务）
    rag_service = RAGService(vector_service=None)
    
    # 如果没有向量服务，返回简单回答
    if not rag_service.vector_service:
        return {
            "response": f"这是对您的问题 '{prompt}' 的回答。（注：向量检索服务未初始化）",
            "attachment_data": [],
            "special_note": "当前系统未配置知识库检索功能",
            "status": "warning"
        }
    
    return rag_service.generate_response(prompt=prompt, scene_id=scene_id)
