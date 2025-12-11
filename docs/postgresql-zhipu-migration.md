# PostgreSQL数据库迁移与智普清言API集成方案

## 📋 项目概述

本文档提供了从当前Flask+FAISS+Google Gemini/DeepSeek技术栈迁移到FastAPI+PostgreSQL+pgvector+智普清言的完整实施方案。

### 🎯 迁移目标
- **数据库**: MySQL → PostgreSQL 16+ with pgvector
- **向量存储**: FAISS → pgvector
- **LLM服务**: Google Gemini/DeepSeek → 智普清言 (Zhipu AI)
- **认证方式**: RADIUS → 邮箱认证 + JWT
- **网络限制**: 校园网限制 → 开放访问

---

## 1. PostgreSQL环境搭建

### 1.1 Docker Compose配置 (`docker-compose.postgres.yml`)

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: rag-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: rag_bot
      POSTGRES_USER: rag_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-rag_password_2024}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      - rag-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rag_user -d rag_bot"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: rag-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - rag-network
    command: redis-server --appendonly yes

  pgadmin:
    image: dpage/pgadmin4
    container_name: rag-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@ragbot.com
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin123}
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres
    networks:
      - rag-network

volumes:
  postgres_data:
  redis_data:
  pgadmin_data:

networks:
  rag-network:
    driver: bridge
```

### 1.2 环境变量配置 (`.env`)

```bash
# PostgreSQL配置
POSTGRES_PASSWORD=rag_password_2024
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=rag_bot
POSTGRES_USER=rag_user

# Redis配置
REDIS_URL=redis://localhost:6379/0

# 智普清言API配置
ZHIPU_API_KEY=your_zhipu_api_key_here
ZHIPU_EMBEDDING_MODEL=embedding-3
ZHIPU_CHAT_MODEL=glm-4

# 应用配置
DATABASE_URL=postgresql://rag_user:rag_password_2024@localhost:5432/rag_bot
JWT_SECRET_KEY=your_jwt_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24

# 开发模式
DEBUG=true
ENVIRONMENT=development
```

### 1.3 启动脚本 (`scripts/start-postgres.sh`)

```bash
#!/bin/bash

echo "🚀 启动PostgreSQL数据库..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 创建网络（如果不存在）
docker network create rag-network 2>/dev/null || true

# 启动服务
docker-compose -f docker-compose.postgres.yml up -d

echo "⏳ 等待PostgreSQL启动..."
sleep 10

# 检查连接状态
if docker exec rag-postgres pg_isready -U rag_user -d rag_bot; then
    echo "✅ PostgreSQL启动成功！"
    echo "📊 PgAdmin访问: http://localhost:5050"
    echo "🗄️ 数据库连接: postgresql://rag_user:rag_password_2024@localhost:5432/rag_bot"
else
    echo "❌ PostgreSQL启动失败"
    exit 1
fi

# 运行初始化脚本
echo "🔧 运行数据库初始化..."
docker exec rag-postgres psql -U rag_user -d rag_bot -c "\i /docker-entrypoint-initdb.d/01-init-extensions.sql"
docker exec rag-postgres psql -U rag_user -d rag_bot -c "\i /docker-entrypoint-initdb.d/02-create-tables.sql"

echo "✅ 数据库环境搭建完成！"
```

---

## 2. pgvector扩展安装配置

### 2.1 扩展初始化脚本 (`migrations/01-init-extensions.sql`)

```sql
-- PostgreSQL + pgvector 初始化脚本
-- 创建必要的扩展

-- 启用pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;
COMMENT ON EXTENSION vector IS '向量相似度搜索扩展';

-- 启用uuid-ossp扩展（用于生成唯一ID）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID生成扩展';

-- 启用pg_trgm扩展（用于文本搜索）
CREATE EXTENSION IF NOT EXISTS pg_trgm;
COMMENT ON EXTENSION pg_trgm IS '全文搜索扩展';

-- 启用btree_gin扩展（用于索引优化）
CREATE EXTENSION IF NOT EXISTS btree_gin;
COMMENT ON EXTENSION btree_gin IS 'B-tree GIN索引扩展';

-- 创建向量相似度函数
CREATE OR REPLACE FUNCTION cosine_similarity(vec1 vector, vec2 vector)
RETURNS REAL AS $$
BEGIN
    RETURN 1 - (vec1 <=> vec2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 创建文档相似度索引类型
CREATE OR REPLACE FUNCTION document_similarity(vec1 vector, vec2 vector)
RETURNS REAL AS $$
BEGIN
    RETURN 1 - (vec1 <=> vec2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 创建向量操作符
CREATE OPERATOR <=> (vector, vector) RETURNS float4 AS
'SELECT pgvector_native_distance($1, $2);';

-- 创建向量索引支持
CREATE OPERATOR CLASS vector_l2_ops FOR TYPE vector USING ivfflat
AS
    OPERATOR 1 <=> (vector, vector),
    OPERATOR 2 <=> (vector, vector),
    OPERATOR 3 <=> (vector, vector);

-- 创建向量操作符类注释
COMMENT ON OPERATOR CLASS vector_l2_ops IS '向量L2距离操作符类';

-- 设置默认搜索策略
ALTER DATABASE rag_bot SET default_text_search_config = 'simple';

-- 创建中文搜索配置
CREATE TEXT SEARCH CONFIGURATION chinese (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION chinese
    ALTER MAPPING FOR asciiword, asciihword, hword_asciiprefix, hword, hword_part
    WITH simple;

-- 创建向量索引性能监控视图
CREATE OR REPLACE VIEW vector_index_stats AS
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_relation_size(indexrelid) as index_size_bytes
FROM pg_indexes
WHERE indexdef LIKE '%vector%';

-- 性能优化设置
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET max_parallel_workers = 8;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

-- 提交事务
COMMIT;
```

### 2.2 性能优化配置

```sql
-- 性能优化设置
-- 建议的生产环境配置

-- 1. 内存相关配置
SET shared_preload_libraries = 'pg_stat_statements, vector';
SET track_activity_query_size = 2048;

-- 2. 连接配置
SET max_connections = 200;
SET superuser_reserved_connections = 10;

-- 3. 查询优化
SET work_mem = '64MB';
SET maintenance_work_mem = '256MB';

-- 4. 向量索引优化
SET ivfflat.probe_limit = 2000;
SET hnsw.ef_construction = 200;
SET hnsw.ef_search = 100;

-- 5. 自动分析设置
SET autovacuum = on;
SET autovacuum_max_workers = 3;
SET autovacuum_naptime = '1min';

-- 6. 统计信息收集
SET track_counts = on;
SET track_io_timing = on;
```

---

## 3. 数据库初始化脚本

### 3.1 表结构创建 (`migrations/02-create-tables.sql`)

```sql
-- RAG问答机器人数据库表结构
-- 支持邮箱认证、向量存储、RAG流水线

-- 用户认证相关表
CREATE SCHEMA IF NOT EXISTS auth;

-- 用户表（替代原有的RADIUS认证）
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    department VARCHAR(100),
    student_id VARCHAR(50),
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(32),
    language VARCHAR(10) DEFAULT 'zh-CN',
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    login_count INTEGER DEFAULT 0
);

-- 用户会话表
CREATE TABLE auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RAG相关表
CREATE SCHEMA IF NOT EXISTS rag;

-- 知识库表
CREATE TABLE rag.knowledge_bases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    scene_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    embedding_model VARCHAR(50) DEFAULT 'text-embedding-ada-002',
    chunk_size INTEGER DEFAULT 1000,
    chunk_overlap INTEGER DEFAULT 200,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 文档表
CREATE TABLE rag.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    knowledge_base_id UUID NOT NULL REFERENCES rag.knowledge_bases(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    file_path TEXT,
    file_type VARCHAR(50),
    file_size BIGINT,
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    processing_progress INTEGER DEFAULT 0,
    processing_error TEXT,
    metadata JSONB DEFAULT '{}',
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 文档向量片段表
CREATE TABLE rag.document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES rag.documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    vector vector(1536),
    embedding_model VARCHAR(50) DEFAULT 'text-embedding-ada-002',
    word_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 对话表
CREATE SCHEMA IF NOT EXISTS chat;

-- 对话会话表
CREATE TABLE chat.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    scene_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 消息表
CREATE TABLE chat.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat.conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    sources JSONB DEFAULT '[]',
    token_count INTEGER DEFAULT 0,
    model_name VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 消息向量表（用于语义搜索）
CREATE TABLE chat.message_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES chat.messages(id) ON DELETE CASCADE,
    vector vector(1536),
    embedding_model VARCHAR(50) DEFAULT 'text-embedding-3-small',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建向量索引
CREATE INDEX idx_document_chunks_vector ON rag.document_chunks USING ivfflat (vector vector_l2_ops);

-- 创建时间索引
CREATE INDEX idx_documents_created_at ON rag.documents (created_at);
CREATE INDEX idx_conversations_created_at ON chat.conversations (created_at);
CREATE INDEX idx_messages_created_at ON chat.messages (created_at);
CREATE INDEX idx_sessions_expires_at ON auth.sessions (expires_at);

-- 创建用户相关索引
CREATE INDEX idx_users_email ON auth.users (email);
CREATE INDEX idx_users_role ON auth.users (role);
CREATE INDEX idx_sessions_user_id ON auth.sessions (user_id);
CREATE INDEX idx_sessions_active ON auth.sessions (is_active);

-- 创建复合索引
CREATE INDEX idx_kb_owner_active ON rag.knowledge_bases (owner_id, is_active);
CREATE INDEX idx_docs_kb_status ON rag.documents (knowledge_base_id, status);
CREATE INDEX idx_chunks_doc_index ON rag.document_chunks (document_id, chunk_index);
CREATE INDEX idx_conv_user_active ON chat.conversations (user_id, is_active);
CREATE INDEX idx_msgs_conv_created ON chat.messages (conversation_id, created_at);

-- 创建全文搜索索引
CREATE INDEX idx_docs_title_gin ON rag.documents USING gin (to_tsvector('simple', title));
CREATE INDEX idx_docs_content_gin ON rag.documents USING gin (to_tsvector('simple', content));
CREATE INDEX idx_msgs_content_gin ON chat.messages USING gin (to_tsvector('simple', content));

-- 插入初始数据
INSERT INTO rag.knowledge_bases (id, name, description, category, scene_id, is_public, created_by) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', '通用助手', '通用智能问答助手', 'general', 'general', true, '00000000-0000-0000-0000-000000000000'),
    ('550e8400-e29b-41d4-a716-446655440001', '思政学习空间', '思想政治教育资源库', 'education', 'db_sizheng', true, '00000000-0000-0000-0000-000000000000'),
    ('550e8400-e29b-41d4-a716-446655440002', '学习指导', '学习方法和指导资源', 'education', 'db_xuexizhidao', true, '00000000-0000-0000-0000-000000000000'),
    ('550e8400-e29b-41d4-a716-446655440003', '智慧思政', '智能化思想政治教育', 'education', 'db_zhihuisizheng', true, '00000000-0000-0000-0000-000000000000'),
    ('550e8400-e29b-41d4-716-446655440004', '科研辅助', '科研方法和工具', 'research', 'db_keyanfuzhu', true, '00000000-0000-0000-0000-000000000000'),
    ('550e8400-e29b-41d4-716-446655440005', '网上办事厅', '校园行政服务', 'service', 'db_wangshangbanshiting', true, '00000000-0000-0000-0000-000000000000');

-- 创建管理员用户（密码：admin123）
INSERT INTO auth.users (id, email, password_hash, name, role, is_active, is_verified, created_by) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@ragbot.com', '$2b$12$QqY8J/7t6.7kOI/Y8qLOHwJxgMu5.jUGYL.n8/Hb6ZHT7e9XIXuy3ebQxF', '系统管理员', 'super_admin', true, true, '00000000-0000-0000-0000-000000000001');

COMMIT;
```

### 3.3 数据迁移工具类 (`migrations/migration_tools.py`)

```python
import asyncio
import asyncpg
import os
from typing import List, Dict, Any
from datetime import datetime
import json
import hashlib

class DatabaseMigration:
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.pool = None

    async def __aenter__(self):
        self.pool = await asyncpg.create_pool(
            self.db_url,
            min_size=2,
            max_size=10,
            command_timeout=60
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.pool:
            await self.pool.close()

    async def migrate_from_mysql(self, mysql_config: Dict[str, Any]):
        """从MySQL迁移数据到PostgreSQL"""
        print("🔄 开始数据迁移...")

        # 连接MySQL（需要安装pymysql）
        import pymysql
        mysql_conn = pymysql.connect(**mysql_config)

        try:
            # 迁移用户数据
            await self._migrate_users(mysql_conn)

            # 迁移对话数据
            await self._migrate_conversations(mysql_conn)

            # 迁移消息数据
            await self._migrate_messages(mysql_conn)

            # 迁移文档数据
            await self._migrate_documents(mysql_conn)

            print("✅ 数据迁移完成！")

        finally:
            mysql_conn.close()

    async def _migrate_users(self, mysql_conn):
        """迁移用户数据"""
        print("👥 迁移用户数据...")

        cursor = mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()

        for user in users:
            # 转换用户角色
            role_map = {
                'student': 'student',
                'teacher': 'teacher',
                'admin': 'admin'
            }
            role = role_map.get(user.get('role', 'student'), 'student')

            # 检查邮箱是否已存在
            existing = await self.pool.fetchrow(
                "SELECT id FROM auth.users WHERE email = $1",
                (user['email'],)
            )

            if not existing:
                await self.pool.execute(
                    """
                    INSERT INTO auth.users (
                        id, email, password_hash, name, phone, department,
                        student_id, role, is_active, is_verified, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    """,
                    (
                        user.get('id', self._generate_uuid()),
                        user['email'],
                        user.get('password_hash', ''),
                        user.get('name', ''),
                        user.get('phone'),
                        user.get('department'),
                        user.get('student_id'),
                        role,
                        True,
                        True,
                        user.get('created_at', datetime.now())
                    )
                )

    async def _migrate_documents(self, mysql_conn):
        """迁移文档和向量数据"""
        print("📄 迁移文档数据...")

        # 获取FAISS向量数据
        import faiss
        import numpy as np

        # 这里需要根据实际的FAISS索引路径进行调整
        faiss_index_path = "/path/to/faiss/index.faiss"

        cursor = mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM documents")
        documents = cursor.fetchall()

        if os.path.exists(faiss_index_path):
            index = faiss.read_index(faiss_index_path)

            for i, doc in enumerate(documents):
                # 插入文档
                doc_id = self._generate_uuid()

                await self.pool.execute(
                    """
                    INSERT INTO rag.documents (
                        id, knowledge_base_id, title, content, file_path, file_type,
                        status, word_count, created_at, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    """,
                    (
                        doc_id,
                        self._get_kb_id_for_document(doc),
                        doc.get('title', ''),
                        doc.get('content', ''),
                        doc.get('file_path', ''),
                        doc.get('file_type', ''),
                        'completed',
                        doc.get('word_count', 0),
                        doc.get('created_at', datetime.now()),
                        doc.get('created_by', self._get_user_id_for_doc(doc))
                    )
                )

                # 分块处理文档内容
                content = doc.get('content', '')
                chunk_size = 1000
                chunk_overlap = 200

                for j in range(0, len(content), chunk_size - chunk_overlap):
                    chunk_start = j
                    chunk_end = min(j + chunk_size, len(content))
                    chunk_content = content[chunk_start:chunk_end]

                    # 获取对应的向量
                    vector = index.reconstruct([i])[0]
                    if len(vector) > 1536:
                        vector = vector[:1536]
                    elif len(vector) < 1536:
                        vector = np.pad(vector, (0, 1536 - len(vector)))

                    # 插入向量片段
                    await self.pool.execute(
                        """
                        INSERT INTO rag.document_chunks (
                            id, document_id, chunk_index, content, vector
                        ) VALUES ($1, $2, $3, $4, $5)
                        """,
                        (
                            self._generate_uuid(),
                            doc_id,
                            j // (chunk_size - chunk_overlap),
                            chunk_content,
                            vector.tolist()
                        )
                    )

    def _generate_uuid(self) -> str:
        """生成UUID"""
        import uuid
        return str(uuid.uuid4())

    def _get_kb_id_for_document(self, document: Dict) -> str:
        """获取文档对应的知识库ID"""
        # 根据文档的类别或场景返回对应的知识库ID
        category = document.get('category', 'general')
        scene_id = document.get('scene_id', 'general')

        kb_mapping = {
            'sizheng': '550e8400-e29b-41d4-a716-446655440001',
            'xuexizhidao': '550e8400-e29b-41d4-a716-446655440002',
            'zhihuisizheng': '550e400-e29b-41d4-716-446655440003',
            'keyanfuzhu': '550e400-e29b-41d4-716-446655440004',
            'wangshangbanshiting': '550e400-e29b-41d4-716-446655440005',
        }

        return kb_mapping.get(scene_id, '550e400-e29b-41d4-a716-446655440000')

    def _get_user_id_for_doc(self, document: Dict) -> str:
        """获取文档创建者ID"""
        # 如果有用户ID映射表，可以使用
        return document.get('user_id', '00000000-0000-0000-0000-000000000001')
```

### 3.4 数据迁移脚本 (`scripts/migrate-data.py`)

```python
#!/usr/bin/env python3
import asyncio
import os
from dotenv import load_dotenv
from migration_tools import DatabaseMigration

# 加载环境变量
load_dotenv()

async def main():
    """主迁移函数"""
    print("🚀 开始RAG系统数据迁移...")

    # 获取环境配置
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("❌ 错误：未找到DATABASE_URL环境变量")
        return

    mysql_config = {
        'host': os.getenv('MYSQL_HOST', 'localhost'),
        'port': int(os.getenv('MYSQL_PORT', 3306)),
        'user': os.getenv('MYSQL_USER', 'root'),
        'password': os.getenv('MYSQL_PASSWORD', ''),
        'database': os.getenv('MYSQL_DATABASE', 'chatbot_rag'),
    }

    faiss_path = os.getenv('FAISS_INDEX_PATH', './faiss_index')

    try:
        # 创建迁移工具
        migration = DatabaseMigration(db_url, mysql_config, faiss_path)

        # 执行迁移步骤
        await migration.migrate_users()
        print("✅ 用户数据迁移完成")

        await migration.migrate_conversations()
        print("✅ 对话历史迁移完成")

        await migration.migrate_faiss_index()
        print("✅ FAISS向量数据迁移完成")

        print("🎉 所有数据迁移完成！")

        # 验证迁移结果
        await migration.validate_migration()
        print("✅ 迁移验证通过")

    except Exception as e:
        print(f"❌ 迁移失败: {e}")
        return 1

    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
```

## 4. 智普清言API集成

### 4.1 环境配置

#### 环境变量配置
```bash
# .env
# 智普清言API配置
ZHIPU_API_KEY=your_zhipu_api_key_here
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPU_EMBEDDING_MODEL=embedding-2
ZHIPU_CHAT_MODEL=glm-4-plus
ZHIPU_CHAT_MODEL_FAST=glm-4-flash

# 向量配置
EMBEDDING_DIMENSION=1024
VECTOR_INDEX_TYPE=ivfflat
VECTOR_LISTS=100
VECTOR_PROBES=10

# Redis配置
REDIS_URL=redis://localhost:6379/0
REDIS_TTL=3600

# 应用配置
APP_ENV=development
DEBUG=true
LOG_LEVEL=INFO
```

### 4.2 智普清言API服务封装

#### ZhipuAIService类
```python
# services/zhipu_service.py
import asyncio
import json
import time
from typing import Dict, List, Optional, Any, AsyncGenerator
import aiohttp
import numpy as np
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class ZhipuAIService:
    """智普清言API服务封装"""

    def __init__(self, api_key: str, base_url: str = "https://open.bigmodel.cn/api/paas/v4"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = None
        self._last_request_time = 0
        self._rate_limit_delay = 0.1  # 100ms between requests

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def _rate_limit(func):
        """请求频率限制装饰器"""
        @wraps(func)
        async def wrapper(self, *args, **kwargs):
            current_time = time.time()
            time_since_last = current_time - self._last_request_time
            if time_since_last < self._rate_limit_delay:
                await asyncio.sleep(self._rate_limit_delay - time_since_last)

            self._last_request_time = time.time()
            return await func(self, *args, **kwargs)
        return wrapper

    def _get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    @_rate_limit
    async def get_embedding(self, text: str, model: str = "embedding-2") -> List[float]:
        """
        获取文本嵌入向量

        Args:
            text: 输入文本
            model: 嵌入模型名称

        Returns:
            向量列表
        """
        if not self.session:
            raise RuntimeError("Session not initialized. Use async with statement.")

        url = f"{self.base_url}/embeddings"
        payload = {
            "model": model,
            "input": text
        }

        try:
            async with self.session.post(url, headers=self._get_headers(), json=payload) as response:
                response.raise_for_status()
                data = await response.json()

                if "data" not in data or not data["data"]:
                    raise ValueError("Invalid embedding response")

                return data["data"][0]["embedding"]

        except aiohttp.ClientError as e:
            logger.error(f"Embedding API request failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Embedding processing failed: {e}")
            raise

    @_rate_limit
    async def get_embeddings_batch(self, texts: List[str], model: str = "embedding-2") -> List[List[float]]:
        """
        批量获取嵌入向量

        Args:
            texts: 文本列表
            model: 嵌入模型名称

        Returns:
            向量列表
        """
        if not texts:
            return []

        # 智普清言支持批量请求，限制每次最多100个文本
        batch_size = 100
        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            url = f"{self.base_url}/embeddings"
            payload = {
                "model": model,
                "input": batch
            }

            try:
                async with self.session.post(url, headers=self._get_headers(), json=payload) as response:
                    response.raise_for_status()
                    data = await response.json()

                    if "data" not in data:
                        raise ValueError("Invalid batch embedding response")

                    batch_embeddings = [item["embedding"] for item in data["data"]]
                    all_embeddings.extend(batch_embeddings)

            except aiohttp.ClientError as e:
                logger.error(f"Batch embedding API request failed: {e}")
                raise
            except Exception as e:
                logger.error(f"Batch embedding processing failed: {e}")
                raise

        return all_embeddings

    @_rate_limit
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "glm-4-plus",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        聊天对话补全

        Args:
            messages: 对话消息列表
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大token数
            stream: 是否流式返回

        Returns:
            API响应
        """
        if not self.session:
            raise RuntimeError("Session not initialized. Use async with statement.")

        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": stream
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        try:
            async with self.session.post(url, headers=self._get_headers(), json=payload) as response:
                response.raise_for_status()

                if stream:
                    return self._handle_stream_response(response)
                else:
                    data = await response.json()
                    return data

        except aiohttp.ClientError as e:
            logger.error(f"Chat completion API request failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Chat completion processing failed: {e}")
            raise

    async def _handle_stream_response(self, response) -> AsyncGenerator[Dict[str, Any], None]:
        """处理流式响应"""
        async for line in response.content:
            line = line.decode('utf-8').strip()
            if line.startswith('data: '):
                data_str = line[6:]
                if data_str == '[DONE]':
                    break
                try:
                    data = json.loads(data_str)
                    yield data
                except json.JSONDecodeError:
                    continue

    @_rate_limit
    async def semantic_search(
        self,
        query: str,
        documents: List[str],
        model: str = "embedding-2"
    ) -> List[Dict[str, Any]]:
        """
        语义搜索

        Args:
            query: 查询文本
            documents: 文档列表
            model: 嵌入模型名称

        Returns:
            相似度排序的文档列表
        """
        try:
            # 获取查询向量
            query_embedding = await self.get_embedding(query, model)

            # 获取文档向量
            doc_embeddings = await self.get_embeddings_batch(documents, model)

            # 计算余弦相似度
            similarities = []
            query_np = np.array(query_embedding)

            for i, doc_embedding in enumerate(doc_embeddings):
                doc_np = np.array(doc_embedding)
                similarity = np.dot(query_np, doc_np) / (
                    np.linalg.norm(query_np) * np.linalg.norm(doc_np)
                )
                similarities.append({
                    "index": i,
                    "document": documents[i],
                    "similarity": float(similarity)
                })

            # 按相似度排序
            similarities.sort(key=lambda x: x["similarity"], reverse=True)
            return similarities

        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            raise
```

#### Redis缓存服务
```python
# services/redis_cache.py
import json
import asyncio
from typing import Any, Optional, List, Dict
import aioredis
import pickle
import hashlib
from datetime import timedelta

class RedisCache:
    """Redis缓存服务"""

    def __init__(self, redis_url: str, default_ttl: int = 3600):
        self.redis_url = redis_url
        self.default_ttl = default_ttl
        self.redis = None

    async def connect(self):
        """连接Redis"""
        self.redis = await aioredis.from_url(self.redis_url, decode_responses=False)

    async def disconnect(self):
        """断开Redis连接"""
        if self.redis:
            await self.redis.close()

    def _get_key(self, prefix: str, identifier: str) -> str:
        """生成缓存键"""
        return f"rag:{prefix}:{identifier}"

    def _hash_data(self, data: Any) -> str:
        """生成数据哈希"""
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.md5(data_str.encode()).hexdigest()

    async def get(self, prefix: str, identifier: str) -> Optional[Any]:
        """获取缓存数据"""
        if not self.redis:
            await self.connect()

        key = self._get_key(prefix, identifier)
        try:
            data = await self.redis.get(key)
            if data:
                return pickle.loads(data)
        except Exception as e:
            logger.error(f"Cache get failed: {e}")
        return None

    async def set(self, prefix: str, identifier: str, data: Any, ttl: Optional[int] = None) -> bool:
        """设置缓存数据"""
        if not self.redis:
            await self.connect()

        key = self._get_key(prefix, identifier)
        ttl = ttl or self.default_ttl

        try:
            serialized_data = pickle.dumps(data)
            await self.redis.setex(key, ttl, serialized_data)
            return True
        except Exception as e:
            logger.error(f"Cache set failed: {e}")
            return False

    async def delete(self, prefix: str, identifier: str) -> bool:
        """删除缓存数据"""
        if not self.redis:
            await self.connect()

        key = self._get_key(prefix, identifier)
        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete failed: {e}")
            return False

    async def get_embedding(self, text: str, model: str = "embedding-2") -> Optional[List[float]]:
        """获取文本嵌入向量缓存"""
        text_hash = self._hash_data({"text": text, "model": model})
        return await self.get("embedding", text_hash)

    async def set_embedding(self, text: str, embedding: List[float], model: str = "embedding-2") -> bool:
        """缓存文本嵌入向量"""
        text_hash = self._hash_data({"text": text, "model": model})
        # 向量缓存7天
        return await self.set("embedding", text_hash, embedding, ttl=604800)

    async def get_search_results(self, query_hash: str) -> Optional[List[Dict[str, Any]]]:
        """获取搜索结果缓存"""
        return await self.get("search", query_hash)

    async def set_search_results(self, query_hash: str, results: List[Dict[str, Any]], ttl: int = 1800) -> bool:
        """缓存搜索结果"""
        return await self.set("search", query_hash, results, ttl)

    async def invalidate_pattern(self, pattern: str) -> int:
        """根据模式删除缓存"""
        if not self.redis:
            await self.connect()

        try:
            keys = await self.redis.keys(f"rag:{pattern}:*")
            if keys:
                return await self.redis.delete(*keys)
        except Exception as e:
            logger.error(f"Cache invalidate pattern failed: {e}")
        return 0
```

### 4.3 RAG服务重构（PostgreSQL + pgvector版本）

#### VectorService类
```python
# services/vector_service.py
import asyncio
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import asyncpg
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

class VectorService:
    """向量搜索服务 - 基于PostgreSQL pgvector"""

    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    @asynccontextmanager
    async def get_connection(self):
        async with self.pool.acquire() as conn:
            yield conn

    async def create_vector_index(
        self,
        table_name: str,
        vector_column: str,
        index_type: str = "ivfflat",
        lists: int = 100
    ) -> bool:
        """
        创建向量索引

        Args:
            table_name: 表名
            vector_column: 向量列名
            index_type: 索引类型 (ivfflat/hnsw)
            lists: IVFFlat索引的聚类数量

        Returns:
            创建是否成功
        """
        try:
            async with self.get_connection() as conn:
                if index_type.lower() == "ivfflat":
                    await conn.execute(
                        f"""
                        CREATE INDEX IF NOT EXISTS {table_name}_{vector_column}_idx
                        ON {table_name} USING ivfflat ({vector_column} vector_cosine_ops)
                        WITH (lists = {lists})
                        """
                    )
                elif index_type.lower() == "hnsw":
                    await conn.execute(
                        f"""
                        CREATE INDEX IF NOT EXISTS {table_name}_{vector_column}_idx
                        ON {table_name} USING hnsw ({vector_column} vector_cosine_ops)
                        """
                    )
                else:
                    raise ValueError(f"Unsupported index type: {index_type}")

                logger.info(f"Created {index_type} index on {table_name}.{vector_column}")
                return True

        except Exception as e:
            logger.error(f"Failed to create vector index: {e}")
            return False

    async def vector_search(
        self,
        query_vector: List[float],
        knowledge_base_id: Optional[str] = None,
        limit: int = 10,
        similarity_threshold: float = 0.7,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        向量相似度搜索

        Args:
            query_vector: 查询向量
            knowledge_base_id: 知识库ID（可选）
            limit: 返回结果数量限制
            similarity_threshold: 相似度阈值
            filters: 过滤条件

        Returns:
            搜索结果列表
        """
        try:
            async with self.get_connection() as conn:
                # 构建查询条件
                where_conditions = ["1 = 1"]
                params = {"query_vector": query_vector, "limit": limit}

                if knowledge_base_id:
                    where_conditions.append("kb_id = $knowledge_base_id")
                    params["knowledge_base_id"] = knowledge_base_id

                if filters:
                    if filters.get("status"):
                        where_conditions.append("status = $status")
                        params["status"] = filters["status"]
                    if filters.get("created_by"):
                        where_conditions.append("created_by = $created_by")
                        params["created_by"] = filters["created_by"]

                where_clause = " AND ".join(where_conditions)

                query = f"""
                SELECT
                    id, document_id, content,
                    1 - (vector <=> $query_vector::vector) as similarity,
                    chunk_index, metadata
                FROM rag.document_chunks
                WHERE {where_clause}
                AND 1 - (vector <=> $query_vector::vector) >= $similarity
                ORDER BY similarity DESC
                LIMIT $limit
                """

                params["similarity"] = similarity_threshold

                rows = await conn.fetch(query, *params.values())

                results = []
                for row in rows:
                    result = {
                        "id": row["id"],
                        "document_id": row["document_id"],
                        "content": row["content"],
                        "similarity": float(row["similarity"]),
                        "chunk_index": row["chunk_index"],
                        "metadata": row["metadata"]
                    }
                    results.append(result)

                return results

        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            raise

    async def hybrid_search(
        self,
        query_text: str,
        query_vector: List[float],
        knowledge_base_id: Optional[str] = None,
        limit: int = 10,
        vector_weight: float = 0.7,
        keyword_weight: float = 0.3,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        混合搜索（向量 + 关键词）

        Args:
            query_text: 查询文本
            query_vector: 查询向量
            knowledge_base_id: 知识库ID
            limit: 返回结果数量
            vector_weight: 向量搜索权重
            keyword_weight: 关键词搜索权重
            filters: 过滤条件

        Returns:
            混合搜索结果
        """
        try:
            async with self.get_connection() as conn:
                # 向量搜索
                vector_results = await self.vector_search(
                    query_vector, knowledge_base_id, limit * 2, 0.1, filters
                )

                # 关键词搜索
                keyword_results = await self.keyword_search(
                    query_text, knowledge_base_id, limit * 2, filters
                )

                # 合并和重排序结果
                combined_scores = {}

                # 处理向量搜索结果
                for result in vector_results:
                    doc_id = result["document_id"]
                    vector_score = result["similarity"]
                    combined_scores[doc_id] = {
                        "vector_score": vector_score,
                        "keyword_score": 0.0,
                        "data": result
                    }

                # 处理关键词搜索结果
                for result in keyword_results:
                    doc_id = result["document_id"]
                    keyword_score = result["rank_score"]

                    if doc_id in combined_scores:
                        combined_scores[doc_id]["keyword_score"] = keyword_score
                    else:
                        combined_scores[doc_id] = {
                            "vector_score": 0.0,
                            "keyword_score": keyword_score,
                            "data": result
                        }

                # 计算最终分数
                final_results = []
                for doc_id, scores in combined_scores.items():
                    final_score = (
                        vector_weight * scores["vector_score"] +
                        keyword_weight * scores["keyword_score"]
                    )

                    result = scores["data"].copy()
                    result["final_score"] = final_score
                    final_results.append(result)

                # 按最终分数排序并限制数量
                final_results.sort(key=lambda x: x["final_score"], reverse=True)
                return final_results[:limit]

        except Exception as e:
            logger.error(f"Hybrid search failed: {e}")
            raise

    async def keyword_search(
        self,
        query_text: str,
        knowledge_base_id: Optional[str] = None,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        关键词搜索

        Args:
            query_text: 查询文本
            knowledge_base_id: 知识库ID
            limit: 返回结果数量
            filters: 过滤条件

        Returns:
            关键词搜索结果
        """
        try:
            async with self.get_connection() as conn:
                # 构建查询条件
                where_conditions = ["content ILIKE $query_text"]
                params = {
                    "query_text": f"%{query_text}%",
                    "limit": limit
                }

                if knowledge_base_id:
                    where_conditions.append("kb_id = $knowledge_base_id")
                    params["knowledge_base_id"] = knowledge_base_id

                if filters:
                    if filters.get("status"):
                        where_conditions.append("status = $status")
                        params["status"] = filters["status"]

                where_clause = " AND ".join(where_conditions)

                query = f"""
                SELECT
                    id, document_id, content,
                    ts_rank_cd(to_tsvector('chinese', content), plainto_tsquery('chinese', $query_text)) as rank_score,
                    chunk_index, metadata
                FROM rag.document_chunks
                WHERE {where_clause}
                ORDER BY rank_score DESC
                LIMIT $limit
                """

                rows = await conn.fetch(query, *params.values())

                results = []
                for row in rows:
                    result = {
                        "id": row["id"],
                        "document_id": row["document_id"],
                        "content": row["content"],
                        "rank_score": float(row["rank_score"]),
                        "chunk_index": row["chunk_index"],
                        "metadata": row["metadata"]
                    }
                    results.append(result)

                return results

        except Exception as e:
            logger.error(f"Keyword search failed: {e}")
            raise

    async def insert_chunks(
        self,
        chunks: List[Dict[str, Any]]
    ) -> List[str]:
        """
        批量插入文档片段

        Args:
            chunks: 片段列表

        Returns:
            插入的片段ID列表
        """
        try:
            async with self.get_connection() as conn:
                chunk_ids = []

                for chunk in chunks:
                    # 插入或更新文档信息
                    await conn.execute(
                        """
                        INSERT INTO rag.documents (
                            id, kb_id, title, content, file_path,
                            file_type, status, word_count, created_at, created_by
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (id) DO UPDATE SET
                            title = EXCLUDED.title,
                            content = EXCLUDED.content,
                            updated_at = CURRENT_TIMESTAMP
                        """,
                        chunk["document_id"],
                        chunk["kb_id"],
                        chunk["title"],
                        chunk["content"],
                        chunk.get("file_path", ""),
                        chunk.get("file_type", "text"),
                        "completed",
                        len(chunk["content"]),
                        chunk.get("created_at", "NOW()"),
                        chunk.get("created_by", "system")
                    )

                    # 插入向量片段
                    chunk_id = await conn.fetchval(
                        """
                        INSERT INTO rag.document_chunks (
                            id, document_id, chunk_index, content, vector, metadata
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING id
                        """,
                        chunk["id"],
                        chunk["document_id"],
                        chunk["chunk_index"],
                        chunk["content"],
                        chunk["vector"],
                        chunk.get("metadata", {})
                    )

                    chunk_ids.append(chunk_id)

                return chunk_ids

        except Exception as e:
            logger.error(f"Failed to insert chunks: {e}")
            raise

    async def delete_document(self, document_id: str) -> bool:
        """
        删除文档及其所有片段

        Args:
            document_id: 文档ID

        Returns:
            删除是否成功
        """
        try:
            async with self.get_connection() as conn:
                # 删除文档片段
                await conn.execute(
                    "DELETE FROM rag.document_chunks WHERE document_id = $1",
                    document_id
                )

                # 删除文档
                result = await conn.execute(
                    "DELETE FROM rag.documents WHERE id = $1",
                    document_id
                )

                return result == "DELETE 1"

        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            return False
```

#### RAGService类
```python
# services/rag_service.py
import asyncio
import hashlib
from typing import List, Dict, Any, Optional, AsyncGenerator
from services.zhipu_service import ZhipuAIService
from services.vector_service import VectorService
from services.redis_cache import RedisCache
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

class RAGService:
    """RAG服务 - 基于智普清言和pgvector"""

    def __init__(
        self,
        zhipu_service: ZhipuAIService,
        vector_service: VectorService,
        cache_service: RedisCache
    ):
        self.zhipu_service = zhipu_service
        self.vector_service = vector_service
        self.cache = cache_service

    async def search_documents(
        self,
        query: str,
        knowledge_base_id: Optional[str] = None,
        limit: int = 10,
        search_type: str = "hybrid",
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        搜索相关文档

        Args:
            query: 查询文本
            knowledge_base_id: 知识库ID
            limit: 返回结果数量
            search_type: 搜索类型 (vector/keyword/hybrid)
            filters: 过滤条件

        Returns:
            搜索结果
        """
        try:
            # 生成查询哈希用于缓存
            query_hash = hashlib.md5(
                f"{query}_{knowledge_base_id}_{limit}_{search_type}_{filters}".encode()
            ).hexdigest()

            # 尝试从缓存获取结果
            cached_results = await self.cache.get_search_results(query_hash)
            if cached_results:
                logger.info(f"Cache hit for query: {query[:50]}...")
                return cached_results

            # 获取查询向量
            query_vector = await self.zhipu_service.get_embedding(query)

            # 根据搜索类型执行搜索
            if search_type == "vector":
                results = await self.vector_service.vector_search(
                    query_vector, knowledge_base_id, limit, 0.7, filters
                )
            elif search_type == "keyword":
                results = await self.vector_service.keyword_search(
                    query, knowledge_base_id, limit, filters
                )
            else:  # hybrid
                results = await self.vector_service.hybrid_search(
                    query, query_vector, knowledge_base_id, limit,
                    vector_weight=0.7, keyword_weight=0.3, filters=filters
                )

            # 缓存搜索结果
            await self.cache.set_search_results(query_hash, results, ttl=1800)

            return results

        except Exception as e:
            logger.error(f"Document search failed: {e}")
            raise

    async def generate_response(
        self,
        query: str,
        conversation_id: Optional[str] = None,
        knowledge_base_id: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        use_context: bool = True
    ) -> Dict[str, Any] | AsyncGenerator:
        """
        生成RAG响应

        Args:
            query: 用户查询
            conversation_id: 对话ID
            knowledge_base_id: 知识库ID
            temperature: 温度参数
            max_tokens: 最大token数
            stream: 是否流式返回
            use_context: 是否使用上下文检索

        Returns:
            生成的响应
        """
        try:
            # 搜索相关文档
            context_docs = []
            if use_context:
                context_docs = await self.search_documents(
                    query, knowledge_base_id, limit=5, search_type="hybrid"
                )

            # 构建上下文
            context_text = ""
            if context_docs:
                context_chunks = []
                for i, doc in enumerate(context_docs):
                    chunk = f"资料{i+1}: {doc['content']}\n"
                    context_chunks.append(chunk)
                    if len(''.join(context_chunks)) > 2000:  # 限制上下文长度
                        break

                context_text = '\n'.join(context_chunks)

            # 构建消息
            messages = self._build_messages(query, context_text, conversation_id)

            if stream:
                return self._stream_response(
                    messages, temperature, max_tokens, context_docs
                )
            else:
                return await self._generate_response(
                    messages, temperature, max_tokens, context_docs
                )

        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            raise

    def _build_messages(
        self,
        query: str,
        context: str,
        conversation_id: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """构建对话消息"""
        system_prompt = """你是一个智能助手，专门帮助用户解答问题。请基于提供的资料回答用户的问题。

回答要求：
1. 基于提供的资料进行回答，如果资料中没有相关信息，请明确说明
2. 回答要准确、清晰、有条理
3. 如果资料中有矛盾的信息，请指出
4. 适当使用项目符号和分段来组织回答
5. 语言要自然流畅，符合中文表达习惯"""

        user_prompt = f"用户问题：{query}"

        if context:
            user_prompt = f"参考资料：\n{context}\n\n{user_prompt}"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        return messages

    async def _generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: Optional[int],
        context_docs: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """生成完整响应"""
        response = await self.zhipu_service.chat_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )

        return {
            "response": response["choices"][0]["message"]["content"],
            "context_docs": context_docs,
            "model": response["model"],
            "usage": response.get("usage", {}),
            "sources": [doc["document_id"] for doc in context_docs]
        }

    async def _stream_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: Optional[int],
        context_docs: List[Dict[str, Any]]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """流式生成响应"""
        async for chunk in self.zhipu_service.chat_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        ):
            yield {
                "chunk": chunk,
                "context_docs": context_docs if not chunk.get("choices") else None,
                "sources": [doc["document_id"] for doc in context_docs]
            }

    async def index_document(
        self,
        content: str,
        title: str,
        knowledge_base_id: str,
        file_path: Optional[str] = None,
        file_type: str = "text",
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> str:
        """
        索引文档到向量数据库

        Args:
            content: 文档内容
            title: 文档标题
            knowledge_base_id: 知识库ID
            file_path: 文件路径
            file_type: 文件类型
            chunk_size: 分块大小
            chunk_overlap: 分块重叠

        Returns:
            文档ID
        """
        try:
            import uuid
            document_id = str(uuid.uuid4())

            # 分块处理
            chunks = []
            for i in range(0, len(content), chunk_size - chunk_overlap):
                chunk_start = i
                chunk_end = min(i + chunk_size, len(content))
                chunk_content = content[chunk_start:chunk_end]

                chunks.append({
                    "content": chunk_content,
                    "chunk_index": i // (chunk_size - chunk_overlap)
                })

            # 批量获取嵌入向量
            chunk_texts = [chunk["content"] for chunk in chunks]
            embeddings = await self.zhipu_service.get_embeddings_batch(chunk_texts)

            # 准备插入数据
            insert_chunks = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                insert_chunks.append({
                    "id": str(uuid.uuid4()),
                    "document_id": document_id,
                    "kb_id": knowledge_base_id,
                    "title": title,
                    "content": chunk["content"],
                    "chunk_index": chunk["chunk_index"],
                    "vector": embedding,
                    "file_path": file_path,
                    "file_type": file_type,
                    "created_by": "system"
                })

            # 插入向量数据库
            await self.vector_service.insert_chunks(insert_chunks)

            # 清除相关缓存
            await self.cache.invalidate_pattern("search")

            logger.info(f"Successfully indexed document: {title}")
            return document_id

        except Exception as e:
            logger.error(f"Document indexing failed: {e}")
            raise

    async def delete_document(self, document_id: str) -> bool:
        """删除文档"""
        try:
            success = await self.vector_service.delete_document(document_id)

            if success:
                # 清除相关缓存
                await self.cache.invalidate_pattern("search")
                logger.info(f"Successfully deleted document: {document_id}")

            return success

        except Exception as e:
            logger.error(f"Document deletion failed: {e}")
            return False
```

### 4.4 服务配置和初始化

#### 服务工厂
```python
# services/service_factory.py
import os
import asyncpg
from services.zhipu_service import ZhipuAIService
from services.vector_service import VectorService
from services.redis_cache import RedisCache
from services.rag_service import RAGService

class ServiceFactory:
    """服务工厂类"""

    def __init__(self):
        self._zhipu_service = None
        self._vector_service = None
        self._cache_service = None
        self._rag_service = None
        self._db_pool = None

    async def get_db_pool(self) -> asyncpg.Pool:
        """获取数据库连接池"""
        if not self._db_pool:
            self._db_pool = await asyncpg.create_pool(
                os.getenv('DATABASE_URL'),
                min_size=5,
                max_size=20,
                command_timeout=60
            )
        return self._db_pool

    async def get_zhipu_service(self) -> ZhipuAIService:
        """获取智普清言服务"""
        if not self._zhipu_service:
            self._zhipu_service = ZhipuAIService(
                api_key=os.getenv('ZHIPU_API_KEY'),
                base_url=os.getenv('ZHIPU_BASE_URL', 'https://open.bigmodel.cn/api/paas/v4')
            )
        return self._zhipu_service

    async def get_cache_service(self) -> RedisCache:
        """获取缓存服务"""
        if not self._cache_service:
            self._cache_service = RedisCache(
                redis_url=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
                default_ttl=int(os.getenv('REDIS_TTL', 3600))
            )
            await self._cache_service.connect()
        return self._cache_service

    async def get_vector_service(self) -> VectorService:
        """获取向量服务"""
        if not self._vector_service:
            pool = await self.get_db_pool()
            self._vector_service = VectorService(pool)
        return self._vector_service

    async def get_rag_service(self) -> RAGService:
        """获取RAG服务"""
        if not self._rag_service:
            zhipu_service = await self.get_zhipu_service()
            vector_service = await self.get_vector_service()
            cache_service = await self.get_cache_service()

            self._rag_service = RAGService(
                zhipu_service=zhipu_service,
                vector_service=vector_service,
                cache_service=cache_service
            )
        return self._rag_service

    async def initialize_services(self):
        """初始化所有服务"""
        await self.get_db_pool()
        await self.get_zhipu_service()
        await self.get_cache_service()
        await self.get_vector_service()
        await self.get_rag_service()

    async def cleanup_services(self):
        """清理所有服务"""
        if self._db_pool:
            await self._db_pool.close()

        if self._cache_service:
            await self._cache_service.disconnect()

        if self._zhipu_service:
            await self._zhipu_service.__aexit__(None, None, None)

# 全局服务实例
service_factory = ServiceFactory()
```

## 5. 启动和部署脚本

### 5.1 开发环境启动脚本
```bash
#!/bin/bash
# scripts/start-dev.sh

echo "🚀 启动RAG系统开发环境..."

# 启动Docker服务
echo "📦 启动PostgreSQL和Redis..."
docker-compose -f docker-compose.dev.yml up -d

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 初始化数据库
echo "🗄️ 初始化数据库..."
python scripts/init_database.py

# 启动FastAPI应用
echo "🌐 启动FastAPI应用..."
export APP_ENV=development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

echo "✅ 开发环境启动完成！"
echo "📖 API文档: http://localhost:8000/docs"
echo "🔧 PgAdmin: http://localhost:5050"
```

### 5.2 生产环境部署脚本
```bash
#!/bin/bash
# scripts/deploy-prod.sh

echo "🚀 部署RAG系统生产环境..."

# 构建Docker镜像
echo "🏗️ 构建Docker镜像..."
docker build -t rag-backend:latest .

# 停止旧容器
echo "🛑 停止旧容器..."
docker-compose -f docker-compose.prod.yml down

# 启动新容器
echo "🚀 启动生产容器..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🏥 执行健康检查..."
curl -f http://localhost:8000/health || exit 1

echo "✅ 生产环境部署完成！"
```

### 5.3 数据库迁移脚本
```bash
#!/bin/bash
# scripts/migrate-database.sh

echo "🗄️ 执行数据库迁移..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误：未设置DATABASE_URL环境变量"
    exit 1
fi

# 执行迁移
python scripts/migrate-data.py

echo "✅ 数据库迁移完成！"
```

## 6. 测试和验证

### 6.1 单元测试
```python
# tests/test_rag_service.py
import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from services.rag_service import RAGService
from services.zhipu_service import ZhipuAIService
from services.vector_service import VectorService
from services.redis_cache import RedisCache

@pytest.fixture
async def rag_service():
    """创建RAG服务测试实例"""
    zhipu_service = AsyncMock(spec=ZhipuAIService)
    vector_service = AsyncMock(spec=VectorService)
    cache_service = AsyncMock(spec=RedisCache)

    service = RAGService(zhipu_service, vector_service, cache_service)
    return service

@pytest.mark.asyncio
async def test_search_documents(rag_service):
    """测试文档搜索功能"""
    # 模拟返回数据
    rag_service.vector_service.hybrid_search.return_value = [
        {"document_id": "doc1", "content": "测试内容", "similarity": 0.8}
    ]

    results = await rag_service.search_documents("测试查询")

    assert len(results) == 1
    assert results[0]["document_id"] == "doc1"
    rag_service.vector_service.hybrid_search.assert_called_once()

@pytest.mark.asyncio
async def test_generate_response(rag_service):
    """测试响应生成功能"""
    # 模拟搜索结果
    rag_service.search_documents = AsyncMock(return_value=[])

    # 模拟智普清言响应
    rag_service.zhipu_service.chat_completion.return_value = {
        "choices": [{"message": {"content": "测试回复"}}],
        "model": "glm-4-plus",
        "usage": {"total_tokens": 100}
    }

    response = await rag_service.generate_response(
        query="测试问题",
        use_context=False
    )

    assert response["response"] == "测试回复"
    assert response["model"] == "glm-4-plus"
```

### 6.2 集成测试
```python
# tests/test_integration.py
import pytest
import asyncio
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_chat_integration():
    """测试完整的聊天流程"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # 发送聊天请求
        response = await client.post(
            "/api/chat",
            json={
                "message": "你好",
                "conversation_id": None,
                "knowledge_base_id": None
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "sources" in data

@pytest.mark.asyncio
async def test_document_indexing():
    """测试文档索引流程"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # 上传文档
        response = await client.post(
            "/api/documents",
            files={"file": ("test.txt", "测试文档内容", "text/plain")},
            data={"knowledge_base_id": "test_kb", "title": "测试文档"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "document_id" in data
```

## 7. 监控和日志

### 7.1 应用监控
```python
# monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest
import time
import logging

logger = logging.getLogger(__name__)

# 定义指标
CHAT_REQUESTS = Counter('rag_chat_requests_total', 'Total chat requests')
CHAT_DURATION = Histogram('rag_chat_duration_seconds', 'Chat response duration')
DOCUMENT_INDEXING = Counter('rag_document_indexing_total', 'Documents indexed')
VECTOR_SEARCH = Histogram('rag_vector_search_duration_seconds', 'Vector search duration')
ACTIVE_CONNECTIONS = Gauge('rag_active_connections', 'Active database connections')

class MetricsCollector:
    """指标收集器"""

    def __init__(self):
        self.chat_requests = CHAT_REQUESTS
        self.chat_duration = CHAT_DURATION
        self.document_indexing = DOCUMENT_INDEXING
        self.vector_search = VECTOR_SEARCH
        self.active_connections = ACTIVE_CONNECTIONS

    def record_chat_request(self):
        """记录聊天请求"""
        self.chat_requests.inc()

    def record_chat_duration(self, duration: float):
        """记录聊天响应时间"""
        self.chat_duration.observe(duration)

    def record_document_indexing(self):
        """记录文档索引"""
        self.document_indexing.inc()

    def record_vector_search(self, duration: float):
        """记录向量搜索时间"""
        self.vector_search.observe(duration)

    def set_active_connections(self, count: int):
        """设置活跃连接数"""
        self.active_connections.set(count)

    def get_metrics(self) -> str:
        """获取Prometheus格式的指标"""
        return generate_latest()

# 全局指标收集器
metrics = MetricsCollector()
```

### 7.2 日志配置
```python
# logging_config.py
import logging
import logging.config
from datetime import datetime

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'detailed': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        },
        'json': {
            'format': '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'detailed'
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'DEBUG',
            'filename': 'logs/rag_system.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'json'
        },
        'error_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'ERROR',
            'filename': 'logs/rag_system_error.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'json'
        }
    },
    'loggers': {
        '': {  # root logger
            'handlers': ['console', 'file'],
            'level': 'INFO'
        },
        'rag': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'DEBUG',
            'propagate': False
        }
    }
}

def setup_logging():
    """设置日志配置"""
    logging.config.dictConfig(LOGGING_CONFIG)
    logger = logging.getLogger(__name__)
    logger.info("Logging system initialized")
```

这个完整的PostgreSQL + 智普清言集成方案提供了：

1. **完整的数据库架构** - 基于PostgreSQL + pgvector的向量存储
2. **智普清言API封装** - 完整的嵌入和聊天服务
3. **Redis缓存系统** - 提高查询性能
4. **混合搜索功能** - 向量搜索和关键词搜索结合
5. **完整的迁移工具** - 从MySQL/FAISS迁移到PostgreSQL/pgvector
6. **服务工厂模式** - 统一管理各种服务
7. **监控和日志系统** - 完整的运维支持
8. **测试框架** - 单元测试和集成测试
9. **部署脚本** - 开发和生产环境部署

这个方案支持高并发、高可用，并且具有良好的扩展性。
    async with DatabaseMigration(db_url) as migration:
        if input("是否从MySQL迁移数据？(y/n): ").lower() == 'y':
            await migration.migrate_from_mysql(mysql_config)
        else:
            print("跳过MySQL数据迁移")

        # 验证迁移结果
        await migration.validate_migration()

async def main():
    """主入口函数"""
    await main()

if __name__ == "__main__":
    asyncio.run(main())
```
```
TodoWrite
<arg_key>todos</arg_key>
<arg_value>[{"content": "设计和实现PostgreSQL数据库迁移和智普清言API集成", "status": "in_progress", "activeForm": "设计和实现PostgreSQL数据库迁移和智普清言API集成"}, {"content": "PostgreSQL环境搭建", "status": "completed", "activeForm": "完成PostgreSQL环境搭建"}, {"content": "pgvector扩展安装配置", "status": "in_progress", "activeForm": "安装和配置pgvector扩展"}, {"content": "数据库初始化脚本编写", "status": "pending", "activeForm": "编写数据库初始化脚本"}, {"content": "数据迁移方案设计", "status": "pending", "activeForm": "设计数据迁移方案"}, {"content": "数据模型重构", "status": "pending", "activeForm": "重构数据模型以支持邮箱认证"}, {"content": "智普清言API接入配置", "status": "pending", "activeForm": "配置智普清言API接入"}, {"content": "Embedding和Chat服务封装", "status": "pending", "activeForm": "封装Embedding和Chat服务"}]