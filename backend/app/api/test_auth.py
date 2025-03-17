"""
独立的认证API测试脚本，避免与应用程序模块冲突
"""
from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, create_access_token
import logging
import sys

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建测试应用
app = Flask(__name__)

# 配置应用
app.config['JWT_SECRET_KEY'] = 'test-secret-key'  # 仅用于测试
app.config['USE_TEST_AUTH'] = True  # 启用测试认证

# 初始化JWT
jwt = JWTManager(app)

# 测试认证凭据
TEST_CREDENTIALS = {
    "admin": "admin123",
    "test": "test123",
    "guest": "guest"
}

# 模拟用户数据库
mock_users = {
    "admin": {"id": 1, "email": "admin@example.com", "role": "admin"},
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

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    logger.info(f"尝试登录: username={username}")
    
    # 使用测试认证
    response = test_authentication(username, password)
    
    # 检查认证响应
    if response.status_code == 200:
        auth_data = response.json()
        
        # 生成JWT令牌 - 使用username作为标识
        access_token = create_access_token(identity=username)
        
        # 返回令牌和附加信息
        return jsonify(
            access_token=access_token,
            user_info=auth_data.get('user_info', {})
        ), 200
    else:
        # 认证失败
        return jsonify({"msg": "Invalid username or password"}), response.status_code

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username in mock_users:
        return jsonify({"msg": "User already exists"}), 400
        
    # 将用户添加到模拟数据库
    mock_users[username] = {
        "id": len(mock_users) + 1,
        "email": f"{username}@example.com"
    }
    
    return jsonify({"msg": "User created successfully"}), 201

if __name__ == "__main__":
    # 判断是否以服务器模式运行
    run_server = "--server" in sys.argv
    
    if run_server:
        # 启动Web服务器进行手动测试
        print("启动Web服务器，访问 http://localhost:5000/api/auth/login")
        app.run(debug=True, port=5000)
    else:
        # 使用测试客户端进行自动测试
        with app.test_client() as client:
            print("测试 /api/auth/login API - 使用有效凭据:")
            response = client.post('/api/auth/login', 
                                json={'username': 'admin', 'password': 'admin123'})
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.get_json()}")
        
            print("\n测试 /api/auth/login API - 使用无效凭据:")
            response = client.post('/api/auth/login', 
                                json={'username': 'admin', 'password': 'wrongpass'})
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.get_json()}")
            
            print("\n测试 /api/auth/register API:")
            response = client.post('/api/auth/register',
                                json={'username': 'newuser', 'password': 'password123'})
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.get_json()}")