"""
Tests for authentication routes and functionality.
"""
import pytest
from flask import json


class TestAuthRoutes:
    """Test authentication endpoints."""
    
    def test_register_success(self, client, init_database):
        """Test successful user registration."""
        response = client.post('/auth/register', json={
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['status'] == 'success'
        assert 'message' in data
    
    def test_register_duplicate_username(self, client, init_database):
        """Test registration with duplicate username."""
        response = client.post('/auth/register', json={
            'username': 'testuser',
            'email': 'another@example.com',
            'password': 'pass123'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['status'] == 'error'
    
    def test_register_missing_fields(self, client):
        """Test registration with missing required fields."""
        response = client.post('/auth/register', json={
            'username': 'incomplete'
        })
        
        assert response.status_code == 400
    
    def test_login_success(self, client, init_database):
        """Test successful login."""
        response = client.post('/auth/login', json={
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert 'access_token' in data
        assert 'user' in data
    
    def test_login_invalid_credentials(self, client, init_database):
        """Test login with invalid credentials."""
        response = client.post('/auth/login', json={
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert data['status'] == 'error'
    
    def test_login_nonexistent_user(self, client, init_database):
        """Test login with non-existent user."""
        response = client.post('/auth/login', json={
            'username': 'nonexistent',
            'password': 'password123'
        })
        
        assert response.status_code == 401
    
    def test_logout(self, client, auth_headers):
        """Test logout functionality."""
        response = client.post('/auth/logout', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
    
    def test_protected_route_without_token(self, client, init_database):
        """Test accessing protected route without authentication."""
        response = client.get('/auth/profile')
        
        assert response.status_code == 401
    
    def test_protected_route_with_token(self, client, auth_headers):
        """Test accessing protected route with valid token."""
        response = client.get('/auth/profile', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'username' in data
