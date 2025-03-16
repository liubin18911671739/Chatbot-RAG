# iChat Rag-QA System

## 项目简介
该项目是一个基于 Docker 的问答系统，利用前后端分离架构，实现了前端展示、后端业务，以及数据库和模型服务之间的协同工作。

## 架构说明
- **Frontend**: 构建前端显示界面，服务于用户请求。侦听端口 8080，并通过 Nginx 提供静态资源。
- **Backend**: 后端服务，处理业务逻辑，侦听端口 5000，依赖于 MySQL 数据库和 RAG 模型服务。
- **MySQL**: 数据库服务，用于存储应用数据。
- **vllm**: RAG 模型服务，提供问答生成接口。

## 部署指南
1. 将所有代码克隆到本地开发环境。
2. 修改 docker-compose.yml 文件中的环境变量（如数据库连接字符串等）。
3. 在项目根目录下运行：
   ```
   docker-compose up --build
   ```
4. 前端访问地址： [http://localhost:8080](http://localhost:8080)
5. 后端接口访问地址： [http://localhost:5000](http://localhost:5000)

## 独立运行服务

### 运行后端服务
1. 进入后端目录：
   ```
   cd backend
   ```
2. 安装依赖：
   ```
   pip install -r requirements.txt
   ```
3. 配置环境变量：
   ```
   # Windows
   set MYSQL_HOST=localhost
   set MYSQL_PORT=3306
   set MYSQL_USER=robin
   set MYSQL_PASSWORD=Robin123
   set MYSQL_DATABASE=rag
   set VLLM_SERVICE_URL=http://localhost:8000

   # Linux/MacOS
   export MYSQL_HOST=localhost
   export MYSQL_PORT=3306
   export MYSQL_USER=root
   export MYSQL_PASSWORD=password
   export MYSQL_DATABASE=rag
   export VLLM_SERVICE_URL=http://localhost:8000
   ```
4. 启动后端服务：
   ```
   # 开发模式
   python app.py

   # 或使用生产环境配置
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

### 运行前端服务
1. 进入前端目录：
   ```
   cd frontend
   ```
2. 安装依赖：
   ```
   npm install
   ```
3. 开发模式运行：
   ```
   npm run serve
   ```
   开发服务器将在 http://localhost:8080 启动

4. 构建生产版本：
   ```
   npm run build
   ```
   构建后的文件将生成在 dist 目录中

## 其他说明
- 数据卷 mysql_data 用于持久化 MySQL 数据，请确保 Docker 环境中具备相关权限。
- 前后端服务的构建文件均位于 `./docker` 文件夹中。
