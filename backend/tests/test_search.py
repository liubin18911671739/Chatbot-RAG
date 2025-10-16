"""
Tests for search functionality.
"""
import pytest
from flask import json


class TestSearchRoutes:
    """Test search endpoints."""
    
    def test_search_questions_basic(self, client, init_database):
        """Test basic question search."""
        response = client.post('/search', json={
            'query': '中国特色',
            'type': 'questions'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'results' in data
        assert isinstance(data['results'], list)
    
    def test_search_empty_query(self, client, init_database):
        """Test search with empty query."""
        response = client.post('/search', json={
            'query': '',
            'type': 'questions'
        })
        
        assert response.status_code == 400
    
    def test_search_with_filters(self, client, init_database):
        """Test search with category filter."""
        response = client.post('/search', json={
            'query': '学习',
            'type': 'questions',
            'filters': {
                'category': '思政学习'
            }
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'results' in data
    
    def test_search_pagination(self, client, init_database):
        """Test search with pagination."""
        response = client.post('/search', json={
            'query': '中国',
            'type': 'questions',
            'page': 1,
            'per_page': 5
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'results' in data
        assert 'total' in data or 'count' in data
    
    def test_search_suggestions(self, client, init_database):
        """Test search suggestions endpoint."""
        response = client.get('/search/suggestions?q=中国')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
    
    def test_hybrid_search(self, client, init_database):
        """Test hybrid search combining multiple methods."""
        response = client.post('/search/hybrid', json={
            'query': '社会主义',
            'methods': ['keyword', 'semantic']
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'results' in data
