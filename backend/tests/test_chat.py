from flask import json, Flask
from flask.testing import FlaskClient
import pytest

# Assuming the Flask app is created in app.py
from backend.app import app

@pytest.fixture
def client() -> FlaskClient:
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_chat(client):
    response = client.post('/chat', json={"prompt": "你好，请问什么是中国特色社会主义？"})
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['status'] == 'success'
    assert 'response' in data
    assert isinstance(data['response'], str)

def test_get_scenes(client):
    response = client.get('/scenes')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert isinstance(data, dict)
    assert '学习指导' in data
    assert '思政学习空间' in data

def test_feedback(client):
    response = client.post('/feedback', json={"feedback": "Great service!"})
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['status'] == 'success'
    assert data['message'] == "感谢您的反馈"

def test_greeting(client):
    response = client.get('/greeting')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['status'] == 'success'
    assert data['greeting'] == "欢迎使用我们的QA系统!"