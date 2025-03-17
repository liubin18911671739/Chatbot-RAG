from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import requests
from app.models.user import User
from app import db

auth_bp = Blueprint('auth', __name__)

# 测试认证凭据 - 仅用于开发/测试环境
TEST_CREDENTIALS = {
    "admin": "admin123",
    "test": "test123",
    "guest": "guest"
}

def test_authentication(username, password):
    """模拟认证服务，仅用于测试/开发环境"""
    class MockResponse:
        def __init__(self, json_data, status_code):
            self.json_data = json_data
            self.status_code = status_code
            
        def json(self):
            return self.json_data
    
    # 检查用户名是否存在且密码匹配
    if username in TEST_CREDENTIALS and TEST_CREDENTIALS[username] == password:
        return MockResponse({
            "authenticated": True,
            "user_info": {
                "username": username,
                "role": "admin" if username == "admin" else "user",
                "display_name": f"测试用户_{username}"
            }
        }, 200)
    else:
        return MockResponse({
            "authenticated": False,
            "message": "Invalid username or password"
        }, 401)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # 是否使用测试认证
    use_test_auth = current_app.config.get('USE_TEST_AUTH', False)
    
    try:
        if use_test_auth:
            # 使用测试认证
            current_app.logger.info("使用测试认证服务")
            response = test_authentication(username, password)
        else:
            # 调用实际的外部认证服务
            auth_service_url = current_app.config.get('AUTH_SERVICE_URL', 'http://auth-service:8080/api/auth')
            
            # 向外部认证服务发送请求
            response = requests.post(
                auth_service_url,
                json={
                    'username': username,
                    'password': password
                },
                timeout=5  # 5秒超时
            )
        
        # 检查认证响应
        if response.status_code == 200:
            auth_data = response.json()
            
            # 获取用户ID或创建本地用户记录
            user = User.query.filter_by(username=username).first()
            if not user:
                # 如果是首次登录，创建本地用户记录
                user = User(username=username)
                user.set_password('external_auth')  # 设置一个占位符密码
                db.session.add(user)
                db.session.commit()
            
            # 生成JWT令牌
            access_token = create_access_token(identity=user.id)
            
            # 返回令牌和可能的附加信息
            return jsonify(
                access_token=access_token,
                user_info=auth_data.get('user_info', {})
            ), 200
        else:
            # 认证失败
            return jsonify({"msg": response.json().get('message', 'Authentication failed')}), response.status_code
            
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"外部认证服务调用失败: {str(e)}")
        return jsonify({"msg": "Authentication service unavailable"}), 503

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "User already exists"}), 400

    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User created successfully"}), 201
