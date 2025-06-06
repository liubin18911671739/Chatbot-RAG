from flask import jsonify
from routes import bp

@bp.route('/health', methods=['GET'])
def health_check():
    """API健康检查端点"""
    return jsonify({
        'status': 'ok',
        'message': 'API服务正常运行'
    }), 200

@bp.route('/greeting', methods=['GET'])
def greeting():
    """获取问候语"""
    greeting_text = "你好！我是棠心问答AI辅导员，随时为你提供帮助～可以解答思想困惑、学业指导、心理调适等成长问题，也能推荐校园资源。请随时告诉我你的需求，我会用AI智慧陪伴你成长！✨"
    return jsonify({"status": "success", "greeting": greeting_text})