from flask import request, jsonify
from services.chat_service import process_chat_prompt

from routes import bp  # 使用共享的Blueprint

# bp = Blueprint('chat', __name__)

@bp.route('/chat', methods=['POST'])
def chat():
    """处理聊天请求"""
    data = request.get_json()
    
    # 验证输入数据
    if not data or 'prompt' not in data:
        return jsonify({"status": "error", "message": "缺少提示信息"}), 400
    
    prompt = data['prompt']
    scene_id = data.get('scene_id')  # 支持可选的scene_id参数
    
    # 调用服务处理聊天逻辑
    response = process_chat_prompt(prompt, scene_id)
    
    return jsonify(response)