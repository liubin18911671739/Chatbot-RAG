#!/bin/bash

# YiYun Chat Render 部署准备脚本
# 此脚本帮助准备项目以便在 Render 上部署

echo "🚀 YiYun Chat Render 部署准备脚本"
echo "=================================="

# 检查必要的文件
echo "📋 检查项目文件..."

if [ ! -f "render.yaml" ]; then
    echo "❌ 错误: render.yaml 文件不存在"
    exit 1
fi

if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ 错误: backend/requirements.txt 文件不存在"
    exit 1
fi

if [ ! -f "frontend/package.json" ]; then
    echo "❌ 错误: frontend/package.json 文件不存在"
    exit 1
fi

echo "✅ 所有必要文件存在"

# 检查 Git 仓库
echo "🔍 检查 Git 仓库状态..."

if [ ! -d ".git" ]; then
    echo "⚠️  警告: 当前目录不是 Git 仓库"
    echo "正在初始化 Git 仓库..."
    git init
    echo "✅ Git 仓库已初始化"
fi

# 检查是否有远程仓库
if ! git remote -v | grep -q "origin"; then
    echo "⚠️  警告: 没有设置远程仓库"
    echo "请设置远程仓库："
    echo "  git remote add origin https://github.com/your-username/yiyun-chat.git"
    echo ""
    read -p "请输入您的 GitHub 仓库 URL: " repo_url
    if [ ! -z "$repo_url" ]; then
        git remote add origin "$repo_url"
        echo "✅ 远程仓库已设置"
    fi
fi

# 更新 render.yaml 中的仓库地址
if [ ! -z "$repo_url" ]; then
    echo "📝 更新 render.yaml 中的仓库地址..."
    sed -i.bak "s|repo: https://github.com/your-username/yiyun-chat.git|repo: $repo_url|g" render.yaml
    rm render.yaml.bak
    echo "✅ render.yaml 已更新"
fi

# 检查后端依赖
echo "🔧 检查后端依赖..."
cd backend
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 已安装"
    if [ -f "requirements.txt" ]; then
        echo "📦 检查 requirements.txt..."
        if grep -q "gunicorn" requirements.txt; then
            echo "✅ Gunicorn 已在依赖中"
        else
            echo "⚠️  添加 Gunicorn 到依赖中..."
            echo "gunicorn==21.2.0" >> requirements.txt
            echo "✅ Gunicorn 已添加"
        fi
    fi
else
    echo "❌ 错误: Python 3 未安装"
    exit 1
fi
cd ..

# 检查前端依赖
echo "🔧 检查前端依赖..."
cd frontend
if command -v npm &> /dev/null; then
    echo "✅ npm 已安装"
    if [ -f "package.json" ]; then
        echo "📦 检查 package.json..."
        # 检查构建脚本
        if grep -q "\"build\":" package.json; then
            echo "✅ 构建脚本存在"
        else
            echo "⚠️  警告: 没有找到构建脚本"
        fi
    fi
else
    echo "❌ 错误: npm 未安装"
    exit 1
fi
cd ..

# 创建 .gitignore 文件
echo "📝 创建/更新 .gitignore 文件..."
cat > .gitignore << EOF
# 依赖
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.env
.venv/

# 构建输出
dist/
build/
*.egg-info/

# 日志
*.log
logs/

# 编辑器
.vscode/
.idea/
*.swp
*.swo
*~

# 操作系统
.DS_Store
Thumbs.db

# 数据库
*.db
*.sqlite
*.sqlite3

# 临时文件
*.tmp
*.temp

# 测试覆盖率
coverage/
.coverage
.pytest_cache/

# 配置文件
.env.local
.env.production
config.local.js
EOF

echo "✅ .gitignore 文件已创建"

# 提交更改
echo "💾 提交更改到 Git..."
git add .
git commit -m "Add Render deployment configuration

- Add render.yaml for Render deployment
- Add deployment guide and setup script
- Update .gitignore for better file management
- Configure build and deployment settings"

echo "✅ 更改已提交"

# 推送到远程仓库
echo "🚀 推送到远程仓库..."
if git push origin main 2>/dev/null || git push origin master 2>/dev/null; then
    echo "✅ 代码已推送到远程仓库"
else
    echo "⚠️  警告: 推送失败，请手动推送："
    echo "  git push origin main"
fi

echo ""
echo "🎉 部署准备完成！"
echo ""
echo "接下来的步骤："
echo "1. 登录 Render Dashboard: https://dashboard.render.com"
echo "2. 点击 'New +' 按钮"
echo "3. 选择 'Blueprint'"
echo "4. 连接您的 GitHub 仓库"
echo "5. 选择包含 render.yaml 的仓库"
echo "6. Render 会自动部署您的应用"
echo ""
echo "📖 更多信息请查看 RENDER_DEPLOYMENT_GUIDE.md"
echo ""
echo "🔧 重要配置："
echo "- 确保在 Render Dashboard 中配置正确的环境变量"
echo "- 检查 RAG_SERVICE_URL 是否可从 Render 访问"
echo "- 验证所有服务的健康检查端点"
echo ""
echo "祝您部署顺利！🚀"
