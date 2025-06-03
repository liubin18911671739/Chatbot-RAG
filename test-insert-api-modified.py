#!/usr/bin/env python3
"""
测试修改后的 /api/insert 接口
验证插入功能是否正常工作
"""

import requests
import json

# 本地后端API
LOCAL_BASE_URL = "http://localhost:5000/api"

def test_insert_admin_question():
    """测试管理员插入问题"""
    print("=== 测试管理员插入问题 ===")
    
    data = {
        "question": "什么是Flask?",
        "answer": "Web框架", 
        "userid": "admin",
        "status": "reviewed"  # 管理员插入，已审核状态
    }
    
    try:
        response = requests.post(f"{LOCAL_BASE_URL}/insert", json=data)
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.json()}")
        
        if response.status_code == 201:
            print("✅ 管理员插入问题成功")
        else:
            print("❌ 管理员插入问题失败")
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")

def test_insert_user_question():
    """测试普通用户插入问题"""
    print("\n=== 测试普通用户插入问题 ===")
    
    data = {
        "question": "什么是Python?",
        "answer": "编程语言",
        "userid": "user123", 
        "status": "unreview"  # 普通用户插入，未审核状态
    }
    
    try:
        response = requests.post(f"{LOCAL_BASE_URL}/insert", json=data)
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.json()}")
        
        if response.status_code == 201:
            print("✅ 普通用户插入问题成功")
        else:
            print("❌ 普通用户插入问题失败")
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")

def test_insert_auto_status():
    """测试自动状态设置"""
    print("\n=== 测试自动状态设置 ===")
    
    # 管理员不提供status，应该自动设为reviewed
    admin_data = {
        "question": "什么是Django?",
        "answer": "Python Web框架",
        "userid": "admin"
        # 没有提供status字段
    }
    
    try:
        response = requests.post(f"{LOCAL_BASE_URL}/insert", json=admin_data)
        print(f"管理员自动状态 - 响应状态码: {response.status_code}")
        print(f"管理员自动状态 - 响应内容: {response.json()}")
        
        if response.status_code == 201:
            print("✅ 管理员自动状态设置成功")
        else:
            print("❌ 管理员自动状态设置失败")
            
    except Exception as e:
        print(f"❌ 管理员自动状态请求失败: {e}")
    
    # 普通用户不提供status，应该自动设为unreview
    user_data = {
        "question": "什么是Vue?",
        "answer": "前端框架",
        "userid": "user456"
        # 没有提供status字段
    }
    
    try:
        response = requests.post(f"{LOCAL_BASE_URL}/insert", json=user_data)
        print(f"普通用户自动状态 - 响应状态码: {response.status_code}")
        print(f"普通用户自动状态 - 响应内容: {response.json()}")
        
        if response.status_code == 201:
            print("✅ 普通用户自动状态设置成功")
        else:
            print("❌ 普通用户自动状态设置失败")
            
    except Exception as e:
        print(f"❌ 普通用户自动状态请求失败: {e}")

def test_invalid_data():
    """测试无效数据处理"""
    print("\n=== 测试无效数据处理 ===")
    
    # 缺少必填字段
    invalid_data = {
        "question": "测试问题",
        # 缺少answer和userid
    }
    
    try:
        response = requests.post(f"{LOCAL_BASE_URL}/insert", json=invalid_data)
        print(f"无效数据 - 响应状态码: {response.status_code}")
        print(f"无效数据 - 响应内容: {response.json()}")
        
        if response.status_code == 400:
            print("✅ 无效数据处理正确")
        else:
            print("❌ 无效数据处理失败")
            
    except Exception as e:
        print(f"❌ 无效数据请求失败: {e}")

def main():
    """主测试函数"""
    print("开始测试修改后的 /api/insert 接口\n")
    
    # 检查后端是否运行
    try:
        response = requests.get(f"{LOCAL_BASE_URL}/questions", timeout=3)
        print("✅ 后端服务器运行正常")
    except Exception as e:
        print(f"❌ 后端服务器未运行或无法连接: {e}")
        print("请先启动后端服务器")
        return
    
    # 运行测试
    test_insert_admin_question()
    test_insert_user_question() 
    test_insert_auto_status()
    test_invalid_data()
    
    print("\n=== 测试完成 ===")

if __name__ == "__main__":
    main()
