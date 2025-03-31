from flask import request, jsonify
from routes import bp

# bp = Blueprint('feedback', __name__)

@bp.route('/feedback', methods=['POST'])
def feedback():
    """处理用户反馈"""
    data = request.get_json()
    
    # 这里可以添加逻辑来处理反馈，例如保存到数据库或发送到消息队列
    # 目前只是返回成功消息
    return jsonify({"status": "success", "message": "感谢您的反馈"})