from flask import jsonify
from routes import bp

# bp = Blueprint('greeting', __name__)

@bp.route('/greeting', methods=['GET'])
def greeting():
    """获取问候语"""
    greeting_text = "欢迎使用我们的QA系统!"
    return jsonify({"status": "success", "greeting": greeting_text})