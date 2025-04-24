from flask import Blueprint, jsonify
from routes import bp

# bp = Blueprint('scenes', __name__)


@bp.route('/scenes', methods=['GET'])
def get_scenes():
    """获取场景列表"""
    scenes = {
        "学习指导": {
            "description": "学习方法与指导服务",
            "icon": "📖",
            "id": "db_xuexizhidao",
            "status": "developing"
        },
        "思政学习空间": {
            "description": "思想政治教育资源",
            "icon": "📚",
            "id": "db_sizheng",
            "status": "available"
        },
        "智慧思政": {
            "description": "智能化思政教育平台",
            "icon": "💡",
            "id": "db_zhihuisizheng",
            "status": "developing"
        },
        "科研辅助": {
            "description": "科研工作辅助服务",
            "icon": "🔬",
            "id": "db_keyanfuzhu",
            "status": "developing"
        },
        "8001": {
            "description": "在线办事服务平台",
            "icon": "🏢",
            "id": "db_wangshangbanshiting",
            "status": "developing"
        },
        "通用助手": {
            "description": "棠心问答通用助手",
            "icon": "🎓",
            "id": None,
            "status": "available"
        }
    }
    return jsonify({"status": "success", "scenes": scenes})


