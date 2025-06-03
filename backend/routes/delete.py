"""
问题删除路由模块
提供删除问题的RESTful API接口
"""

from flask import jsonify
from routes import bp
import requests

# 目标API基础URL
BASE_URL = "http://10.10.15.210:5001/api"

@bp.route('/delete/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    """
    删除指定ID的问题
    
    参数:
    - question_id: 问题ID
    
    返回:
    {
        "status": "success"
    }
    """
    try:
        print(f"删除问题ID: {question_id}")
        
        try:
            # 调用目标API删除问题
            response = requests.delete(f"{BASE_URL}/delete/{question_id}")
            
            print(f"目标API响应状态码: {response.status_code}")
            print(f"目标API响应内容: {response.text}")
            
            if response.status_code == 200:
                # 成功删除
                print(f"成功删除问题ID: {question_id}")
                return jsonify({
                    "status": "success"
                }), 200
                
            elif response.status_code == 404:
                # 问题不存在
                return jsonify({
                    "status": "error",
                    "message": "问题不存在"
                }), 404
                
            else:
                # 其他API错误
                print(f"API删除失败: {response.status_code}, {response.text}")
                return jsonify({
                    "status": "error",
                    "message": f"API删除失败: {response.status_code}",
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
        print(f"删除问题时发生错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "删除问题失败",
            "error": str(e)
        }), 500


@bp.route('/delete', methods=['DELETE'])
def delete_question_without_id():
    """
    处理没有提供ID的删除请求
    """
    return jsonify({
        "status": "error",
        "message": "请在URL中提供问题ID，例如: /api/delete/123"
    }), 400
