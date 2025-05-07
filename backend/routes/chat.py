from flask import request, jsonify
from routes import bp  # 使用共享的Blueprint
import requests
import json

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
    history = data.get('history', [])  # 获取历史对话，如果没有则为空列表
    
    try:
        # 调用 DeepSeek API 获取回答
        api_response = call_deepseek_api(prompt, scene_id, history)
        
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

def call_deepseek_api(prompt, scene_id=None, history=None):
    """调用 DeepSeek API 获取回答"""
    # 调试模式：返回精简版回答，避免实际调用API
    debug_mode = False  # 设置为True开启调试模式
    
    if debug_mode:
        print(f"调试模式: 跳过API调用，返回精简回答")
        return f"精简调试回答: 您问了关于'{prompt[:30]}...'的问题。场景ID: {scene_id or '默认'}"
    
    api_key = "sk-8aee1f222a834f1290a7fa365d498bb2"
    api_url = "https://api.deepseek.com/v1/chat/completions"
    
    # 根据场景 ID 可以添加不同的系统提示词
    system_message = "你是北京第二外国语学院的AI助手，请提供简要的回答。"
    # if scene_id:
    #     # 可以根据不同场景定制系统提示词
    #     scene_prompts = {
    #         "db_sizheng": "你是北京第二外国语学院的思政学习助手，请提供准确的思政知识。",
    #         "db_xuexizhidao": "你是北京第二外国语学院的学习指导助手，请提供有效的学习方法指导。",
    #         "db_zhihuisizheng": "你是北京第二外国语学院的智慧思政助手，请解答思政相关问题。",
    #         "db_keyanfuzhu": "你是北京第二外国语学院的科研辅助助手，请提供科研方法和学术写作指导。",
    #         "db_wangshangbanshiting": "你是北京第二外国语学院的8001助手，请提供校园事务办理指南。"
    #     }
    #     if scene_id in scene_prompts:
    #         system_message = scene_prompts[scene_id]
    
    # 构建消息列表
    messages = [
        {"role": "system", "content": system_message}
    ]
    
    # 添加历史消息（如果有）
    if history and isinstance(history, list):
        for msg in history:
            if 'user' in msg and msg['user']:
                messages.append({"role": "user", "content": msg['user']})
            if 'assistant' in msg and msg['assistant']:
                messages.append({"role": "assistant", "content": msg['assistant']})
    
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