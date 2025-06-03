from flask import request, jsonify
from routes import bp
import requests

# 目标API基础URL
BASE_URL = "http://10.10.15.210:5001/api"

@bp.route('/insert', methods=['POST'])
def insert_question():
    """处理问题插入请求，包含查重功能"""
    try:
        data = request.get_json()
        
        # 验证输入数据
        if not data:
            return jsonify({
                "status": "error",
                "message": "请求数据不能为空"
            }), 400
        
        # 验证必填字段
        required_fields = ['question', 'answer', 'userid']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "status": "error",
                    "message": f"缺少必填字段: {field}"                }), 400
        
        question = data['question'].strip()
        answer = data['answer'].strip()
        userid = data['userid'].strip()
          # 根据用户类型设置默认状态
        if 'status' not in data:
            # 如果没有提供status，根据用户类型设置默认值
            if userid == "admin":
                status = 'reviewed'  # 管理员插入的内容默认为已审核
            else:
                status = 'unreviewed'  # 普通用户插入的内容默认为未审核
        else:
            status = data['status'].strip()
        
        # 验证状态值
        valid_statuses = ['reviewed', 'unreviewed', 'unreview']  # 兼容多种拼写
        if status not in valid_statuses:
            return jsonify({
                "status": "error",
                "message": f"无效的状态值。允许的状态: reviewed, unreviewed"
            }), 400
        
        # 统一状态值格式（将unreview转换为unreviewed）
        if status == 'unreview':
            status = 'unreviewed'
        
        # 查重检查 - 使用search.py中的函数检查是否已存在相同问题
        from .search import find_question_by_text
        duplicate_question = find_question_by_text(question)
        if duplicate_question:
            return jsonify({
                "status": "error",
                "message": "问题已存在",
                "duplicate_id": duplicate_question['id'],
                "existing_question": duplicate_question['question']
            }), 409
        
        # 通过API插入新问题
        insert_data = {
            "question": question,
            "answer": answer,
            "userid": userid,
            "status": status
        }
        
        try:
            # 调用目标API插入问题
            print(f"向目标API插入问题: {insert_data}")
            response = requests.post(f"{BASE_URL}/insert", json=insert_data)
            
            if response.status_code == 201:
                result = response.json()
                print(f"成功插入新问题到API: {result}")
                return jsonify(result), 201
            else:
                print(f"API插入失败: {response.status_code}, {response.text}")
                return jsonify({
                    "status": "error",
                    "message": f"API插入失败: {response.status_code}",
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
        print(f"插入问题时发生错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "插入问题失败",
            "error": str(e)
        }), 500