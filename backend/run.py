from app import create_app
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)

app = create_app('development')

if __name__ == '__main__':
    print("=" * 50)
    print(" 多语言新闻系统服务已启动")
    print(f" 运行环境: {app.config.get('ENV', 'development')}")
    print(f" 调试模式: {'开启' if app.debug else '关闭'}")
    print(f" API URL: http://localhost:5000/")
    print(f" 管理面板: http://localhost:5000/admin")
    print("=" * 50)
    app.run(host='0.0.0.0', debug=True)