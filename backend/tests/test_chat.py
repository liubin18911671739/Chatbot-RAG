from flask import json, Flask
from flask.testing import FlaskClient
import pytest

@pytest.fixture
def client() -> FlaskClient:
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_chat(client):
    response = client.post('/api/chat', json={"prompt": "你好,请问什么是中国特色社会主义?"})
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert 'response' in data or 'answer' in data

def test_get_scenes(client):
    response = client.get('/api/scenes')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert isinstance(data, dict)

def test_feedback(client):
    response = client.post('/api/feedback', json={"message": "Great service!"})
    data = json.loads(response.data)
    
    assert response.status_code in [200, 201]

def test_greeting(client):
    response = client.get('/api/greeting')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['status'] == 'success'
    assert data['greeting'] == "欢迎使用我们的QA系统!"