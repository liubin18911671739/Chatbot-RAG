#!/usr/bin/env python3
"""
Delete API 测试文件
用于测试 delete.py 模块中的问题删除功能

运行测试:
python test-delete.py

或使用 pytest:
pytest test-delete.py -v
"""

import json
import pytest
import requests
from unittest.mock import patch, Mock
from flask import Flask
from flask.testing import FlaskClient

# 导入需要测试的模块
try:
    from app import app
    from routes.delete import delete_question, delete_question_without_id
except ImportError:
    # 如果直接运行此文件，设置路径
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from app import app
    from routes.delete import delete_question, delete_question_without_id


class TestDeleteAPI:
    """删除API测试类"""
    
    @pytest.fixture
    def client(self) -> FlaskClient:
        """创建测试客户端"""
        app.config['TESTING'] = True
        with app.test_client() as client:
            yield client
    
    @pytest.fixture
    def mock_successful_response(self):
        """模拟成功响应"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = '{"status": "success"}'
        return mock_response
    
    @pytest.fixture
    def mock_not_found_response(self):
        """模拟404响应"""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.text = '{"status": "error", "message": "Question not found"}'
        return mock_response
    
    @pytest.fixture
    def mock_server_error_response(self):
        """模拟500响应"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = '{"status": "error", "message": "Internal server error"}'
        return mock_response

    def test_delete_question_success(self, client, mock_successful_response):
        """测试成功删除问题"""
        with patch('routes.delete.requests.delete', return_value=mock_successful_response):
            response = client.delete('/api/delete/123')
            data = json.loads(response.data)
            
            assert response.status_code == 200
            assert data['status'] == 'success'
    
    def test_delete_question_not_found(self, client, mock_not_found_response):
        """测试删除不存在的问题"""
        with patch('routes.delete.requests.delete', return_value=mock_not_found_response):
            response = client.delete('/api/delete/999')
            data = json.loads(response.data)
            
            assert response.status_code == 404
            assert data['status'] == 'error'
            assert data['message'] == '问题不存在'
    
    def test_delete_question_server_error(self, client, mock_server_error_response):
        """测试服务器错误"""
        with patch('routes.delete.requests.delete', return_value=mock_server_error_response):
            response = client.delete('/api/delete/123')
            data = json.loads(response.data)
            
            assert response.status_code == 500
            assert data['status'] == 'error'
            assert 'API删除失败' in data['message']
    
    def test_delete_question_connection_error(self, client):
        """测试连接错误"""
        with patch('routes.delete.requests.delete', side_effect=requests.exceptions.ConnectionError()):
            response = client.delete('/api/delete/123')
            data = json.loads(response.data)
            
            assert response.status_code == 503
            assert data['status'] == 'error'
            assert data['message'] == '无法连接到目标API服务器'
    
    def test_delete_question_timeout_error(self, client):
        """测试超时错误"""
        with patch('routes.delete.requests.delete', side_effect=requests.exceptions.Timeout()):
            response = client.delete('/api/delete/123')
            data = json.loads(response.data)
            
            assert response.status_code == 504
            assert data['status'] == 'error'
            assert data['message'] == '请求超时'
    
    def test_delete_question_generic_exception(self, client):
        """测试通用异常"""
        with patch('routes.delete.requests.delete', side_effect=Exception("Unexpected error")):
            response = client.delete('/api/delete/123')
            data = json.loads(response.data)
            
            assert response.status_code == 500
            assert data['status'] == 'error'
            assert data['message'] == '删除问题失败'
            assert data['error'] == 'Unexpected error'
    
    def test_delete_question_without_id(self, client):
        """测试没有提供ID的删除请求"""
        response = client.delete('/api/delete')
        data = json.loads(response.data)
        
        assert response.status_code == 400
        assert data['status'] == 'error'
        assert '请在URL中提供问题ID' in data['message']
    
    def test_delete_question_invalid_id_type(self, client):
        """测试无效的ID类型"""
        response = client.delete('/api/delete/abc')
        
        # 应该返回404，因为Flask路由会因为类型不匹配而不匹配该路由
        assert response.status_code == 404
    
    def test_delete_question_negative_id(self, client, mock_not_found_response):
        """测试负数ID"""
        with patch('routes.delete.requests.delete', return_value=mock_not_found_response):
            response = client.delete('/api/delete/-1')
            data = json.loads(response.data)
            
            assert response.status_code == 404
            assert data['status'] == 'error'
    
    def test_delete_question_zero_id(self, client, mock_not_found_response):
        """测试ID为0"""
        with patch('routes.delete.requests.delete', return_value=mock_not_found_response):
            response = client.delete('/api/delete/0')
            data = json.loads(response.data)
            
            assert response.status_code == 404
            assert data['status'] == 'error'
    
    def test_delete_question_large_id(self, client, mock_successful_response):
        """测试大ID值"""
        with patch('routes.delete.requests.delete', return_value=mock_successful_response):
            response = client.delete('/api/delete/999999999')
            data = json.loads(response.data)
            
            assert response.status_code == 200
            assert data['status'] == 'success'


class TestDeleteAPIIntegration:
    """集成测试类"""
    
    def test_api_call_parameters(self):
        """测试API调用参数是否正确"""
        with patch('routes.delete.requests.delete') as mock_delete:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.text = '{"status": "success"}'
            mock_delete.return_value = mock_response
            
            # 模拟Flask应用上下文
            with app.test_client() as client:
                client.delete('/api/delete/123')
            
            # 验证API调用参数
            mock_delete.assert_called_once_with(
                "http://10.10.15.210:5001/delete/123",
                timeout=30
            )
    
    def test_response_format_consistency(self):
        """测试响应格式一致性"""
        test_cases = [
            (200, '{"status": "success"}', 200, 'success'),
            (404, '{"error": "not found"}', 404, 'error'),
            (500, '{"error": "server error"}', 500, 'error'),
        ]
        
        for api_status, api_response, expected_status, expected_result in test_cases:
            with patch('routes.delete.requests.delete') as mock_delete:
                mock_response = Mock()
                mock_response.status_code = api_status
                mock_response.text = api_response
                mock_delete.return_value = mock_response
                
                with app.test_client() as client:
                    response = client.delete('/api/delete/123')
                    data = json.loads(response.data)
                    
                    assert response.status_code == expected_status
                    assert data['status'] == expected_result


def test_direct_function_calls():
    """直接测试函数调用"""
    # 测试路由函数是否正确导入
    assert callable(delete_question)
    assert callable(delete_question_without_id)


class TestEdgeCases:
    """边界情况测试"""
    
    @pytest.fixture
    def client(self) -> FlaskClient:
        """创建测试客户端"""
        app.config['TESTING'] = True
        with app.test_client() as client:
            yield client
    
    def test_very_long_response(self, client):
        """测试非常长的响应"""
        with patch('routes.delete.requests.delete') as mock_delete:
            mock_response = Mock()
            mock_response.status_code = 500
            mock_response.text = 'x' * 10000  # 非常长的响应
            mock_delete.return_value = mock_response
            
            response = client.delete('/api/delete/123')
            data = json.loads(response.data)
            
            assert response.status_code == 500
            assert data['status'] == 'error'
            assert len(data['error']) == 10000
    
    def test_empty_response(self, client):
        """测试空响应"""
        with patch('routes.delete.requests.delete') as mock_delete:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.text = ''
            mock_delete.return_value = mock_response
            
            response = client.delete('/api/delete/123')
            data = json.loads(response.data)
            
            assert response.status_code == 200
            assert data['status'] == 'success'
    
    def test_malformed_response(self, client):
        """测试格式错误的响应"""
        with patch('routes.delete.requests.delete') as mock_delete:
            mock_response = Mock()
            mock_response.status_code = 500
            mock_response.text = 'Not a JSON response'
            mock_delete.return_value = mock_response
            
            response = client.delete('/api/delete/123')
            data = json.loads(response.data)
            
            assert response.status_code == 500
            assert data['status'] == 'error'
            assert data['error'] == 'Not a JSON response'


def run_manual_tests():
    """手动运行测试的函数"""
    print("开始运行删除API测试...")
    
    # 创建测试客户端
    app.config['TESTING'] = True
    client = app.test_client()
    
    test_cases = [
        ("删除存在的问题", "DELETE", "/api/delete/123"),
        ("删除不存在的问题", "DELETE", "/api/delete/999"),
        ("没有提供ID", "DELETE", "/api/delete"),
        ("无效的ID格式", "DELETE", "/api/delete/abc"),
    ]
    
    for test_name, method, url in test_cases:
        print(f"\n测试: {test_name}")
        print(f"请求: {method} {url}")
        
        try:
            if method == "DELETE":
                response = client.delete(url)
            
            print(f"状态码: {response.status_code}")
            
            try:
                data = json.loads(response.data)
                print(f"响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
            except json.JSONDecodeError:
                print(f"响应 (原始): {response.data}")
                
        except Exception as e:
            print(f"测试失败: {str(e)}")
    
    print("\n测试完成！")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "manual":
        # 手动测试模式
        run_manual_tests()
    else:
        # 使用pytest运行测试
        print("使用 pytest 运行测试:")
        print("pytest test-delete.py -v")
        print("\n或者运行手动测试:")
        print("python test-delete.py manual")
        
        # 尝试运行pytest
        try:
            pytest.main([__file__, "-v"])
        except SystemExit:
            pass
