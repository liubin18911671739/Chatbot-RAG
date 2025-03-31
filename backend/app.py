from flask import Flask
from flask_cors import CORS
from routes import bp  # 导入Blueprint

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register the main API blueprint
app.register_blueprint(bp, url_prefix='/api')  # 添加url_prefix

# 打印所有已注册的路由（调试用）
print("Registered routes:")
for rule in app.url_map.iter_rules():
    print(f"{rule.endpoint}: {rule.rule}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  # Run the app in debug mode for development
