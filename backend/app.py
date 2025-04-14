from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint
from routes import bp  # 导入主Blueprint
from routes.auth import auth_bp  # 导入身份验证Blueprint

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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

# Register the auth blueprint
app.register_blueprint(auth_bp, url_prefix='/api/auth')  # 添加auth路由

# 提供静态 swagger.json 文件
@app.route('/static/swagger.json')
def send_swagger_json():
    return send_from_directory('.', 'swagger.json')

# 打印所有已注册的路由（调试用）
print("Registered routes:")
for rule in app.url_map.iter_rules():
    print(f"{rule.endpoint}: {rule.rule}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  # Run the app in debug mode for development
