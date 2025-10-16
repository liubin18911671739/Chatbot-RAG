"""
Tests for feedback routes.
"""
import pytest
from flask import json


class TestFeedbackRoutes:
    """Test feedback submission and retrieval."""
    
    def test_submit_feedback_success(self, client, init_database):
        """Test successful feedback submission."""
        response = client.post('/feedback', json={
            'message': '这是一条测试反馈',
            'rating': 5,
            'email': 'user@example.com'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert '感谢您的反馈' in data['message']
    
    def test_submit_feedback_minimal(self, client, init_database):
        """Test feedback submission with minimal data."""
        response = client.post('/feedback', json={
            'message': '简单反馈'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
    
    def test_submit_feedback_missing_message(self, client, init_database):
        """Test feedback submission without message."""
        response = client.post('/feedback', json={
            'rating': 3
        })
        
        assert response.status_code == 400
    
    def test_submit_feedback_invalid_rating(self, client, init_database):
        """Test feedback submission with invalid rating."""
        response = client.post('/feedback', json={
            'message': '测试',
            'rating': 10  # Rating should be 1-5
        })
        
        assert response.status_code == 400
    
    def test_get_all_feedback_as_admin(self, client, admin_headers):
        """Test retrieving all feedback as admin."""
        response = client.get('/feedback', headers=admin_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
    
    def test_get_all_feedback_as_user(self, client, auth_headers):
        """Test retrieving all feedback as regular user (should fail)."""
        response = client.get('/feedback', headers=auth_headers)
        
        # Should be forbidden for regular users
        assert response.status_code in [403, 401]
    
    def test_get_feedback_by_id_as_admin(self, client, admin_headers, init_database):
        """Test retrieving specific feedback as admin."""
        # Submit feedback first
        client.post('/feedback', json={'message': '测试反馈'})
        
        # Get all feedback
        response = client.get('/feedback', headers=admin_headers)
        feedback_list = response.get_json()
        
        if len(feedback_list) > 0:
            feedback_id = feedback_list[0]['id']
            response = client.get(f'/feedback/{feedback_id}', headers=admin_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['id'] == feedback_id
    
    def test_feedback_statistics(self, client, admin_headers, init_database):
        """Test feedback statistics endpoint."""
        response = client.get('/feedback/stats', headers=admin_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'total' in data or 'count' in data
