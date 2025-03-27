import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_simple_search():
    """测试简单搜索 API"""
    url = f"{BASE_URL}/search/simple"
    payload = {
        "query": "经济",
        "country": "china"
    }
    
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

def test_basic_search():
    """测试基本搜索 API"""
    url = f"{BASE_URL}/search/basic"
    params = {
        "keyword": "经济",
        "country": "china"
    }
    
    response = requests.get(url, params=params)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"Error Response: {response.text}")

if __name__ == "__main__":
    print("Testing Simple Search API...")
    test_simple_search()
    
    print("\nTesting Basic Search API...")
    test_basic_search()