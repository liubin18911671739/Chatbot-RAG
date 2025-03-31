from flask import Blueprint, render_template, redirect, url_for
from flask_login import login_required, current_user

dashboard = Blueprint('dashboard', __name__)

@dashboard.route('/')
@login_required  # 确保用户必须登录才能访问
def index():
    return render_template('dashboard.html')  # 确保此页面不会触发重定向

@dashboard.route('/dashboard')
@login_required  # 确保用户必须登录才能访问
def dashboard_index():
    return render_template('dashboard.html')  # 确保此页面不会触发重定向