"""
Basic smoke tests to verify the application is working.
"""
import pytest
from flask import json


class TestBasicEndpoints:
    """Test basic API endpoints are accessible."""
    
    def test_health_check(self, client):
        """Test the health check endpoint."""
        response = client.get('/api/health')
        assert response.status_code == 200
    
    def test_root_endpoint(self, client):
        """Test the root endpoint."""
        response = client.get('/')
        assert response.status_code in [200, 404]  # May return 404 if no root route
    
    def test_scenes_endpoint(self, client, init_database):
        """Test scenes endpoint returns data."""
        response = client.get('/api/scenes')
        assert response.status_code == 200
        data = response.get_json()
        assert data is not None
    
    def test_greeting_endpoint(self, client):
        """Test greeting endpoint."""
        response = client.get('/api/greeting')
        assert response.status_code == 200
        data = response.get_json()
        assert data is not None
    
    def test_chat_endpoint_exists(self, client):
        """Test chat endpoint exists."""
        response = client.post('/api/chat', json={'prompt': '你好'})
        # May return 400, 401, or 200 depending on auth requirements
        assert response.status_code in [200, 400, 401, 422]
    
    def test_feedback_endpoint_exists(self, client):
        """Test feedback endpoint exists."""
        response = client.post('/api/feedback', json={'message': 'test'})
        # May return 400, 401, or 200 depending on requirements
        assert response.status_code in [200, 201, 400, 401, 422]
