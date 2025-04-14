import os
import json
import requests
from flask import Blueprint, request, jsonify
from zeep import Client
import jwt
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

# 从环境变量或配置文件中获取密钥
JWT_SECRET = os.environ.get('JWT_SECRET', 'bisu-secret-key')
JWT_EXPIRATION = 24  # token有效期，单位：小时

# BISU CAS Web Service地址
CAS_WSDL_URL = 'http://cas1.bisu.edu.cn/tpass/service/LoginService?wsdl'

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    处理登录请求，与BISU CAS系统进行身份验证
    请求参数:
    - username: 加密后的用户名
    - password: 加密后的密码
    """
    data = request.get_json()
    encrypted_username = data.get('username')
    encrypted_password = data.get('password')
    
    if not encrypted_username or not encrypted_password:
        return jsonify({
            'success': False,
            'message': '用户名和密码不能为空'
        }), 400
    
    try:
        # 创建SOAP客户端
        client = Client(CAS_WSDL_URL)
        
        # 调用loginValidate方法
        result = client.service.loginValidate(
            username=encrypted_username,
            password=encrypted_password
        )
        
        # 解析结果（假设返回的是JSON字符串）
        response_data = json.loads(result) if isinstance(result, str) else result
        
        if response_data.get('success'):
            # 身份验证成功，生成JWT token
            token = generate_token(encrypted_username)
            return jsonify({
                'success': True,
                'token': token,
                'message': '登录成功'
            })
        else:
            # 身份验证失败
            return jsonify({
                'success': False,
                'message': '用户名或密码错误'
            }), 401
            
    except Exception as e:
        # 记录异常
        print(f"Login error: {str(e)}")
        return jsonify({
            'success': False,
            'message': '登录服务暂时不可用，请稍后再试'
        }), 500

def generate_token(username):
    """
    生成JWT token
    """
    payload = {
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """
    验证JWT token是否有效
    """
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({
            'valid': False, 
            'message': '未提供token'
        }), 400
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return jsonify({
            'valid': True, 
            'username': payload.get('username')
        })
    except jwt.ExpiredSignatureError:
        return jsonify({
            'valid': False, 
            'message': 'token已过期'
        }), 401
    except jwt.InvalidTokenError:
        return jsonify({
            'valid': False, 
            'message': '无效token'
        }), 401