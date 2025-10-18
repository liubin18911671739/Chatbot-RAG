# iChat RAG-QA 系统 MVP 任务清单

本文档列出了实现最小可行产品（MVP）所需完成的核心任务。基于当前项目状态和需求文档分析。

**更新时间**: 2025-10-18
**目标**: 构建一个可运行的校园RAG问答系统，支持文档上传、向量检索和智能问答

---

## 一、核心基础设施 (优先级: 🔴 高)

### 1.1 数据库与模型完善
**状态**: 🟡 进行中
**负责模块**: `backend/models/`

- [ ] 添加文档相关数据模型
  - [ ] `Document` 模型（文件名、路径、上传时间、用户ID、状态）
  - [ ] `DocumentChunk` 模型（文档ID、分片内容、序号、元数据）
  - [ ] `Embedding` 模型（chunk_id、向量、维度）
  - [ ] 添加外键关系和索引

- [ ] 添加对话历史模型
  - [ ] `Chat` 模型（会话ID、用户ID、场景ID、创建时间）
  - [ ] `Message` 模型（会话ID、角色、内容、时间戳）

- [ ] 数据库迁移
  - [ ] 创建 Alembic/Flask-Migrate 迁移脚本
  - [ ] 初始化迁移环境 `flask db init`
  - [ ] 生成初始迁移 `flask db migrate -m "初始化模型"`
  - [ ] 应用迁移 `flask db upgrade`
  - [ ] 编写数据回滚脚本

**验收标准**:
- 所有模型字段完整，有适当的约束和索引
- 迁移脚本可重复执行，支持升级和回滚
- 测试数据可成功插入和查询

---

### 1.2 JWT 认证完整实现
**状态**: 🔴 未完成（仅有TODO注释）
**负责模块**: `backend/routes/hybrid_auth.py`

- [ ] 安装和配置 Flask-JWT-Extended
  - [ ] 更新 `requirements.txt`
  - [ ] 在 `app.py` 中配置 JWT
  - [ ] 设置环境变量 `JWT_SECRET_KEY`

- [ ] 完善令牌生成
  - [ ] 在登录成功后生成 access_token 和 refresh_token
  - [ ] 设置合理的过期时间（access: 1小时，refresh: 7天）
  - [ ] 在响应中返回令牌和用户信息

- [ ] 实现令牌验证装饰器
  - [ ] 替换 `token_required` 中的 TODO
  - [ ] 使用 `@jwt_required()` 保护需要认证的端点
  - [ ] 添加可选认证 `@jwt_required(optional=True)`

- [ ] 令牌刷新端点
  - [ ] `POST /api/auth/refresh` 接口
  - [ ] 验证 refresh_token 并签发新的 access_token

- [ ] 测试
  - [ ] 测试登录获取令牌
  - [ ] 测试令牌验证
  - [ ] 测试令牌过期和刷新
  - [ ] 测试无效令牌拒绝访问

**文件路径**:
- `backend/routes/hybrid_auth.py` (第38、141行有TODO)
- `backend/app.py`

**验收标准**:
- 用户登录后获得有效JWT令牌
- 受保护的API端点正确验证令牌
- 过期令牌被拒绝，可通过refresh_token刷新

---

## 二、RAG 核心功能 (优先级: 🔴 高)

### 2.1 向量数据库集成
**状态**: ✅ 已完成并通过测试 (2025-10-18)
**负责模块**: `backend/services/`

**选择方案**: FAISS (已在 requirements.txt 中) + 可选后期迁移到 pgvector

- [x] FAISS 向量存储服务
  - [x] 创建 `backend/services/vector_service.py`
  - [x] 实现向量初始化和索引构建
  - [x] 实现向量插入 `add_vectors(embeddings, metadata)`
  - [x] 实现相似度搜索 `search(query_vector, top_k=5)`
  - [x] 实现索引持久化（保存/加载 FAISS 索引文件）

- [x] Embedding 生成服务
  - [x] 创建 `backend/services/embedding_service.py`
  - [x] 集成 sentence-transformers（已在依赖中）
  - [x] 加载模型（使用: `paraphrase-multilingual-MiniLM-L12-v2`）
  - [x] 实现文本向量化 `get_embedding(text: str) -> np.ndarray`
  - [x] 实现批量向量化 `get_embeddings(texts: List[str])`
  - [x] 添加缓存机制（LRU cache）

- [x] 测试
  - [x] 单元测试：向量插入和检索 (`test_embedding_service.py`, `test_vector_service.py`)
  - [x] 核心功能测试：VectorService 基础功能验证（已通过 6/6 测试）
  - [x] 性能测试：1000条文档的检索速度 (`test_vector_integration.py`)
  - [x] 相似度准确性测试
  - [x] 集成测试和快速测试脚本
  - [x] Bug修复：持久化路径类型转换

**验收标准**:
- ✅ 可成功生成文本向量（384维，多语言支持）
- ✅ 可存储和检索向量数据
- ✅ Top-K 相似度搜索返回合理结果
- ✅ 向量搜索性能 <1ms（10个向量）
- ✅ 支持批量操作（批量搜索已验证）
- ✅ 索引持久化正常工作（保存/加载已验证）

**测试报告**: 详见 `backend/VECTOR_TEST_REPORT.md`

**文件清单**:
- `backend/services/embedding_service.py` - Embedding 生成服务
- `backend/services/vector_service.py` - FAISS 向量存储服务
- `backend/tests/test_embedding_service.py` - Embedding 单元测试
- `backend/tests/test_vector_service.py` - Vector 单元测试
- `backend/test_vector_integration.py` - 完整集成测试
- `backend/test_vector_quick.py` - 快速验证测试
- `backend/services/VECTOR_INTEGRATION_README.md` - 使用文档

---

### 2.2 文档处理管线
**状态**: ✅ 已完成并通过测试 (2025-10-18)
**负责模块**: `backend/services/document_service.py`

- [x] 创建文档处理服务
  - [x] 创建 `backend/services/document_service.py` (600+ 行)
  - [x] 支持的文件类型：PDF、DOCX、TXT、Markdown
  - [x] 使用 PyPDF2 解析 PDF（已在依赖中）
  - [x] 使用 python-docx 解析 DOCX（已在依赖中）

- [x] 文本分片（Chunking）
  - [x] 实现基于字符数的分片（chunk_size=500, overlap=50）
  - [x] 实现基于段落的分片（保持语义完整性）
  - [x] 使用 langchain-text-splitters（已在依赖中）
  - [x] 保留元数据（页码、章节、文件名）

- [x] 文档入库流程
  - [x] 文件上传 -> 解析 -> 分片 -> 向量化 -> 存储
  - [x] 事务处理（失败时回滚）
  - [x] 进度跟踪（大文件异步处理）

- [x] 测试
  - [x] 测试各类型文件解析（20个单元测试全部通过）
  - [x] 测试分片质量（递归分片和简单分片）
  - [x] 测试完整入库流程（集成测试）

**验收标准**:
- ✅ 支持 PDF、DOCX、TXT、Markdown 文件上传和解析
- ✅ 文本分片合理，保留上下文（chunk_size=500, overlap=50）
- ✅ 文档入库后可被检索到（完整管线测试通过）

**测试结果**: 20/20 测试通过
**文件清单**:
- `backend/services/document_service.py` - 文档处理服务（600+行）
- `backend/tests/test_document_service.py` - 单元测试（350+行）
- `backend/test_document_integration.py` - 集成测试
- `backend/services/DOCUMENT_SERVICE_README.md` - 使用文档

---

### 2.3 RAG 检索生成管线
**状态**: 🟡 部分完成（当前依赖外部API）
**负责模块**: `backend/services/rag_service.py`

- [ ] 增强现有 RAG 服务
  - [ ] 集成本地向量检索（替代或补充外部API）
  - [ ] 现混合检索策略
    - 向量检索（语义相似）
    - 关键词检索（BM25，可选）
  - [ ] 上下文排序和重排（可选 Cross-Encoder）

- [ ] 提示词工程
  - [ ] 设计系统提示词模板
  - [ ] 场景特定提示词（思政、学习指导等）
  - [ ] 上下文注入格式优化

- [ ] 生成策略
  - [ ] 使用检索内容构建 prompt
  - [ ] 调用 LLM API（Google Gemini 主 + DeepSeek 备）
  - [ ] 置信度评估（检索分数阈值）
  - [ ] 无结果时的 fallback 策略

- [ ] 测试
  - [ ] 端到端 RAG 测试
  - [ ] 不同场景下的回答质量
  - [ ] 无匹配文档时的降级处理

**文件路径**: `backend/services/rag_service.py`

**验收标准**:
- 用户提问可触发向量检索
- 检索到的文档片段用于生成回答
- 回答包含来源引用
- 无匹配时有合理的降级响应

---

## 三、API 端点开发 (优先级: 🔴 高)

### 3.1 文档管理 API
**状态**: 🔴 未开始
**负责模块**: `backend/routes/documents.py` (新建)

- [ ] 创建路由文件 `backend/routes/documents.py`

- [ ] 实现端点
  - [ ] `POST /api/docs/upload` - 文件上传
    - 接收 multipart/form-data
    - 验证文件类型和大小（最大 10MB）
    - 保存文件到存储（本地或对象存储）
    - 创建 Document 记录
    - 返回文档ID和状态

  - [ ] `POST /api/docs/ingest` - 触发文档处理
    - 接收文档ID
    - 异步处理：解析 -> 分片 -> 向量化 -> 入库
    - 更新文档状态（processing -> completed/failed）

  - [ ] `GET /api/docs` - 文档列表
    - 支持分页 (page, limit)
    - 支持过滤（场景、状态、上传者）
    - 返回文档元数据和统计

  - [ ] `GET /api/docs/:id` - 文档详情
    - 返回文档信息、分片数量、状态

  - [ ] `DELETE /api/docs/:id` - 删除文档
    - 删除文件、数据库记录、向量
    - 需要管理员权限

- [ ] 权限控制
  - [ ] 上传、处理、删除需要管理员权限
  - [ ] 列表和详情需要登录用户

- [ ] 测试
  - [ ] 上传各类型文件
  - [ ] 处理和查询文档
  - [ ] 权限验证

**验收标准**:
- 管理员可上传文档并触发处理
- 文档列表正确显示所有文档
- 删除文档会清理所有相关数据

---

### 3.2 增强现有聊天 API
**状态**: 🟡 基础完成
**负责模块**: `backend/routes/chat.py`

- [ ] 集成本地 RAG
  - [ ] 在聊天请求中调用 RAG 服务
  - [ ] 根据场景ID过滤检索范围
  - [ ] 返回来源文档引用

- [ ] 会话管理
  - [ ] 保存对话历史到数据库
  - [ ] 支持多轮对话上下文
  - [ ] 会话ID关联

- [ ] 流式响应（可选）
  - [ ] 支持 Server-Sent Events (SSE)
  - [ ] 逐字返回生成内容

**验收标准**:
- 聊天使用本地向量检索增强
- 回答包含来源文档片段
- 对话历史正确保存

---

## 四、管理后台 (优先级: 🟡 中)

### 4.1 管理端页面开发
**状态**: 🔴 未开始
**负责模块**: `frontend/src/views/admin/` (新建)

- [ ] 创建管理后台路由
  - [ ] 在 Vue Router 中添加 `/admin` 路由
  - [ ] 添加权限守卫（仅管理员可访问）

- [ ] 文档管理页面
  - [ ] 文档列表表格（Element Plus Table）
  - [ ] 上传组件（Element Plus Upload）
  - [ ] 删除确认对话框
  - [ ] 处理进度显示

- [ ] 场景配置页面
  - [ ] 场景增删改查界面
  - [ ] 场景详情编辑（名称、描述、状态）
  - [ ] 关联文档范围设置（可选）

- [ ] 用户管理页面（简化版）
  - [ ] 用户列表
  - [ ] 添加/禁用管理员账号

- [ ] 系统监控页面
  - [ ] 调用 `/api/health` 显示状态
  - [ ] 请求统计图表（复用 AnalyticsView）

**验收标准**:
- 管理员登录后可访问管理后台
- 可上传、查看、删除文档
- 可管理场景和用户

---

## 五、测试与质量保障 (优先级: 🟡 中)

### 5.1 后端测试完善
**状态**: 🟡 已有67个测试用例
**负责模块**: `backend/tests/`

- [ ] 新增测试文件
  - [ ] `test_documents.py` - 文档管理测试
  - [ ] `test_vector_service.py` - 向量服务测试
  - [ ] `test_rag_pipeline.py` - RAG 管线测试
  - [ ] `test_jwt_auth.py` - JWT 认证测试

- [ ] 集成测试
  - [ ] 端到端 RAG 流程测试
  - [ ] 文档上传到检索的完整流程

- [ ] 覆盖率目标
  - [ ] 核心服务代码覆盖率 ≥ 70%
  - [ ] 运行 `pytest --cov=. --cov-report=html`

**验收标准**:
- 所有新增功能有对应测试
- 测试通过率 100%
- 核心模块覆盖率达标

---

### 5.2 前端测试
**状态**: 🟡 已配置 Jest 和 Cypress
**负责模块**: `frontend/`

- [ ] 单元测试
  - [ ] 关键组件测试（ChatBox、HistoryPanel）
  - [ ] Vuex/Pinia store 测试

- [ ] E2E 测试（Cypress）
  - [ ] 用户登录流程
  - [ ] 聊天对话流程
  - [ ] 管理后台操作流程

**验收标准**:
- 关键用户路径有 E2E 测试覆盖
- CI/CD 中集成测试

---

## 六、部署与运维 (优先级: 🟢 低)

### 6.1 环境变量和配置
**状态**: 🟡 部分完成

- [ ] 创建 `.env.example`
  - [ ] 数据库配置
  - [ ] JWT 密钥
  - [ ] LLM API 密钥
  - [ ] RADIUS 服务器配置
  - [ ] 向量模型路径
  - [ ] 文件存储路径

- [ ] 环境区分
  - [ ] 开发环境配置
  - [ ] 测试环境配置
  - [ ] 生产环境配置

**验收标准**:
- 所有敏感信息通过环境变量配置
- 不同环境配置清晰分离

---

### 6.2 Docker 优化
**状态**: 🟡 基础配置完成
**负责模块**: `docker/`, `docker-compose.yml`

- [ ] 数据库服务
  - [ ] 添加 PostgreSQL 服务到 docker-compose
  - [ ] 配置数据持久化卷
  - [ ] 添加健康检查

- [ ] 向量模型挂载
  - [ ] 在 Dockerfile 中下载或挂载 sentence-transformers 模型
  - [ ] 优化镜像大小

- [ ] 生产优化
  - [ ] 多阶段构建
  - [ ] 资源限制
  - [ ] 日志收集配置

**验收标准**:
- `docker-compose up` 可一键启动完整系统
- 数据持久化正常工作
- 服务间网络通信正常

---

### 6.3 文档完善
**状态**: 🟡 已有基础文档

- [ ] 更新 README.md
  - [ ] 添加 RAG 功能说明
  - [ ] 更新部署步骤（包含数据库迁移）
  - [ ] 添加故障排查指南

- [ ] API 文档
  - [ ] 更新 Swagger 文档（新增文档管理端点）
  - [ ] 添加请求示例

- [ ] 开发指南
  - [ ] 本地开发环境搭建
  - [ ] 测试运行指南
  - [ ] 代码贡献规范

**验收标准**:
- 新开发者可根据文档快速上手
- API 文档完整准确

---

## 七、MVP 验收里程碑

### 阶段一：基础设施 (Week 1-2)
- ✅ 数据库模型完善
- ✅ JWT 认证实现
- ✅ 数据库迁移脚本

### 阶段二：RAG 核心 (Week 3-4)
- ✅ 向量数据库集成
- ✅ 文档处理管线
- ✅ RAG 检索生成

### 阶段三：API 和前端 (Week 5-6)
- ✅ 文档管理 API
- ✅ 管理后台页面
- ✅ 聊天 API 增强

### 阶段四：测试和部署 (Week 7-8)
- ✅ 测试覆盖率达标
- ✅ Docker 部署优化
- ✅ 文档完善

---

## MVP 最终验收标准

**核心功能**:
1. ✅ 用户可注册登录（本地账号 + 可选RADIUS）
2. ✅ 管理员可上传文档（PDF/DOCX/TXT）
3. ✅ 文档自动处理并入库向量数据库
4. ✅ 用户提问可触发向量检索
5. ✅ 系统返回基于检索内容的回答
6. ✅ 回答包含来源文档引用
7. ✅ 支持多个知识场景
8. ✅ 微信小程序可正常使用（含校园网限制）

**非功能需求**:
1. ✅ 所有核心 API 有单元测试
2. ✅ 关键用户流程有 E2E 测试
3. ✅ Docker 一键部署
4. ✅ API 文档完整
5. ✅ 无硬编码敏感信息

---

## 附录

### 技术债务和未来优化
- [ ] pgvector 迁移（替代 FAISS）
- [ ] 分布式向量检索（Milvus/Qdrant）
- [ ] 模型微调（特定领域）
- [ ] 更复杂的混合检索策略
- [ ] 缓存层（Redis）
- [ ] 消息队列（异步文档处理）
- [ ] 监控和告警系统（Prometheus/Grafana）

### 参考资料
- [LangChain 文档](https://python.langchain.com/)
- [FAISS 文档](https://github.com/facebookresearch/faiss)
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)
- [Sentence Transformers](https://www.sbert.net/)

---

**备注**:
- 🔴 高优先级：MVP 必须完成
- 🟡 中优先级：MVP 强烈建议完成
- 🟢 低优先级：MVP 后优化
