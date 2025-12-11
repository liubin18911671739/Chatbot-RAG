# Claude 复现版 - RAG问答机器人FastAPI后端超级提示词

> 💡 **使用说明**: 将此提示词提供给Claude Code，基于现有项目架构完整实现FastAPI + PostgreSQL + 智普清言的RAG后端系统。

---

## 🚀 RAG问答机器人后端完整实现 - FastAPI + PostgreSQL + 智普清言

### 项目概述
基于现有的项目架构，实现一个完整的RAG问答机器人后端系统。系统从当前的Flask + FAISS + Google Gemini/DeepSeek架构迁移到FastAPI + PostgreSQL + pgvector + 智普清言架构，提供高性能的智能问答服务。

### 现有项目资源
- ✅ 完整的PostgreSQL迁移方案: `docs/postgresql-zhipu-migration.md`
- ✅ Shared Packages: `packages/shared/` (API服务、类型定义、React Hooks)
- ✅ Docker配置: `docker-compose.postgres.yml`
- ✅ 数据库架构: auth, rag, chat三个schema的完整设计
- ✅ 智普清言服务类: ZhipuAIService, VectorService, RAGService

### 技术架构要求

#### 核心技术栈
- **Web框架**: FastAPI 0.104+ (Python 3.11+)
- **数据库**: PostgreSQL 15+ with pgvector扩展
- **ORM**: SQLAlchemy 2.0+ + Alembic
- **AI服务**: 智普清言 API (Embedding + Chat)
- **认证**: JWT + OAuth2 (password flow)
- **缓存**: Redis (向量缓存和搜索结果缓存)
- **任务队列**: Celery + Redis (异步文档处理)
- **监控**: Prometheus + 结构化日志

#### 项目结构
```
backend-v2/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI应用入口
│   ├── config.py              # 配置管理
│   ├── database.py            # 数据库连接
│   ├── dependencies.py        # 依赖注入
│   ├── models/                # SQLAlchemy模型
│   │   ├── __init__.py
│   │   ├── auth.py            # 用户认证模型
│   │   ├── rag.py             # RAG相关模型
│   │   ├── chat.py            # 聊天模型
│   │   └── vector.py          # 向量模型
│   ├── schemas/               # Pydantic模型
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── rag.py
│   │   ├── chat.py
│   │   └── user.py
│   ├── services/              # 业务逻辑服务
│   │   ├── __init__.py
│   │   ├── zhipu_service.py   # 智普清言API服务
│   │   ├── vector_service.py  # pgvector服务
│   │   ├── rag_service.py      # RAG核心服务
│   │   ├── auth_service.py    # 认证服务
│   │   ├── cache_service.py   # Redis缓存服务
│   │   └── migration_service.py # 数据迁移服务
│   ├── api/                   # API路由
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py        # 认证接口
│   │   │   ├── chat.py        # 聊天接口
│   │   │   ├── documents.py   # 文档管理接口
│   │   │   ├── users.py        # 用户管理接口
│   │   │   └── admin.py        # 管理员接口
│   │   └── deps.py             # API依赖
│   ├── core/                  # 核心功能
│   │   ├── __init__.py
│   │   ├── security.py        # 安全相关
│   │   ├── exceptions.py      # 异常处理
│   │   ├── middleware.py      # 中间件
│   │   └── logging.py         # 日志配置
│   └── utils/                 # 工具函数
├── migrations/               # 数据库迁移
├── scripts/                  # 脚本文件
├── tests/                    # 测试文件
├── requirements.txt          # 依赖包
├── .env.example             # 环境变量示例
├── docker-compose.yml       # Docker配置
└── README.md                # 项目说明
```

### 核心实现要求

#### 1. 数据库架构 (PostgreSQL + pgvector)

基于`docs/postgresql-zhipu-migration.md`中的完整schema设计：

```sql
-- 创建数据库和扩展
CREATE DATABASE rag_bot;
CREATE EXTENSION IF NOT EXISTS vector;

-- 用户认证Schema
CREATE SCHEMA auth;

-- RAG功能Schema
CREATE SCHEMA rag;

-- 聊天功能Schema
CREATE SCHEMA chat;

-- 核心表结构 (从migration guide复制)
-- users, documents, document_chunks, embeddings, chat_sessions, chat_messages等
```

#### 2. 智普清言API服务集成

基于现有`docs/postgresql-zhipu-migration.md`中的ZhipuAIService实现：

```python
# services/zhipu_service.py
import asyncio
import aiohttp
from typing import Dict, List, Optional, Any

class ZhipuAIService:
    """智普清言API服务封装"""

    def __init__(self, api_key: str, base_url: str = "https://open.bigmodel.cn/api/paas/v4"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def get_embedding(self, text: str, model: str = "embedding-2") -> List[float]:
        """获取文本嵌入向量"""

    async def chat_completion(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """聊天对话补全"""

    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """批量获取嵌入向量"""
```

#### 3. 向量搜索服务 (pgvector)

基于现有设计实现VectorService：

```python
# services/vector_service.py
import asyncpg
import numpy as np
from typing import List, Dict, Any, Optional

class VectorService:
    """PostgreSQL pgvector向量搜索服务"""

    def __init__(self, db_pool: asyncpg.Pool):
        self.pool = db_pool

    async def vector_search(self, query_vector: List[float], **kwargs) -> List[Dict[str, Any]]:
        """向量相似度搜索"""

    async def hybrid_search(self, query_text: str, query_vector: List[float], **kwargs) -> List[Dict[str, Any]]:
        """混合搜索(向量+关键词)"""

    async def create_vector_index(self, table_name: str, **kwargs) -> bool:
        """创建向量索引"""
```

#### 4. RAG核心服务

基于现有设计实现完整的RAG pipeline：

```python
# services/rag_service.py
from .zhipu_service import ZhipuAIService
from .vector_service import VectorService
from .cache_service import RedisCache

class RAGService:
    """RAG检索增强生成服务"""

    def __init__(self, zhipu_service, vector_service, cache_service):
        self.zhipu_service = zhipu_service
        self.vector_service = vector_service
        self.cache = cache_service

    async def search_documents(self, query: str, **kwargs) -> List[Dict[str, Any]]:
        """搜索相关文档"""

    async def generate_response(self, query: str, **kwargs) -> Dict[str, Any]:
        """生成RAG响应"""

    async def index_document(self, content: str, **kwargs) -> str:
        """索引文档到向量数据库"""
```

#### 5. FastAPI路由实现

```python
# api/v1/chat.py
from fastapi import APIRouter, Depends, HTTPException
from ..services.rag_service import RAGService
from ..schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    rag_service: RAGService = Depends(get_rag_service)
):
    """处理聊天请求"""

@router.get("/history/{session_id}")
async def get_chat_history():
    """获取聊天历史"""

# api/v1/auth.py
@router.post("/login")
async def login():
    """用户登录"""

@router.post("/register")
async def register():
    """用户注册"""
```

#### 6. 数据迁移服务

基于现有MySQL/FAISS到PostgreSQL/pgvector的迁移工具：

```python
# services/migration_service.py
class DatabaseMigration:
    """数据库迁移服务"""

    async def migrate_from_mysql(self, mysql_config: Dict):
        """从MySQL迁移数据"""

    async def migrate_faiss_index(self, faiss_path: str):
        """迁移FAISS向量索引"""

    async def validate_migration(self):
        """验证迁移结果"""
```

### 环境配置

#### 环境变量 (.env)
```bash
# 数据库配置
DATABASE_URL=postgresql://rag_user:rag_password_2024@localhost:5432/rag_bot
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=rag_bot
POSTGRES_USER=rag_user
POSTGRES_PASSWORD=rag_password_2024

# 智普清言API配置
ZHIPU_API_KEY=your_zhipu_api_key_here
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPU_EMBEDDING_MODEL=embedding-2
ZHIPU_CHAT_MODEL=glm-4-plus

# 向量配置
EMBEDDING_DIMENSION=1024
VECTOR_INDEX_TYPE=ivfflat
VECTOR_LISTS=100

# Redis配置
REDIS_URL=redis://localhost:6379/0
REDIS_TTL=3600

# JWT配置
SECRET_KEY=your_jwt_secret_key_here
JWT_ACCESS_TOKEN_EXPIRES=3600

# 应用配置
APP_ENV=development
DEBUG=true
LOG_LEVEL=INFO
```

### Docker配置

#### docker-compose.postgres.yml (复用现有)
```yaml
version: '3.8'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: rag_bot
      POSTGRES_USER: rag_user
      POSTGRES_PASSWORD: rag_password_2024
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rag_user -d rag_bot"]

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

#### requirements.txt
```txt
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy>=2.0.0
asyncpg>=0.28.0
alembic>=1.12.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
aiohttp>=3.9.0
redis>=5.0.0
celery>=5.3.0
python-multipart>=0.0.6
prometheus-client>=0.19.0
structlog>=23.2.0
pytest>=7.4.0
pytest-asyncio>=0.21.0
httpx>=0.25.0
```

### 实现优先级

#### Phase 1: 核心基础设施 (必须完成)
1. **FastAPI应用结构** - 完整的项目目录和基础配置
2. **PostgreSQL数据库** - 使用现有docker-compose.postgres.yml
3. **数据模型** - 基于migration guide中的完整schema
4. **智普清言集成** - ZhipuAIService完整实现

#### Phase 2: RAG核心功能 (必须完成)
1. **向量搜索服务** - VectorService with pgvector
2. **RAG服务** - 完整的检索增强生成pipeline
3. **API路由** - auth, chat, documents的核心接口
4. **认证系统** - JWT-based认证和授权

#### Phase 3: 高级功能 (推荐完成)
1. **Redis缓存** - 向量和搜索结果缓存
2. **文档处理** - 文件上传和自动向量化
3. **数据迁移工具** - 从现有系统迁移数据
4. **监控和日志** - 性能监控和结构化日志

### 代码质量要求

#### 必须遵循的现有模式
- **使用现有的shared packages** - 从`packages/shared/`导入API服务
- **遵循现有的设计文档** - 参考`docs/postgresql-zhipu-migration.md`
- **保持代码一致性** - 与现有项目风格保持一致
- **完整的错误处理** - 异常处理和日志记录

#### 代码规范
```python
# 类型提示
from typing import List, Dict, Any, Optional

# 异步模式
async def example_function():
    pass

# 依赖注入
from fastapi import Depends

# 结构化日志
import structlog
logger = structlog.get_logger()

# 异常处理
try:
    pass
except Exception as e:
    logger.error("Error occurred", exc_info=True)
    raise
```

### 测试要求

#### 必须实现的测试
```python
# tests/test_rag_service.py
import pytest
from app.services.rag_service import RAGService

@pytest.mark.asyncio
async def test_rag_chat_flow():
    """测试完整RAG聊天流程"""

@pytest.mark.asyncio
async def test_vector_search():
    """测试向量搜索功能"""

@pytest.mark.asyncio
async def test_zhipu_api_integration():
    """测试智普清言API集成"""
```

### 部署要求

#### 开发环境
```bash
# 1. 启动PostgreSQL和Redis
docker-compose -f docker-compose.postgres.yml up -d

# 2. 创建数据库和扩展
python scripts/init_database.py

# 3. 运行数据库迁移
alembic upgrade head

# 4. 启动FastAPI应用
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 生产环境
```bash
# 使用生产配置
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 验收标准

#### 功能验收
- [ ] 完整的RAG问答功能 (智普清言 + pgvector)
- [ ] 用户认证和授权 (JWT + 邮箱登录)
- [ ] 文档上传和自动向量化
- [ ] 管理员接口和用户管理
- [ ] 实时聊天和流式响应

#### 性能验收
- [ ] API响应时间 < 2秒
- [ ] 向量搜索时间 < 100ms
- [ ] 并发支持 > 100用户
- [ ] 数据库查询优化

#### 质量验收
- [ ] 单元测试覆盖率 > 70%
- [ ] 完整的API文档 (OpenAPI/Swagger)
- [ ] 结构化日志和监控
- [ ] 错误处理和异常恢复

### 立即开始

**请基于现有项目资源和此提示词，完整实现FastAPI后端系统。重点是：**

1. **复用现有设计** - 使用`docs/postgresql-zhipu-migration.md`中的完整架构
2. **集成智普清言** - 基于现有的ZhipuAIService设计实现
3. **利用Shared Packages** - 从`packages/shared/`导入现有API服务
4. **保持架构一致** - 与项目整体设计保持一致

**所有技术规范、代码实现和架构设计都已在此项目准备就绪，请完整实现生产就绪的RAG问答机器人后端系统。**