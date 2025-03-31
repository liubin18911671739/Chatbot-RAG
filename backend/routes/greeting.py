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
    greeting_text = "欢迎使用我们的QA系统!"
    return jsonify({"status": "success", "greeting": greeting_text})