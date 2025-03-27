from flask import Flask
from app.models import db

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    db.init_app(app)

    # 注册蓝图
    from app.api.routes import api_bp
    app.register_blueprint(api_bp)

    return app