# iChat Rag-QA System
{
  "registry-mirrors": [
    "https://registry.cn-hangzhou.aliyuncs.com",
    "https://mirror.ccs.tencentyun.com",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}

## 项目简介
该项目是一个基于 Docker 的问答系统，利用前后端分离架构，实现了前端展示、后端业务，以及数据库和模型服务之间的协同工作。

## 架构说明
- **Frontend**: 构建前端显示界面，服务于用户请求。侦听端口 8080，并通过 Nginx 提供静态资源。
- **Backend**: 后端服务，处理业务逻辑，侦听端口 5000，RAG 模型服务。

## 部署指南
1. 将所有代码克隆到本地开发环境。
2. 修改 docker-compose.yml 文件中的环境变量（如数据库连接字符串等）。
3. 在项目根目录下运行：
   ```
   docker-compose up --build
   ```
4. 前端访问地址： [http://localhost:8080](http://localhost:8080)
5. 后端接口访问地址： [http://localhost:5000](http://localhost:5000)

# 后端使用flask API
## 聊天接口
@bp.route('/chat', methods=['POST'])
def chat():
## /chat 示例：
{
  "prompt": "你好，请问什么是中国特色社会主义？"
}
{
    "attachment_data": [],
    "response": "<深度思考>\n嗯，我现在要回答的问题是：“你好，请问什么是中国特色社会主义？”首先，我需要理解这个问题的背景和相关内容。中国特色社会主义是一个政治术语，通常用于描述中国在发展过程中所采取的特定模式。\n我记得，这个概念结合了马克思列宁主义、毛泽东思想、邓小平理论、“三个代表”重要思想、科学发展观以及习近平新时代中国特色社会主义思想。这些理论共同构成了中国共产党的指导思想，用于推动国家的发展和改革。\n接下来，我应该考虑如何简明扼要地解释这个概念。我需要提到它是马克思列宁主义基本原则与中国实际相结合的结果，同时强调改革开放和现代化建设的重要性。还要指出，它强调以人民为中心，实现共同富裕，以及坚持和发展中国特色社会主义道路。\n最后，我应该确保回答准确，不使用任何编造的信息，并保持语言简洁明了。\n</深度思考>\n中国特色社会主义是马克思列宁主义基本原则与中国具体实际相结合的产物，是改革开放和现代化建设的指导思想。它强调以人民为中心，推动共同富裕，同时坚持走中国特色社会主义道路。",
    "special_note": "",
    "status": "success"
}

# 场景列表接口
@bp.route('/scenes', methods=['GET'])
def get_scenes():
## /scenes
{
    "学习指导": {
        "description": "学习方法与指导服务",
        "icon": "📖",
        "id": "db_xuexizhidao",
        "status": "developing"
    },
    "思政学习空间": {
        "description": "思想政治教育资源",
        "icon": "📚",
        "id": "db_sizheng",
        "status": "available"
    },
    "智慧思政": {
        "description": "智能化思政教育平台",
        "icon": "💡",
        "id": "db_zhihuisizheng",
        "status": "developing"
    },
    "科研辅助": {
        "description": "科研工作辅助服务",
        "icon": "🔬",
        "id": "db_keyanfuzhu",
        "status": "developing"
    },
    "网上办事大厅": {
        "description": "在线办事服务平台",
        "icon": "🏢",
        "id": "db_wangshangbanshiting",
        "status": "developing"
    },
    "通用助手": {
        "description": "棠心问答通用助手",
        "icon": "🎓",
        "id": null,
        "status": "available"
    }
}

# 反馈接口
@bp.route('/feedback', methods=['POST'])
def feedback():
    """处理用户反馈"""
    data = request.get_json()
    # 实现反馈处理逻辑
    return jsonify({"status": "success", "message": "感谢您的反馈"})

# 问候语接口
@bp.route('/greeting', methods=['GET'])
def greeting():
    """获取问候语"""
    # 实现获取问候语的逻辑
    greeting_text = "欢迎使用我们的QA系统!"
    return jsonify({"status": "success", "greeting": greeting_text})



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

3. 启动后端服务：
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


# admin-end 
基于 Flask Bootstrap 的后台管理系统，提供 RAG 系统的管理界面和数据可视化功能。

## 系统概述
admin-end 是一个专为管理员设计的后台管理系统，用于管理 RAG 问答系统的文档库、查看系统运行状态及用户使用情况统计。该系统采用 Flask 作为后端框架，Bootstrap 作为前端 UI 框架，实现了简洁美观的管理界面。

## 功能特点
- **文档管理**：上传、删除和更新 RAG 系统的知识库文档
- **数据可视化**：图表展示系统使用情况、热门问题及性能指标
- **用户管理**：查看用户活动和使用统计
- **系统监控**：实时监控系统资源使用情况和模型运行状态
- **日志查询**：便捷查看系统日志和错误记录

## 运行指南
1. 进入 admin-end 目录：
   ```
   cd admin-end
   ```

2. 安装依赖：
   ```
   pip install -r requirements.txt
   ```

3. 启动管理后台：
   ```
   python admin.py
   ```
   或使用生产环境配置:
   ```
   gunicorn -w 2 -b 0.0.0.0:5001 admin:app
   ```

4. 访问管理界面：http://localhost:5001/admin

## 文档上传指南
1. 登录管理后台
2. 导航至"文档管理"页面
3. 点击"上传文档"按钮
4. 选择文档类型（PDF、DOCX、TXT等）
5. 选择分类目录
6. 上传文件并等待系统处理
7. 系统会自动提取、分割文档并更新知识库

## API 接口
管理后台提供以下主要 API 接口：

- `/admin/api/documents` - 文档管理接口
- `/admin/api/statistics` - 系统统计数据接口
- `/admin/api/users` - 用户数据接口
- `/admin/api/logs` - 系统日志接口
- `/admin/api/health` - 系统健康检查接口

## 权限控制
管理后台实现了基于角色的访问控制：
- 超级管理员：拥有所有权限
- 内容管理员：可以管理文档，但无法修改系统设置
- 只读用户：只能查看数据，不能进行操作

## Docker 部署
可通过 Docker 独立部署 admin-end：

```
docker build -t admin-end -f admin-end/Dockerfile .
docker run -d -p 5001:5001 --name admin-system admin-end
```
