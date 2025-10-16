from flask import json, Flask
from flask.testing import FlaskClient
import pytest

@pytest.fixture
def client() -> FlaskClient:
    with app.test_client() as client:
        yield client

def test_get_scenes(client):
    """Test the /api/scenes endpoint"""
    response = client.get('/api/scenes')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, dict)

    # Check if the structure of the response is correct
    if len(data) > 0:
        for scene in data:
            assert "description" in data[scene] or "id" in data[scene]

def test_scene_status(client, init_database):
    """Test the status of each scene"""
    response = client.get('/api/scenes')
    data = json.loads(response.data)

    assert response.status_code == 200
    assert isinstance(data, dict)

def test_scene_description(client, init_database):
    """Test the description of each scene"""
    response = client.get('/api/scenes')
    data = json.loads(response.data)

    for scene in data:
        assert isinstance(data[scene]["description"], str)  # Ensure description is a string
        assert len(data[scene]["description"]) > 0  # Ensure description is not empty