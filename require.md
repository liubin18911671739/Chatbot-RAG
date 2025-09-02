# school-chatbot（校园问答系统）需求说明

本文件为通用化的校园问答系统需求说明，可适配不同院校环境与基础设施。目标是以全栈 Next.js 打造统一的 Web 用户端与管理端，并提供移动端（Expo）与小程序用户端接入；后端基于 Next.js API Routes，采用 PostgreSQL + pgvector 作为知识检索与业务数据底座。支持校园网访问限制、RADIUS 认证等能力，并提供可移植的 Docker 化部署方案，兼容 Render/Vercel 等平台。

## 1. 背景与目标
- 目标：提供一套可运营的“校园问答系统”，面向在校师生，支持多端访问、知识库管理与高可用部署。
- 场景：校园常见问题应答、办事指南、教学科研、学习辅导、通用问答等，可按“场景”分类管理与引导。
- 交付：可运行的全栈应用（Web 用户端 + Web 管理端 + 移动端 + 小程序端）、数据库与向量检索、基础监控与诊断能力、部署脚本与文档。

## 2. 总体架构
- 技术栈：
  - Web 前端：Next.js（App Router，SSR/SSG，Tailwind/Ant Design 可选）
  - 后端：Next.js API Routes（Edge/Node runtime 视需求），RESTful 接口
  - 移动端：Expo（React Native）仅用户端
  - 小程序端：微信小程序，仅用户端
  - 数据库：PostgreSQL（Docker 运行），启用 pgvector 扩展
  - 向量检索：pgvector（语义检索、相似度召回），Embedding 可接任意厂商
  - 鉴权：基于 JWT 的会话；可选 RADIUS 认证接入
  - 部署：Docker 为主；支持 Render、Vercel（Web/Edge）、自托管（Nginx/容器编排）
- 核心模块：
  - Chat & 场景管理：多场景问答、提示词/工具链策略
  - 知识库与检索：文档上传、解析、分片、Embedding、入库与搜索
  - 管理平台：数据与配置管理、运营工具、访问策略下发
  - 访问控制：校园网访问限制（网络范围/探测策略）、RADIUS/混合认证
  - 监控与诊断：健康检查、请求日志、失败原因记录

## 3. 角色与使用端
- 角色
  - 添加普通用户 user 密码 User@123 管理员 admin 密码 Admin@123
  - 匿名访客（可选）：仅公共场景的只读访问
  - 认证用户：校内用户，使用 JWT 会话；可选 RADIUS 认证
  - 管理员：运营与数据管理权限
- 终端
  - Web 用户端：对话、场景浏览、历史与反馈
  - Web 管理端：场景配置、文档/知识数据管理、用户与访问策略、运维工具
  - 移动端（Expo）：用户端核心功能（对话、场景、历史、反馈）
  - 小程序端：用户端核心功能 + 校园网访问限制与诊断提示

## 4. 功能需求
### 4.1 用户端（Web/移动端/小程序端）
- Chat 对话
  - 输入：prompt，附带场景 ID（可选）与会话上下文
  - 输出：模型回复、来源片段（命中文档/知识）、引用链接（可选）
  - 策略：主检索-生成（RAG）为优先；当无答案时可回退到通用模型或固定回复
- 场景列表与切换
  - 展示场景名称、描述、状态（上线/开发中）
  - 场景内可设置特定系统提示、知识范围或工具开关
- 搜索/建议（可选）
  - 热门问题、问题建议接口；关键词 or 语义搜索
- 历史与收藏
  - 最近会话列表、本地/服务端存储、清空与导出（可选）
- 反馈
  - 对消息或会话提交有用/无用、纠错意见、文本反馈
- 访问限制提示（小程序/移动端侧）
  - 校园网检测：检测网络类型、特定域名/API 可达性、可选地理围栏
  - 未满足访问策略时给出限制说明与诊断细节

### 4.2 管理端（Web）
- 文档与知识数据管理
  - 上传：PDF/Docx/Markdown/纯文本（至少满足 PDF/文本）
  - 解析与分片：可配置最大分片、重叠、清洗规则
  - 向量化：调用 Embedding 服务，写入 pgvector；存储元数据（文件、页码、标题、来源）
  - 索引与回填：构建/重建索引、批量导入导出
  - 去重与版本：同名/相似文档判重；版本管理（可选）
- 场景配置与运营
  - 场景增删改查：名称、描述、提示词、关联数据范围、上线状态
  - 答复策略：置信度阈值、召回条数、fallback 策略
- 用户与权限（基础）
  - 管理员账号：创建/禁用、角色（管理员/运营）
  - 访问策略：是否允许匿名、是否启用校园网限制、是否启用 RADIUS 认证
- 监控与审计
  - 健康检查查看、请求失败统计（如无结果、超时、网络失败）
  - 基本操作日志（文档导入、配置变更）

## 5. 接口与协议（Next.js API Routes）
- 基础
  - `GET /api/health`：健康检查，返回版本、时间、依赖服务状态
  - `GET /api/greeting`：欢迎语或公告
- 场景
  - `GET /api/scenes`：获取场景列表
  - `POST /api/scenes`：创建场景（管理员）
  - `PUT /api/scenes/:id`：更新场景（管理员）
  - `DELETE /api/scenes/:id`：删除场景（管理员）
- 对话
  - `POST /api/chat`：输入 `prompt`、可选 `scene_id` 和会话信息；返回模型回复、来源证据
  - 回退策略：当检索无结果或置信度低，返回“未命中”或回落到通用模型（可配置）
- 知识数据
  - `POST /api/docs/upload`：上传文件（管理员）
  - `POST /api/docs/ingest`：触发解析/分片/向量化（管理员）
  - `GET /api/docs`：查询导入文档清单与元数据
  - `DELETE /api/docs/:id`：删除文档及其向量（管理员）
- 搜索/建议（可选）
  - `GET /api/search?q=...`：关键词/语义搜索，返回相似问题/片段
  - `GET /api/suggestions`：返回热门问题/推荐问法
- 反馈
  - `POST /api/feedback`：提交反馈（文本/点赞/点踩）
- 认证与访问控制
  - `POST /api/auth/login`：本地账号登录（JWT）
  - `POST /api/auth/radius-login`：RADIUS 登录（可选，返回 JWT）
  - `GET /api/auth/users`：管理员用户列表（管理员）
  - 中间件：基于 JWT 的鉴权、基于角色的访问控制

说明：接口以 REST 为主，必要时对 `POST /api/chat` 支持流式（SSE）以提升体验。

## 6. 数据与存储
- 数据库：PostgreSQL（Docker 容器），开启 pgvector 扩展
  - 业务表：`users`、`scenes`、`feedbacks`、`documents`、`document_chunks`、`chats`、`messages`
  - 向量表：`embeddings`（chunk_id, vector, metadata）
  - 约束与索引：主键/外键、时间索引、pgvector 索引（ivfflat/hnsw 视版本）
- 文件存储：
  - 小规模可直接存 DB（bytea）或本地卷；建议对接对象存储（S3 兼容/本地 MinIO）
- 配置与密钥：
  - 所有敏感信息使用环境变量/密钥管理；提供 `.env.example`

## 7. 检索生成（RAG）流程
1) 文档入库：上传 -> 解析 -> 分片 -> Embedding -> 写入 pgvector
2) 查询阶段：对话 prompt + 场景上下文 -> Embedding -> 相似检索（Top-K）-> 过滤（场景/权限）
3) 生成阶段：将命中文档片段作为上下文交给模型生成答案
4) 回退：无命中或置信度低时返回“未找到答案”或回退至通用模型（可选）

## 8. 访问限制与认证
- 校园网访问限制
  - 网段配置：例如 10.0.0.0/8、172.16.0.0/12、192.168.0.0/16（可按校方网段自定义）
  - 探测策略：网络类型判断 + 指定 API/域名可达性校验 + 可选地理围栏
  - 端侧实现：
    - 小程序/移动端：在请求前进行网络/可达性校验，不满足则拦截并提示
    - Web：可选后端探针模式，避免在浏览器侧暴露内网拓扑
- 认证
  - 本地账号（必选）：账号/密码登录，返回 JWT
  - RADIUS（可选）：通过 RADIUS 服务器验证学工号/密码，成功后签发 JWT
  - 混合策略：优先 RADIUS，失败时本地；或按场景/端类型切换
  - 会话安全：Token 过期、刷新、登出、最小权限

## 9. 非功能性要求
- 安全：
  - 不在仓库硬编码任何密钥、内网 IP；使用环境变量与密钥管理
  - 上传文件类型与大小限制、病毒扫描（可选）、XSS/CSRF 防护
- 可用性与容错：
  - 关键接口超时/重试/退避；Embedding/检索/生成的错误隔离与降级
- 监控与日志：
  - 健康检查端点；请求/错误日志；失败原因分类统计
- 性能：
  - pgvector 索引配置、Top-K/阈值可调；SSE 流式响应降低首字延迟
- 测试与质量：
  - 单元测试（核心 API：health/chat/scenes）与端到端测试（关键用户流）

## 10. 部署与环境
- 环境划分：开发/测试/生产
- Docker：
  - 服务：`web`（Next.js 全栈）、`db`（PostgreSQL+pgvector）、`proxy`（可选 Nginx）
  - 健康检查：基于服务名访问 `web` 的 `/api/health`
  - 卷与备份：Postgres 数据卷与备份策略
- Render：
  - 后端（API Routes 以 Server 部署）与数据库（Render PostgreSQL 或外部托管）
- Vercel：
  - Web 前端（SSR/Edge）、API Routes（Node/Edge 视实现）；数据库连接通过环境变量
- 迁移与初始化：
  - 数据库迁移脚本（Prisma/Drizzle 等任选一种）；初始管理员创建

## 11. 开发任务拆解（建议）
1) 项目骨架：Next.js App Router + API Routes + 基础 UI
2) DB 接入：PostgreSQL 连接、pgvector 扩展检测与安装脚本
3) 管理端：场景与文档管理页面 + 上传/解析/入库流程
4) RAG 服务 千问DASHSCOPE ：Embedding 抽象、检索与生成管线、回退策略
5) 用户端：对话页、场景选择、历史与反馈
6) 访问限制：小程序/移动端网络校验工具、Web 端后端探针
7) 认证：本地账号 + 可选 RADIUS，对接 JWT 中间件
8) 监控与健康检查：/api/health、日志与错误分类
9) 部署：Docker Compose、Render/Vercel 配置与文档
10) 测试：核心 API 单测、关键流 E2E

## 12. 验收标准
- 功能：
  - Web 用户端与管理端可用；移动端与小程序具备用户核心流程
  - 文档上传后可检索并用于回答；无命中时有合理回退
  - 场景的增删改查与生效；反馈可记录
  - 访问限制策略在小程序/移动端生效；可查看诊断信息
- 非功能：
  - 环境变量与密钥未硬编码；健康检查与日志可用
  - Docker 本地一键起服务；Render/Vercel 至少一种云端可运行

## 13. 配置清单（示例 .env）
- `DATABASE_URL=postgres://user:pass@db:5432/school_chatbot`
- `PGVECTOR_ENABLED=true`
- `JWT_SECRET=...`
- `EMBEDDING_PROVIDER=...`（及其密钥）
- `RADIUS_SERVER=...` / `RADIUS_SECRET=...`（可选）
- `ALLOWED_CIDRS=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16`
- `PUBLIC_BASE_URL=https://...`

## 14. 风险与约束
- 第三方模型/Embedding 依赖可用性与费用；需做降级与缓存
- pgvector 版本兼容与索引参数调优
- RADIUS 需网络连通与字典/共享密钥正确配置
- 小程序侧网络策略应避免暴露内网拓扑细节，可改由后端探针

—— 以上需求汇总自既有系统要点，并统一到全栈 Next.js + PostgreSQL/pgvector 的实现路径，保留校园网访问限制、RADIUS 认证、管理平台文档上传等关键特性，同时适配 Docker/Render/Vercel 的多环境部署。

