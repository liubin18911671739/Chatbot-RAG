#!/usr/bin/env python3
"""
测试管理员用户登录功能
"""

import requests
import json

def test_admin_login():
    """测试管理员用户登录"""
    
    # 测试本地认证
    url = "http://localhost:5000/api/auth/login"
    
    # 测试数据
    test_data = {
        "username": "admin",
        "password": "admin@123",
        "auth_type": "local"
    }
    
    print("测试管理员用户登录...")
    print(f"URL: {url}")
    print(f"测试数据: {json.dumps(test_data, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(url, json=test_data, timeout=10)
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ 登录成功！")
                print(f"用户信息: {json.dumps(result.get('user', {}), indent=2, ensure_ascii=False)}")
            else:
                print("❌ 登录失败")
        else:
            print(f"❌ 请求失败，状态码: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保服务器正在运行")
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")

def test_radius_auth():
    """测试RADIUS认证"""
    url = "http://localhost:5000/api/auth/radius-login"
    
    # 测试数据
    test_data = {
        "username": "admin",
        "password": "admin@123"
    }
    
    print("\n测试RADIUS认证...")
    print(f"URL: {url}")
    print(f"测试数据: {json.dumps(test_data, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(url, json=test_data, timeout=10)
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            print("✅ RADIUS认证成功！")
        else:
            print("❌ RADIUS认证失败")
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保服务器正在运行")
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")

if __name__ == '__main__':
    print("开始测试认证功能...")
    test_admin_login()
    test_radius_auth()
    print("\n测试完成！")