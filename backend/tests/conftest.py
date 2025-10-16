"""
Pytest configuration and shared fixtures for backend tests.
"""
import pytest
from flask import Flask
from flask.testing import FlaskClient
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app as flask_app
from models.database import db, User, Scene, Feedback


@pytest.fixture(scope='session')
def app():
    """Create and configure a test Flask application."""
    flask_app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'JWT_SECRET_KEY': 'test-secret-key',
        'SECRET_KEY': 'test-secret-key',
        'WTF_CSRF_ENABLED': False,
    })
    
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope='function')
def client(app) -> FlaskClient:
    """Create a test client for the Flask application."""
    return app.test_client()


@pytest.fixture(scope='function')
def init_database(app):
    """Initialize database with test data."""
    with app.app_context():
        # Clear existing data
        db.session.query(User).delete()
        db.session.query(Scene).delete()
        db.session.query(Feedback).delete()
        
        # Create test users with password hash
        from werkzeug.security import generate_password_hash
        
        test_user = User(
            username='testuser',
            email='test@example.com',
            password_hash=generate_password_hash('testpass123')
        )
        
        admin_user = User(
            username='admin',
            email='admin@example.com',
            password_hash=generate_password_hash('adminpass123')
        )
        
        db.session.add(test_user)
        db.session.add(admin_user)
        
        # Create test scenes
        test_scenes = [
            Scene(
                id='学习指导',
                description='学习辅助场景',
                icon='📚',
                status='available'
            ),
            Scene(
                id='思政学习空间',
                description='思政学习场景',
                icon='🎓',
                status='available'
            ),
        ]
        for scene in test_scenes:
            db.session.add(scene)
        
        db.session.commit()
        
        yield db
        
        # Cleanup
        db.session.query(User).delete()
        db.session.query(Scene).delete()
        db.session.query(Feedback).delete()
        db.session.commit()


@pytest.fixture
def auth_headers(client, init_database):
    """Get authentication headers for test user."""
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass123'
    })
    data = response.get_json()
    if data and 'access_token' in data:
        token = data.get('access_token')
        return {'Authorization': f'Bearer {token}'}
    # If token auth is not available, return empty headers
    return {}


@pytest.fixture
def admin_headers(client, init_database):
    """Get authentication headers for admin user."""
    response = client.post('/api/auth/login', json={
        'username': 'admin',
        'password': 'adminpass123'
    })
    data = response.get_json()
    if data and 'access_token' in data:
        token = data.get('access_token')
        return {'Authorization': f'Bearer {token}'}
    # If token auth is not available, return empty headers
    return {}
