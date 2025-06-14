import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_suggestions_api():
    try:
        # 调用 suggestions API
        response = requests.get(f"{BASE_URL}/questions")
        
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
    except requests.exceptions.Timeout:
        print("请求超时")
    except requests.exceptions.RequestException as e:
        print(f"请求异常: {e}")
    except json.JSONDecodeError:
        print("响应不是有效的 JSON 格式")
        
# 执行测试
if __name__ == "__main__":
    test_suggestions_api()