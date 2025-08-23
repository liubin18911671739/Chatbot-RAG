from flask import jsonify
import requests
import json
from routes import bp  # 使用共享的Blueprint



@bp.route('/suggestions', methods=['GET'])
def get_suggestions():
    """获取建议列表 - 代理转发到目标API服务器"""
    
    try:
        # 调用 suggestions API
        BASE_URL = "http://10.10.15.210:5001"
        response = requests.get(f"{BASE_URL}/api/suggestions", timeout=10)
        
        # 检查响应状态码
        if response.status_code == 200:
            print("API 调用成功!")
            print("响应状态码:", response.status_code)
            return jsonify(response.json())
        else:
            print("错误信息:", response.text)
            return jsonify({
                "status": "error",
                "message": f"API调用失败: {response.status_code}",
                "suggestions": []
            }), response.status_code
            
    except requests.exceptions.ConnectionError:
        print("连接错误: 无法连接到服务器")
        return jsonify({
            "status": "error", 
            "message": "无法连接到建议服务器",
            "suggestions": []
        }), 503
    except requests.exceptions.Timeout:
        print("请求超时")
        return jsonify({
            "status": "error",
            "message": "请求超时",
            "suggestions": []
        }), 408
    except requests.exceptions.RequestException as e:
        print(f"请求异常: {e}")
        return jsonify({
            "status": "error",
            "message": f"请求异常: {str(e)}",
            "suggestions": []
        }), 500
    except json.JSONDecodeError:
        print("响应不是有效的 JSON 格式")
        return jsonify({
            "status": "error",
            "message": "服务器响应格式错误",
            "suggestions": []
        }), 500