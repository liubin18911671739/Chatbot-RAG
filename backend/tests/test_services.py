"""
Tests for backend services (chat_service, rag_service).
"""
import pytest
from services.chat_service import process_chat_prompt
from services.rag_service import generate_response


class TestChatService:
    """Test chat service functionality."""
    
    def test_process_chat_prompt_basic(self):
        """Test basic message processing."""
        response = process_chat_prompt("你好")
        
        assert response is not None
        assert isinstance(response, dict)
        assert 'response' in response or 'status' in response
    
    def test_process_chat_prompt_with_scene(self):
        """Test message processing with specific scene."""
        response = process_chat_prompt("帮我学习", scene_id="学习指导")
        
        assert response is not None
        assert isinstance(response, dict)


class TestRAGService:
    """Test RAG service functionality."""
    
    def test_generate_response_basic(self):
        """Test basic response generation."""
        response = generate_response("什么是新时代?")
        
        assert response is not None
        assert isinstance(response, dict)
        assert 'response' in response or 'answer' in response
    
    def test_generate_response_with_scene(self):
        """Test response generation with scene."""
        response = generate_response("学习方法", scene_id="学习指导")
        
        assert response is not None
        assert isinstance(response, dict)
