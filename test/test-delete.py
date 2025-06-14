#!/usr/bin/env python3
"""
简化版 Delete API 测试
用于快速测试 delete.py 功能

运行: python test-delete.py
"""

    
import requests
import json

BASE_URL = "http://localhost:5000/api"
# DEL_BASE_URL = "http://10.10.15.210:5000/api"


def test_delete_api():
    try:
    # 调用 search API
        response = requests.get(f"{BASE_URL}/search", params={
            "query": "泰国简介",
        })
        print("搜索结果:", response.json())
        
    except requests.exceptions.ConnectionError:
        print("连接错误: 无法连接到服务器")
    except Exception as e:
        print(f"搜索异常: {e}")

    print("=== 测试删除API ===")
    
    id = response.json().get("id", None)
    if id:
        print(f"找到有效的ID: {id}")
    else:
        print("未找到有效的ID，无法进行删除测试")
        return

    """测试删除API"""
    try:
        # 调用删除API
        response = requests.delete(f"{BASE_URL}/delete/{id}")
        print("删除结果:", response.json())

    except requests.exceptions.ConnectionError:
        print("连接错误: 无法连接到服务器")
    except Exception as e:
        print(f"删除异常: {e}")

        # }


    
if __name__ == "__main__":
    print("\n=== 测试 Delete API ===")
    
    test_delete_api()
    