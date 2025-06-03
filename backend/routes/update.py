"""
问题更新路由模块
提供更新问题答案和状态的RESTful API接口
"""

from flask import request, jsonify
from routes import bp
import requests

# 目标API基础URL
BASE_URL = "http://10.10.15.210:5001/api"

@bp.route('/update/<int:question_id>', methods=['PUT'])
def update_question(question_id):
    """
    更新问题的答案内容和状态
    
    参数:
    - question_id: 问题ID
    
    请求体JSON:
    {
        "question": "什么是Python?",      # 可选，问题内容
        "answer": "python是一种编程语言",  # 可选，答案内容
        "userid": "user6",              # 可选，用户ID
        "status": "reviewed"            # 可选，审核状态 (reviewed/unreview)
    }
    """
    try:
        data = request.get_json()
        
        # 验证输入数据
        if not data:
            return jsonify({
                "status": "error",
                "message": "请求数据不能为空"
            }), 400
        
        # 构建更新数据，只包含提供的字段
        update_data = {}
        
        # 检查并添加各个字段
        if 'question' in data:
            question = data['question'].strip() if data['question'] else ""
            if question:
                update_data['question'] = question
        
        if 'answer' in data:
            answer = data['answer'].strip() if data['answer'] else ""
            if answer:
                update_data['answer'] = answer
        
        if 'userid' in data:
            userid = data['userid'].strip() if data['userid'] else ""
            if userid:
                update_data['userid'] = userid
        
        if 'status' in data:
            status = data['status'].strip() if data['status'] else ""
            # 验证状态值
            valid_statuses = ['reviewed', 'unreview']
            if status and status in valid_statuses:
                update_data['status'] = status
            elif status and status not in valid_statuses:
                return jsonify({
                    "status": "error",
                    "message": f"无效的状态值。允许的状态: {', '.join(valid_statuses)}"
                }), 400
        
        # 检查是否有数据需要更新
        if not update_data:
            return jsonify({
                "status": "error",
                "message": "没有有效的数据需要更新"
            }), 400
        
        print(f"更新问题ID: {question_id}, 更新数据: {update_data}")
        
        try:
            # 调用目标API更新问题
            response = requests.put(f"{BASE_URL}/update/{question_id}", json=update_data, timeout=30)
            
            print(f"目标API响应状态码: {response.status_code}")
            print(f"目标API响应内容: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"成功更新问题: {result}")
                
                return jsonify({
                    "status": "success",
                    "message": "问题更新成功",
                    "data": result
                }), 200
                
            elif response.status_code == 404:
                return jsonify({
                    "status": "error",
                    "message": "问题不存在"
                }), 404
                
            else:
                print(f"API更新失败: {response.status_code}, {response.text}")
                return jsonify({
                    "status": "error",
                    "message": f"API更新失败: {response.status_code}",
                    "error": response.text
                }), response.status_code
                
        except requests.exceptions.ConnectionError:
            print("连接目标API服务器失败")
            return jsonify({
                "status": "error",
                "message": "无法连接到目标API服务器"
            }), 503
            
        except requests.exceptions.Timeout:
            print("请求目标API超时")
            return jsonify({
                "status": "error",
                "message": "请求超时"
            }), 504
        
    except Exception as e:
        print(f"更新问题时发生错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "更新问题失败",
            "error": str(e)
        }), 500


@bp.route('/update', methods=['PUT'])
def update_question_without_id():
    """
    处理没有提供ID的更新请求
    """
    return jsonify({
        "status": "error",
        "message": "请在URL中提供问题ID，例如: /api/update/123"
    }), 400
