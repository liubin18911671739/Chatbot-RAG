import os
from app import create_app, db
from app.models.user import User

def create_admin_user(username, email, password):
    """创建一个管理员用户"""
    app = create_app()
    with app.app_context():
        # 打印数据库文件的绝对路径
        db_path = os.path.abspath('data.db')
        print(f"数据库文件路径: {db_path}")
        
        # 创建所有数据库表
        db.create_all()
        
        # 检查用户是否已存在
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print(f"用户 '{username}' 已经存在!")
            return

        # 创建新用户
        user = User(username=username, email=email)
        user.set_password(password)
        
        # 保存到数据库
        db.session.add(user)
        db.session.commit()
        print(f"成功创建用户: {username}")

if __name__ == "__main__":
    # 创建管理员用户
    create_admin_user("admin", "admin@example.com", "Admin@123")
    
    # 创建测试用户
    create_admin_user("test", "test@example.com", "Test@123")