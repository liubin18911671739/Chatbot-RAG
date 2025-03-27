from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import config
import os

# 创建全局的数据库对象
db = SQLAlchemy()

def create_app(config_name='default'):
    """创建Flask应用实例"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # 初始化数据库
    db.init_app(app)
    
    # 初始化CORS
    CORS(app)
    
    # 确保上传文件夹存在
    upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    
    # 注册蓝图
    from .api.rag_agent import rag_agent_bp
    app.register_blueprint(rag_agent_bp, url_prefix='/api')
    
    from .admin.routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/admin')
    
    return app