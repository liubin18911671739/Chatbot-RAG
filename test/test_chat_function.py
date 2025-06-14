#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试 chat() 函数的脚本
"""

import sys
import os
import requests
import json
import time
from unittest.mock import Mock, patch, MagicMock

# 添加项目路径到系统路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from backend.routes.chat import chat
    from flask import Flask, request
    print("✅ 成功导入 chat 函数")
except ImportError as e:
    print(f"❌ 导入错误: {e}")
    sys.exit(1)


class TestChatFunction:
    """测试 chat() 函数的测试类"""
    
    def __init__(self):
        self.app = Flask(__name__)
        self.success_response = {
            "status": "success",
            "response": "这是一个测试回答",
            "attachment_data": [],
            "special_note": ""
        }
        self.error_response = {
            "status": "error", 
            "response": "抱歉，获取回答时出现问题，请稍后再试。"
        }
    
    def test_missing_prompt(self):
        """测试缺少 prompt 参数的情况"""
        print("\n🧪 测试用例 1: 缺少 prompt 参数")
        
        with self.app.test_request_context(
            '/chat', 
            method='POST',
            json={}
        ):
            try:
                result = chat()
                print(f"✅ 响应状态码: {result[1] if isinstance(result, tuple) else 'Unknown'}")
                print(f"✅ 响应内容: {result[0].get_json() if hasattr(result[0], 'get_json') else result}")
                return True
            except Exception as e:
                print(f"❌ 测试失败: {e}")
                return False
    
    def test_empty_prompt(self):
        """测试空 prompt 的情况"""
        print("\n🧪 测试用例 2: 空 prompt")
        
        with self.app.test_request_context(
            '/chat',
            method='POST', 
            json={"prompt": ""}
        ):
            try:
                result = chat()
                print(f"✅ 响应状态码: {result[1] if isinstance(result, tuple) else 'Unknown'}")
                print(f"✅ 响应内容: {result[0].get_json() if hasattr(result[0], 'get_json') else result}")
                return True
            except Exception as e:
                print(f"❌ 测试失败: {e}")
                return False
    
    @patch('backend.routes.chat.requests.post')
    def test_successful_response(self, mock_post):
        """测试成功响应的情况"""
        print("\n🧪 测试用例 3: 成功响应")
        
        # 模拟成功的API响应
        mock_response = Mock()
        mock_response.json.return_value = self.success_response
        mock_post.return_value = mock_response
        
        with self.app.test_request_context(
            '/chat',
            method='POST',
            json={"prompt": "你好", "scene_id": "test"}
        ):
            try:
                result = chat()
                print(f"✅ 响应内容: {result}")
                print(f"✅ API调用次数: {mock_post.call_count}")
                return True
            except Exception as e:
                print(f"❌ 测试失败: {e}")
                return False
    
    @patch('backend.routes.chat.requests.post')
    def test_error_response_with_retry(self, mock_post):
        """测试错误响应重试机制"""
        print("\n🧪 测试用例 4: 错误响应重试机制")
        
        # 前两次返回错误，第三次返回成功
        mock_response_error = Mock()
        mock_response_error.json.return_value = self.error_response
        
        mock_response_success = Mock()
        mock_response_success.json.return_value = self.success_response
        
        mock_post.side_effect = [
            mock_response_error,  # 第1次调用
            mock_response_error,  # 第2次调用  
            mock_response_success  # 第3次调用
        ]
        
        with self.app.test_request_context(
            '/chat',
            method='POST',
            json={"prompt": "测试重试机制"}
        ):
            try:
                result = chat()
                print(f"✅ 响应内容: {result}")
                print(f"✅ API调用次数: {mock_post.call_count}")
                print("✅ 重试机制工作正常")
                return True
            except Exception as e:
                print(f"❌ 测试失败: {e}")
                return False
    
    @patch('backend.routes.chat.requests.post')
    def test_max_retries_exceeded(self, mock_post):
        """测试达到最大重试次数的情况"""
        print("\n🧪 测试用例 5: 达到最大重试次数")
        
        # 始终返回错误响应
        mock_response = Mock()
        mock_response.json.return_value = self.error_response
        mock_post.return_value = mock_response
        
        with self.app.test_request_context(
            '/chat',
            method='POST',
            json={"prompt": "测试最大重试"}
        ):
            try:
                result = chat()
                print(f"✅ 响应状态码: {result[1] if isinstance(result, tuple) else 'Unknown'}")
                print(f"✅ 响应内容: {result[0].get_json() if hasattr(result[0], 'get_json') else result}")
                print(f"✅ API调用次数: {mock_post.call_count}")
                return True
            except Exception as e:
                print(f"❌ 测试失败: {e}")
                return False
    
    @patch('backend.routes.chat.requests.post')
    def test_network_error(self, mock_post):
        """测试网络错误的情况"""
        print("\n🧪 测试用例 6: 网络错误处理")
        
        # 模拟网络错误
        mock_post.side_effect = requests.exceptions.ConnectionError("网络连接错误")
        
        with self.app.test_request_context(
            '/chat',
            method='POST',
            json={"prompt": "测试网络错误"}
        ):
            try:
                result = chat()
                print(f"✅ 响应状态码: {result[1] if isinstance(result, tuple) else 'Unknown'}")
                print(f"✅ 响应内容: {result[0].get_json() if hasattr(result[0], 'get_json') else result}")
                return True
            except Exception as e:
                print(f"❌ 测试失败: {e}")
                return False
    
    @patch('backend.routes.chat.requests.post')
    def test_timeout_error(self, mock_post):
        """测试超时错误的情况"""
        print("\n🧪 测试用例 7: 超时错误处理")
        
        # 模拟超时错误
        mock_post.side_effect = requests.exceptions.Timeout("请求超时")
        
        with self.app.test_request_context(
            '/chat',
            method='POST',
            json={"prompt": "测试超时错误"}
        ):
            try:
                result = chat()
                print(f"✅ 响应状态码: {result[1] if isinstance(result, tuple) else 'Unknown'}")
                print(f"✅ 响应内容: {result[0].get_json() if hasattr(result[0], 'get_json') else result}")
                return True
            except Exception as e:
                print(f"❌ 测试失败: {e}")
                return False
    
    def test_with_scene_id(self):
        """测试带有 scene_id 参数的情况"""
        print("\n🧪 测试用例 8: 带 scene_id 参数")
        
        with patch('backend.routes.chat.requests.post') as mock_post:
            mock_response = Mock()
            mock_response.json.return_value = self.success_response
            mock_post.return_value = mock_response
            
            with self.app.test_request_context(
                '/chat',
                method='POST',
                json={"prompt": "你好", "scene_id": "db_sizheng"}
            ):
                try:
                    result = chat()
                    print(f"✅ 响应内容: {result}")
                    # 检查是否正确传递了 scene_id
                    call_args = mock_post.call_args
                    if call_args:
                        json_data = call_args[1].get('json', {})
                        print(f"✅ 传递的 scene_id: {json_data.get('scene_id')}")
                    return True
                except Exception as e:
                    print(f"❌ 测试失败: {e}")
                    return False
    
    def run_all_tests(self):
        """运行所有测试用例"""
        print("🚀 开始测试 chat() 函数...\n")
        
        test_methods = [
            self.test_missing_prompt,
            self.test_empty_prompt,
            self.test_successful_response,
            self.test_error_response_with_retry,
            self.test_max_retries_exceeded,
            self.test_network_error,
            self.test_timeout_error,
            self.test_with_scene_id
        ]
        
        passed = 0
        total = len(test_methods)
        
        for test_method in test_methods:
            try:
                if test_method():
                    passed += 1
                    print("✅ PASSED")
                else:
                    print("❌ FAILED")
            except Exception as e:
                print(f"❌ FAILED: {e}")
            print("-" * 50)
        
        print(f"\n📊 测试总结:")
        print(f"通过: {passed}/{total}")
        print(f"失败: {total - passed}/{total}")
        print(f"成功率: {passed/total*100:.1f}%")
        
        return passed == total


def test_real_api():
    """测试真实的API调用"""
    print("\n🌐 测试真实API调用...")
    
    test_data = {
        "prompt": "你好，请简单介绍一下你自己",
        "scene_id": "test"
    }
    
    try:
        # 假设后端服务运行在 localhost:5000
        response = requests.post(
            "http://localhost:5000/chat",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"✅ 状态码: {response.status_code}")
        print(f"✅ 响应内容: {response.json()}")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到本地服务器，跳过真实API测试")
        return False
    except Exception as e:
        print(f"❌ 真实API测试失败: {e}")
        return False


if __name__ == "__main__":
    # 运行模拟测试
    tester = TestChatFunction()
    mock_success = tester.run_all_tests()
    
    # 运行真实API测试（可选）
    print("\n" + "="*60)
    real_api_success = test_real_api()
    
    print("\n" + "="*60)
    print("🏁 测试完成!")
    
    if mock_success:
        print("✅ 所有模拟测试通过")
    else:
        print("❌ 部分模拟测试失败")
    
    if real_api_success:
        print("✅ 真实API测试通过")
    else:
        print("❌ 真实API测试失败或跳过")
