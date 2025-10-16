"""
Tests for analytics and statistics routes.
"""
import pytest
from flask import json


class TestAnalyticsRoutes:
    """Test analytics endpoints."""
    
    def test_get_analytics_as_admin(self, client, admin_headers):
        """Test retrieving analytics as admin."""
        response = client.get('/analytics', headers=admin_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)
    
    def test_get_analytics_as_user(self, client, auth_headers):
        """Test retrieving analytics as regular user (should fail)."""
        response = client.get('/analytics', headers=auth_headers)
        
        # Should be forbidden for regular users
        assert response.status_code in [403, 401]
    
    def test_get_chat_statistics(self, client, admin_headers):
        """Test chat statistics endpoint."""
        response = client.get('/analytics/chat', headers=admin_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'total_messages' in data or 'count' in data
    
    def test_get_user_statistics(self, client, admin_headers):
        """Test user statistics endpoint."""
        response = client.get('/analytics/users', headers=admin_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'total_users' in data or 'count' in data
    
    def test_get_popular_questions(self, client, admin_headers):
        """Test popular questions endpoint."""
        response = client.get('/analytics/popular-questions', headers=admin_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
    
    def test_get_analytics_by_date_range(self, client, admin_headers):
        """Test analytics with date range filter."""
        response = client.get('/analytics?start_date=2025-01-01&end_date=2025-12-31', 
                            headers=admin_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)
