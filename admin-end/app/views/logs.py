from flask import Blueprint, render_template
from app.models.log import Log
from app.extensions import db

# 创建蓝图对象
logs = Blueprint('logs', __name__)

@logs.route('/')
def index():
    """显示系统日志"""
    all_logs = Log.query.order_by(Log.timestamp.desc()).limit(100).all()
    return render_template('logs/index.html', logs=all_logs)

@logs.route('/errors')
def errors():
    """显示错误日志"""
    error_logs = Log.query.filter_by(level='ERROR').order_by(Log.timestamp.desc()).all()
    return render_template('logs/errors.html', logs=error_logs)