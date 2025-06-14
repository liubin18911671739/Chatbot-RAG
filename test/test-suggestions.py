import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_suggestions_api():
    try:       
        # 调用 suggestions API
        response = requests.get(f"{BASE_URL}/suggestions")
        print(f"API 响应状态码: {response.status_code}")
        # 检查响应状态码
        if response.status_code == 200:
            print("API 调用成功!")
            print("响应状态码:", response.status_code)
            print("响应内容:", response.json())
            return json.dumps(response.json(), indent=2, ensure_ascii=False)
        else:
            print("错误信息:", response.text)
           
    except requests.exceptions.ConnectionError:
        print("连接错误: 无法连接到服务器")

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
    print("=== 测试 Suggestions API ===")
    test_suggestions_api()
    
    print("\n=== 测试 Search API ===")
    test_search_api()