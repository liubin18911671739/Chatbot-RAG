"""
问题管理路由模块
提供问题列表的RESTful API接口
"""

from flask import request, jsonify
from routes import bp
import requests
import json

# 目标API基础URL
BASE_URL = "http://10.10.15.210:5001"

@bp.route('/questions', methods=['GET'])
def get_questions():
    """
    获取问题列表 - 代理转发到目标API服务器
    """
    try:
      
        # 转发请求到目标API服务器
        response = requests.get(f"{BASE_URL}/api/questions")
        
        print(f"目标API响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            print("API 调用成功!")
            print("响应状态码:", response.status_code)
            print("响应内容:", response.json())
            return json.dumps(response.json(), indent=2, ensure_ascii=False)
        else:
            print(f"目标API返回错误: {response.status_code}")
            return jsonify({
                "status": "error",
                "message": f"目标API返回错误: {response.status_code}",
                "qas": []
            }), response.status_code
            
    except requests.exceptions.ConnectionError:
        print("连接目标API服务器失败")
        return jsonify({
            "status": "error",
            "message": "无法连接到目标API服务器",
            "qas": []
        }), 503