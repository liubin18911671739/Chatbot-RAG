from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    # 配置数据库连接
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:password@localhost:3306/rag'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    # Load configuration
    app.config.from_object('app.config.Config')

    # 在app/__init__.py或config.py中添加
    app.config['OLLAMA_URL'] = os.environ.get('OLLAMA_URL', 'http://localhost:11434')
    app.config['MODEL_NAME'] = os.environ.get('MODEL_NAME', 'deepseek-r1:1.5b')

    # Register blueprints
    from .api import api as api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api')

    return app