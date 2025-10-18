# iChat Rag-QA System

[Contributor Guide → AGENTS.md](AGENTS.md)
{
  "registry-mirrors": [
    "https://registry.cn-hangzhou.aliyuncs.com",
    "https://mirror.ccs.tencentyun.com",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}

## 项目简介
该项目是一个基于 Docker 的**RAG (检索增强生成) 问答系统**，利用前后端分离架构，实现了前端展示、后端业务，以及数据库和模型服务之间的协同工作。系统集成了**向量数据库**和**语义搜索**功能，支持智能文档检索和知识问答。该系统专为北京第二外国语学院设计，具有校园网络访问限制功能，确保只能在校园内网环境中使用。

## 核心特性 ✨
- 🤖 **RAG 智能问答**: 基于检索增强生成技术的智能对话系统
- 🔍 **语义搜索**: 使用 FAISS 向量数据库实现高效的语义检索 (< 1ms)
- 🌐 **多语言支持**: 支持中英文等多种语言的文本向量化
- 📚 **知识库管理**: 支持多场景知识库，包括思政学习、学习指导等
- 🏫 **校园网限制**: 完善的校园网络访问控制机制
- 🎯 **高性能**: 毫秒级向量检索，支持每秒 1000+ 查询

## 架构说明
- **Frontend**: 构建前端显示界面，服务于用户请求。侦听端口 8080，并通过 Nginx 提供静态资源。
- **Backend**: 后端服务，处理业务逻辑，侦听端口 5000，集成 RAG 模型和向量搜索服务。
- **Vector Database**: FAISS 向量数据库，提供高效的语义搜索能力 (384维向量)。
- **Embedding Service**: 基于 sentence-transformers 的多语言文本向量化服务。
- **Miniprogram**: 微信小程序客户端，具有校园网络访问控制和管理功能。

## 校园网络限制功能
### 功能概述
本系统实现了完善的校园网络访问限制机制，确保微信小程序只能在北京第二外国语学院校园网环境中使用，防止外网访问。

### 核心特性
- **多重网络验证**: 通过API连通性、IP范围和地理位置多重验证确保校园网环境
- **智能访问控制**: 自动检测网络环境，非校园网用户将被重定向到访问拒绝页面
- **管理员配置界面**: 提供密码保护的管理后台，可实时配置网络限制策略
- **访问日志记录**: 详细记录所有访问尝试，便于安全审计
- **用户友好提示**: 为被拒绝访问的用户提供详细的帮助信息和联系方式

### 技术实现
- **NetworkValidator**: 核心网络验证类，负责所有网络环境检测
- **校园API检测**: 验证与校园内部服务器(10.10.15.211, 10.10.15.210)的连通性
- **IP范围验证**: 检查用户IP是否在校园网段(10.10.0.0/16, 192.168.0.0/16, 172.16.0.0/12)
- **地理位置校验**: 基于GPS坐标验证用户是否在校园范围内
- **环境配置**: 支持开发/测试/生产环境的差异化配置

## 部署指南
1. 将所有代码克隆到本地开发环境。
2. 修改 docker-compose.yml 文件中的环境变量（如数据库连接字符串等）。
3. 在项目根目录下运行：
   ```
   docker-compose up --build
   ```
4. 前端访问地址： [http://localhost:8080](http://localhost:8080)
5. 后端接口访问地址： [http://10.10.15.210:5000](http://10.10.15.210:5000)

## 校园网络限制配置指南

### 管理员访问
1. 在微信小程序中进入"个人中心"页面
2. 点击"管理员配置"选项
3. 输入管理员密码: `bisu2024admin`
4. 进入管理界面进行网络限制配置

### 配置选项
- **启用校园网限制**: 控制是否启用网络访问限制
- **开发模式**: 开发环境下可绕过网络限制
- **校园API服务器**: 配置校园内部API服务器地址
- **访问日志**: 查看和管理访问尝试记录

### 网络验证机制
1. **API连通性检测**: 尝试连接校园内部API服务器(10.10.15.211, 10.10.15.210)
2. **IP地址验证**: 检查用户IP是否在校园网段范围内
3. **地理位置验证**: 基于GPS坐标验证用户是否在校园边界内
4. **多重验证**: 任一验证通过即可访问，提高可用性

### 故障排除
- 确保校园网连接正常
- 检查防火墙设置是否阻止API访问
- 验证GPS定位权限已开启
- 联系技术支持: support@bisu.edu.cn

### 部署注意事项
- 生产环境务必启用网络限制
- 定期检查校园API服务器可用性
- 监控访问日志异常情况
- 备份管理员配置和访问日志

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
    "8001": {
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
    greeting_text = "欢迎使用我们的QA系统！我是棠心问答AI辅导员，随时为你提供帮助～可以解答思想困惑、学业指导、心理调适等成长问题，也能推荐校园资源。请随时告诉我你的需求，我会用AI智慧陪伴你成长！✨"
    return jsonify({"status": "success", "greeting": greeting_text})

## 向量数据库集成 🔍

### 功能概述
系统集成了基于 FAISS 和 sentence-transformers 的向量数据库，提供高效的语义搜索能力。

### 核心组件
- **Embedding Service** (`backend/services/embedding_service.py`)
  - 使用 `paraphrase-multilingual-MiniLM-L12-v2` 多语言模型
  - 支持中文、英文等多种语言
  - 向量维度: 384
  - LRU 缓存优化

- **Vector Service** (`backend/services/vector_service.py`)
  - FAISS 向量索引 (Flat/IVFFlat/HNSW)
  - Top-K 相似度搜索
  - 索引持久化
  - 批量操作支持

### 性能指标
| 操作 | 性能 |
|------|------|
| 向量搜索 (Top-10) | < 1ms |
| 批量向量化 (1000条) | ~15s |
| 吞吐量 | > 1000 queries/sec |

### 快速测试
```bash
cd backend
source ../venv/bin/activate
python test_vector_quick.py
```

### 详细文档
- 📖 [使用手册](backend/services/VECTOR_INTEGRATION_README.md)
- 📝 [实现总结](backend/VECTOR_INTEGRATION_SUMMARY.md)
- 📦 [交付清单](backend/VECTOR_INTEGRATION_DELIVERY.md)
- 💡 [代码示例](backend/examples_vector_usage.py)

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
   
   **注意**: 首次运行会自动下载向量化模型 (~120MB)
  
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

# Using Claude 3.7 Agent for Complete System Development and Deployment

## System Overview Prompt
```
# iChat RAG-QA System Development Specification

## Project Overview
Create a comprehensive Retrieval-Augmented Generation Question-Answering (RAG-QA) system called "iChat" with the following components:
1. Frontend web application using Vue.js
2. Backend API service using Flask
3. Admin dashboard for system management
4. Docker-based deployment architecture

## System Architecture

### Frontend (Vue.js)
- Single page application with responsive design
- Features:
  - User authentication
  - Chat interface for question answering
  - Multiple scene selection for different knowledge domains
  - History tracking of past conversations
  - Feedback mechanism for answers
  - User preferences settings
- UI Components:
  - Login page
  - Main chat interface
  - Scene selection panel
  - Settings page
  - About/Help documentation

### Backend (Flask)
- RESTful API endpoints:
  - /chat - For receiving queries and providing answers
  - /scenes - For retrieving available knowledge domains
  - /feedback - For collecting user feedback
  - /greeting - For personalized welcome messages
  - /history - For retrieving chat history
- Core Services:
  - Authentication service
  - RAG pipeline implementation
  - Vector database integration (using Milvus)
  - Document processing and indexing
  - Knowledge base management
  - Logging and analytics

### Admin Dashboard (Flask + Bootstrap)
- Web interface for system administrators
- Features:
  - Document management (upload, delete, update)
  - System performance monitoring
  - Usage statistics and visualizations
  - User activity tracking
  - Configuration management
  - Log viewing and analysis
- API Endpoints:
  - /admin/api/documents
  - /admin/api/statistics
  - /admin/api/users
  - /admin/api/logs
  - /admin/api/health

### Database Architecture
- MongoDB for storing:
  - User information
  - Chat histories
  - System configurations
  - Feedback data
- Milvus for vector storage:
  - Document embeddings
  - Semantic search capability

## Technical Implementation Details

### RAG Implementation
- Text segmentation and chunking
- Embedding generation using sentence transformers
- Vector indexing and retrieval
- Context augmentation
- LLM integration (with configurable model choice)

### Docker Deployment
- Multi-container setup using docker-compose
- Container Services:
  - frontend (Vue.js + Nginx)
  - backend (Flask)
  - admin-end (Flask)
  - mongodb
  - milvus
  - llm-service (optional, for local model deployment)
- Network configuration with appropriate port mappings
- Volume mounting for persistent data

### Security Considerations
- JWT-based authentication
- Rate limiting
- Input validation
- CORS configuration
- Environment-based secrets management

## Development Requirements
- Use Python 3.9+ for backend services
- Vue.js 3 with Composition API for frontend
- Implement comprehensive testing (unit and integration tests)
- Follow PEP 8 style guidelines for Python code
- Include detailed documentation for API endpoints and deployment process
- Implement proper error handling and logging throughout the system

## Scene-Specific Knowledge Domains
Implement specialized knowledge bases for:
1. Academic Learning Guidance
2. Political Education Resources
3. Smart Political Education
4. Research Assistance
5. Online Administrative Services
6. General Assistant

Each domain should have dedicated document collections, customized retrieval strategies, and domain-specific answer formatting.

## Performance Expectations
- Response time under 2 seconds for typical queries
- Support for concurrent users (minimum 100)
- Horizontal scalability design
- Efficient resource utilization (CPU/RAM)
- Graceful degradation under heavy load

Please implement this system with clean, well-structured code that follows best practices for each technology used. Include comprehensive documentation and deployment instructions.
```

10.10.15.210:5001: 
/api/suggestions
## Suggestions API, get
json
{
  "suggestions": [
    "问题密集书库的图书可以外借吗",
    "借阅图书遗失如何处理？"
  ]

}

/api/questions
## Questions API, get
json
{
  "questions": [
    {
      "id": 1,
      "question": "问题密集书库的图书可以外借吗",
      "answer": "问题密集书库的图书一般不允许外借，主要用于现场阅读和学习。",
      "userid": "user1",
      "status": "reviewed"
    },
    {
      "id": 2,
      "question": "借阅图书遗失如何处理？",
      "answer": "如果借阅的图书遗失，请及时联系图书馆工作人员进行处理，可能需要赔偿或补办手续。",
      "userid": "user2",
      "status": "reviewed"
    },
    {
      "id": 3,
      "question": "借的书在哪儿还？",
      "answer": "请将借阅的图书归还到图书馆的指定还书地点。",
      "userid": "user3",
      "status": "unreview"
    }
  ]
}

/api/questions
## Questions insert, post, 后端需要查重然后插入
json
{
  "question": "新的问题1",
  "answer": "问题的答案1",
  "userid": "user4",
  "status": "reviewed"
}

{
  "question": "新的问题2",
  "answer": "问题的答案2",
  "userid": "user5",
  "status": "unreview"
}

/api/update/{id}
## Questions updateAPI, post
json
{
  "question": "更新后的问题",
  "answer": "更新后的答案",
  "userid": "user6",
  "status": "reviewed"
}

/api/delete/{id}
## Questions delete API, post
json
{
  "status": "success"
}

/api/search
## Questions search API, get
## params
{
  "query": "借阅图书遗失"
}
json
{
  "id": 1213
}

## 前端中处理多个 params
  try {
    const response = await axios.get('/api/search', {
      params: {
        key: btoa(unescape(encodeURIComponent(searchOptions.query))),
        include_unreviewed: searchOptions.includeUnreviewed,
        page: searchOptions.page || 1,
        limit: searchOptions.limit || 10,
        sort: searchOptions.sort || 'created_at',
        order: searchOptions.order || 'desc'
      }
    });
    return response.data;
  } catch (error) {
    console.error('搜索失败:', error);
    throw error;
  }

  ⏺ Bash(python create_test_admin.py)
  ⎿  成功创建测试管理员用户:      
       用户名: admin
       邮箱: admin@ichat.com

## 技术栈 🛠️

### 后端
- **框架**: Flask 3.1.0
- **数据库**: PostgreSQL / MySQL / SQLite
- **ORM**: SQLAlchemy 2.0.38
- **认证**: Flask-JWT-Extended 4.7.1
- **向量数据库**: FAISS 1.10.0
- **文本向量化**: sentence-transformers 3.4.1
- **机器学习**: PyTorch 2.6.0, scikit-learn 1.6.1
- **文档处理**: PyPDF2, python-docx
- **LLM集成**: Google Gemini, DeepSeek

### 前端
- **框架**: Vue 3.0
- **UI组件**: Element Plus 2.9.6
- **状态管理**: Vuex 4.0 / Pinia 2.1.7
- **路由**: Vue Router 4.0
- **HTTP客户端**: Axios 0.21.4
- **图表**: ECharts 6.0.0

### 测试
- **后端测试**: pytest 8.3.5, pytest-cov 6.0.0
- **前端测试**: Jest 29.7.0, Cypress 12.17.4
- **测试覆盖率**: 21% (核心模块 100%)

### 部署
- **容器化**: Docker, Docker Compose
- **服务器**: Gunicorn 23.0.0
- **反向代理**: Nginx

## 测试 🧪

### 运行所有测试
```bash
# 一键运行所有测试
./run_all_tests.sh
```

### 后端测试
```bash
cd backend

# 运行核心测试
pytest tests/test_smoke.py tests/test_services.py -v

# 运行向量数据库测试
python test_vector_quick.py

# 运行完整测试套件
pytest tests/ -v --cov=. --cov-report=html
```

### 前端测试
```bash
cd frontend

# 运行单元测试
npm test

# 运行测试覆盖率
npm run test:coverage

# 运行 E2E 测试
npm run cypress:open
```

### 测试覆盖
- ✅ 后端核心功能: 10个测试全部通过
- ✅ 向量数据库: 55+ 单元测试
- ✅ 前端组件: 7个测试通过

## 项目结构 📁

```
ichat/
├── backend/                      # 后端服务
│   ├── app.py                   # Flask 应用入口
│   ├── config.py                # 配置文件
│   ├── requirements.txt         # Python 依赖
│   ├── models/                  # 数据模型
│   │   └── database.py         # 数据库模型
│   ├── routes/                  # API 路由
│   │   ├── auth.py             # 认证路由
│   │   ├── chat.py             # 聊天路由
│   │   └── ...
│   ├── services/                # 业务服务
│   │   ├── embedding_service.py # 文本向量化 ✨
│   │   ├── vector_service.py    # 向量存储 ✨
│   │   ├── rag_service.py       # RAG 检索生成
│   │   └── chat_service.py      # 聊天服务
│   ├── tests/                   # 测试文件
│   │   ├── test_smoke.py       # 基础测试
│   │   ├── test_services.py    # 服务测试
│   │   ├── test_embedding_service.py  # Embedding 测试 ✨
│   │   └── test_vector_service.py     # Vector 测试 ✨
│   ├── models/                  # 向量模型缓存 ✨
│   └── vector_store/            # FAISS 索引存储 ✨
├── frontend/                     # 前端应用
│   ├── src/
│   │   ├── views/              # 页面组件
│   │   ├── components/         # 通用组件
│   │   ├── store/              # 状态管理
│   │   └── services/           # API 服务
│   ├── tests/                   # 前端测试
│   └── package.json
├── miniprogram/                  # 微信小程序
│   ├── pages/                   # 小程序页面
│   ├── utils/                   # 工具函数
│   └── config/                  # 配置文件
├── docs/                         # 文档
│   ├── TESTING_QUICKSTART.md   # 测试快速入门
│   ├── TESTING_STATUS.md       # 测试状态
│   └── ...
├── docker-compose.yml           # Docker 编排
├── TODO.md                      # 任务清单
└── README.md                    # 项目文档

✨ = 新增向量数据库相关文件
```

## 开发路线图 🗓️

### ✅ 已完成 (Phase 1)
- [x] 基础架构搭建
- [x] 用户认证系统
- [x] 聊天功能
- [x] 场景管理
- [x] 校园网限制
- [x] 向量数据库集成 ✨
- [x] 语义搜索功能 ✨
- [x] 测试框架

### 🚧 进行中 (Phase 2)
- [ ] 文档处理管线
- [ ] 文档管理 API
- [ ] RAG 检索优化
- [ ] 管理后台完善

### 📋 计划中 (Phase 3)
- [ ] 混合检索 (BM25 + 向量)
- [ ] 重排序优化
- [ ] 对话历史管理
- [ ] 性能监控
- [ ] 用户反馈系统

## 贡献指南 🤝

欢迎贡献！请查看 [AGENTS.md](AGENTS.md) 了解详细的贡献指南。

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范
- Python: PEP 8
- JavaScript: ESLint
- 提交信息: Conventional Commits

## 许可证 📄

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式 📧

- **项目维护**: liubin18911671739
- **技术支持**: support@bisu.edu.cn
- **问题反馈**: [GitHub Issues](https://github.com/liubin18911671739/ichat/issues)

## 致谢 🙏

- 感谢北京第二外国语学院的支持
- 感谢所有贡献者的付出
- 基于 FAISS、sentence-transformers 等优秀开源项目

---

**最后更新**: 2025-10-18
**版本**: 1.0.0
**状态**: 🚀 持续开发中
