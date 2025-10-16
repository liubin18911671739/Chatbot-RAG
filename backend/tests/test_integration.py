"""
Integration tests for the complete system flow.
"""
import pytest
from flask import json


class TestIntegrationFlow:
    """Test complete user flows."""
    
    def test_complete_registration_and_login_flow(self, client, init_database):
        """Test user registration, login, and accessing protected resources."""
        # 1. Register a new user
        response = client.post('/auth/register', json={
            'username': 'integrationuser',
            'email': 'integration@example.com',
            'password': 'testpass123'
        })
        assert response.status_code == 201
        
        # 2. Login with the new user
        response = client.post('/auth/login', json={
            'username': 'integrationuser',
            'password': 'testpass123'
        })
        assert response.status_code == 200
        data = response.get_json()
        token = data['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # 3. Access protected profile endpoint
        response = client.get('/auth/profile', headers=headers)
        assert response.status_code == 200
        profile = response.get_json()
        assert profile['username'] == 'integrationuser'
        
        # 4. Send a chat message
        response = client.post('/chat', 
            headers=headers,
            json={'message': '你好'}
        )
        assert response.status_code == 200
    
    def test_complete_chat_flow(self, client, auth_headers):
        """Test complete chat interaction flow."""
        # 1. Send initial message
        response = client.post('/chat',
            headers=auth_headers,
            json={'message': '什么是中国特色社会主义?'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert 'response' in data
        
        # 2. Get suggestions based on the chat
        response = client.get('/suggestions?context=中国特色社会主义',
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # 3. Continue conversation with context
        response = client.post('/chat',
            headers=auth_headers,
            json={
                'message': '请详细说明',
                'context': [
                    {'role': 'user', 'content': '什么是中国特色社会主义?'},
                    {'role': 'assistant', 'content': '中国特色社会主义是...'}
                ]
            }
        )
        assert response.status_code == 200
        
        # 4. Submit feedback
        response = client.post('/feedback',
            headers=auth_headers,
            json={
                'message': '回答很有帮助',
                'rating': 5
            }
        )
        assert response.status_code == 200
    
    def test_admin_workflow(self, client, admin_headers):
        """Test admin workflow for managing questions."""
        # 1. Create a new question
        response = client.post('/questions',
            headers=admin_headers,
            json={
                'question': '集成测试问题',
                'answer': '集成测试答案',
                'category': '测试'
            }
        )
        assert response.status_code == 201
        question_id = response.get_json()['id']
        
        # 2. Verify question was created
        response = client.get(f'/questions/{question_id}')
        assert response.status_code == 200
        
        # 3. Update the question
        response = client.put(f'/questions/{question_id}',
            headers=admin_headers,
            json={
                'question': '更新的问题',
                'answer': '更新的答案'
            }
        )
        assert response.status_code == 200
        
        # 4. Search for the question
        response = client.get('/search?q=更新的问题')
        assert response.status_code == 200
        
        # 5. Delete the question
        response = client.delete(f'/questions/{question_id}',
            headers=admin_headers
        )
        assert response.status_code == 200
        
        # 6. Verify deletion
        response = client.get(f'/questions/{question_id}')
        assert response.status_code == 404
    
    def test_scene_based_interaction(self, client, auth_headers):
        """Test interaction with different scenes."""
        # 1. Get available scenes
        response = client.get('/scenes')
        assert response.status_code == 200
        scenes = response.get_json()
        assert len(scenes) > 0
        
        # 2. Select a scene and interact
        scene_name = list(scenes.keys())[0]
        response = client.post('/chat',
            headers=auth_headers,
            json={
                'message': '帮助我学习',
                'scene': scene_name
            }
        )
        assert response.status_code == 200
        
        # 3. Get scene-specific suggestions
        response = client.get(f'/suggestions?scene={scene_name}',
            headers=auth_headers
        )
        assert response.status_code == 200
