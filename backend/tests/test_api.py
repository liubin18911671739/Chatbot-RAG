from app import create_app
import pytest

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_auth_login(client):
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpassword'
    })
    assert response.status_code == 200
    assert 'access_token' in response.json

def test_auth_login_invalid(client):
    response = client.post('/api/auth/login', json={
        'username': 'invaliduser',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401
    assert 'msg' in response.json

def test_chat_send_message(client):
    response = client.post('/api/chat/send', json={
        'message': 'Hello, how can I help you?'
    })
    assert response.status_code == 200
    assert 'response' in response.json

def test_chat_send_message_empty(client):
    response = client.post('/api/chat/send', json={
        'message': ''
    })
    assert response.status_code == 400
    assert 'msg' in response.json

def test_admin_get_users(client):
    response = client.get('/api/admin/users')
    assert response.status_code == 200
    assert isinstance(response.json, list)  # Expecting a list of users

def test_admin_get_users_unauthorized(client):
    response = client.get('/api/admin/users', headers={'Authorization': 'Bearer invalidtoken'})
    assert response.status_code == 401
    assert 'msg' in response.json