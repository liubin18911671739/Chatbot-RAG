# 棠心问答 - iChat RAG-QA 智能问答系统

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/liubin18911671739/ichat)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.2.0-green.svg)](https://github.com/liubin18911671739/ichat)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![Vue](https://img.shields.io/badge/vue-3.0+-green.svg)](https://vuejs.org/)

> **专为北京第二外国语学院打造的智能校园问答系统**

[📖 开发者指南](DEVELOP.md) | [👥 用户手册](USERGUIDE.md) | [📋 项目进度](TODO.md) | [🔧 API文档](http://localhost:5000/api/docs)

## 🎯 项目概述

**棠心问答 (iChat)** 是一个基于 **RAG (Retrieval-Augmented Generation)** 技术的智能问答系统，专为北京第二外国语学院校园环境设计。系统整合了先进的自然语言处理技术、向量数据库和大语言模型，为师生提供准确、高效的智能问答服务。

### 🌟 核心特性

- **🤖 RAG 智能问答**: 基于检索增强生成技术，提供准确的专业回答
- **🔍 语义搜索引擎**: FAISS 向量数据库，毫秒级检索速度 (<1ms)
- **🌐 多语言支持**: 完美支持中英文等多种语言
- **📚 知识场景管理**: 6大专业领域知识库 (思政、学习指导、科研等)
- **🏫 校园网安全**: 多重网络验证机制，确保校园内网使用
- **📱 多端支持**: Web前端 + 微信小程序，随时随地访问
- **⚡ 高性能架构**: 支持并发100+用户，99.9%系统可用性
- **🔒 企业级安全**: JWT认证 + RADIUS校园网集成认证

## 🏗️ 系统架构

```mermaid
graph TB
    A[用户界面层] --> B[API网关层]
    B --> C[业务逻辑层]
    C --> D[数据访问层]
    D --> E[存储层]

    A1[Web前端<br/>Vue 3 + Element Plus] --> A
    A2[微信小程序<br/>原生小程序] --> A

    B1[Nginx反向代理] --> B
    B2[JWT认证] --> B
    B3[RADIUS认证] --> B

    C1[聊天服务] --> C
    C2[RAG服务] --> C
    C3[文档处理] --> C
    C4[向量服务] --> C

    D1[SQLAlchemy ORM] --> D
    D2[缓存层] --> D

    E1[SQLite/MySQL/PostgreSQL] --> E
    E2[FAISS向量数据库] --> E
    E3[文件存储] --> E
```

### 技术栈

#### 后端架构
- **Web框架**: Flask 3.1.0 + Flask-CORS
- **数据库**: SQLAlchemy 2.0.38 (支持MySQL/PostgreSQL/SQLite)
- **认证**: Flask-JWT-Extended + PyRAD (RADIUS)
- **AI引擎**: Google Gemini + DeepSeek 双LLM支持
- **向量搜索**: FAISS 1.10.0 + sentence-transformers
- **文档处理**: PyPDF2, python-docx, langchain
- **测试**: pytest 8.3.5 + 覆盖率报告

#### 前端架构
- **框架**: Vue 3 + Composition API
- **UI组件**: Element Plus 2.9.6
- **状态管理**: Pinia 2.1.7
- **路由**: Vue Router 4.0.0
- **HTTP客户端**: Axios 0.21.4
- **可视化**: ECharts 6.0.0
- **测试**: Jest 29.7.0 + Cypress 12.17.4

#### 基础设施
- **容器化**: Docker + Docker Compose
- **Web服务器**: Nginx (反向代理 + 静态资源)
- **应用服务器**: Gunicorn 23.0.0
- **监控**: 日志轮转 + 健康检查

## 🚀 快速开始

### 环境要求

- **Python**: 3.9+
- **Node.js**: 16.0+
- **Docker**: 20.0+ (可选)
- **内存**: 4GB+ (向量模型需要)
- **存储**: 10GB+ (文档和向量数据)

### 一键部署 (推荐)

```bash
# 克隆项目
git clone https://github.com/liubin18911671739/ichat.git
cd ichat

# 启动完整系统 (包含所有服务)
docker-compose up --build

# 访问系统
# Web前端: http://localhost:8080
# 后端API: http://localhost:5000
# API文档: http://localhost:5000/api/docs
```

### 开发环境设置

#### 1. 后端服务

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 创建测试管理员
python create_test_admin.py  # 用户名: admin, 密码: admin@123

# 启动开发服务器
python app.py
```

#### 2. 前端服务

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器 (代理后端API)
npm run serve

# 构建生产版本
npm run build
```

#### 3. 微信小程序

1. 使用微信开发者工具打开 `miniprogram` 目录
2. 配置 AppID: `wxa3fc6e84217531a2`
3. 在小程序管理后台配置服务器域名
4. 管理员密码: `bisu2024admin`

## 📚 功能特性

### 智能问答系统

- **场景化知识库**: 6个专业领域，针对性回答
- **上下文理解**: 支持多轮对话，记忆历史记录
- **来源标注**: 自动引用相关文档片段
- **智能推荐**: 基于用户历史的个性化建议

### 知识场景

| 场景ID | 场景名称 | 描述 | 状态 |
|--------|----------|------|------|
| `db_sizheng` | 思政学习空间 | 思想政治教育资源 | ✅ 可用 |
| `db_xuexizhidao` | 学习指导 | 学习方法与指导服务 | 🚧 开发中 |
| `db_zhihuisizheng` | 智慧思政 | 智能化思政教育平台 | 🚧 开发中 |
| `db_keyanfuzhu` | 科研辅助 | 科研工作辅助服务 | 🚧 开发中 |
| `db_wangshangbanshiting` | 网上办事厅 | 校园行政服务 | 🚧 开发中 |
| `general` | 通用助手 | 综合问答助手 | ✅ 可用 |

### 文档管理

- **多格式支持**: PDF, DOCX, TXT, Markdown
- **智能分片**: 基于语义的文本分割 (500字符/块)
- **批量处理**: 大文件异步处理，进度跟踪
- **元数据提取**: 自动提取页码、章节信息

### 校园网安全机制

#### 多重验证体系
1. **API连通性**: 验证校园内部服务器可达性
2. **IP地址检查**: 验证是否在校园网段 (10.10.0.0/16等)
3. **GPS定位**: 基于地理位置的校园边界验证
4. **管理员权限**: 密码保护的高级配置功能

#### 配置管理
- **动态配置**: 实时调整网络限制策略
- **访问日志**: 详细的访问记录和安全审计
- **环境适配**: 支持开发/测试/生产环境差异化配置

## 🔧 API 接口

### 核心接口

```http
# 智能问答
POST /api/chat
Content-Type: application/json

{
  "prompt": "请问图书馆的开馆时间？",
  "scene_id": "general",
  "user_id": "user123"
}
```

```http
# 用户认证
POST /api/hybrid_auth
Content-Type: application/json

{
  "username": "student@bisu.edu.cn",
  "password": "password",
  "radius_mode": true
}
```

```http
# 知识场景列表
GET /api/scenes

# 推荐问题
GET /api/suggestions?scene_id=db_sizheng

# 用户反馈
POST /api/feedback
```

### 完整API文档

启动后端服务后，访问 `http://localhost:5000/api/docs` 查看完整的Swagger API文档。

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
./run_all_tests.sh

# 后端测试
cd backend
python -m pytest tests/ -v --cov=. --cov-report=html

# 前端测试
cd frontend
npm test                    # 单元测试
npm run test:coverage      # 覆盖率报告
npm run cypress:open       # E2E测试

# 向量服务快速测试
cd backend
python test_vector_quick.py
```

### 测试覆盖

- **后端**: 70% 代码覆盖率，核心功能 100%
- **前端**: 单元测试 + E2E 测试
- **集成**: API接口完整测试
- **性能**: 并发压力测试

## 📊 性能指标

| 指标 | 数值 | 说明 |
|------|------|------|
| 向量检索 | <1ms | Top-10 相似度搜索 |
| 文档处理 | ~15s | 1000条文档批量处理 |
| 并发用户 | 100+ | 同时在线用户支持 |
| 系统可用性 | 99.9% | 生产环境稳定性 |
| 响应时间 | <2s | 平均问答响应时间 |

## 🔒 安全特性

- **JWT令牌**: 安全的用户会话管理
- **RADIUS集成**: 校园网统一身份认证
- **HTTPS支持**: 生产环境数据传输加密
- **输入验证**: 防止SQL注入和XSS攻击
- **访问控制**: 基于角色的权限管理
- **审计日志**: 完整的操作记录追踪

## 🛠️ 故障排除

### 常见问题

#### 1. 向量模型下载失败
```bash
# 手动下载sentence-transformers模型
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"
```

#### 2. 校园网认证失败
- 检查网络连接是否在校园网范围内
- 验证RADIUS服务器配置
- 确认防火墙设置

#### 3. Docker启动失败
```bash
# 清理Docker缓存
docker system prune -a
docker-compose down --volumes
docker-compose up --build
```

#### 4. 前端代理错误
```javascript
// 检查 vue.config.cjs 中的代理配置
target: 'http://localhost:5000',  // 本地开发
// target: 'http://10.10.15.211:5000',  // 生产服务器
```

### 日志查看

```bash
# 查看应用日志
tail -f backend/logs/app.log

# 查看Docker日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📈 项目状态

- **当前版本**: v1.2.0
- **开发状态**: 🟢 生产就绪
- **完成度**: 85%
- **核心功能**: 95% 完成
- **测试覆盖**: 70%

### 最新更新 (v1.2.0)

- ✅ 完整RAG管线实现
- ✅ FAISS向量数据库集成
- ✅ 多格式文档处理支持
- ✅ 校园网安全机制
- ✅ 微信小程序上线
- ✅ 性能优化和缓存机制

## 🤝 贡献指南

### 开发流程

1. **Fork项目** 并创建功能分支
2. **编写代码** 并遵循代码规范
3. **添加测试** 确保功能正常
4. **提交代码** 并创建Pull Request
5. **代码审查** 通过后合并

### 代码规范

- **Python**: 遵循PEP 8规范
- **JavaScript**: 使用ESLint配置
- **Git提交**: 采用Conventional Commits格式
- **文档**: 保持Markdown格式整洁

### 开发环境

- 使用 `pre-commit` 钩子进行代码检查
- 遵循项目的目录结构规范
- 为新功能编写相应的测试用例
- 更新相关文档和API说明

## 📞 支持与联系

### 技术支持

- **项目负责人**: liubin18911671739
- **技术支持邮箱**: support@bisu.edu.cn
- **问题反馈**: [GitHub Issues](https://github.com/liubin18911671739/ichat/issues)
- **文档首页**: [项目Wiki](https://github.com/liubin18911671739/ichat/wiki)

### 文档资源

- [📖 开发者指南](DEVELOP.md) - 详细开发文档
- [👥 用户手册](USERGUIDE.md) - 用户使用指南
- [📋 项目进度](TODO.md) - 开发进度报告
- [🔧 API文档](http://localhost:5000/api/docs) - 完整接口文档

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) - 详见 LICENSE 文件

---

<div align="center">

**[⬆ 回到顶部](#棠心问答---ichat-rag-qa-智能问答系统)**

Made with ❤️ by [北京第二外国语学院](https://www.bisu.edu.cn/)

</div># Chatbot-RAG
# Chatbot-RAG
