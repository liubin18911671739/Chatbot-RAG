#!/bin/bash

# 设置环境变量
export FLASK_APP=backend/app/run.py
export FLASK_ENV=development

# 安装后端依赖
pip install -r backend/requirements.txt

# 安装前端依赖
cd frontend
npm install

# 构建前端项目
npm run build

# 返回根目录
cd ..

# 创建数据目录
mkdir -p backend/data/embeddings
mkdir -p backend/data/uploaded_docs

# 提示用户完成设置
echo "环境设置完成！请根据需要启动后端和前端服务。"