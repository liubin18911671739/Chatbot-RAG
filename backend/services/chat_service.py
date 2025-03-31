# backend/services/chat_service.py

from flask import jsonify
from .rag_service import generate_response

def process_chat_prompt(prompt, scene_id=None):
    """
    处理聊天请求，并返回生成的回复
    
    Args:
        prompt (str): 用户输入的问题
        scene_id (str, optional): 场景ID
    
    Returns:
        dict: 包含响应信息的字典
    """
    # 调用RAG服务生成响应
    response = generate_response(prompt, scene_id)
    return response

def process_chat(prompt):
    """处理用户输入的聊天提示并生成响应"""
    if not prompt:
        return jsonify({"status": "error", "message": "提示不能为空"}), 400

    # 调用 RAG 模型服务生成响应
    response = process_chat_prompt(prompt)

    return jsonify({
        "status": "success",
        "response": response
    })