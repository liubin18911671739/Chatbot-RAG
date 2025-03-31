# backend/config.py

import os

class Config:
    """基本配置类"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or '你应该更改这个密钥'
    DEBUG = os.environ.get('DEBUG', 'False').lower() in ['true', '1']
    
    # 数据库配置
    # SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'mysql+pymysql://user:password@localhost/db_name'
    # SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 其他配置
    RAG_SERVICE_URL = os.environ.get('RAG_SERVICE_URL') or 'http://localhost:8000'
    MAX_CHAT_HISTORY = 10  # 最大聊天记录数

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}