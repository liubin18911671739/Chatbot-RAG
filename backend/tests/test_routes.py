import pytest
import sys
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from unittest.mock import MagicMock, patch
import json

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)

# 添加特殊模块映射，使得 'app' 变成有效的导入模块
sys.path.insert(0, os.path.join(project_root, 'backend'))

from backend.app.api.routes import api_bp

from app.factory import create_app
from app.models import db, Website, News,  User
@pytest.fixture
def app():
    flask_app = create_app()
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()


def test_scrape_data_no_country(client):
    resp = client.post('/api/scrape', json={})
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'Country is required' in data['error']

# 将 patch 指向 DataScraper 真正定义的路径，比如 "app.services.scraper"
@patch('app.services.scraper.DataScraper.start_scraping', return_value={"success": True})
def test_scrape_data_valid(mock_scrape, client):
    resp = client.post('/api/scrape', json={"country": "TestCountry"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['success'] is True

def test_get_news_empty(client):
    resp = client.get('/api/news')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data == []

def test_get_websites_empty(client):
    resp = client.get('/api/websites')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data == []

def test_get_logs_empty(client):
    resp = client.get('/api/logs')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data == []

def test_analyze_data_no_type(client):
    resp = client.post('/api/analyze', json={})
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'Analysis type is required' in data['error']

def test_analyze_data_valid(client):
    resp = client.post('/api/analyze', json={"type": "test_analysis"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['message'] == "Analysis completed"

def test_authenticate_user_missing(client):
    resp = client.post('/api/auth', json={})
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'Username and password are required' in data['error']

def test_authenticate_user_invalid(client):
    user = User(username="admin", password="admin")
    with client.application.app_context():
        db.session.add(user)
        db.session.commit()
    resp = client.post('/api/auth', json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401

def test_authenticate_user_valid(client):
    user = User(username="admin", password="admin")
    with client.application.app_context():
        db.session.add(user)
        db.session.commit()
    resp = client.post('/api/auth', json={"username": "admin", "password": "admin"})
    assert resp.status_code == 200

def test_search_news_no_query(client):
    resp = client.post('/api/search_news', json={})
    assert resp.status_code == 400
    data = resp.get_json()
    assert '查询关键词不能为空' in data['error']

def test_search_news_empty_db(client):
    resp = client.post('/api/search_news', json={"query": "test"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert '数据库中没有找到包含嵌入向量的新闻' in data['message']

def test_test_scrape_country_no_country(client):
    resp = client.post('/api/test_scrape_country', json={})
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'Country is required' in data['error']

@patch.object(DataScraper, 'start_scraping', return_value={"started": True})
def test_test_scrape_country_valid(mock_scrape, client):
    resp = client.post('/api/test_scrape_country', json={"country": "Test"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'Scraping started' in data['message']

def test_test_scrape_website_no_id(client):
    resp = client.post('/api/test_scrape_website', json={})
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'Website ID is required' in data['error']

def test_test_scrape_website_not_found(client):
    resp = client.post('/api.test_scrape_website', json={"website_id": 999})
    assert resp.status_code == 404

@patch.object(DataScraper, '_scrape_website', return_value=None)
def test_test_scrape_website_valid(mock_scrape, client):
    with client.application.app_context():
        # 为 Website 提供必填字段，避免 NOT NULL 约束失败
        site = Website(name="Test Website", url="http://test.com", country="Testland")
        db.session.add(site)
        db.session.commit()

        resp = client.post('/api/test_scrape_website', json={"website_id": site.id})
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'Scraping completed' in data['message']

@patch.object(DataScraper, 'start_scraping', return_value={"started": True})
def test_test_scrape_all(mock_scrape, client):
    resp = client.post('/api/test_scrape_all')
    assert resp.status_code == 200

def test_get_vectorized_news_empty(client):
    resp = client.get('/api/vectorized_news')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['count'] == 0

def test_test_vectorize_no_text(client):
    resp = client.post('/api/test_vectorize', json={})
    assert resp.status_code == 400

@patch('app.services.sentence_embedding_service.SentenceEmbeddingService.get_sentence_embedding', return_value=[0.1,0.2,0.3])
def test_test_vectorize_valid(mock_embed, client):
    resp = client.post('/api/test_vectorize', json={"text": "test"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['vector_length'] == 3

def test_compare_texts_missing(client):
    resp = client.post('/api/compare_texts', json={})
    assert resp.status_code == 400

@patch('app.services.sentence_embedding_service.SentenceEmbeddingService.compute_similarity', return_value=0.99)
def test_compare_texts_valid(mock_sim, client):
    resp = client.post('/api/compare_texts', json={"text1": "hello", "text2": "world"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['similarity'] == 0.99

def test_get_countries_empty(client):
    resp = client.get('/api/countries')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data == []