from flask import request, jsonify
from routes import bp  # 使用共享的Blueprint
import requests
import json, re
from google import genai
from google.genai import types

@bp.route('/chat', methods=['POST'])
def chat():
    """处理聊天请求"""
    data = request.get_json()
    
    # 输出调试信息
    print(f"收到聊天请求: {data}")
      # 验证输入数据
    if not data or 'prompt' not in data:
        print("错误: 缺少prompt字段")
        return jsonify({"status": "error", "message": "缺少提示信息"}), 400
    
    prompt = data['prompt']
    scene_id = data.get('scene_id')  # 支持可选的scene_id参数
    
    response = requests.post(
        "http://10.10.15.210:5000/api/chat",
        json={
            "prompt": prompt,
            "scene_id": scene_id
        },
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    
    if response.status_code == 200:
        try:
            response_data = response.json()
            if "response" in response_data:
                response_withoutthink = re.sub(
                    r'<深度思考>[\s\S]*?</深度思考>', '', response_data["response"]
                )
                cleaned_response = re.sub(r'\n{3,}', '\n\n', response_withoutthink).strip()
                return jsonify({
                    "status": "success",
                    "response": cleaned_response,
                    "attachment_data": [],
                    "special_note": ""
                })
            else:
                print("警告: 响应中缺少 'response' 字段")
                # 如果主API响应格式不正确，使用备用API
                api_response = call_gemini_api(prompt, scene_id)
                return jsonify({
                    "status": "success",
                    "response": api_response,
                    "attachment_data": [],
                    "special_note": ""
                })
        except json.JSONDecodeError:
            print("警告: 主API响应不是有效的JSON格式")
            # 如果主API响应不是JSON，使用备用API
            api_response = call_gemini_api(prompt, scene_id)
            return jsonify({
                "status": "success",
                "response": api_response,
                "attachment_data": [],
                "special_note": ""
            })
    else:     
        try:
            # 调用 Gemini API 获取回答
            api_response = call_gemini_api(prompt, scene_id)
            
            # 构建响应
            response = {
                "status": "success",
                "response": api_response,
                "attachment_data": [],
                "special_note": ""
            }
            
            print(f"返回响应: {response}")
            return jsonify(response)
        except Exception as e:
            print(f"处理聊天请求时出错: {str(e)}")
            return jsonify({"status": "error", "message": "处理请求时出错"}), 500

def call_gemini_api(prompt, scene_id=None):
    """调用 Gemini API 获取回答"""
    # 调试模式：返回精简版回答，避免实际调用API
    # debug_mode = False  # 设置为True开启调试模式
    
    # if debug_mode:
    #     print(f"调试模式: 跳过API调用，返回精简回答")
    #     return f"精简调试回答: 您问了关于'{prompt[:30]}...'的问题。场景ID: {scene_id or '默认'}"
    
    # # Gemini API 配置
    # try:
    #     client = genai.Client(api_key="AIzaSyAZqjyE7wN3Mh81S-bfITb98lA0SISANBY")  # 请替换为实际的 API Key
        
    #     # 根据场景 ID 可以添加不同的系统提示词
    #     system_instruction = "你是高校的AI助手，请对问题提供的详细答案，如果不知道就回答不知道，不要进行推理和联想。"
    #     if scene_id:
    #         # 可以根据不同场景定制系统提示词
    #         scene_prompts = {
    #             "db_sizheng": "你是北京第二外国语学院的思政学习助手，请提供准确的思政知识。",
    #             "db_xuexizhidao": "你是北京第二外国语学院的学习指导助手，请提供有效的学习方法指导。",
    #             "db_zhihuisizheng": "你是北京第二外国语学院的智慧思政助手，请解答思政相关问题。",
    #             "db_keyanfuzhu": "你是北京第二外国语学院的科研辅助助手，请提供科研方法和学术写作指导。",
    #             "db_wangshangbanshiting": "你是北京第二外国语学院的8001助手，请提供校园事务办理指南。"
    #         }
    #         if scene_id in scene_prompts:
    #             system_instruction = scene_prompts[scene_id]
        
    #     # 构建对话内容
    #     conversation_content = ""
        
    #     # 添加当前用户问题
    #     conversation_content += f"用户: {prompt}"
    #       # 调用 Gemini API
    #     response = client.models.generate_content(
    #         model="gemini-2.0-flash",
    #         config=types.GenerateContentConfig(
    #             system_instruction=system_instruction,
    #             temperature=0.3,
    #             max_output_tokens=2000
    #         ),
    #         contents=conversation_content
    #     )
        
    #     return response.text.strip()  # 返回回答内容，去除首尾空格
        
    # except Exception as e:
    #     print(f"Gemini API 错误: {str(e)}")
    #     raise Exception(f"Gemini API 错误: {str(e)}")

    # # 以下是原来的 DeepSeek API 实现（已注释）
    api_key = "sk-8aee1f222a834f1290a7fa365d498bb2"
    api_url = "https://api.deepseek.com/v1/chat/completions"
    
    # 根据场景 ID 可以添加不同的系统提示词
    system_message = "你是北京第二外国语学院的AI助手，请提供简要的回答。"
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
            system_message = scene_prompts[scene_id]
    
    # 构建消息列表
    messages = [
        {"role": "system", "content": system_message}
    ]
    
    # 添加当前用户问题
    messages.append({"role": "user", "content": prompt})
    
    # 构建请求数据
    payload = {
        "model": "deepseek-chat",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    # 设置请求头
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    # 发送请求
    response = requests.post(api_url, headers=headers, json=payload)
    response_data = response.json()
    
    # 检查响应
    if response.status_code != 200:
        error_message = response_data.get('error', {}).get('message', '未知错误')
        print(f"DeepSeek API 错误: {error_message}")
        raise Exception(f"DeepSeek API 错误: {error_message}")
    
    # 提取回答内容
    try:
        answer = response_data['choices'][0]['message']['content']
        return answer
    except (KeyError, IndexError) as e:
        print(f"解析 DeepSeek API 响应时出错: {str(e)}")
        print(f"响应内容: {response_data}")
        raise Exception("无法解析 DeepSeek API 响应")

# 测试主函数
def main():
    """测试 call_gemini_api 函数"""
    print("🚀 开始测试 Gemini API 调用...\n")
    
    # 测试用例
    test_cases = [
        {
            "prompt": "你好，请简单介绍一下北京第二外国语学院",
            "scene_id": None,
            "history": []
        },
        {
            "prompt": "什么是人工智能？",
            "scene_id": "db_xuexizhidao",
            "history": [
                {"user": "你好", "assistant": "您好！我是北京第二外国语学院的AI助手"}
            ]
        },
        {
            "prompt": "党政办公室综合事务的办公室是？",
            "scene_id": "db_wangshangbanshiting",
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
            print(f"回答长度: {len(result)} 字符")
            print(f"回答内容: {result[:100]}...")
            
        except Exception as e:
            print(f"❌ 测试失败: {str(e)}")
        
        print("-" * 50)
    
    print("🏁 测试完成!")

if __name__ == "__main__":
    main()