#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DeepSeek问题生成器
用于生成100个完全不相关的问题用于压力测试
"""

import requests
import json
import time
import random

class DeepSeekQuestionGenerator:
    def __init__(self):
        self.api_url = "https://api.deepseek.com/v1/chat/completions"
        # 注意：这里需要您的实际API密钥
        self.api_key = "sk-8aee1f222a834f1290a7fa365d498bb2"  # 请替换为您的实际API密钥
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
    def generate_questions_batch(self, count=100):
        """生成指定数量的问题"""
        questions = []
        
        # 不同类型的问题提示，确保问题多样性
        question_prompts = [
            "生成10个关于科学技术的问题，每个问题一行，不要编号：",
            "生成10个关于历史文化的问题，每个问题一行，不要编号：",
            "生成10个关于日常生活的问题，每个问题一行，不要编号：",
            "生成10个关于自然环境的问题，每个问题一行，不要编号：",
            "生成10个关于艺术娱乐的问题，每个问题一行，不要编号：",
            "生成10个关于健康医疗的问题，每个问题一行，不要编号：",
            "生成10个关于教育学习的问题，每个问题一行，不要编号：",
            "生成10个关于经济商业的问题，每个问题一行，不要编号：",
            "生成10个关于体育运动的问题，每个问题一行，不要编号：",
            "生成10个关于旅游地理的问题，每个问题一行，不要编号："
        ]
        
        for i, prompt in enumerate(question_prompts):
            print(f"正在生成第{i+1}批问题...")
            try:
                batch_questions = self._call_deepseek_api(prompt)
                questions.extend(batch_questions)
                print(f"第{i+1}批生成了{len(batch_questions)}个问题")
                
                # 添加延迟避免API限制
                time.sleep(2)
                
            except Exception as e:
                print(f"第{i+1}批问题生成失败: {e}")
                # 如果API调用失败，使用备用问题
                fallback_questions = self._generate_fallback_questions(i)
                questions.extend(fallback_questions)
                
        return questions[:count]  # 确保返回指定数量的问题
    
    def _call_deepseek_api(self, prompt):
        """调用DeepSeek API"""
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        response = requests.post(
            self.api_url, 
            headers=self.headers, 
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content']
            # 解析问题列表
            questions = [q.strip() for q in content.split('\n') if q.strip() and not q.strip().isdigit()]
            return questions
        else:
            raise Exception(f"API调用失败: {response.status_code} - {response.text}")
    
    def _generate_fallback_questions(self, batch_index):
        """生成备用问题（当API调用失败时使用）"""
        fallback_questions_sets = [
            # 科学技术
            [
                "人工智能的发展前景如何？",
                "量子计算的工作原理是什么？",
                "基因编辑技术有哪些应用？",
                "5G网络的优势在哪里？",
                "新能源汽车的发展趋势如何？",
                "区块链技术如何应用？",
                "虚拟现实技术的未来发展？",
                "机器学习算法有哪些类型？",
                "云计算的安全性如何保证？",
                "物联网技术的应用场景有哪些？"
            ],
            # 历史文化
            [
                "古代丝绸之路的历史意义是什么？",
                "文艺复兴对欧洲的影响如何？",
                "中国古代四大发明有哪些？",
                "埃及金字塔是如何建造的？",
                "古希腊哲学对现代思想的影响？",
                "中华传统文化的核心价值观是什么？",
                "世界文化遗产保护的重要性？",
                "古代文明交流的方式有哪些？",
                "传统节日的文化内涵是什么？",
                "书法艺术的历史发展脉络？"
            ],
            # 日常生活
            [
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
            ],
            # 自然环境
            [
                "全球气候变化的主要原因？",
                "生物多样性保护的重要性？",
                "可再生能源有哪些类型？",
                "森林砍伐对环境的影响？",
                "海洋污染的主要来源？",
                "如何减少碳足迹？",
                "野生动物保护的措施有哪些？",
                "水资源短缺的解决方案？",
                "垃圾分类的意义是什么？",
                "空气质量对健康的影响？"
            ],
            # 艺术娱乐
            [
                "音乐对人类情感的影响？",
                "电影艺术的发展历程？",
                "绘画技法的基本要素？",
                "舞蹈的文化表达形式？",
                "文学作品的社会价值？",
                "戏剧表演的艺术特色？",
                "雕塑艺术的发展演变？",
                "摄影构图的基本原则？",
                "设计美学的核心理念？",
                "民间艺术的传承意义？"
            ],
            # 健康医疗
            [
                "预防疾病的基本措施？",
                "心理健康的重要性？",
                "运动对身体的益处？",
                "营养均衡的重要性？",
                "睡眠质量如何改善？",
                "慢性病的预防方法？",
                "医疗技术的最新发展？",
                "中医养生的基本理念？",
                "疫苗接种的重要性？",
                "急救知识的基本内容？"
            ],
            # 教育学习
            [
                "终身学习的重要性？",
                "有效学习方法有哪些？",
                "在线教育的优势和挑战？",
                "批判性思维如何培养？",
                "创新能力的培养途径？",
                "语言学习的有效策略？",
                "职业技能的发展规划？",
                "教育公平的实现路径？",
                "素质教育的核心内容？",
                "学习动机的激发方法？"
            ],
            # 经济商业
            [
                "市场经济的基本特征？",
                "创业成功的关键因素？",
                "电子商务的发展趋势？",
                "供需关系对价格的影响？",
                "投资理财的基本知识？",
                "企业管理的核心要素？",
                "国际贸易的发展现状？",
                "数字经济的特点？",
                "品牌建设的重要性？",
                "消费者权益如何保护？"
            ],
            # 体育运动
            [
                "运动对身心健康的作用？",
                "奥林匹克精神的内涵？",
                "团队运动的价值意义？",
                "体育锻炼的科学方法？",
                "运动损伤的预防措施？",
                "体育产业的发展前景？",
                "运动营养的基本知识？",
                "体育教育的重要作用？",
                "运动康复的基本原理？",
                "体育精神对人格的影响？"
            ],
            # 旅游地理
            [
                "可持续旅游的发展理念？",
                "世界著名景点的特色？",
                "地理环境对文化的影响？",
                "旅游规划的基本原则？",
                "文化旅游的发展意义？",
                "生态旅游的保护作用？",
                "旅游业对经济的贡献？",
                "气候对旅游的影响？",
                "旅游安全的注意事项？",
                "地方特色文化的保护？"
            ]
        ]
        
        if batch_index < len(fallback_questions_sets):
            return fallback_questions_sets[batch_index]
        else:
            # 如果超出范围，随机选择一组
            return random.choice(fallback_questions_sets)
    
    def save_questions_to_file(self, questions, filename="prompt.txt"):
        """将问题保存到文件"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                for i, question in enumerate(questions, 1):
                    f.write(f"{question}\n")
            print(f"✅ 成功保存{len(questions)}个问题到 {filename}")
            return True
        except Exception as e:
            print(f"❌ 保存文件失败: {e}")
            return False

def main():
    """主函数"""
    print("🚀 开始生成压力测试问题...")
    print("=" * 50)
    
    generator = DeepSeekQuestionGenerator()
    
    # 检查API密钥
    if generator.api_key == "YOUR_DEEPSEEK_API_KEY":
        print("⚠️  警告：未设置DeepSeek API密钥，将使用备用问题生成方案")
        print("如需使用DeepSeek API，请在脚本中设置您的API密钥")
        print("使用备用问题生成方案...")
        
        # 使用备用方案生成问题
        questions = []
        for i in range(10):
            batch_questions = generator._generate_fallback_questions(i)
            questions.extend(batch_questions)
        
        questions = questions[:100]  # 确保100个问题
    else:
        # 使用API生成问题
        questions = generator.generate_questions_batch(100)
    
    if questions:
        # 保存到文件
        success = generator.save_questions_to_file(questions, "prompt.txt")
        
        if success:
            print("\n📊 问题生成统计:")
            print(f"   总问题数: {len(questions)}")
            print(f"   文件路径: prompt.txt")
            print("\n✨ 问题示例:")
            for i, question in enumerate(questions[:5], 1):
                print(f"   {i}. {question}")
            print("   ...")
            print(f"   {len(questions)}. {questions[-1]}")
        else:
            print("❌ 文件保存失败")
    else:
        print("❌ 问题生成失败")

if __name__ == "__main__":
    main()
