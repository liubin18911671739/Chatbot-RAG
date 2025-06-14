import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_search_api():
    """测试搜索API"""
    try:
        # 调用 search API
        response = requests.get(f"{BASE_URL}/search", params={
            "query": "什么是Python?",
        })
        print("搜索结果:", response.json())
        
        # json
        # {
        #   "id": 1213
        # }
        
    except requests.exceptions.ConnectionError:
        print("连接错误: 无法连接到服务器")
    except Exception as e:
        print(f"搜索异常: {e}")
        
# 执行测试
if __name__ == "__main__":

    
    print("\n=== 测试 Search API ===")
    test_search_api()