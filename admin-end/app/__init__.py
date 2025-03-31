from flask import Flask, redirect, url_for, render_template
from flask_login import current_user
from config import Config
from .extensions import db, login_manager, bootstrap, csrf

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 初始化所有扩展
    bootstrap.init_app(app)
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    
    # 创建所有数据库表 - 应用上下文中执行
    with app.app_context():
        db.create_all()
    
    # 加载用户加载器
    @login_manager.user_loader
    def load_user(user_id):
        from .models.user import User
        return User.query.get(int(user_id))
    
    # 添加根路径重定向
    @app.route('/')
    def index():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard.index'))  # 确保 dashboard.index 不会重定向回 `/`
        else:
            return redirect(url_for('auth.login'))  # 确保 auth.login 不会重定向回 `/`
        
    # 添加登录路径重定向
    @app.route('/login')
    def login_redirect():
        return redirect(url_for('auth.login'))
    
    # 临时路由：直接访问登录页面，绕过重定向
    @app.route('/direct-login')
    def direct_login():
        return render_template('auth/login.html')
    
    # 注册所有蓝图
    from .views.dashboard import dashboard
    app.register_blueprint(dashboard)
    
    from .views.documents import documents
    app.register_blueprint(documents, url_prefix='/documents')
    
    from .views.logs import logs
    app.register_blueprint(logs, url_prefix='/logs')
    
    from .views.users import users
    app.register_blueprint(users, url_prefix='/users')
    
    from .auth import auth
    app.register_blueprint(auth, url_prefix='/auth')
    
    return app