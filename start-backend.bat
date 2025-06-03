@echo off
:: filepath: start-backend.bat
echo ===========================================
echo 启动后端Python服务 (无代理模式)
echo ===========================================

:: 清除代理设置
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=
set NO_PROXY=*

:: 启动Flask应用
echo 启动Flask后端服务...
echo 按 Ctrl+C 停止服务
python app.py

pause