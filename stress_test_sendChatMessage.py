#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sendChatMessage() 压力测试脚本
测试 iChat 系统的 sendChatMessage 函数的性能和稳定性
使用100个随机问题进行测试，40秒超时，计算成功率
"""

import asyncio
import aiohttp
import json
import time
import random
import logging
from datetime import datetime
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor
import threading
import signal
import sys
import os

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('stress_test.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class StressTestConfig:
    """压力测试配置"""
    API_BASE_URL = "http://10.10.15.211:5000"
    API_ENDPOINT = "/api/chat"
    REQUEST_TIMEOUT = 60  # 60秒超时
    TOTAL_QUESTIONS = 100
    CONCURRENT_REQUESTS = 10  # 并发请求数
    QUESTIONS_FILE = "prompt.txt"
    RESULTS_FILE = f"stress_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

class StressTestResults:
    """测试结果统计"""
    def __init__(self):
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.timeout_requests = 0
        self.response_times = []
        self.errors = []
        self.start_time = None
        self.end_time = None
        self.lock = threading.Lock()
    
    def add_success(self, response_time: float):
        """添加成功请求"""
        with self.lock:
            self.successful_requests += 1
            self.response_times.append(response_time)
    
    def add_failure(self, error_msg: str, is_timeout: bool = False):
        """添加失败请求"""
        with self.lock:
            self.failed_requests += 1
            if is_timeout:
                self.timeout_requests += 1
            self.errors.append(error_msg)
    
    def get_success_rate(self) -> float:
        """计算成功率"""
        if self.total_requests == 0:
            return 0.0
        return (self.successful_requests / self.total_requests) * 100
    
    def get_average_response_time(self) -> float:
        """计算平均响应时间"""
        if not self.response_times:
            return 0.0
        return sum(self.response_times) / len(self.response_times)
    
    def get_max_response_time(self) -> float:
        """最大响应时间"""
        return max(self.response_times) if self.response_times else 0.0
    
    def get_min_response_time(self) -> float:
        """最小响应时间"""
        return min(self.response_times) if self.response_times else 0.0
    
    def get_total_duration(self) -> float:
        """总测试时间"""
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return 0.0

class SendChatMessageStressTester:
    """sendChatMessage 压力测试器"""
    
    def __init__(self, config: StressTestConfig):
        self.config = config
        self.results = StressTestResults()
        self.questions = []
        self.session = None
        self.is_running = False
    
    def load_questions(self) -> bool:
        """加载测试问题"""
        try:
            # 首先尝试从文件加载
            if os.path.exists(self.config.QUESTIONS_FILE):
                with open(self.config.QUESTIONS_FILE, 'r', encoding='utf-8') as f:
                    self.questions = [line.strip() for line in f.readlines() if line.strip()]
                
                if len(self.questions) >= self.config.TOTAL_QUESTIONS:
                    self.questions = self.questions[:self.config.TOTAL_QUESTIONS]
                    logger.info(f"✅ 从 {self.config.QUESTIONS_FILE} 加载了 {len(self.questions)} 个问题")
                    return True
                else:
                    logger.warning(f"⚠️ 文件中只有 {len(self.questions)} 个问题，需要 {self.config.TOTAL_QUESTIONS} 个")
            
            # 如果文件不存在或问题不够，使用备用问题
            logger.info("📝 使用备用问题生成方案...")
            self._generate_fallback_questions()
            return True
            
        except Exception as e:
            logger.error(f"❌ 加载问题失败: {e}")
            logger.info("📝 使用备用问题生成方案...")
            self._generate_fallback_questions()
            return True
    
    def _generate_fallback_questions(self):
        """生成备用测试问题"""
        fallback_questions = [
            # 科学技术类
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
            
            # 教育学习类
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
            
            # 健康医疗类
            "预防疾病的基本措施？",
            "心理健康的重要性？",
            "运动对身体的益处？",
            "营养均衡的重要性？",
            "睡眠质量如何改善？",
            "慢性病的预防方法？",
            "医疗技术的最新发展？",
            "中医养生的基本理念？",
            "疫苗接种的重要性？",
            "急救知识的基本内容？",
            
            # 经济商业类
            "市场经济的基本特征？",
            "创业成功的关键因素？",
            "电子商务的发展趋势？",
            "供需关系对价格的影响？",
            "投资理财的基本知识？",
            "企业管理的核心要素？",
            "国际贸易的发展现状？",
            "数字经济的特点？",
            "品牌建设的重要性？",
            "消费者权益如何保护？",
            
            # 环境保护类
            "全球气候变化的主要原因？",
            "生物多样性保护的重要性？",
            "可再生能源有哪些类型？",
            "森林砍伐对环境的影响？",
            "海洋污染的主要来源？",
            "如何减少碳足迹？",
            "野生动物保护的措施有哪些？",
            "水资源短缺的解决方案？",
            "垃圾分类的意义是什么？",
            "空气质量对健康的影响？",
            
            # 文化历史类
            "古代丝绸之路的历史意义是什么？",
            "文艺复兴对欧洲的影响如何？",
            "中国古代四大发明有哪些？",
            "埃及金字塔是如何建造的？",
            "古希腊哲学对现代思想的影响？",
            "中华传统文化的核心价值观是什么？",
            "世界文化遗产保护的重要性？",
            "古代文明交流的方式有哪些？",
            "民族文化传承的意义？",
            "传统节日的文化内涵是什么？",
            
            # 艺术娱乐类
            "音乐对人类情感的影响？",
            "电影艺术的发展历程？",
            "绘画技法的基本要素？",
            "舞蹈的文化表达形式？",
            "文学作品的社会价值？",
            "戏剧表演的艺术特色？",
            "雕塑艺术的发展演变？",
            "摄影构图的基本原则？",
            "设计美学的核心理念？",
            "民间艺术的传承意义？",
            
            # 体育运动类
            "运动对身心健康的作用？",
            "奥林匹克精神的内涵？",
            "团队运动的价值意义？",
            "体育锻炼的科学方法？",
            "运动损伤的预防措施？",
            "体育产业的发展前景？",
            "运动营养的基本知识？",
            "体育教育的重要作用？",
            "运动康复的基本原理？",
            "体育精神对人格的影响？",
            
            # 旅游地理类
            "可持续旅游的发展理念？",
            "世界著名景点的特色？",
            "地理环境对文化的影响？",
            "旅游规划的基本原则？",
            "文化旅游的发展意义？",
            "生态旅游的保护作用？",
            "旅游业对经济的贡献？",
            "气候对旅游的影响？",
            "旅游安全的注意事项？",
            "地方特色文化的保护？",
            
            # 日常生活类
            "如何养成良好的作息习惯？",
            "健康饮食的基本原则是什么？",
            "如何有效管理个人时间？",
            "居家清洁的小窍门有哪些？",
            "如何选择适合的运动方式？",
            "理财规划的基本步骤？",
            "如何提高工作效率？",
            "人际交往的技巧有哪些？",
            "如何缓解生活压力？",
            "购物时如何避免冲动消费？"
        ]
        
        # 随机选择100个问题
        self.questions = random.sample(fallback_questions, min(self.config.TOTAL_QUESTIONS, len(fallback_questions)))
        
        # 如果备用问题不够，循环使用
        while len(self.questions) < self.config.TOTAL_QUESTIONS:
            remaining = self.config.TOTAL_QUESTIONS - len(self.questions)
            self.questions.extend(random.sample(fallback_questions, min(remaining, len(fallback_questions))))
        
        logger.info(f"✅ 生成了 {len(self.questions)} 个备用测试问题")
    
    async def send_single_message(self, session: aiohttp.ClientSession, question: str, question_id: int) -> Dict[str, Any]:
        """发送单个聊天消息"""
        start_time = time.time()
        
        try:
            # 构建请求数据
            payload = {
                "prompt": question,
                "scene_id": None,
                "user_id": f"stress_test_user_{question_id}"
            }
            
            # 发送请求
            timeout = aiohttp.ClientTimeout(total=self.config.REQUEST_TIMEOUT)
            async with session.post(
                f"{self.config.API_BASE_URL}{self.config.API_ENDPOINT}",
                json=payload,
                timeout=timeout,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    result = await response.json()
                    
                    # 检查响应格式
                    if 'response' in result or 'answer' in result:
                        self.results.add_success(response_time)
                        logger.info(f"✅ 问题 {question_id} 成功 (响应时间: {response_time:.2f}s)")
                        return {
                            "success": True,
                            "question_id": question_id,
                            "question": question,
                            "response_time": response_time,
                            "status_code": response.status,
                            "response_data": result
                        }
                    else:
                        error_msg = f"问题 {question_id} 响应格式不正确: {result}"
                        self.results.add_failure(error_msg)
                        logger.warning(f"⚠️ {error_msg}")
                        return {
                            "success": False,
                            "question_id": question_id,
                            "question": question,
                            "error": error_msg,
                            "response_time": response_time
                        }
                else:
                    error_msg = f"问题 {question_id} HTTP错误: {response.status}"
                    self.results.add_failure(error_msg)
                    logger.error(f"❌ {error_msg}")
                    return {
                        "success": False,
                        "question_id": question_id,
                        "question": question,
                        "error": error_msg,
                        "response_time": response_time
                    }
                    
        except asyncio.TimeoutError:
            response_time = time.time() - start_time
            error_msg = f"问题 {question_id} 超时 (>{self.config.REQUEST_TIMEOUT}s)"
            self.results.add_failure(error_msg, is_timeout=True)
            logger.error(f"⏰ {error_msg}")
            return {
                "success": False,
                "question_id": question_id,
                "question": question,
                "error": error_msg,
                "response_time": response_time,
                "timeout": True
            }
        except Exception as e:
            response_time = time.time() - start_time
            error_msg = f"问题 {question_id} 异常: {str(e)}"
            self.results.add_failure(error_msg)
            logger.error(f"💥 {error_msg}")
            return {
                "success": False,
                "question_id": question_id,
                "question": question,
                "error": error_msg,
                "response_time": response_time
            }
    
    async def run_stress_test(self) -> Dict[str, Any]:
        """运行压力测试"""
        logger.info("🚀 开始 sendChatMessage() 压力测试")
        logger.info("=" * 60)
        logger.info(f"📊 测试配置:")
        logger.info(f"   API地址: {self.config.API_BASE_URL}{self.config.API_ENDPOINT}")
        logger.info(f"   问题总数: {self.config.TOTAL_QUESTIONS}")
        logger.info(f"   并发数: {self.config.CONCURRENT_REQUESTS}")
        logger.info(f"   超时时间: {self.config.REQUEST_TIMEOUT}s")
        logger.info("=" * 60)
        
        self.is_running = True
        self.results.start_time = time.time()
        self.results.total_requests = len(self.questions)
        
        # 创建HTTP会话
        connector = aiohttp.TCPConnector(limit=self.config.CONCURRENT_REQUESTS * 2)
        async with aiohttp.ClientSession(connector=connector) as session:
            self.session = session
            
            # 创建信号量控制并发数
            semaphore = asyncio.Semaphore(self.config.CONCURRENT_REQUESTS)
            
            async def controlled_request(question: str, question_id: int):
                async with semaphore:
                    return await self.send_single_message(session, question, question_id)
            
            # 创建所有任务
            tasks = [
                controlled_request(question, i + 1)
                for i, question in enumerate(self.questions)
            ]
            
            # 执行所有任务
            try:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # 处理异常结果
                for i, result in enumerate(results):
                    if isinstance(result, Exception):
                        error_msg = f"问题 {i + 1} 任务异常: {str(result)}"
                        self.results.add_failure(error_msg)
                        logger.error(f"💥 {error_msg}")
                
            except KeyboardInterrupt:
                logger.info("⏹️ 用户中断测试")
                self.is_running = False
            except Exception as e:
                logger.error(f"❌ 测试执行异常: {e}")
                self.is_running = False
        
        self.results.end_time = time.time()
        return self._generate_report()
    
    def _generate_report(self) -> Dict[str, Any]:
        """生成测试报告"""
        report = {
            "test_info": {
                "timestamp": datetime.now().isoformat(),
                "api_url": f"{self.config.API_BASE_URL}{self.config.API_ENDPOINT}",
                "total_questions": self.config.TOTAL_QUESTIONS,
                "concurrent_requests": self.config.CONCURRENT_REQUESTS,
                "timeout_seconds": self.config.REQUEST_TIMEOUT,
                "test_duration": self.results.get_total_duration()
            },
            "statistics": {
                "total_requests": self.results.total_requests,
                "successful_requests": self.results.successful_requests,
                "failed_requests": self.results.failed_requests,
                "timeout_requests": self.results.timeout_requests,
                "success_rate": self.results.get_success_rate(),
                "failure_rate": 100 - self.results.get_success_rate(),
                "timeout_rate": (self.results.timeout_requests / self.results.total_requests * 100) if self.results.total_requests > 0 else 0
            },
            "performance": {
                "average_response_time": self.results.get_average_response_time(),
                "max_response_time": self.results.get_max_response_time(),
                "min_response_time": self.results.get_min_response_time(),
                "requests_per_second": self.results.total_requests / self.results.get_total_duration() if self.results.get_total_duration() > 0 else 0
            },
            "errors": self.results.errors[:50]  # 只保存前50个错误信息
        }
        
        return report
    
    def print_summary(self, report: Dict[str, Any]):
        """打印测试总结"""
        print("\n" + "=" * 60)
        print("📈 sendChatMessage() 压力测试结果总结")
        print("=" * 60)
        
        stats = report["statistics"]
        perf = report["performance"]
        info = report["test_info"]
        
        print(f"🔧 测试配置:")
        print(f"   API地址: {info['api_url']}")
        print(f"   测试问题: {info['total_questions']} 个")
        print(f"   并发数: {info['concurrent_requests']}")
        print(f"   超时设置: {info['timeout_seconds']} 秒")
        print(f"   总测试时间: {info['test_duration']:.2f} 秒")
        
        print(f"\n📊 成功率统计:")
        print(f"   总请求数: {stats['total_requests']}")
        print(f"   成功请求: {stats['successful_requests']}")
        print(f"   失败请求: {stats['failed_requests']}")
        print(f"   超时请求: {stats['timeout_requests']}")
        print(f"   ✅ 成功率: {stats['success_rate']:.2f}%")
        print(f"   ❌ 失败率: {stats['failure_rate']:.2f}%")
        print(f"   ⏰ 超时率: {stats['timeout_rate']:.2f}%")
        
        print(f"\n⚡ 性能指标:")
        print(f"   平均响应时间: {perf['average_response_time']:.2f} 秒")
        print(f"   最快响应时间: {perf['min_response_time']:.2f} 秒")
        print(f"   最慢响应时间: {perf['max_response_time']:.2f} 秒")
        print(f"   平均QPS: {perf['requests_per_second']:.2f} 请求/秒")
        
        # 评估结果
        print(f"\n🎯 测试评估:")
        if stats['success_rate'] >= 95:
            print(f"   🌟 优秀 - 系统性能表现优异")
        elif stats['success_rate'] >= 85:
            print(f"   👍 良好 - 系统性能表现不错")
        elif stats['success_rate'] >= 70:
            print(f"   ⚠️  一般 - 系统性能需要改进")
        else:
            print(f"   🚨 较差 - 系统性能存在严重问题")
        
        if perf['average_response_time'] <= 5:
            print(f"   ⚡ 响应速度: 快速")
        elif perf['average_response_time'] <= 15:
            print(f"   🏃 响应速度: 正常")
        else:
            print(f"   🐌 响应速度: 偏慢")
        
        print("=" * 60)
    
    def save_results(self, report: Dict[str, Any]):
        """保存测试结果"""
        try:
            with open(self.config.RESULTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            logger.info(f"📁 测试结果已保存到: {self.config.RESULTS_FILE}")
        except Exception as e:
            logger.error(f"❌ 保存结果文件失败: {e}")

def signal_handler(signum, frame):
    """信号处理器"""
    print("\n⏹️ 接收到中断信号，正在停止测试...")
    sys.exit(0)

async def main():
    """主函数"""
    # 注册信号处理器
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("🚀 sendChatMessage() 压力测试工具")
    print("=" * 60)
    print("此工具将对 iChat 系统的 sendChatMessage 函数进行压力测试")
    print("使用100个不相关的问题，40秒超时，计算成功率")
    print("=" * 60)
    
    # 创建配置和测试器
    config = StressTestConfig()
    tester = SendChatMessageStressTester(config)
    
    # 加载测试问题
    if not tester.load_questions():
        logger.error("❌ 无法加载测试问题，测试终止")
        return
    
    print(f"📝 已加载 {len(tester.questions)} 个测试问题")
    print("🔄 开始执行压力测试...")
    
    try:
        # 运行压力测试
        report = await tester.run_stress_test()
        
        # 打印结果
        tester.print_summary(report)
        
        # 保存结果
        tester.save_results(report)
        
    except KeyboardInterrupt:
        print("\n⏹️ 测试被用户中断")
    except Exception as e:
        logger.error(f"❌ 测试执行失败: {e}")

if __name__ == "__main__":
    # 运行异步主函数
    asyncio.run(main())
