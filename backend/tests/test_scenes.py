from flask import json, Flask
from flask.testing import FlaskClient
import pytest

# Assuming the Flask app is created in app.py
from backend.app import app

@pytest.fixture
def client() -> FlaskClient:
    with app.test_client() as client:
        yield client

def test_get_scenes(client):
    """Test the /scenes endpoint"""
    response = client.get('/scenes')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "学习指导" in data
    assert "思政学习空间" in data
    assert "智慧思政" in data
    assert "科研辅助" in data
    assert "8001" in data
    assert "通用助手" in data

    # Check if the structure of the response is correct
    for scene in data:
        assert "description" in data[scene]
        assert "icon" in data[scene]
        assert "id" in data[scene]
        assert "status" in data[scene]

def test_scene_status(client):
    """Test the status of each scene"""
    response = client.get('/scenes')
    data = json.loads(response.data)

    for scene in data:
        assert data[scene]["status"] in ["available", "developing"]  # Assuming these are the only statuses

def test_scene_description(client):
    """Test the description of each scene"""
    response = client.get('/scenes')
    data = json.loads(response.data)

    for scene in data:
        assert isinstance(data[scene]["description"], str)  # Ensure description is a string
        assert len(data[scene]["description"]) > 0  # Ensure description is not empty