"""
Tests for questions management routes.
"""
import pytest
from flask import json


class TestQuestionsRoutes:
    """Test questions CRUD endpoints."""
    
    def test_get_all_questions(self, client, init_database):
        """Test retrieving all questions."""
        response = client.get('/questions')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_get_question_by_id(self, client, init_database):
        """Test retrieving a specific question by ID."""
        # First get all questions to get a valid ID
        response = client.get('/questions')
        questions = response.get_json()
        question_id = questions[0]['id']
        
        response = client.get(f'/questions/{question_id}')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['id'] == question_id
        assert 'question' in data
        assert 'answer' in data
    
    def test_get_nonexistent_question(self, client, init_database):
        """Test retrieving non-existent question."""
        response = client.get('/questions/99999')
        
        assert response.status_code == 404
    
    def test_search_questions(self, client, init_database):
        """Test searching questions."""
        response = client.get('/questions/search?q=中国特色')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
    
    def test_create_question_as_admin(self, client, admin_headers):
        """Test creating a question as admin."""
        response = client.post('/questions', 
            headers=admin_headers,
            json={
                'question': '新问题测试',
                'answer': '这是测试答案',
                'category': '测试分类'
            }
        )
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['status'] == 'success'
    
    def test_create_question_as_user(self, client, auth_headers):
        """Test creating a question as regular user (should fail)."""
        response = client.post('/questions',
            headers=auth_headers,
            json={
                'question': '新问题测试',
                'answer': '这是测试答案',
                'category': '测试分类'
            }
        )
        
        # Should be forbidden if only admins can create
        assert response.status_code in [403, 401]
    
    def test_update_question_as_admin(self, client, admin_headers, init_database):
        """Test updating a question as admin."""
        # Get a question ID
        response = client.get('/questions')
        questions = response.get_json()
        question_id = questions[0]['id']
        
        response = client.put(f'/questions/{question_id}',
            headers=admin_headers,
            json={
                'question': '更新的问题',
                'answer': '更新的答案'
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
    
    def test_delete_question_as_admin(self, client, admin_headers, init_database):
        """Test deleting a question as admin."""
        # Create a question first
        response = client.post('/questions',
            headers=admin_headers,
            json={
                'question': '待删除问题',
                'answer': '待删除答案',
                'category': '测试'
            }
        )
        question_id = response.get_json()['id']
        
        response = client.delete(f'/questions/{question_id}', headers=admin_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
    
    def test_filter_questions_by_category(self, client, init_database):
        """Test filtering questions by category."""
        response = client.get('/questions?category=思政学习')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        for question in data:
            assert question['category'] == '思政学习'
