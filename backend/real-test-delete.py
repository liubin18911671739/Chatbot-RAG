#!/usr/bin/env python3
"""
Delete API 真实测试
用于测试真实的删除API调用

警告: 这将向真实API发送删除请求，请谨慎使用！

运行: python real-test-delete.py
"""

import json
import time
import requests
from datetime import datetime

class RealDeleteAPITester:
    """真实删除API测试器"""
    
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.test_results = []
    
    def log_test(self, test_name, success, details):
        """记录测试结果"""
        result = {
            "timestamp": datetime.now().isoformat(),
            "test_name": test_name,
            "success": success,
            "details": details
        }
        self.test_results.append(result)
        
        # 打印结果
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
    
    def test_delete_nonexistent_question(self):
        """测试删除不存在的问题"""
        test_name = "删除不存在的问题"
        
        try:
            # 使用一个很大的ID，假设它不存在
            question_id = 999999999
            url = f"{self.base_url}/api/delete/{question_id}"
            
            response = requests.delete(url, timeout=10)
            data = response.json()
            
            # 检查响应
            if response.status_code == 404 and data.get('status') == 'error':
                self.log_test(test_name, True, f"正确返回404: {data.get('message', '')}")
            else:
                self.log_test(test_name, False, f"意外响应: {response.status_code}, {data}")
                
        except Exception as e:
            self.log_test(test_name, False, f"请求失败: {str(e)}")
    
    def test_delete_invalid_id_format(self):
        """测试无效ID格式"""
        test_name = "删除无效ID格式"
        
        try:
            url = f"{self.base_url}/api/delete/abc"
            response = requests.delete(url, timeout=10)
            
            # Flask应该返回404因为路由不匹配
            if response.status_code == 404:
                self.log_test(test_name, True, "正确处理无效ID格式")
            else:
                self.log_test(test_name, False, f"意外状态码: {response.status_code}")
                
        except Exception as e:
            self.log_test(test_name, False, f"请求失败: {str(e)}")
    
    def test_delete_without_id(self):
        """测试没有ID的删除请求"""
        test_name = "删除请求缺少ID"
        
        try:
            url = f"{self.base_url}/api/delete"
            response = requests.delete(url, timeout=10)
            data = response.json()
            
            if response.status_code == 400 and data.get('status') == 'error':
                self.log_test(test_name, True, f"正确返回400: {data.get('message', '')}")
            else:
                self.log_test(test_name, False, f"意外响应: {response.status_code}, {data}")
                
        except Exception as e:
            self.log_test(test_name, False, f"请求失败: {str(e)}")
    
    def test_api_server_connectivity(self):
        """测试API服务器连接性"""
        test_name = "API服务器连接性"
        
        try:
            # 先测试健康检查端点（如果有的话）
            health_endpoints = [
                f"{self.base_url}/health",
                f"{self.base_url}/api/health",
                f"{self.base_url}/",
            ]
            
            connected = False
            for endpoint in health_endpoints:
                try:
                    response = requests.get(endpoint, timeout=5)
                    if response.status_code in [200, 404]:  # 404也表示服务器在运行
                        connected = True
                        self.log_test(test_name, True, f"服务器响应: {endpoint} -> {response.status_code}")
                        break
                except:
                    continue
            
            if not connected:
                self.log_test(test_name, False, "无法连接到API服务器")
                
        except Exception as e:
            self.log_test(test_name, False, f"连接测试失败: {str(e)}")
    
    def test_delete_response_format(self):
        """测试删除响应格式"""
        test_name = "删除响应格式"
        
        try:
            # 使用不存在的ID测试响应格式
            question_id = 888888888
            url = f"{self.base_url}/api/delete/{question_id}"
            
            response = requests.delete(url, timeout=10)
            
            # 检查是否返回JSON
            try:
                data = response.json()
                
                # 检查必要字段
                required_fields = ['status']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test(test_name, True, "响应格式正确")
                else:
                    self.log_test(test_name, False, f"缺少字段: {missing_fields}")
                    
            except json.JSONDecodeError:
                self.log_test(test_name, False, "响应不是有效的JSON")
                
        except Exception as e:
            self.log_test(test_name, False, f"格式测试失败: {str(e)}")
    
    def test_delete_request_timeout(self):
        """测试删除请求超时处理"""
        test_name = "删除请求超时处理"
        
        try:
            question_id = 777777777
            url = f"{self.base_url}/api/delete/{question_id}"
            
            # 设置很短的超时时间来测试超时处理
            start_time = time.time()
            try:
                response = requests.delete(url, timeout=0.001)  # 1毫秒超时
                # 如果没有超时，那就正常处理
                end_time = time.time()
                self.log_test(test_name, True, f"请求在 {end_time - start_time:.3f}s 内完成")
            except requests.exceptions.Timeout:
                self.log_test(test_name, True, "正确处理超时异常")
                
        except Exception as e:
            self.log_test(test_name, False, f"超时测试失败: {str(e)}")
    
    def test_stress_delete_requests(self):
        """压力测试删除请求"""
        test_name = "删除请求压力测试"
        
        try:
            success_count = 0
            total_requests = 5  # 较少的请求数，避免对服务器造成过大压力
            
            print(f"    开始发送 {total_requests} 个删除请求...")
            
            for i in range(total_requests):
                try:
                    question_id = 900000000 + i
                    url = f"{self.base_url}/api/delete/{question_id}"
                    
                    response = requests.delete(url, timeout=5)
                    if response.status_code in [200, 404]:  # 成功或不存在都算正常
                        success_count += 1
                    
                    time.sleep(0.1)  # 避免过于频繁的请求
                    
                except Exception as e:
                    print(f"    请求 {i+1} 失败: {str(e)}")
            
            success_rate = success_count / total_requests
            if success_rate >= 0.8:  # 80%成功率
                self.log_test(test_name, True, f"成功率: {success_rate:.1%} ({success_count}/{total_requests})")
            else:
                self.log_test(test_name, False, f"成功率过低: {success_rate:.1%}")
                
        except Exception as e:
            self.log_test(test_name, False, f"压力测试失败: {str(e)}")
    
    def run_all_tests(self):
        """运行所有测试"""
        print("开始真实删除API测试...")
        print("=" * 60)
        
        tests = [
            self.test_api_server_connectivity,
            self.test_delete_nonexistent_question,
            self.test_delete_invalid_id_format,
            self.test_delete_without_id,
            self.test_delete_response_format,
            self.test_delete_request_timeout,
            self.test_stress_delete_requests,
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ 测试 {test.__name__} 发生异常: {str(e)}")
            print()  # 空行分隔
        
        self.print_summary()
    
    def print_summary(self):
        """打印测试摘要"""
        print("=" * 60)
        print("测试摘要")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"总测试数: {total_tests}")
        print(f"通过: {passed_tests}")
        print(f"失败: {failed_tests}")
        print(f"成功率: {passed_tests/total_tests:.1%}")
        
        if failed_tests > 0:
            print("\n失败的测试:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test_name']}: {result['details']}")
        
        # 保存详细结果到文件
        try:
            with open('delete_api_test_results.json', 'w', encoding='utf-8') as f:
                json.dump(self.test_results, f, ensure_ascii=False, indent=2)
            print(f"\n详细测试结果已保存到: delete_api_test_results.json")
        except Exception as e:
            print(f"\n保存测试结果失败: {str(e)}")


def main():
    """主函数"""
    print("Delete API 真实测试工具")
    print("=" * 60)
    print("警告: 这将向真实API发送删除请求！")
    print("请确保:")
    print("1. 后端服务正在运行")
    print("2. 使用的是测试环境")
    print("3. 了解删除操作的影响")
    print("=" * 60)
    
    # 确认继续
    while True:
        confirm = input("确定要继续吗？(y/N): ").strip().lower()
        if confirm in ['y', 'yes']:
            break
        elif confirm in ['n', 'no', '']:
            print("测试已取消")
            return
        else:
            print("请输入 y 或 n")
    
    # 获取API地址
    api_url = input("请输入API地址 (默认: http://localhost:5000): ").strip()
    if not api_url:
        api_url = "http://localhost:5000"
    
    # 创建测试器并运行测试
    tester = RealDeleteAPITester(api_url)
    tester.run_all_tests()


if __name__ == "__main__":
    main()
