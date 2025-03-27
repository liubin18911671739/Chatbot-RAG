from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import db

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True)  # 允许为空
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.username}>"

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# 避免循环导入
def setup_login(login_manager):
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

# 创建初始管理员用户的函数 - 将在app/__init__.py中调用
def create_admin_user(app):
    """创建默认管理员用户"""
    # 使用应用上下文
    with app.app_context():
        try:
            from app.models.user import User
            from app import db
            
            admin = User.query.filter_by(username='admin').first()
            if not admin:
                admin = User(
                    username='admin',
                    email='admin@example.com',
                    role='admin'
                )
                admin.set_password('admin123')  # 设置默认密码
                db.session.add(admin)
                db.session.commit()
                app.logger.info("已创建默认管理员用户")
            else:
                app.logger.info("管理员用户已存在")
        except Exception as e:
            app.logger.error(f"创建管理员用户失败: {str(e)}")
            # 不要让这个异常中断应用启动