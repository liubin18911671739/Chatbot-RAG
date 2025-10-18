#!/bin/bash

# 数据库初始化脚本
# 用于首次设置数据库迁移环境

echo "================================"
echo "  iChat 数据库迁移初始化"
echo "================================"
echo ""

# 检查是否已存在 migrations 目录
if [ -d "migrations" ]; then
    echo "⚠️  migrations/ 目录已存在"
    read -p "是否要删除并重新初始化？(y/N): " confirm
    if [ "$confirm" == "y" ] || [ "$confirm" == "Y" ]; then
        echo "正在删除旧的迁移目录..."
        rm -rf migrations
        echo "✅ 旧迁移目录已删除"
    else
        echo "❌ 取消初始化"
        exit 1
    fi
fi

# 检查 Python 环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 python3，请先安装 Python 3"
    exit 1
fi

# 检查依赖
echo "正在检查依赖..."
python3 -c "import flask_migrate" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Flask-Migrate 未安装，正在安装..."
    pip3 install flask-migrate
fi

echo ""
echo "步骤 1/4: 初始化迁移环境"
echo "------------------------"
python3 manage_db.py init
if [ $? -ne 0 ]; then
    echo "❌ 初始化失败"
    exit 1
fi

echo ""
echo "步骤 2/4: 生成初始迁移脚本"
echo "------------------------"
export FLASK_APP=app.py
flask db migrate -m "Initial migration: add Document, DocumentChunk, Embedding, Chat, Message models"
if [ $? -ne 0 ]; then
    echo "❌ 迁移脚本生成失败"
    exit 1
fi

echo ""
echo "步骤 3/4: 应用迁移到数据库"
echo "------------------------"
flask db upgrade
if [ $? -ne 0 ]; then
    echo "❌ 迁移应用失败"
    exit 1
fi

echo ""
echo "步骤 4/4: 验证数据库状态"
echo "------------------------"
flask db current

echo ""
echo "================================"
echo "  ✅ 数据库迁移初始化完成！"
echo "================================"
echo ""
echo "下一步："
echo "  1. 运行 'python3 app.py' 启动服务器"
echo "  2. 运行 'python3 create_test_admin.py' 创建测试管理员"
echo "  3. 查看 migrations/versions/ 目录中的迁移文件"
echo ""
echo "常用命令："
echo "  flask db migrate -m '描述'  # 生成新迁移"
echo "  flask db upgrade           # 应用迁移"
echo "  flask db downgrade         # 回滚迁移"
echo "  flask db history           # 查看历史"
echo ""
