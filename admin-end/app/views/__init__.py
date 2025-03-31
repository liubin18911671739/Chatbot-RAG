from flask import Blueprint

views = Blueprint('views', __name__)

# 只需要导入各子模块，不需要创建新的蓝图
# 每个子模块都已经定义了自己的蓝图

from . import dashboard, documents, logs, users