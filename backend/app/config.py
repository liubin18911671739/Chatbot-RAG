import os
from datetime import timedelta
from pathlib import Path

class Config:
    """基础配置类"""
    # 安全配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change-in-production'
    
    # 数据库配置
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # 使用MySQL替代SQLite
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'mysql+pymysql://robin:Robin123@localhost/news_system'
    
    # MongoDB配置
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/news_system'
    
    # JWT配置
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # 应用配置
    LANGUAGES = ['zh', 'en', 'fr', 'es', 'de', 'ar']
    DEFAULT_LANGUAGE = 'zh'
    
    # 爬虫配置
    CRAWLER_INTERVAL = 3600  # 爬虫运行间隔（秒）
    CRAWLER_CONCURRENCY = 3  # 爬虫并发数
    
    # 缓存配置
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300
    
    # 其他配置
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 最大上传文件大小：10MB

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    SQLALCHEMY_ECHO = True

class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    
    # 在生产环境中，务必设置环境变量以提供这些值
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'production-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'mysql+pymysql://user:password@localhost/multilingual_news_prod'
    MONGO_URI = os.environ.get('MONGO_URI')
    
    # 生产环境额外安全设置
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True

# 配置映射字典
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}