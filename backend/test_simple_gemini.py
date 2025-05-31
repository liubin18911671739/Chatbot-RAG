#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的 Gemini API 测试
"""

print("🚀 开始简单测试...")

try:
    from google import genai
    from google.genai import types
    print("✅ 成功导入 google.genai")
    
    # 创建客户端
    client = genai.Client(api_key="AIzaSyAZqjyE7wN3Mh81S-bfITb98lA0SISANBY")
    print("✅ 成功创建客户端")
      # 简单测试
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        config=types.GenerateContentConfig(
            system_instruction="你是一个友好的助手。",
            temperature=0.7,
            max_output_tokens=100
        ),
        contents="你好，请说Hello World"
    )
    
    print("✅ 成功调用 API")
    print(f"回答: {response.text}")
    
except ImportError as e:
    print(f"❌ 导入错误: {e}")
except Exception as e:
    print(f"❌ API 调用错误: {e}")

print("🏁 测试完成!")
