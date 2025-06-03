#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试更新API功能的脚本
"""

import requests
import json

# API基础URL
BASE_URL = "http://localhost:5000"

def test_update_api():
    """测试更新API功能"""
    
    print("=" * 50)
    print("测试更新API功能")
    print("=" * 50)
    
    # 首先，我们需要获取一个问题的ID进行测试
    print("\n1. 获取问题列表...")
    try:
        response = requests.get(f"{BASE_URL}/api/questions")
        if response.status_code == 200:
            questions_data = response.json()
            print(f"获取问题列表成功: {response.status_code}")
            
            # 尝试从不同的数据结构中获取问题
            questions = []
            if isinstance(questions_data, dict):
                if 'qas' in questions_data:
                    questions = questions_data['qas']
                elif 'questions' in questions_data:
                    questions = questions_data['questions']
                elif 'data' in questions_data:
                    questions = questions_data['data']
            elif isinstance(questions_data, list):
                questions = questions_data
            
            if questions and len(questions) > 0:
                # 使用第一个问题的ID进行测试
                question_id = questions[0].get('id')
                print(f"使用问题ID进行测试: {question_id}")
                print(f"原始问题内容: {questions[0].get('question', 'N/A')}")
                print(f"原始答案: {questions[0].get('answer', 'N/A')}")
                print(f"原始状态: {questions[0].get('status', 'N/A')}")
                
                # 测试更新功能
                test_update_question(question_id)
            else:
                print("未找到可用的问题进行测试")
        else:
            print(f"获取问题列表失败: {response.status_code}")
            print(f"响应内容: {response.text}")
            
    except Exception as e:
        print(f"获取问题列表时发生错误: {e}")


def test_update_question(question_id):
    """测试更新指定问题"""
    
    print(f"\n2. 测试更新问题ID: {question_id}")
    
    # 测试数据 - 按照用户提供的示例
    update_data = {
        "question": "什么是Python?",
        "answer": "python是一种编程语言",
        "userid": "user6",
        "status": "reviewed"
    }
    
    try:
        print(f"发送更新请求...")
        print(f"URL: {BASE_URL}/api/update/{question_id}")
        print(f"数据: {json.dumps(update_data, ensure_ascii=False, indent=2)}")
        
        response = requests.put(f"{BASE_URL}/api/update/{question_id}", json=update_data)
        
        print(f"\n响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 更新成功!")
            print(f"返回数据: {json.dumps(result, ensure_ascii=False, indent=2)}")
        else:
            print(f"❌ 更新失败: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 请求时发生错误: {e}")


def test_partial_update():
    """测试部分字段更新"""
    
    print(f"\n3. 测试部分字段更新...")
    
    # 假设使用ID为1的问题
    question_id = 1
    
    # 只更新状态
    partial_data = {
        "status": "reviewed"
    }
    
    try:
        print(f"发送部分更新请求...")
        print(f"URL: {BASE_URL}/api/update/{question_id}")
        print(f"数据: {json.dumps(partial_data, ensure_ascii=False, indent=2)}")
        
        response = requests.put(f"{BASE_URL}/api/update/{question_id}", json=partial_data)
        
        print(f"\n响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 部分更新成功!")
            print(f"返回数据: {json.dumps(result, ensure_ascii=False, indent=2)}")
        else:
            print(f"❌ 部分更新失败: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 请求时发生错误: {e}")


def test_invalid_requests():
    """测试无效请求"""
    
    print(f"\n4. 测试无效请求...")
    
    # 测试1: 没有ID的请求
    print("\n4.1 测试没有ID的更新请求:")
    try:
        response = requests.put(f"{BASE_URL}/api/update", json={"status": "reviewed"})
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
    except Exception as e:
        print(f"请求错误: {e}")
    
    # 测试2: 空数据
    print("\n4.2 测试空数据更新:")
    try:
        response = requests.put(f"{BASE_URL}/api/update/1", json={})
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
    except Exception as e:
        print(f"请求错误: {e}")
    
    # 测试3: 无效状态值
    print("\n4.3 测试无效状态值:")
    try:
        response = requests.put(f"{BASE_URL}/api/update/1", json={"status": "invalid_status"})
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
    except Exception as e:
        print(f"请求错误: {e}")


if __name__ == "__main__":
    print("开始测试更新API...")
    
    # 运行测试
    test_update_api()
    test_partial_update()
    test_invalid_requests()
    
    print("\n" + "=" * 50)
    print("测试完成")
    print("=" * 50)
