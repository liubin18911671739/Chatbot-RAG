import os
import json
import requests
from flask import Blueprint, request, jsonify
from zeep import Client
import jwt
from datetime import datetime, timedelta
import hashlib
import logging
from xml.etree import ElementTree as ET

auth_bp = Blueprint('auth', __name__)

# 从环境变量或配置文件中获取密钥
JWT_SECRET = os.environ.get('JWT_SECRET', 'bisu-secret-key')
JWT_EXPIRATION = 24  # token有效期，单位：小时

# BISU CAS Web Service地址
CAS_SERVICE_URL = 'http://cas.bisu.edu.cn/tpass/service/LoginService?wsdl'

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
        client = Client(CAS_SERVICE_URL)
        
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

# 添加CAS认证代理路由
# CAS服务的URL
CAS_SERVICE_URL = 'http://cas.bisu.edu.cn/tpass/service/LoginService?wsdl'

# 简单MD5加密函数
def encrypt_md5(text):
    return hashlib.md5(text.encode('utf-8')).hexdigest()

@auth_bp.route('/cas-proxy', methods=['POST'])
def cas_proxy():
    """
    为前端提供CAS代理服务，避免跨域问题
    """
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'message': '用户名和密码不能为空'
            }), 400
        
        # 加密用户名和密码
        encrypted_username = encrypt_md5(username)
        encrypted_password = encrypt_md5(password)
        
        # 构建SOAP请求
        soap_envelope = f"""
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.tpass.cas.bisu.edu.cn/">
            <soapenv:Header/>
            <soapenv:Body>
                <ser:loginValidate>
                    <username>{encrypted_username}</username>
                    <password>{encrypted_password}</password>
                </ser:loginValidate>
            </soapenv:Body>
        </soapenv:Envelope>
        """
        
        # 发送请求到CAS服务
        try:
            response = requests.post(
                CAS_SERVICE_URL,
                data=soap_envelope,
                headers={
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': ''
                },
                timeout=10  # 10秒超时
            )
            
            # 检查响应状态
            if response.status_code != 200:
                logging.error(f"CAS服务返回错误状态码: {response.status_code}")
                return jsonify({
                    'success': False,
                    'message': f'CAS服务返回错误状态码: {response.status_code}'
                }), 500
            
            # 解析SOAP响应
            try:
                root = ET.fromstring(response.text)
                # 查找return元素
                namespaces = {
                    'soap': 'http://schemas.xmlsoap.org/soap/envelope/',
                    'ns2': 'http://service.tpass.cas.bisu.edu.cn/'
                }
                
                return_element = root.find('.//return', namespaces)
                
                if return_element is not None:
                    # 返回元素包含JSON字符串
                    return jsonify(eval(return_element.text))
                else:
                    # 没有找到返回元素，将原始响应返回给前端
                    logging.warning("无法解析CAS服务响应中的return元素")
                    return jsonify({
                        'success': False,
                        'message': '无法解析CAS服务响应'
                    }), 500
                
            except Exception as e:
                logging.error(f"解析CAS响应时发生错误: {str(e)}")
                # JSON 兼容尝试
                if '{"success":true}' in response.text:
                    return jsonify({'success': True})
                elif '{"success":false}' in response.text:
                    return jsonify({'success': False})
                else:
                    return jsonify({
                        'success': False,
                        'message': f'解析CAS响应时发生错误: {str(e)}',
                        'raw_response': response.text[:500]  # 返回部分原始响应用于调试
                    }), 500
            
        except requests.exceptions.ConnectionError:
            logging.error("无法连接到CAS服务器")
            # 开发环境下的备用认证逻辑
            from flask import current_app
            if current_app.config.get('DEBUG', False) and username == '20090025' and password == '?Lb!816003':
                logging.info("开发环境：使用测试账号成功登录")
                return jsonify({'success': True})
            return jsonify({
                'success': False,
                'message': '无法连接到CAS服务器，请稍后重试'
            }), 503
            
        except requests.exceptions.Timeout:
            logging.error("连接CAS服务器超时")
            return jsonify({
                'success': False,
                'message': '连接CAS服务器超时，请稍后重试'
            }), 504
            
        except Exception as e:
            logging.error(f"连接CAS服务器时发生错误: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'连接CAS服务器时发生错误: {str(e)}'
            }), 500
            
    except Exception as e:
        logging.error(f"CAS代理服务处理请求时发生错误: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'处理请求时发生错误: {str(e)}'
        }), 500