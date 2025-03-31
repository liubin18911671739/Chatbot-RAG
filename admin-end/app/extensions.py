from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bootstrap import Bootstrap
from flask_wtf.csrf import CSRFProtect

db = SQLAlchemy()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'  # 确保登录视图正确配置
login_manager.login_message = '请先登录以访问此页面'
login_manager.login_message_category = 'warning'
bootstrap = Bootstrap()
csrf = CSRFProtect()