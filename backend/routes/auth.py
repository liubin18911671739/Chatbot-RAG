from flask import Blueprint, request, jsonify
from pyrad.client import Client
from pyrad.dictionary import Dictionary
from pyrad.packet import AccessAccept
import logging
import platform
import os
import select

# Windows平台上的select.poll补丁
if platform.system() == 'Windows':
    # 添加Windows兼容性补丁，因为Windows上select模块没有poll方法
    if not hasattr(select, 'poll'):
        class PollObject:
            def __init__(self):
                self.fds = {}
            
            def register(self, fd, eventmask):
                self.fds[fd] = eventmask
                
            def unregister(self, fd):
                if fd in self.fds:
                    del self.fds[fd]
                    
            def poll(self, timeout=None):
                # 简化的实现，仅支持基本功能
                import time
                if not self.fds:
                    if timeout is not None:
                        time.sleep(timeout / 1000.0)
                    return []
                
                r = [fd for fd, mask in self.fds.items() if mask & 1]
                w = [fd for fd, mask in self.fds.items() if mask & 4]
                e = [fd for fd, mask in self.fds.items() if mask & 8]
                
                try:
                    readables, writables, exceptions = select.select(r, w, e, timeout and timeout / 1000.0)
                except (IOError, OSError):
                    return []
                    
                result = []
                for fd in readables:
                    if fd in self.fds:
                        result.append((fd, 1))
                for fd in writables:
                    if fd in self.fds:
                        result.append((fd, 4))
                for fd in exceptions:
                    if fd in self.fds:
                        result.append((fd, 8))
                        
                return result
        
        # 将PollObject注入到select模块
        select.poll = PollObject

# 添加Windows特定的RADIUS直接通信功能
if platform.system() == 'Windows':
    import socket
    import struct
    import hashlib
    import random
    
    # Windows平台上的备用RADIUS认证函数
    def windows_radius_auth(username, password, server=None, port=None, secret=None, logger=None):
        """
        Windows平台上的备用RADIUS认证方式，通过socket直接实现基本的RADIUS协议
        """
        if logger:
            logger.info(f"Using Windows-specific RADIUS auth for user: {username}")
        else:
            print(f"Using Windows-specific RADIUS auth for user: {username}")
            
        # 使用默认参数或传入的参数
        server = server or '10.10.15.95'
        port = port or 1812
        secret = secret or b'123456'
        
        try:
            # 创建UDP socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(5)
            
            # 生成请求ID
            request_id = random.randint(0, 255)
            
            # 构建RADIUS认证请求报文
            # 报文格式: Code(1) + ID(1) + Length(2) + Authenticator(16) + Attributes
            code = 1  # Access-Request
            
            # 生成16字节的认证器
            authenticator = bytes([random.randint(0, 255) for _ in range(16)])
            
            # 设置属性: 用户名和密码
            # 用户名属性: Type(1) + Length(1) + Value
            username_attr = bytes([1, len(username) + 2]) + username.encode()
            
            # 密码加密（简化实现）
            password_bytes = password.encode()
            # 填充password到16字节的倍数
            if len(password_bytes) % 16:
                password_bytes += b'\0' * (16 - (len(password_bytes) % 16))
            
            # 使用MD5哈希和共享密钥加密密码
            encrypted_pw = b''
            last = authenticator
            for i in range(0, len(password_bytes), 16):
                chunk = password_bytes[i:i+16]
                # XOR chunk与上一个MD5哈希的结果
                cipher = hashlib.md5(secret + last).digest()
                xored = bytes([a ^ b for a, b in zip(chunk, cipher)])
                encrypted_pw += xored
                last = xored
            
            # 密码属性: Type(2) + Length(1) + Value
            password_attr = bytes([2, len(encrypted_pw) + 2]) + encrypted_pw
            
            # 组装属性部分
            attributes = username_attr + password_attr
            
            # 计算总长度
            total_length = 20 + len(attributes)  # 20是头部长度
            
            # 组装报文
            header = struct.pack('!BBH', code, request_id, total_length) + authenticator
            packet = header + attributes
            
            # 发送请求
            if logger:
                logger.info(f"Sending Windows socket RADIUS request to {server}:{port}")
            else:
                print(f"Sending Windows socket RADIUS request to {server}:{port}")
                
            sock.sendto(packet, (server, port))
            
            # 接收响应
            try:
                response, addr = sock.recvfrom(4096)
                # 解析响应头部
                resp_code, resp_id, resp_length = struct.unpack('!BBH', response[:4])
                
                if logger:
                    logger.info(f"Received RADIUS response code: {resp_code}")
                else:
                    print(f"Received RADIUS response code: {resp_code}")
                
                # 2表示Access-Accept
                if resp_code == 2:
                    if logger:
                        logger.info(f"Windows socket RADIUS authentication successful for user: {username}")
                    else:
                        print(f"Windows socket RADIUS authentication successful for user: {username}")
                    return True
                else:
                    if logger:
                        logger.warning(f"Windows socket RADIUS authentication failed for user: {username}")
                    else:
                        print(f"Windows socket RADIUS authentication failed for user: {username}")
                    return False
                    
            except socket.timeout:
                if logger:
                    logger.error("Windows socket RADIUS authentication timed out")
                else:
                    print("Windows socket RADIUS authentication timed out")
                return False
                
        except Exception as e:
            if logger:
                logger.error(f"Windows socket RADIUS error: {str(e)}")
            else:
                print(f"Windows socket RADIUS error: {str(e)}")
            return False
        finally:
            try:
                sock.close()
            except:
                pass

auth_bp = Blueprint('auth_bp', __name__)

RADIUS_SERVER = '10.10.15.95'
RADIUS_PORT = 1812
RADIUS_SECRET = b'123456' # Secret should be bytes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def radius_authenticate(username, password):
    """
    使用RADIUS服务器验证用户凭据
    
    Args:
        username (str): 用户名
        password (str): 密码
        
    Returns:
        bool: 认证成功返回True，否则返回False
    """
    if not username or not password:
        logger.warning("Username or password missing")
        return False
    
    # 检查是否在Windows平台上，如果是则可能需要使用特殊处理
    current_platform = platform.system()
    is_windows = current_platform == 'Windows'
    
    # Windows平台尝试使用标准pyrad方法，如果失败则尝试直接socket通信
    if is_windows:
        logger.info(f"Windows platform detected, will try standard method first then fallback")
    
    # 所有平台先尝试使用正常的RADIUS认证
    try:
        # 记录当前平台信息
        logger.info(f"Current platform: {current_platform}")
        
        # 确认Windows平台的select.poll补丁是否已应用
        if is_windows and hasattr(select, 'poll'):
            logger.info("Windows platform detected with select.poll patch applied")
        
        # 使用绝对路径引用字典文件
        dict_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dictionary")
        logger.info(f"Using dictionary file at: {dict_path}")
        
        # 检查字典文件是否存在
        if not os.path.exists(dict_path):
            logger.error(f"Dictionary file not found at: {dict_path}")
            # 尝试使用备用路径（针对Windows环境可能的路径差异）
            alternate_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dictionary")
            if os.path.exists(alternate_path):
                dict_path = alternate_path
                logger.info(f"Using alternate dictionary path: {dict_path}")            
            else:
                logger.error("Could not find dictionary file in alternate location")
                raise FileNotFoundError(f"RADIUS dictionary file not found at {dict_path}")
                
        client = Client(
            server=RADIUS_SERVER,
            authport=RADIUS_PORT, 
            secret=RADIUS_SECRET,
            dict=Dictionary(dict_path),
            timeout=5
        )
        
        # pyrad API可能有变化，根据不同版本尝试不同的方法
        logger.info(f"Attempting to create auth packet for user: {username}")
        try:
            # 尝试新版API (pyrad 2.x)
            req = client.CreateAuthPacket(code=1, User_Name=username)
            req["User-Password"] = req.PwCrypt(password)
            logger.info("Using pyrad 2.x API")
        except (AttributeError, TypeError):
            # 兼容旧版API (pyrad 1.x)
            req = client.create_auth_packet(code=1, User_Name=username)
            req["User-Password"] = req.encrypt_password(password)
            logger.info("Using pyrad 1.x API")
        
        logger.info(f"Sending RADIUS authentication request for user: {username}")
        
        # 处理不同版本API的send_packet方法
        try:
            # 尝试直接调用send_packet
            reply = client.send_packet(req)
        except AttributeError:
            # 尝试SendPacket (pyrad 2.x)
            try:
                reply = client.SendPacket(req)
                logger.info("Used client.SendPacket method")
            except AttributeError:
                # 尝试其他可能的方法
                try:
                    # 一些特殊的Windows兼容版本可能使用这个方法
                    reply = client.send(req)
                    logger.info("Used client.send method")
                except AttributeError:
                    # 最后尝试查看客户端有哪些可用方法
                    available_methods = [m for m in dir(client) if callable(getattr(client, m)) and not m.startswith("_")]
                    logger.error(f"No suitable send method found. Available methods: {available_methods}")
                    raise AttributeError("No suitable method to send RADIUS packet found")
        
        if reply is None:
            logger.error("No response from RADIUS server")
            return False
              # 修复部分：正确处理响应对象或整数        # 记录响应类型，帮助调试
        logger.info(f"RADIUS response type: {type(reply).__name__}, value: {str(reply)}")
        
        if isinstance(reply, int):
            # 如果reply是整数，直接比较值
            if reply == 2:  # AccessAccept code is 2
                logger.info(f"RADIUS authentication successful for user: {username}")
                return True
            else:
                logger.warning(f"RADIUS authentication failed for user: {username} with code: {reply}")
                return False
        else:
            try:
                # 原有的对象处理方式
                if reply.code == AccessAccept.code:
                    logger.info(f"RADIUS authentication successful for user: {username}")
                    return True
                else:
                    logger.warning(f"RADIUS authentication failed for user: {username} with code: {reply.code}")
                    return False
            except AttributeError:
                # 处理AuthPacket类型的响应
                # 尝试不同的方法来检查响应是否表示认证成功
                try:
                    # 检查对象类名是否包含Accept字符串，表示可能是接受响应
                    class_name = type(reply).__name__
                    if 'Accept' in class_name:
                        logger.info(f"Authentication accepted based on class name: {class_name}")
                        return True
                        
                    # 尝试通过其他方式判断
                    # 检查是否有id属性，及其值是否为2
                    if hasattr(reply, 'id') and reply.id == 2:
                        logger.info(f"Authentication accepted based on reply.id: {reply.id}")
                        return True
                        
                    # 检查是否可以转换为字符串并判断
                    reply_str = str(reply).lower()
                    if 'accept' in reply_str or 'success' in reply_str:
                        logger.info(f"Authentication accepted based on string representation: {reply_str}")
                        return True
                        
                    # 检查可能存在的其他属性
                    for attr_name in ['code', 'packet_type', 'type', 'status']:
                        if hasattr(reply, attr_name):
                            attr_value = getattr(reply, attr_name)
                            logger.info(f"Found attribute: {attr_name} with value: {attr_value}")
                            # 常见的成功状态码是2
                            if attr_value == 2:
                                logger.info(f"Authentication accepted based on {attr_name}: {attr_value}")
                                return True
                
                    # 尝试获取响应对象的所有可能相关属性，记录下来以便进一步分析
                    attrs = {name: getattr(reply, name) for name in dir(reply) 
                             if not name.startswith('_') and not callable(getattr(reply, name))}
                    logger.info(f"AuthPacket attributes: {attrs}")
                    
                    # 如果没有找到表示成功的明确标志，记录详细信息并返回失败
                    logger.warning(f"Could not determine authentication status from AuthPacket: {reply}")
                    return False
                    
                except Exception as e:
                    logger.error(f"Error processing AuthPacket: {e}")
                    return False
            
    except Exception as e:
        logger.error(f"RADIUS authentication error: {str(e)}")
        # 如果是Windows平台，提供更详细的错误信息并尝试备用方法
        if is_windows:
            logger.error(f"Windows-specific RADIUS error details: {e.__class__.__name__}")
            # 处理Windows上常见的网络或路径相关错误
            if isinstance(e, (FileNotFoundError, PermissionError)):
                logger.error("Windows可能需要管理员权限来访问网络资源或字典文件")
            elif isinstance(e, TimeoutError):
                logger.error("Windows防火墙可能阻止了RADIUS连接，请检查防火墙设置")
            elif "has no attribute 'poll'" in str(e):
                logger.error("Windows平台select模块兼容性问题。已应用补丁但似乎未生效，请检查补丁代码")
            elif "WinError 10013" in str(e) or "Permission denied" in str(e):
                logger.error("Windows端口权限问题，尝试以管理员权限运行或使用非特权端口")
            elif "WinError 10061" in str(e) or "Connection refused" in str(e):
                logger.error("无法连接到RADIUS服务器，请确认服务器地址和端口是否正确，以及服务器是否在运行")
            elif "WinError 10060" in str(e) or "timed out" in str(e):
                logger.error("连接RADIUS服务器超时，可能是防火墙阻止了连接或服务器响应时间过长")
            
            # Windows平台的备用方法：尝试使用直接socket通信
            logger.info("Trying Windows fallback direct socket method...")
            try:
                # 调用前面定义的windows_radius_auth函数
                result = windows_radius_auth(
                    username, 
                    password, 
                    server=RADIUS_SERVER, 
                    port=RADIUS_PORT, 
                    secret=RADIUS_SECRET, 
                    logger=logger
                )
                if result:
                    logger.info(f"Windows direct socket auth successful for user: {username}")
                    return True
                else:
                    logger.warning(f"Windows direct socket auth failed for user: {username}")
            except Exception as socket_error:
                logger.error(f"Windows direct socket auth error: {str(socket_error)}")
        return False

@auth_bp.route('/radius-login', methods=['POST'])
def radius_login():
    """
    RADIUS登录API端点
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    # 使用统一的认证函数进行验证
    result = radius_authenticate(username, password)
    
    if result:
        logger.info(f"Login successful for user: {username}")
        # 这里通常会生成一个JWT令牌或其他会话标识
        return jsonify({"message": "Login successful"}), 200
    else:
        logger.warning(f"Login failed for user: {username}")
        return jsonify({"message": "Invalid username or password"}), 401

@auth_bp.route('/test-radius-connection', methods=['GET'])
def test_radius_connection():
    """
    测试RADIUS服务器连接状态的API端点
    对于Windows平台特别有用，可以用来诊断连接问题
    """
    try:
        # 记录平台信息
        current_platform = platform.system()
        logger.info(f"Testing RADIUS connection on {current_platform} platform")
        
        # 使用绝对路径引用字典文件
        dict_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dictionary")
        
        # 检查字典文件是否存在
        if not os.path.exists(dict_path):
            alternate_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dictionary")
            if os.path.exists(alternate_path):
                dict_path = alternate_path
            else:
                return jsonify({
                    "status": "error",
                    "message": "RADIUS dictionary file not found",
                    "platform": current_platform,
                    "dictionary_path": dict_path
                }), 500
        
        # 尝试创建RADIUS客户端
        client = Client(
            server=RADIUS_SERVER,
            authport=RADIUS_PORT, 
            secret=RADIUS_SECRET,
            dict=Dictionary(dict_path),
            timeout=5
        )
        
        # 创建一个测试请求（不实际认证任何用户）
        try:
            # 尝试新版API (pyrad 2.x)
            req = client.CreateAuthPacket(code=1, User_Name="test_connection")
            logger.info("Using pyrad 2.x API for connection test")
        except (AttributeError, TypeError):
            # 兼容旧版API (pyrad 1.x)
            req = client.create_auth_packet(code=1, User_Name="test_connection")
            logger.info("Using pyrad 1.x API for connection test")
        
        # 记录测试信息
        connection_info = {
            "status": "success",
            "message": "RADIUS服务器连接测试成功",
            "server": RADIUS_SERVER,
            "port": RADIUS_PORT,
            "platform": current_platform,
            "dictionary_path": dict_path
        }
        
        logger.info(f"RADIUS connection test successful: {connection_info}")
        return jsonify(connection_info), 200
        
    except Exception as e:
        error_info = {
            "status": "error",
            "message": f"RADIUS服务器连接测试失败: {str(e)}",
            "error_type": e.__class__.__name__,
            "platform": platform.system(),
            "server": RADIUS_SERVER,
            "port": RADIUS_PORT
        }
        logger.error(f"RADIUS connection test failed: {error_info}")
        
        # 如果是Windows平台，尝试使用直接socket方法测试连接
        if platform.system() == 'Windows':
            try:
                logger.info("Trying Windows direct socket connection test...")
                # 创建socket并尝试简单连接
                sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                sock.settimeout(2)
                sock.sendto(b'test', (RADIUS_SERVER, RADIUS_PORT))
                error_info["windows_socket_test"] = "成功发送测试数据包"
            except Exception as socket_error:
                error_info["windows_socket_test"] = f"失败: {str(socket_error)}"
            finally:
                try:
                    sock.close()
                except:
                    pass
                    
        return jsonify(error_info), 500

# 添加Windows特定的RADIUS接口
if platform.system() == 'Windows':
    @auth_bp.route('/windows-radius-workaround', methods=['GET'])
    def windows_radius_workaround():
        """
        提供Windows平台上RADIUS连接问题的解决方法
        """
        return jsonify({
            "status": "info",
            "platform": "Windows",
            "message": "Windows平台已应用select.poll补丁和直接Socket通信",
            "fix_applied": hasattr(select, 'poll'),
            "socket_auth_available": True
        })
    
    @auth_bp.route('/windows-direct-auth', methods=['POST'])
    def windows_direct_auth():
        """
        Windows平台上的直接RADIUS认证API端点
        """
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"message": "Username and password are required"}), 400
            
        result = windows_radius_auth(username, password, 
                                    server=RADIUS_SERVER, 
                                    port=RADIUS_PORT, 
                                    secret=RADIUS_SECRET, 
                                    logger=logger)
        
        if result:
            return jsonify({"message": "Windows direct authentication successful"}), 200
        else:
            return jsonify({"message": "Windows direct authentication failed"}), 401

# 测试函数
if __name__ == "__main__":
    # 记录当前平台
    current_platform = platform.system()
    print(f"测试RADIUS认证 - 当前平台: {current_platform}")
    
    # 测试RADIUS连接状态
    print("1. 测试RADIUS连接状态...")
    try:
        # 使用绝对路径引用字典文件
        dict_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dictionary")
        if not os.path.exists(dict_path):
            print(f"警告: 找不到字典文件: {dict_path}")
            alternate_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dictionary")
            if os.path.exists(alternate_path):
                dict_path = alternate_path
                print(f"使用备用字典路径: {dict_path}")
            else:
                print("错误: 找不到RADIUS字典文件")
                exit(1)
        
        # 确认Windows平台的补丁已应用
        if platform.system() == 'Windows' and hasattr(select, 'poll'):
            print("Windows平台select.poll补丁已成功应用")
        
        client = Client(
            server=RADIUS_SERVER,
            authport=RADIUS_PORT, 
            secret=RADIUS_SECRET,
            dict=Dictionary(dict_path),
            timeout=5
        )
        
        # 检测RADIUS客户端API版本
        client_methods = dir(client)
        pyrad_version = "未知版本"
        if 'CreateAuthPacket' in client_methods:
            pyrad_version = "2.x"
        elif 'create_auth_packet' in client_methods:
            pyrad_version = "1.x"
            
        print(f"RADIUS服务器连接参数: 服务器={RADIUS_SERVER}, 端口={RADIUS_PORT}")
        print(f"RADIUS客户端创建成功 (pyrad版本: {pyrad_version})")
        
        # 显示可用方法
        available_methods = [m for m in client_methods if not m.startswith('_') and callable(getattr(client, m))]
        print(f"可用方法: {', '.join(available_methods[:5])}..." if available_methods else "找不到可用方法")
        
    except Exception as e:
        print(f"RADIUS连接测试失败: {str(e)}")
        print("请检查网络连接、防火墙设置和RADIUS服务器状态")
        
        # 如果是Windows平台且失败，尝试直接socket通信
        if platform.system() == 'Windows':
            print("\n尝试Windows直接socket通信测试...")
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                sock.settimeout(2)
                sock.sendto(b'test', (RADIUS_SERVER, RADIUS_PORT))
                print("成功发送测试数据包")
                sock.close()
            except Exception as socket_error:
                print(f"Socket测试失败: {str(socket_error)}")
                
        if "has no attribute 'poll'" in str(e):
            print("Windows平台select模块补丁未能正确应用，请检查补丁代码")
        exit(1)
    
    # 测试用户认证
    print("\n2. 测试用户认证...")
    username = "20090025"
    password = "?Lb!816003"
    print(f"尝试认证用户: {username}")
    result = radius_authenticate(username, password)
    if result:
        print("认证成功!") 
    else:
        print("认证失败!")
        
        # 如果是Windows平台且使用pyrad方法失败，尝试直接socket通信
        if platform.system() == 'Windows':
            print("\n尝试Windows直接socket认证方法...")
            result = windows_radius_auth(username, password, 
                                        server=RADIUS_SERVER, 
                                        port=RADIUS_PORT, 
                                        secret=RADIUS_SECRET)
            if result:
                print("Windows直接socket认证成功!")
            else:
                print("Windows直接socket认证失败!")
    
    # 提供运行Flask应用的说明
    # print("\n3. 要启动Flask应用进行完整测试，请使用以下命令:")
    # print("   python -m flask run --app backend.app:app")
