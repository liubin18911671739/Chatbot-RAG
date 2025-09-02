from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint
from routes import bp  # 导入主Blueprint
from routes.auth import auth_bp as radius_auth_bp  # 导入RADIUS认证Blueprint
from routes.hybrid_auth import auth_bp as hybrid_auth_bp  # 导入混合认证Blueprint
import logging
import platform
from logging.handlers import RotatingFileHandler
import os
import traceback

# 应用程序环境
APP_ENV = os.environ.get('APP_ENV', 'development')  # 可选值: development, testing, production

# 配置日志记录
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'app.log')

# 根据环境设置日志级别
log_level = logging.DEBUG if APP_ENV in ['development', 'testing'] else logging.INFO

# 配置应用程序日志
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
    handlers=[
        RotatingFileHandler(log_file, maxBytes=10485760, backupCount=10),  # 10MB, 10 files
        logging.StreamHandler()  # 同时输出到控制台
    ]
)

logger = logging.getLogger(__name__)
logger.info(f"Starting application on platform: {platform.system()}, environment: {APP_ENV}")

# 如果在测试环境中，启用本地测试模式
if APP_ENV in ['development', 'testing']:
    os.environ['ENABLE_LOCAL_TEST_MODE'] = 'True'
    logger.info("本地测试模式已启用")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# 设置应用配置
app.config.update(
    ENV=APP_ENV,
    DEBUG=APP_ENV in ['development', 'testing'],
    JSON_AS_ASCII=False,  # 确保JSON响应能正确处理中文
    JSON_SORT_KEYS=False  # 保持JSON响应的键顺序
)

# 配置 Swagger UI
SWAGGER_URL = '/api/docs'
API_URL = '/static/swagger.json'

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "BISU-QA System API"
    }
)

app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

# Register the main API blueprint
app.register_blueprint(bp, url_prefix='/api')  # 添加url_prefix

# 注册RADIUS认证模块的蓝图，支持RADIUS身份验证
# 当前包含的端点: /api/radius-auth/radius-login
app.register_blueprint(radius_auth_bp, url_prefix='/api/radius-auth')

# 注册混合认证模块的蓝图，支持RADIUS和本地数据库认证
# 当前包含的端点: /api/auth/login, /api/auth/create-admin, /api/auth/users
app.register_blueprint(hybrid_auth_bp, url_prefix='/api/auth')  

# 记录认证服务状态
from routes.auth import RADIUS_SERVER
logger.info(f"RADIUS认证服务已注册，服务器地址: {RADIUS_SERVER}")

# 全局错误处理
@app.errorhandler(Exception)
def handle_exception(e):
    """全局异常处理"""
    # 记录异常详情
    tb = traceback.format_exc()
    logger.error(f"Unhandled exception: {str(e)}\n{tb}")
    
    # HTTP 错误和自定义错误的不同处理
    if hasattr(e, 'code') and isinstance(e.code, int):
        # HTTP 错误
        return jsonify({
            'success': False,
            'message': str(e.description),
            'error': str(e)
        }), e.code
    
    # 返回统一的错误响应
    return jsonify({
        'success': False,
        'message': '服务器内部错误',
        'error': str(e) if app.debug else 'Internal Server Error'
    }), 500

# 提供静态 swagger.json 文件
@app.route('/static/swagger.json')
def send_swagger_json():
    return send_from_directory('.', 'swagger.json')

# 根路由 - 提供API信息
@app.route('/')
def root():
    return jsonify({
        'name': 'iChat RAG-QA System API',
        'version': '1.0.0',
        'status': 'running',
        'environment': APP_ENV,
        'endpoints': {
            'health': '/api/health',
            'chat': '/api/chat',
            'scenes': '/api/scenes',
            'feedback': '/api/feedback', 
            'greeting': '/api/greeting',
            'documentation': '/api/docs'
        }
    })

# 健康检查端点
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'ok',
        'platform': platform.system(),
        'version': '1.0.0',  # 可以从配置文件或环境变量中获取
        'environment': APP_ENV
    })

# 打印所有已注册的路由（调试用）
logger.info("Registered routes:")
for rule in app.url_map.iter_rules():
    logger.info(f"{rule.endpoint}: {rule.rule}")

if __name__ == '__main__':
    # 设置端口和调试模式
    port = int(os.environ.get('PORT', 5000))
    debug = APP_ENV != 'production'
    
    # 显示应用程序配置信息
    logger.info(f"应用程序配置：")
    logger.info(f" - 环境：{APP_ENV}")
    logger.info(f" - 端口：{port}")
    logger.info(f" - 调试模式：{'启用' if debug else '禁用'}")
    logger.info(f" - 操作系统：{platform.system()} {platform.release()}")
    logger.info(f" - Python版本：{platform.python_version()}")
    
    try:
        # 启动应用
        logger.info(f"正在启动服务器，访问地址：http://localhost:{port}/")
        app.run(host='0.0.0.0', port=port, debug=debug, threaded=True)
    except Exception as e:
        logger.error(f"启动服务器失败：{str(e)}")
        logger.error(traceback.format_exc())
