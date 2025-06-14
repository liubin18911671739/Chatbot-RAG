#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试 chat.py 的备用API功能
验证主API失败时是否正确调用 call_gemini_api
"""

import requests
import json
import time

# 测试配置
CHAT_API_URL = "http://localhost:5000/api/chat"  # 假设这是您的chat.py运行的地址
TEST_TIMEOUT = 60

def test_chat_api():
    """测试聊天API的主API和备用API功能"""
    print("🧪 开始测试 chat.py 的备用API功能")
    print("=" * 60)
    
    # 测试用例
    test_cases = [
        {
            "name": "基本聊天测试",
            "prompt": "你好，请介绍一下北京第二外国语学院",
            "scene_id": "general"
        },
        {
            "name": "学习指导场景测试",
            "prompt": "如何提高英语口语水平？",
            "scene_id": "db_xuexizhidao"
        },
        {
            "name": "思政学习场景测试",
            "prompt": "什么是社会主义核心价值观？",
            "scene_id": "db_sizheng"
        }
    ]
    
    success_count = 0
    total_count = len(test_cases)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📋 测试 {i}/{total_count}: {test_case['name']}")
        print("-" * 50)
        print(f"📝 消息: {test_case['prompt']}")
        print(f"🏷️ 场景: {test_case['scene_id']}")
        
        try:
            # 发送请求
            print(f"🚀 发送请求到: {CHAT_API_URL}")
            start_time = time.time()
            
            response = requests.post(
                CHAT_API_URL,
                json={
                    "prompt": test_case["prompt"],
                    "scene_id": test_case["scene_id"]
                },
                headers={"Content-Type": "application/json"},
                timeout=TEST_TIMEOUT
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            print(f"📊 状态码: {response.status_code}")
            print(f"⏱️ 响应时间: {duration:.2f}秒")
            
            if response.status_code == 200:
                response_data = response.json()
                print(f"✅ 请求成功!")
                
                # 分析响应内容
                if response_data.get("status") == "success":
                    ai_response = response_data.get("response", "")
                    special_note = response_data.get("special_note", "")
                    
                    print(f"📄 响应长度: {len(ai_response)} 字符")
                    print(f"📝 响应预览: {ai_response[:100]}...")
                    
                    # 检查是否使用了备用API
                    if "备用API" in special_note:
                        print(f"🔄 使用了备用API: {special_note}")
                    else:
                        print(f"🎯 使用了主API")
                        
                    if special_note:
                        print(f"ℹ️ 特殊说明: {special_note}")
                    
                    success_count += 1
                else:
                    print(f"❌ API返回错误: {response_data.get('message', '未知错误')}")
                    
            else:
                print(f"❌ HTTP错误: {response.status_code}")
                print(f"错误内容: {response.text}")
                
        except requests.exceptions.Timeout:
            print(f"⏰ 请求超时 (>{TEST_TIMEOUT}秒)")
        except requests.exceptions.ConnectionError:
            print(f"🔌 连接错误: 无法连接到 {CHAT_API_URL}")
        except Exception as e:
            print(f"💥 测试异常: {str(e)}")
        
        # 测试间隔
        if i < total_count:
            print(f"⏳ 等待2秒后进行下一个测试...")
            time.sleep(2)
    
    # 测试结果统计
    print("\n" + "=" * 60)
    print(f"📊 测试完成! 结果统计:")
    print(f"✅ 成功: {success_count}/{total_count}")
    print(f"❌ 失败: {total_count - success_count}/{total_count}")
    print(f"📈 成功率: {(success_count/total_count*100):.1f}%")
    
    if success_count == total_count:
        print(f"🎉 所有测试都通过了！")
    else:
        print(f"⚠️ 有 {total_count - success_count} 个测试失败")

def test_api_failover():
    """专门测试API故障转移功能"""
    print("\n🔄 专项测试: API故障转移功能")
    print("=" * 60)
    
    print("ℹ️ 注意: 这个测试假设主API (http://10.10.15.210:5000) 不可用")
    print("ℹ️ 如果主API可用，这个测试可能无法验证备用API功能")
    
    test_prompt = "这是一个测试备用API的消息"
    
    try:
        print(f"🚀 发送测试消息: '{test_prompt}'")
        
        response = requests.post(
            CHAT_API_URL,
            json={"prompt": test_prompt, "scene_id": "general"},
            headers={"Content-Type": "application/json"},
            timeout=TEST_TIMEOUT
        )
        
        if response.status_code == 200:
            response_data = response.json()
            special_note = response_data.get("special_note", "")
            
            if "备用API" in special_note:
                print(f"✅ 备用API功能正常工作!")
                print(f"📝 备用API响应: {response_data.get('response', '')[:100]}...")
            else:
                print(f"ℹ️ 主API正常工作，备用API未被调用")
                print(f"📝 主API响应: {response_data.get('response', '')[:100]}...")
        else:
            print(f"❌ 请求失败: {response.status_code}")
            
    except Exception as e:
        print(f"💥 测试异常: {str(e)}")

def test_connection():
    """测试基本连接"""
    print("🔍 测试基本连接...")
    
    try:
        # 尝试连接到聊天服务
        response = requests.get(CHAT_API_URL.replace('/api/chat', '/api/greeting'), timeout=5)
        if response.status_code == 200:
            print(f"✅ 连接成功: {CHAT_API_URL}")
            return True
        else:
            print(f"⚠️ 连接异常: 状态码 {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 连接失败: {str(e)}")
        return False

def main():
    """主函数"""
    print("🚀 chat.py 备用API功能测试脚本")
    print(f"📅 测试时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 目标API: {CHAT_API_URL}")
    
    # 基本连接测试
    if not test_connection():
        print("\n❌ 基本连接失败，无法进行进一步测试")
        print("请确保:")
        print("1. 后端服务正在运行")
        print("2. API地址配置正确")
        print("3. 网络连接正常")
        return
    
    # 主要功能测试
    test_chat_api()
    
    # 故障转移测试
    test_api_failover()
    
    print(f"\n🏁 测试完成!")

if __name__ == "__main__":
    main()
