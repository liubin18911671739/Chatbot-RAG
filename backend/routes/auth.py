import os
from flask import Blueprint, request, jsonify
import jwt
from datetime import datetime, timedelta
import logging
# 导入RADIUS认证所需的库
from pyrad.client import Client as RadiusClient
from pyrad.dictionary import Dictionary
import socket
import pyrad.packet

auth_bp = Blueprint('auth', __name__)

# 从环境变量或配置文件中获取密钥
JWT_SECRET = os.environ.get('JWT_SECRET', 'bisu-secret-key')
JWT_EXPIRATION = 24  # token有效期，单位：小时

# RADIUS服务器配置
RADIUS_SERVERS = [
    {
        'SERVER': '10.10.15.95',
        'PORT': 1812,
        'SECRET': os.environ.get('RADIUS_SECRET', 'testing123')
    },
    {
        'SERVER': 'localhost',
        'PORT': 1812,
        'SECRET': os.environ.get('RADIUS_KEY', 'testing123')
    }
]

# 测试用户凭据
TEST_RADIUS_USER = "testing"
TEST_RADIUS_PASSWORD = "password"



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



# RADIUS认证函数
def radius_authenticate(username, password):
    """
    使用RADIUS服务器进行用户认证
    
    参数:
    - username: 用户名
    - password: 密码
    
    返回:
    - 认证成功返回True，失败返回False
    """
    # 先检查是否为测试用户
    if username == TEST_RADIUS_USER and password == TEST_RADIUS_PASSWORD:
        logging.info(f"测试用户认证成功：{username}")
        return True
    
    # 遍历所有配置的RADIUS服务器，尝试认证
    for server_config in RADIUS_SERVERS:
        try:
            # 创建RADIUS客户端
            # 注意：pyrad需要一个字典文件，我们使用默认的空字典
            radius_client = RadiusClient(
                server=server_config['SERVER'],
                authport=server_config['PORT'],
                secret=server_config['SECRET'].encode('utf-8'),
                dict=Dictionary()
            )
            
            # 创建认证请求
            req = radius_client.CreateAuthPacket(code=pyrad.packet.AccessRequest)
            req["User-Name"] = username
            req["User-Password"] = req.PwCrypt(password)
            
            # 发送请求并等待响应
            try:
                reply = radius_client.SendPacket(req)
                if reply.code == pyrad.packet.AccessAccept:
                    logging.info(f"RADIUS认证成功：{username}，服务器：{server_config['SERVER']}")
                    return True
                else:
                    logging.warning(f"RADIUS认证失败：{username}，服务器：{server_config['SERVER']}")
                    # 继续尝试下一个服务器
            except socket.error as e:
                logging.error(f"RADIUS服务器连接失败：{server_config['SERVER']}，错误：{str(e)}")
                # 尝试下一个服务器
            except Exception as e:
                logging.error(f"RADIUS认证请求发送失败：{server_config['SERVER']}，错误：{str(e)}")
                # 尝试下一个服务器
        except Exception as e:
            logging.error(f"RADIUS认证过程发生错误：{server_config['SERVER']}，错误：{str(e)}")
            # 尝试下一个服务器
    
    # 所有服务器都认证失败
    return False

@auth_bp.route('/radius-login', methods=['POST'])
def radius_login():
    """
    处理RADIUS登录请求
    请求参数:
    - username: 用户名
    - password: 密码
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({
            'success': False,
            'message': '用户名和密码不能为空'
        }), 400
    
    try:
        # 调用RADIUS认证函数
        if radius_authenticate(username, password):
            # 认证成功，生成JWT token
            token = generate_token(username)
            return jsonify({
                'success': True,
                'token': token,
                'message': 'RADIUS认证登录成功'
            })
        else:
            # 认证失败
            return jsonify({
                'success': False,
                'message': 'RADIUS认证失败：用户名或密码错误'
            }), 401
            
    except Exception as e:
        # 记录异常
        logging.error(f"RADIUS登录错误: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'RADIUS登录服务暂时不可用，请稍后再试'
        }), 500