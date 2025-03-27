from flask import Blueprint
from app.api.search import search_bp
from app.api.news import news_bp

# 创建主API蓝图
api_bp = Blueprint('api', __name__, url_prefix='/api')

# 注册搜索蓝图
api_bp.register_blueprint(search_bp)

# 注册新闻蓝图
api_bp.register_blueprint(news_bp)

def init_app(app):
    """初始化API蓝图"""
    app.register_blueprint(api_bp)