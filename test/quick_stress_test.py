#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sendChatMessage() 快速压力测试脚本
简化版本，用于快速验证 API 功能
"""

import requests
import time
import json
import random
from datetime import datetime
import concurrent.futures
import threading

class QuickStressTester:
    """快速压力测试器"""
    
    def __init__(self):
        self.api_url = "http://10.10.15.211:5000/api/chat"
        self.timeout = 40  # 40秒超时
        self.total_questions = 20  # 快速测试用20个问题
        self.results = {
            'total': 0,
            'success': 0,
            'failed': 0,
            'timeout': 0,
            'response_times': [],
            'errors': []
        }
        self.lock = threading.Lock()
    
    def get_test_questions(self):
        """获取测试问题"""
        # 检查是否存在问题文件
        try:
            with open('prompt.txt', 'r', encoding='utf-8') as f:
                questions = [line.strip() for line in f.readlines() if line.strip()]
            if len(questions) >= self.total_questions:
                return random.sample(questions, self.total_questions)
        except FileNotFoundError:
            pass
        
        # 使用备用问题
        fallback_questions = [
            "人工智能的发展前景如何？",
            "量子计算的工作原理是什么？",
            "5G网络的优势在哪里？",
            "区块链技术如何应用？",
            "机器学习算法有哪些类型？",
            "云计算的安全性如何保证？",
            "物联网技术的应用场景有哪些？",
            "虚拟现实技术的未来发展？",
            "新能源汽车的发展趋势如何？",
            "基因编辑技术有哪些应用？",
            "终身学习的重要性？",
            "有效学习方法有哪些？",
            "在线教育的优势和挑战？",
            "批判性思维如何培养？",
            "创新能力的培养途径？",
            "语言学习的有效策略？",
            "职业技能的发展规划？",
            "教育公平的实现路径？",
            "素质教育的核心内容？",
            "学习动机的激发方法？",
            "预防疾病的基本措施？",
            "心理健康的重要性？",
            "运动对身体的益处？",
            "营养均衡的重要性？",
            "睡眠质量如何改善？"
        ]
        return random.sample(fallback_questions, min(self.total_questions, len(fallback_questions)))
    
    def send_message(self, question, question_id):
        """发送单个消息"""
        start_time = time.time()
        
        try:
            payload = {
                "prompt": question,
                "scene_id": None,
                "user_id": f"test_user_{question_id}"
            }
            
            response = requests.post(
                self.api_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=self.timeout
            )
            
            response_time = time.time() - start_time
            
            with self.lock:
                if response.status_code == 200:
                    result = response.json()
                    if 'response' in result or 'answer' in result:
                        self.results['success'] += 1
                        self.results['response_times'].append(response_time)
                        print(f"✅ 问题 {question_id} 成功 ({response_time:.2f}s)")
                    else:
                        self.results['failed'] += 1
                        error_msg = f"问题 {question_id} 响应格式错误"
                        self.results['errors'].append(error_msg)
                        print(f"❌ {error_msg}")
                else:
                    self.results['failed'] += 1
                    error_msg = f"问题 {question_id} HTTP错误: {response.status_code}"
                    self.results['errors'].append(error_msg)
                    print(f"❌ {error_msg}")
                    
        except requests.exceptions.Timeout:
            response_time = time.time() - start_time
            with self.lock:
                self.results['timeout'] += 1
                self.results['failed'] += 1
                error_msg = f"问题 {question_id} 超时 (>{self.timeout}s)"
                self.results['errors'].append(error_msg)
                print(f"⏰ {error_msg}")
                
        except Exception as e:
            response_time = time.time() - start_time
            with self.lock:
                self.results['failed'] += 1
                error_msg = f"问题 {question_id} 异常: {str(e)}"
                self.results['errors'].append(error_msg)
                print(f"💥 {error_msg}")
    
    def run_test(self):
        """运行测试"""
        print("🚀 开始 sendChatMessage() 快速压力测试")
        print("=" * 50)
        
        # 获取测试问题
        questions = self.get_test_questions()
        self.results['total'] = len(questions)
        
        print(f"📊 测试配置:")
        print(f"   API地址: {self.api_url}")
        print(f"   问题数量: {len(questions)}")
        print(f"   超时时间: {self.timeout}s")
        print("=" * 50)
        
        start_time = time.time()
        
        # 使用线程池执行测试
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(self.send_message, question, i + 1)
                for i, question in enumerate(questions)
            ]
            
            # 等待所有任务完成
            concurrent.futures.wait(futures)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # 计算统计信息
        success_rate = (self.results['success'] / self.results['total']) * 100 if self.results['total'] > 0 else 0
        avg_response_time = sum(self.results['response_times']) / len(self.results['response_times']) if self.results['response_times'] else 0
        
        # 打印结果
        print("\n" + "=" * 50)
        print("📈 测试结果总结")
        print("=" * 50)
        print(f"总请求数: {self.results['total']}")
        print(f"成功请求: {self.results['success']}")
        print(f"失败请求: {self.results['failed']}")
        print(f"超时请求: {self.results['timeout']}")
        print(f"成功率: {success_rate:.2f}%")
        print(f"平均响应时间: {avg_response_time:.2f}s")
        print(f"总测试时间: {total_time:.2f}s")
        
        if success_rate >= 90:
            print("🌟 测试结果: 优秀")
        elif success_rate >= 75:
            print("👍 测试结果: 良好")
        elif success_rate >= 60:
            print("⚠️ 测试结果: 一般")
        else:
            print("🚨 测试结果: 需要改进")
        
        # 保存结果
        result_data = {
            "timestamp": datetime.now().isoformat(),
            "api_url": self.api_url,
            "timeout": self.timeout,
            "statistics": {
                "total": self.results['total'],
                "success": self.results['success'],
                "failed": self.results['failed'],
                "timeout": self.results['timeout'],
                "success_rate": success_rate,
                "average_response_time": avg_response_time,
                "total_test_time": total_time
            },
            "errors": self.results['errors'][:10]  # 保存前10个错误
        }
        
        filename = f"quick_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(result_data, f, ensure_ascii=False, indent=2)
            print(f"📁 结果已保存到: {filename}")
        except Exception as e:
            print(f"❌ 保存结果失败: {e}")
        
        print("=" * 50)

def main():
    """主函数"""
    print("🚀 sendChatMessage() 快速压力测试工具")
    print("适用于快速验证 API 功能和基本性能")
    print()
    
    tester = QuickStressTester()
    
    try:
        tester.run_test()
    except KeyboardInterrupt:
        print("\n⏹️ 测试被用户中断")
    except Exception as e:
        print(f"❌ 测试执行失败: {e}")

if __name__ == "__main__":
    main()
