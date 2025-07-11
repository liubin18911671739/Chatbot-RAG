@echo off
chcp 65001 > nul
title YiYun Chat Render 部署准备脚本

echo 🚀 YiYun Chat Render 部署准备脚本
echo ==================================
echo.

REM 检查必要的文件
echo 📋 检查项目文件...

if not exist "render.yaml" (
    echo ❌ 错误: render.yaml 文件不存在
    pause
    exit /b 1
)

if not exist "backend\requirements.txt" (
    echo ❌ 错误: backend\requirements.txt 文件不存在
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ❌ 错误: frontend\package.json 文件不存在
    pause
    exit /b 1
)

echo ✅ 所有必要文件存在

REM 检查 Git 仓库
echo 🔍 检查 Git 仓库状态...

if not exist ".git" (
    echo ⚠️  警告: 当前目录不是 Git 仓库
    echo 正在初始化 Git 仓库...
    git init
    echo ✅ Git 仓库已初始化
)

REM 检查是否有远程仓库
git remote -v | find "origin" > nul
if errorlevel 1 (
    echo ⚠️  警告: 没有设置远程仓库
    echo 请设置远程仓库：
    echo   git remote add origin https://github.com/your-username/yiyun-chat.git
    echo.
    set /p repo_url="请输入您的 GitHub 仓库 URL: "
    if not "!repo_url!"=="" (
        git remote add origin "!repo_url!"
        echo ✅ 远程仓库已设置
    )
)

REM 检查后端依赖
echo 🔧 检查后端依赖...
cd backend
python --version > nul 2>&1
if errorlevel 1 (
    python3 --version > nul 2>&1
    if errorlevel 1 (
        echo ❌ 错误: Python 未安装
        pause
        exit /b 1
    ) else (
        echo ✅ Python 3 已安装
    )
) else (
    echo ✅ Python 已安装
)

if exist "requirements.txt" (
    echo 📦 检查 requirements.txt...
    findstr /C:"gunicorn" requirements.txt > nul
    if errorlevel 1 (
        echo ⚠️  添加 Gunicorn 到依赖中...
        echo gunicorn==21.2.0 >> requirements.txt
        echo ✅ Gunicorn 已添加
    ) else (
        echo ✅ Gunicorn 已在依赖中
    )
)
cd ..

REM 检查前端依赖
echo 🔧 检查前端依赖...
cd frontend
npm --version > nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: npm 未安装
    pause
    exit /b 1
) else (
    echo ✅ npm 已安装
)

if exist "package.json" (
    echo 📦 检查 package.json...
    findstr /C:"\"build\":" package.json > nul
    if errorlevel 1 (
        echo ⚠️  警告: 没有找到构建脚本
    ) else (
        echo ✅ 构建脚本存在
    )
)
cd ..

REM 创建 .gitignore 文件
echo 📝 创建/更新 .gitignore 文件...
(
echo # 依赖
echo node_modules/
echo __pycache__/
echo *.pyc
echo *.pyo
echo *.pyd
echo .Python
echo env/
echo venv/
echo .env
echo .venv/
echo.
echo # 构建输出
echo dist/
echo build/
echo *.egg-info/
echo.
echo # 日志
echo *.log
echo logs/
echo.
echo # 编辑器
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo *~
echo.
echo # 操作系统
echo .DS_Store
echo Thumbs.db
echo.
echo # 数据库
echo *.db
echo *.sqlite
echo *.sqlite3
echo.
echo # 临时文件
echo *.tmp
echo *.temp
echo.
echo # 测试覆盖率
echo coverage/
echo .coverage
echo .pytest_cache/
echo.
echo # 配置文件
echo .env.local
echo .env.production
echo config.local.js
) > .gitignore

echo ✅ .gitignore 文件已创建

REM 提交更改
echo 💾 提交更改到 Git...
git add .
git commit -m "Add Render deployment configuration

- Add render.yaml for Render deployment
- Add deployment guide and setup script
- Update .gitignore for better file management
- Configure build and deployment settings"

echo ✅ 更改已提交

REM 推送到远程仓库
echo 🚀 推送到远程仓库...
git push origin main 2>nul || git push origin master 2>nul
if errorlevel 1 (
    echo ⚠️  警告: 推送失败，请手动推送：
    echo   git push origin main
) else (
    echo ✅ 代码已推送到远程仓库
)

echo.
echo 🎉 部署准备完成！
echo.
echo 接下来的步骤：
echo 1. 登录 Render Dashboard: https://dashboard.render.com
echo 2. 点击 'New +' 按钮
echo 3. 选择 'Blueprint'
echo 4. 连接您的 GitHub 仓库
echo 5. 选择包含 render.yaml 的仓库
echo 6. Render 会自动部署您的应用
echo.
echo 📖 更多信息请查看 RENDER_DEPLOYMENT_GUIDE.md
echo.
echo 🔧 重要配置：
echo - 确保在 Render Dashboard 中配置正确的环境变量
echo - 检查 RAG_SERVICE_URL 是否可从 Render 访问
echo - 验证所有服务的健康检查端点
echo.
echo 祝您部署顺利！🚀
echo.
pause
