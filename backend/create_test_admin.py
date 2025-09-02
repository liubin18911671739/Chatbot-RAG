#!/usr/bin/env python3
"""
添加测试管理员的脚本
用于创建一个测试用户，用户名: admin, 密码: admin@123
"""

import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入数据库模型
from models.database import db, User

def create_test_admin():
    """创建测试管理员用户"""
    
    # 创建Flask应用实例
    app = Flask(__name__)
    
    # 配置数据库 - 使用SQLite作为临时数据库
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_admin.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 初始化数据库
    db.init_app(app)
    
    with app.app_context():
        # 创建所有表
        db.create_all()
        
        # 检查用户是否已存在
        existing_user = User.query.filter_by(username='admin').first()
        if existing_user:
            print(f"用户 'admin' 已存在，ID: {existing_user.id}")
            return
        
        # 创建新的管理员用户
        admin_user = User(
            username='admin',
            email='admin@ichat.com',
            password_hash=generate_password_hash('admin@123')
        )
        
        # 添加到数据库
        db.session.add(admin_user)
        db.session.commit()
        
        print(f"成功创建测试管理员用户:")
        print(f"  用户名: admin")
        print(f"  邮箱: admin@ichat.com")
        print(f"  密码: admin@123")
        print(f"  用户ID: {admin_user.id}")
        print(f"  数据库文件: test_admin.db")

if __name__ == '__main__':
    create_test_admin()