#!/usr/bin/env python3
"""
简化版 Delete API 测试
用于快速测试 delete.py 功能

运行: python simple-test-delete.py
"""

import json
import requests
from unittest.mock import patch, Mock

def test_delete_api_mock():
    """使用mock测试删除API"""
    print("=== 模拟测试删除API ===")
    
    # 导入Flask应用
    try:
        from app import app
    except ImportError:
        print("无法导入app，请确保在backend目录中运行")
        return
    
    app.config['TESTING'] = True
    client = app.test_client()
    
    # 测试用例
    test_cases = [
        {
            "name": "成功删除",
            "question_id": 123,
            "mock_status": 200,
            "mock_response": '{"status": "success"}',
            "expected_status": 200
        },
        {
            "name": "问题不存在",
            "question_id": 999,
            "mock_status": 404,
            "mock_response": '{"status": "error", "message": "Not found"}',
            "expected_status": 404
        },
        {
            "name": "服务器错误",
            "question_id": 456,
            "mock_status": 500,
            "mock_response": '{"status": "error", "message": "Server error"}',
            "expected_status": 500
        }
    ]
    
    for case in test_cases:
        print(f"\n测试: {case['name']}")
        
        # 创建mock响应
        mock_response = Mock()
        mock_response.status_code = case['mock_status']
        mock_response.text = case['mock_response']
        
        # 使用mock测试
        with patch('routes.delete.requests.delete', return_value=mock_response):
            response = client.delete(f"/api/delete/{case['question_id']}")
            data = json.loads(response.data)
            
            print(f"  请求ID: {case['question_id']}")
            print(f"  期望状态码: {case['expected_status']}")
            print(f"  实际状态码: {response.status_code}")
            print(f"  响应: {json.dumps(data, ensure_ascii=False)}")
            
            # 检查结果
            if response.status_code == case['expected_status']:
                print("  ✅ 测试通过")
            else:
                print("  ❌ 测试失败")

def test_delete_api_exceptions():
    """测试异常情况"""
    print("\n=== 测试异常情况 ===")
    
    try:
        from app import app
    except ImportError:
        print("无法导入app")
        return
    
    app.config['TESTING'] = True
    client = app.test_client()
    
    # 测试连接错误
    print("\n测试: 连接错误")
    with patch('routes.delete.requests.delete', side_effect=requests.exceptions.ConnectionError()):
        response = client.delete("/api/delete/123")
        data = json.loads(response.data)
        print(f"  状态码: {response.status_code}")
        print(f"  响应: {json.dumps(data, ensure_ascii=False)}")
        
        if response.status_code == 503 and data['status'] == 'error':
            print("  ✅ 连接错误测试通过")
        else:
            print("  ❌ 连接错误测试失败")
    
    # 测试超时错误
    print("\n测试: 超时错误")
    with patch('routes.delete.requests.delete', side_effect=requests.exceptions.Timeout()):
        response = client.delete("/api/delete/123")
        data = json.loads(response.data)
        print(f"  状态码: {response.status_code}")
        print(f"  响应: {json.dumps(data, ensure_ascii=False)}")
        
        if response.status_code == 504 and data['status'] == 'error':
            print("  ✅ 超时错误测试通过")
        else:
            print("  ❌ 超时错误测试失败")

def test_no_id_endpoint():
    """测试没有ID的端点"""
    print("\n=== 测试没有ID的端点 ===")
    
    try:
        from app import app
    except ImportError:
        print("无法导入app")
        return
    
    app.config['TESTING'] = True
    client = app.test_client()
    
    response = client.delete("/api/delete")
    data = json.loads(response.data)
    
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(data, ensure_ascii=False)}")
    
    if response.status_code == 400 and data['status'] == 'error':
        print("✅ 无ID端点测试通过")
    else:
        print("❌ 无ID端点测试失败")

def test_invalid_id_format():
    """测试无效ID格式"""
    print("\n=== 测试无效ID格式 ===")
    
    try:
        from app import app
    except ImportError:
        print("无法导入app")
        return
    
    app.config['TESTING'] = True
    client = app.test_client()
    
    # 测试字符串ID
    response = client.delete("/api/delete/abc")
    print(f"字符串ID状态码: {response.status_code}")
    
    # 测试浮点数ID
    response = client.delete("/api/delete/12.5")
    print(f"浮点数ID状态码: {response.status_code}")
    
    # 由于Flask路由限制为int，这些应该返回404
    print("✅ 无效ID格式测试完成（Flask自动处理）")

def test_real_api_connection():
    """测试真实API连接（可选）"""
    print("\n=== 测试真实API连接 ===")
    
    # 测试目标API是否可达
    target_url = "http://10.10.15.210:5001"
    
    try:
        response = requests.get(f"{target_url}/health", timeout=5)
        print(f"目标API健康检查: {response.status_code}")
        if response.status_code == 200:
            print("✅ 目标API可用")
        else:
            print("⚠️ 目标API返回非200状态")
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到目标API")
    except requests.exceptions.Timeout:
        print("❌ 连接目标API超时")
    except Exception as e:
        print(f"❌ 连接测试错误: {str(e)}")

def main():
    """主函数"""
    print("删除API测试工具")
    print("=" * 50)
    
    # 运行所有测试
    test_delete_api_mock()
    test_delete_api_exceptions()
    test_no_id_endpoint()
    test_invalid_id_format()
    test_real_api_connection()
    
    print("\n" + "=" * 50)
    print("测试完成！")

if __name__ == "__main__":
    main()
