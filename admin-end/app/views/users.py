from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models.user import User
from app.extensions import db  # 使用 extensions 而不是 app

# 将 users_bp 改为 users
users = Blueprint('users', __name__)

@users.route('/')  # 修改路由
def index():
    users_list = User.query.all()
    return render_template('users/index.html', users=users_list)

@users.route('/<int:user_id>', methods=['GET'])  # 修改路由
def user_detail(user_id):
    user = User.query.get_or_404(user_id)
    return render_template('users/detail.html', user=user)

@users.route('/delete/<int:user_id>', methods=['POST'])  # 修改路由
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    flash('User has been deleted successfully.', 'success')
    return redirect(url_for('users.index'))