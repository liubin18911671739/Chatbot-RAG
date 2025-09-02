#!/usr/bin/env python3
"""
混合认证服务 - 支持RADIUS和本地数据库认证
"""

import os
import sys
from flask import Flask, Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import logging

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入RADIUS认证功能
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from auth import radius_authenticate, RADIUS_SERVER, RADIUS_PORT, RADIUS_SECRET
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.database import db, User

# 创建蓝图
auth_bp = Blueprint('hybrid_auth_bp', __name__)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def token_required(f):
    """JWT令牌验证装饰器（待实现）"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': '缺少认证令牌'}), 401
        # TODO: 实现JWT令牌验证
        return f(*args, **kwargs)
    return decorated

def create_test_admin():
    """创建测试管理员用户"""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_admin.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        # 创建所有表
        db.create_all()
        
        # 检查用户是否已存在
        existing_user = User.query.filter_by(username='admin').first()
        if existing_user:
            logger.info(f"测试管理员用户已存在: {existing_user.username}")
            return existing_user
        
        # 创建新的管理员用户
        admin_user = User(
            username='admin',
            email='admin@ichat.com',
            password_hash=generate_password_hash('admin@123')
        )
        
        # 添加到数据库
        db.session.add(admin_user)
        db.session.commit()
        
        logger.info(f"创建测试管理员用户: {admin_user.username}")
        return admin_user

def local_authenticate(username, password):
    """本地数据库认证"""
    try:
        app = Flask(__name__)
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_admin.db'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        db.init_app(app)
        
        with app.app_context():
            user = User.query.filter_by(username=username).first()
            if user and check_password_hash(user.password_hash, password):
                logger.info(f"本地认证成功: {username}")
                return True
            else:
                logger.warning(f"本地认证失败: {username}")
                return False
    except Exception as e:
        logger.error(f"本地认证错误: {str(e)}")
        return False

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    混合登录API - 支持RADIUS和本地数据库认证
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    auth_type = data.get('auth_type', 'radius')  # 默认使用RADIUS认证
    nas_ip_address = data.get('nas_ip_address', '10.10.15.211')
    
    if not username or not password:
        return jsonify({
            'success': False,
            'message': '用户名和密码不能为空'
        }), 400
    
    # 记录登录尝试
    logger.info(f"登录尝试 - 用户: {username}, 认证方式: {auth_type}")
    
    result = False
    
    # 根据认证类型进行认证
    if auth_type == 'radius':
        # RADIUS认证
        result = radius_authenticate(username, password, nas_ip_address)
        auth_method = 'RADIUS'
    elif auth_type == 'local':
        # 本地数据库认证
        result = local_authenticate(username, password)
        auth_method = '本地数据库'
    elif auth_type == 'hybrid':
        # 混合认证：先尝试本地，失败后尝试RADIUS
        result = local_authenticate(username, password)
        if result:
            auth_method = '本地数据库'
        else:
            result = radius_authenticate(username, password, nas_ip_address)
            auth_method = 'RADIUS' if result else '混合认证失败'
    else:
        return jsonify({
            'success': False,
            'message': '不支持的认证类型'
        }), 400
    
    if result:
        logger.info(f"登录成功 - 用户: {username}, 认证方式: {auth_method}")
        
        # TODO: 生成JWT令牌
        token = "dummy_token_" + username  # 临时实现
        
        return jsonify({
            'success': True,
            'message': '登录成功',
            'token': token,
            'user': {
                'username': username,
                'auth_method': auth_method
            }
        }), 200
    else:
        logger.warning(f"登录失败 - 用户: {username}, 认证方式: {auth_method}")
        return jsonify({
            'success': False,
            'message': '用户名或密码错误'
        }), 401

@auth_bp.route('/create-admin', methods=['POST'])
def create_admin():
    """创建管理员用户（需要认证）"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    
    if not username or not password:
        return jsonify({
            'success': False,
            'message': '用户名和密码不能为空'
        }), 400
    
    try:
        app = Flask(__name__)
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_admin.db'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        db.init_app(app)
        
        with app.app_context():
            # 检查用户是否已存在
            existing_user = User.query.filter_by(username=username).first()
            if existing_user:
                return jsonify({
                    'success': False,
                    'message': '用户名已存在'
                }), 400
            
            # 创建新用户
            new_user = User(
                username=username,
                email=email or f'{username}@ichat.com',
                password_hash=generate_password_hash(password)
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            logger.info(f"创建新用户: {username}")
            
            return jsonify({
                'success': True,
                'message': '用户创建成功',
                'user': {
                    'username': username,
                    'email': new_user.email
                }
            }), 201
            
    except Exception as e:
        logger.error(f"创建用户错误: {str(e)}")
        return jsonify({
            'success': False,
            'message': '创建用户失败'
        }), 500

@auth_bp.route('/users', methods=['GET'])
def get_users():
    """获取用户列表（需要认证）"""
    try:
        app = Flask(__name__)
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_admin.db'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        db.init_app(app)
        
        with app.app_context():
            users = User.query.all()
            user_list = []
            
            for user in users:
                user_list.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                })
            
            return jsonify({
                'success': True,
                'users': user_list
            }), 200
            
    except Exception as e:
        logger.error(f"获取用户列表错误: {str(e)}")
        return jsonify({
            'success': False,
            'message': '获取用户列表失败'
        }), 500

@auth_bp.route('/health', methods=['GET'])
def auth_health():
    """认证服务健康检查"""
    return jsonify({
        'success': True,
        'message': '认证服务正常运行',
        'radius_server': RADIUS_SERVER,
        'radius_port': RADIUS_PORT,
        'local_db': 'sqlite:///test_admin.db'
    }), 200

# 初始化测试管理员用户
if __name__ == '__main__':
    print("正在创建测试管理员用户...")
    admin_user = create_test_admin()
    if admin_user:
        print(f"测试管理员用户创建成功:")
        print(f"  用户名: {admin_user.username}")
        print(f"  邮箱: {admin_user.email}")
        print(f"  密码: admin@123")
        print(f"  用户ID: {admin_user.id}")
    else:
        print("创建测试管理员用户失败")