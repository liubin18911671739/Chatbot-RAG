#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
独立测试 Gemini API 调用
"""

import os
import sys

# 添加当前目录到 Python 路径
sys.path.append(os.path.dirname(__file__))

from google import genai
from google.genai import types

def call_gemini_api(prompt, scene_id=None, history=None):
    """调用 Gemini API 获取回答"""    # 调试模式：返回精简版回答，避免实际调用API
    debug_mode = False  # 设置为True开启调试模式
    
    if debug_mode:
        print(f"调试模式: 跳过API调用，返回精简回答")
        return f"精简调试回答: 您问了关于'{prompt[:30]}...'的问题。场景ID: {scene_id or '默认'}"
    
    # Gemini API 配置
    try:
        client = genai.Client(api_key="AIzaSyAZqjyE7wN3Mh81S-bfITb98lA0SISANBY")  # 请替换为实际的 API Key
        
        # 根据场景 ID 可以添加不同的系统提示词
        system_instruction = "你是北京第二外国语学院的AI助手，请提供简要的回答。"
        if scene_id:
            # 可以根据不同场景定制系统提示词
            scene_prompts = {
                "db_sizheng": "你是北京第二外国语学院的思政学习助手，请提供准确的思政知识。",
                "db_xuexizhidao": "你是北京第二外国语学院的学习指导助手，请提供有效的学习方法指导。",
                "db_zhihuisizheng": "你是北京第二外国语学院的智慧思政助手，请解答思政相关问题。",
                "db_keyanfuzhu": "你是北京第二外国语学院的科研辅助助手，请提供科研方法和学术写作指导。",
                "db_wangshangbanshiting": "你是北京第二外国语学院的8001助手，请提供校园事务办理指南。"
            }
            if scene_id in scene_prompts:
                system_instruction = scene_prompts[scene_id]
        
        # 构建对话内容
        conversation_content = ""
        
        # 添加历史消息（如果有）
        if history and isinstance(history, list):
            for msg in history:
                if 'user' in msg and msg['user']:
                    conversation_content += f"用户: {msg['user']}\n"
                if 'assistant' in msg and msg['assistant']:
                    conversation_content += f"助手: {msg['assistant']}\n"
        
        # 添加当前用户问题
        conversation_content += f"用户: {prompt}"
        
        # 调用 Gemini API
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                max_output_tokens=2000
            ),
            contents=conversation_content
        )
        
        return response.text
        
    except Exception as e:
        print(f"Gemini API 错误: {str(e)}")
        raise Exception(f"Gemini API 错误: {str(e)}")

def main():
    """测试 call_gemini_api 函数"""
    print("🚀 开始测试 Gemini API 调用...\n")
    
    # 先测试导入
    try:
        from google import genai
        from google.genai import types
        print("✅ Google Generative AI 包导入成功")
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        return
    
    # 测试用例
    test_cases = [
        {
            "prompt": "你好，请简单介绍一下北京第二外国语学院",
            "scene_id": "db_xuexizhidao",
            "history": []
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"📋 测试用例 {i}:")
        print(f"提问: {test_case['prompt']}")
        print(f"场景ID: {test_case['scene_id']}")
        print(f"历史记录: {len(test_case['history'])} 条")
        
        try:
            # 调用函数
            result = call_gemini_api(
                prompt=test_case['prompt'],
                scene_id=test_case['scene_id'],
                history=test_case['history']
            )
            
            print(f"✅ 成功获取回答:")
            print(f"答案: {result}")
            print(f"回答长度: {len(result)} 字符")
            print(f"回答内容: {result[:200]}...")
            
        except Exception as e:
            print(f"❌ 测试失败: {str(e)}")
        
        print("-" * 50)
    
    print("🏁 测试完成!")

if __name__ == "__main__":
    main()
