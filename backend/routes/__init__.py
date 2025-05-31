from flask import Blueprint

bp = Blueprint('api', __name__)

# 先创建蓝图，再导入路由
from . import chat, scenes, feedback, greeting, suggestions, insert