# 📖 棠心问答系统开发者指南

> **iChat RAG-QA System Developer Guide**

[🏠 返回首页](README.md) | [👥 用户手册](USERGUIDE.md) | [📋 项目进度](TODO.md) | [🔧 API文档](http://localhost:5000/api/docs)

## 目录

- [🎯 开发概述](#开发概述)
- [🛠️ 环境搭建](#️环境搭建)
- [🏗️ 系统架构](#️系统架构)
- [💻 开发规范](#-开发规范)
- [🔧 核心模块开发](#-核心模块开发)
- [🧪 测试指南](#-测试指南)
- [🚀 部署指南](#-部署指南)
- [🐛 调试与排错](#-调试与排错)
- [📊 性能优化](#-性能优化)
- [🔒 安全开发](#-安全开发)

## 🎯 开发概述

### 项目简介

棠心问答 (iChat) 是一个基于 **RAG (Retrieval-Augmented Generation)** 技术的智能问答系统，采用现代化的前后端分离架构，为北京第二外国语学院提供专业的智能问答服务。

### 技术栈总览

```mermaid
graph LR
    A[前端技术栈] --> A1[Vue 3]
    A --> A2[Element Plus]
    A --> A3[Pinia]
    A --> A4[TypeScript]

    B[后端技术栈] --> B1[Flask 3.1]
    B --> B2[SQLAlchemy 2.0]
    B --> B3[FAISS]
    B --> B4[ sentence-transformers]

    C[AI/ML技术栈] --> C1[Google Gemini]
    C --> C2[DeepSeek]
    C --> C3[LangChain]
    C --> C4[RAG Pipeline]

    D[基础设施] --> D1[Docker]
    D --> D2[Nginx]
    D --> D3[Gunicorn]
    D --> D4[Redis]
```

## 🛠️ 环境搭建

### 系统要求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| **操作系统** | Windows 10/macOS 10.15/Ubuntu 18.04 | Windows 11/macOS 12/Ubuntu 20.04 |
| **Python** | 3.9+ | 3.11 |
| **Node.js** | 16.0+ | 18.0+ |
| **内存** | 4GB | 8GB+ |
| **存储** | 10GB | 20GB+ |
| **Docker** | 20.0+ | 24.0+ |

### 开发环境配置

#### 1. 克隆项目

```bash
git clone https://github.com/liubin18911671739/ichat.git
cd ichat
```

#### 2. 后端开发环境

```bash
# 创建虚拟环境
cd backend
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 安装开发工具
pip install black flake8 pytest pytest-cov pre-commit

# 设置pre-commit钩子
pre-commit install
```

#### 3. 前端开发环境

```bash
cd frontend

# 安装依赖
npm install

# 安装开发工具
npm install -g @vue/cli

# 配置ESLint和Prettier
npx eslint --init
```

#### 4. 开发工具配置

##### VS Code 推荐插件

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "ms-python.flake8",
    "Vue.volar",
    "Vue.vscode-typescript-vue-plugin",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode-remote.remote-containers",
    "ms-azuretools.vscode-docker"
  ]
}
```

##### VS Code 设置

```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## 🏗️ 系统架构

### 整体架构图

```mermaid
graph TB
    subgraph "用户层"
        U1[Web用户]
        U2[小程序用户]
        U3[管理员]
    end

    subgraph "接入层"
        LB[Nginx负载均衡]
        AUTH[JWT/RADIUS认证]
    end

    subgraph "应用层"
        API[Flask API服务]
        WEB[Vue前端服务]
        MINI[微信小程序]
    end

    subgraph "业务层"
        CHAT[聊天服务]
        RAG[RAG服务]
        DOC[文档服务]
        VECTOR[向量服务]
    end

    subgraph "数据层"
        DB[(SQL数据库)]
        FAISS[(FAISS向量库)]
        FILES[文件存储]
        CACHE[Redis缓存]
    end

    subgraph "外部服务"
        GEMINI[Google Gemini]
        DEEPSEEK[DeepSeek API]
        RADIUS[RADIUS服务器]
    end

    U1 --> LB
    U2 --> MINI
    U3 --> WEB

    LB --> AUTH
    AUTH --> API
    WEB --> API
    MINI --> API

    API --> CHAT
    API --> RAG
    API --> DOC
    API --> VECTOR

    CHAT --> DB
    RAG --> FAISS
    RAG --> GEMINI
    RAG --> DEEPSEEK
    DOC --> FILES
    VECTOR --> FAISS

    AUTH --> RADIUS
    API --> CACHE
```

### 目录结构

```
ichat/
├── backend/                          # 后端服务
│   ├── app.py                       # Flask应用入口
│   ├── config.py                    # 配置管理
│   ├── requirements.txt             # Python依赖
│   ├── models/                      # 数据模型
│   │   ├── __init__.py
│   │   └── database.py             # 数据库模型定义
│   ├── routes/                      # API路由
│   │   ├── __init__.py
│   │   ├── auth.py                 # 认证相关
│   │   ├── chat.py                 # 聊天接口
│   │   ├── scenes.py               # 场景管理
│   │   ├── documents.py            # 文档管理
│   │   └── analytics.py            # 数据分析
│   ├── services/                    # 业务服务
│   │   ├── __init__.py
│   │   ├── chat_service.py         # 聊天业务逻辑
│   │   ├── rag_service.py          # RAG检索生成
│   │   ├── embedding_service.py    # 文本向量化
│   │   ├── vector_service.py       # 向量数据库操作
│   │   └── document_service.py     # 文档处理服务
│   ├── tests/                       # 测试用例
│   │   ├── conftest.py             # pytest配置
│   │   ├── test_auth.py            # 认证测试
│   │   ├── test_chat.py            # 聊天测试
│   │   └── test_services.py        # 服务测试
│   ├── logs/                        # 日志文件
│   ├── migrations/                  # 数据库迁移
│   └── instance/                    # 实例文件
├── frontend/                         # 前端应用
│   ├── public/                      # 静态资源
│   ├── src/                         # 源代码
│   │   ├── main.js                 # 应用入口
│   │   ├── App.vue                 # 根组件
│   │   ├── components/             # 通用组件
│   │   │   ├── ChatBox.vue        # 聊天组件
│   │   │   ├── ResponseRenderer.vue # 回答渲染
│   │   │   └── HistoryPanel.vue   # 历史记录
│   │   ├── views/                  # 页面组件
│   │   │   ├── ChatView.vue       # 聊天页面
│   │   │   ├── LoginView.vue      # 登录页面
│   │   │   └── AdminView.vue      # 管理后台
│   │   ├── store/                  # 状态管理
│   │   │   ├── index.js           # Pinia store
│   │   │   └── modules/           # 模块化store
│   │   ├── router/                 # 路由配置
│   │   ├── services/               # API服务
│   │   └── utils/                  # 工具函数
│   ├── package.json               # 前端依赖
│   ├── vue.config.cjs             # Vue配置
│   └── tests/                     # 前端测试
├── miniprogram/                     # 微信小程序
│   ├── pages/                     # 页面
│   ├── utils/                     # 工具函数
│   ├── components/                # 组件
│   └── config/                    # 配置文件
├── docs/                          # 项目文档
├── docker/                        # Docker配置
├── nginx/                         # Nginx配置
├── docker-compose.yml             # Docker编排
├── .env.example                   # 环境变量模板
├── README.md                      # 项目说明
├── DEVELOP.md                     # 开发指南
└── USERGUIDE.md                   # 用户手册
```

## 💻 开发规范

### 代码规范

#### Python (后端)

**PEP 8 标准**：

```python
# 导入顺序
import os
import sys
from datetime import datetime

from flask import Flask, request, jsonify
from sqlalchemy import Column, Integer, String

from .services import chat_service
from ..models.database import User

# 函数命名：snake_case
def process_user_request(user_id: int, request_data: dict) -> dict:
    """处理用户请求

    Args:
        user_id: 用户ID
        request_data: 请求数据

    Returns:
        处理结果字典

    Raises:
        ValueError: 当参数无效时
    """
    if not user_id or not request_data:
        raise ValueError("参数不能为空")

    # 业务逻辑
    result = chat_service.handle_request(user_id, request_data)
    return result

# 类命名：PascalCase
class ChatService:
    """聊天服务类"""

    def __init__(self):
        self.config = load_config()

    def send_message(self, message: str) -> str:
        """发送消息"""
        # 实现逻辑
        pass
```

**类型提示**：

```python
from typing import List, Dict, Optional, Union
from dataclasses import dataclass

@dataclass
class ChatMessage:
    user_id: int
    content: str
    scene_id: Optional[str] = None
    timestamp: Optional[datetime] = None

def process_messages(messages: List[ChatMessage]) -> Dict[str, Union[str, int]]:
    """处理消息列表"""
    pass
```

#### JavaScript/Vue (前端)

**ESLint + Prettier 配置**：

```javascript
// 使用ES6+语法
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

// 组合式API
export default {
  name: 'ChatComponent',
  props: {
    userId: {
      type: String,
      required: true
    },
    sceneId: {
      type: String,
      default: 'general'
    }
  },
  setup(props) {
    const router = useRouter()
    const messages = ref([])
    const loading = ref(false)

    // 响应式数据
    const state = reactive({
      currentScene: null,
      showHistory: false
    })

    // 计算属性
    const filteredMessages = computed(() => {
      return messages.value.filter(msg => msg.scene_id === props.sceneId)
    })

    // 方法
    const sendMessage = async (content) => {
      try {
        loading.value = true
        const response = await chatAPI.sendMessage({
          content,
          user_id: props.userId,
          scene_id: props.sceneId
        })

        messages.value.push(response)
        ElMessage.success('发送成功')
      } catch (error) {
        ElMessage.error('发送失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    return {
      messages,
      loading,
      state,
      filteredMessages,
      sendMessage
    }
  }
}
```

### Git 工作流

#### 分支策略

```
main                    # 主分支，生产环境代码
├── develop            # 开发分支
├── feature/xxx        # 功能分支
├── hotfix/xxx         # 热修复分支
└── release/xxx        # 发布分支
```

#### 提交规范

```bash
# 格式：<type>(<scope>): <subject>

feat(api): 添加文档上传接口
fix(frontend): 修复聊天界面显示问题
docs(readme): 更新安装说明
style(format): 代码格式化
refactor(service): 重构RAG服务
test(chat): 添加聊天功能测试
chore(deps): 更新依赖版本
```

#### 开发流程

1. **创建功能分支**：
   ```bash
   git checkout -b feature/chat-enhancement
   ```

2. **开发和提交**：
   ```bash
   git add .
   git commit -m "feat(chat): 添加智能推荐功能"
   git push origin feature/chat-enhancement
   ```

3. **创建Pull Request**：
   - 填写PR模板
   - 请求代码审查
   - 通过CI/CD检查

4. **合并代码**：
   ```bash
   git checkout develop
   git merge feature/chat-enhancement
   git push origin develop
   ```

## 🔧 核心模块开发

### 1. 后端API开发

#### 新建API端点

```python
# backend/routes/example.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

bp = Blueprint('example', __name__, url_prefix='/api/example')

@bp.route('', methods=['GET'])
@jwt_required()
def get_examples():
    """获取示例列表"""
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)

    # 业务逻辑
    examples = example_service.get_user_examples(user_id, page, limit)

    return jsonify({
        'status': 'success',
        'data': examples,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': len(examples)
        }
    })

@bp.route('', methods=['POST'])
@jwt_required()
def create_example():
    """创建新示例"""
    user_id = get_jwt_identity()
    data = request.get_json()

    # 参数验证
    if not data or 'content' not in data:
        return jsonify({
            'status': 'error',
            'message': '缺少必要参数'
        }), 400

    try:
        example = example_service.create_example(user_id, data)
        return jsonify({
            'status': 'success',
            'data': example
        }), 201
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
```

#### 注册路由

```python
# backend/routes/__init__.py
from flask import Blueprint
from .example import bp as example_bp

# 主Blueprint
bp = Blueprint('main', __name__)

# 注册子Blueprint
bp.register_blueprint(example_bp)

# 导出所有路由
from . import auth, chat, scenes, example
```

### 2. 服务层开发

#### 业务服务实现

```python
# backend/services/example_service.py
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from ..models.database import Example, db
from ..utils.exceptions import ValidationError, NotFoundError

class ExampleService:
    """示例服务类"""

    def __init__(self):
        self.session = db.session

    def get_user_examples(self, user_id: int, page: int, limit: int) -> List[Dict]:
        """获取用户示例列表"""
        try:
            examples = (
                self.session.query(Example)
                .filter(Example.user_id == user_id)
                .offset((page - 1) * limit)
                .limit(limit)
                .all()
            )

            return [self._serialize_example(example) for example in examples]
        except Exception as e:
            raise Exception(f"获取示例失败: {str(e)}")

    def create_example(self, user_id: int, data: Dict) -> Dict:
        """创建新示例"""
        try:
            # 验证数据
            self._validate_example_data(data)

            # 创建记录
            example = Example(
                user_id=user_id,
                content=data['content'],
                scene_id=data.get('scene_id'),
                status=data.get('status', 'active')
            )

            self.session.add(example)
            self.session.commit()

            return self._serialize_example(example)
        except Exception as e:
            self.session.rollback()
            raise Exception(f"创建示例失败: {str(e)}")

    def _validate_example_data(self, data: Dict) -> None:
        """验证示例数据"""
        if not data.get('content', '').strip():
            raise ValidationError("内容不能为空")

        if len(data['content']) > 1000:
            raise ValidationError("内容长度不能超过1000字符")

    def _serialize_example(self, example: Example) -> Dict:
        """序列化示例对象"""
        return {
            'id': example.id,
            'content': example.content,
            'scene_id': example.scene_id,
            'status': example.status,
            'created_at': example.created_at.isoformat(),
            'updated_at': example.updated_at.isoformat()
        }

# 全局服务实例
example_service = ExampleService()
```

### 3. 前端组件开发

#### 通用组件

```vue
<!-- frontend/src/components/ExampleComponent.vue -->
<template>
  <div class="example-component">
    <div class="example-header">
      <h3>{{ title }}</h3>
      <el-button
        type="primary"
        @click="handleCreate"
        :loading="loading"
      >
        新建示例
      </el-button>
    </div>

    <div class="example-content">
      <el-table :data="examples" v-loading="loading">
        <el-table-column prop="content" label="内容" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > pageSize"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { exampleAPI } from '@/services/api'
import { formatDate } from '@/utils/date'

export default {
  name: 'ExampleComponent',
  props: {
    title: {
      type: String,
      default: '示例列表'
    }
  },
  setup(props) {
    const loading = ref(false)
    const examples = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)

    // 获取示例列表
    const fetchExamples = async () => {
      try {
        loading.value = true
        const response = await exampleAPI.getExamples({
          page: currentPage.value,
          limit: pageSize.value
        })

        examples.value = response.data
        total.value = response.pagination.total
      } catch (error) {
        ElMessage.error('获取示例列表失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    // 创建示例
    const handleCreate = () => {
      // 跳转到创建页面或打开对话框
      console.log('创建示例')
    }

    // 编辑示例
    const handleEdit = (row) => {
      console.log('编辑示例:', row)
    }

    // 删除示例
    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除这个示例吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        await exampleAPI.deleteExample(row.id)
        ElMessage.success('删除成功')
        await fetchExamples()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败: ' + error.message)
        }
      }
    }

    // 页面变化
    const handlePageChange = (page) => {
      currentPage.value = page
      fetchExamples()
    }

    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        'active': 'success',
        'inactive': 'warning',
        'deleted': 'danger'
      }
      return statusMap[status] || 'info'
    }

    onMounted(() => {
      fetchExamples()
    })

    return {
      loading,
      examples,
      currentPage,
      pageSize,
      total,
      fetchExamples,
      handleCreate,
      handleEdit,
      handleDelete,
      handlePageChange,
      getStatusType,
      formatDate
    }
  }
}
</script>

<style scoped>
.example-component {
  padding: 20px;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.example-content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.el-pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
```

### 4. RAG服务开发

#### 向量化服务

```python
# backend/services/embedding_service.py
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Union
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)

class EmbeddingService:
    """文本向量化服务"""

    def __init__(self, model_name: str = 'paraphrase-multilingual-MiniLM-L12-v2'):
        self.model_name = model_name
        self.model = None
        self.embedding_dim = 384

    def load_model(self):
        """加载向量化模型"""
        if self.model is None:
            logger.info(f"正在加载模型: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info("模型加载完成")

    @lru_cache(maxsize=1000)
    def get_embedding(self, text: str) -> np.ndarray:
        """获取文本向量（带缓存）"""
        if not text or not text.strip():
            return np.zeros(self.embedding_dim)

        try:
            self.load_model()
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding
        except Exception as e:
            logger.error(f"文本向量化失败: {str(e)}")
            return np.zeros(self.embedding_dim)

    def get_embeddings(self, texts: List[str]) -> List[np.ndarray]:
        """批量获取文本向量"""
        if not texts:
            return []

        try:
            self.load_model()
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist() if isinstance(embeddings, np.ndarray) else embeddings
        except Exception as e:
            logger.error(f"批量向量化失败: {str(e)}")
            return [np.zeros(self.embedding_dim) for _ in texts]

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """计算两个文本的相似度"""
        emb1 = self.get_embedding(text1)
        emb2 = self.get_embedding(text2)

        # 余弦相似度
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

# 全局服务实例
embedding_service = EmbeddingService()
```

## 🧪 测试指南

### 后端测试

#### 单元测试

```python
# backend/tests/test_example_service.py
import pytest
from unittest.mock import Mock, patch
from services.example_service import ExampleService
from models.database import Example
from utils.exceptions import ValidationError

class TestExampleService:
    """示例服务测试类"""

    @pytest.fixture
    def service(self):
        """创建服务实例"""
        return ExampleService()

    @pytest.fixture
    def mock_example(self):
        """模拟示例对象"""
        example = Mock(spec=Example)
        example.id = 1
        example.content = "测试内容"
        example.scene_id = "general"
        example.status = "active"
        example.created_at = "2024-01-01T00:00:00"
        example.updated_at = "2024-01-01T00:00:00"
        return example

    def test_validate_example_data_success(self, service):
        """测试数据验证 - 成功"""
        data = {"content": "有效的测试内容"}
        # 不应该抛出异常
        service._validate_example_data(data)

    def test_validate_example_data_empty_content(self, service):
        """测试数据验证 - 空内容"""
        data = {"content": ""}
        with pytest.raises(ValidationError, match="内容不能为空"):
            service._validate_example_data(data)

    def test_validate_example_data_too_long(self, service):
        """测试数据验证 - 内容过长"""
        data = {"content": "a" * 1001}
        with pytest.raises(ValidationError, match="内容长度不能超过1000字符"):
            service._validate_example_data(data)

    def test_serialize_example(self, service, mock_example):
        """测试示例序列化"""
        result = service._serialize_example(mock_example)

        assert result == {
            'id': 1,
            'content': "测试内容",
            'scene_id': "general",
            'status': "active",
            'created_at': "2024-01-01T00:00:00",
            'updated_at': "2024-01-01T00:00:00"
        }

    @patch('services.example_service.db.session')
    def test_create_example_success(self, mock_session, service):
        """测试创建示例 - 成功"""
        # 准备测试数据
        user_id = 1
        data = {
            "content": "新示例内容",
            "scene_id": "test",
            "status": "active"
        }

        # 模拟数据库操作
        mock_example = Mock()
        mock_session.add.return_value = None
        mock_session.commit.return_value = None
        mock_session.query.return_value.filter.return_value.first.return_value = None

        with patch.object(service, '_serialize_example', return_value={"id": 1}):
            result = service.create_example(user_id, data)

        # 验证结果
        assert result == {"id": 1}
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
```

#### 集成测试

```python
# backend/tests/test_example_api.py
import pytest
import json
from app import create_app

class TestExampleAPI:
    """示例API测试类"""

    @pytest.fixture
    def client(self):
        """创建测试客户端"""
        app = create_app('testing')
        with app.test_client() as client:
            with app.app_context():
                yield client

    @pytest.fixture
    def auth_headers(self, client):
        """获取认证头"""
        # 登录获取token
        response = client.post('/api/hybrid_auth', json={
            'username': 'test@example.com',
            'password': 'testpassword'
        })

        if response.status_code == 200:
            token = response.json['access_token']
            return {'Authorization': f'Bearer {token}'}
        return {}

    def test_get_examples_success(self, client, auth_headers):
        """测试获取示例列表 - 成功"""
        response = client.get('/api/examples', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert 'data' in data
        assert 'pagination' in data

    def test_get_examples_unauthorized(self, client):
        """测试获取示例列表 - 未授权"""
        response = client.get('/api/examples')

        assert response.status_code == 401

    def test_create_example_success(self, client, auth_headers):
        """测试创建示例 - 成功"""
        data = {
            'content': '测试示例内容',
            'scene_id': 'general'
        }

        response = client.post(
            '/api/examples',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 201
        response_data = json.loads(response.data)
        assert response_data['status'] == 'success'
        assert 'data' in response_data

    def test_create_example_invalid_data(self, client, auth_headers):
        """测试创建示例 - 无效数据"""
        data = {'content': ''}  # 空内容

        response = client.post(
            '/api/examples',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400
        response_data = json.loads(response.data)
        assert response_data['status'] == 'error'
```

### 前端测试

#### 组件测试

```javascript
// frontend/tests/unit/components/ExampleComponent.spec.js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ExampleComponent from '@/components/ExampleComponent.vue'
import { exampleAPI } from '@/services/api'

// Mock API
jest.mock('@/services/api')
describe('ExampleComponent', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    // Mock API响应
    exampleAPI.getExamples.mockResolvedValue({
      data: [
        { id: 1, content: '测试内容1', status: 'active' },
        { id: 2, content: '测试内容2', status: 'inactive' }
      ],
      pagination: { total: 2, page: 1, limit: 10 }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    jest.clearAllMocks()
  })

  it('正确渲染组件', () => {
    wrapper = mount(ExampleComponent, {
      global: {
        plugins: [pinia]
      },
      props: {
        title: '测试标题'
      }
    })

    expect(wrapper.find('.example-header h3').text()).toBe('测试标题')
    expect(wrapper.find('el-button').text()).toContain('新建示例')
  })

  it('正确加载示例列表', async () => {
    wrapper = mount(ExampleComponent, {
      global: {
        plugins: [pinia]
      }
    })

    // 等待异步数据加载
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(exampleAPI.getExamples).toHaveBeenCalledWith({
      page: 1,
      limit: 10
    })

    const tableRows = wrapper.findAll('el-table-column')
    expect(tableRows.length).toBeGreaterThan(0)
  })

  it('处理API错误', async () => {
    exampleAPI.getExamples.mockRejectedValue(new Error('API错误'))

    wrapper = mount(ExampleComponent, {
      global: {
        plugins: [pinia],
        mocks: {
          $message: {
            error: jest.fn()
          }
        }
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.vm.$message.error).toHaveBeenCalledWith(
      expect.stringContaining('获取示例列表失败')
    )
  })
})
```

### 测试运行

```bash
# 后端测试
cd backend

# 运行所有测试
python -m pytest tests/ -v

# 运行特定测试文件
python -m pytest tests/test_example_service.py -v

# 运行测试并生成覆盖率报告
python -m pytest tests/ --cov=. --cov-report=html

# 运行性能测试
python -m pytest tests/test_performance.py -v -s

# 前端测试
cd frontend

# 运行单元测试
npm run test:unit

# 运行E2E测试
npm run test:e2e

# 生成覆盖率报告
npm run test:coverage
```

## 🚀 部署指南

### 开发环境部署

#### 本地开发

```bash
# 启动后端服务
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py

# 启动前端服务
cd frontend
npm run serve

# 访问应用
# 前端: http://localhost:8080
# 后端: http://localhost:5000
# API文档: http://localhost:5000/api/docs
```

#### Docker开发环境

```bash
# 启动开发环境
docker-compose -f docker-compose.dev.yml up --build

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f

# 停止服务
docker-compose -f docker-compose.dev.yml down
```

### 生产环境部署

#### 1. 服务器准备

```bash
# 安装Docker和Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 创建项目目录
sudo mkdir -p /opt/ichat
cd /opt/ichat
```

#### 2. 环境变量配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑生产环境变量
vim .env
```

`.env` 文件示例：

```env
# 应用配置
APP_ENV=production
SECRET_KEY=your-super-secret-key-here
DEBUG=False

# 数据库配置
DATABASE_URL=mysql://username:password@localhost:3306/ichat
SQLALCHEMY_TRACK_MODIFICATIONS=False

# JWT配置
JWT_SECRET_KEY=jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=604800

# LLM API配置
GOOGLE_API_KEY=your-google-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key

# RADIUS配置
RADIUS_SERVER=10.10.15.1
RADIUS_SECRET=radius-secret

# 向量数据库配置
FAISS_INDEX_PATH=/app/data/vector.index
EMBEDDING_MODEL_PATH=/app/models

# 文件存储配置
UPLOAD_FOLDER=/app/uploads
MAX_CONTENT_LENGTH=10485760  # 10MB

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=/app/logs/app.log
```

#### 3. 启动生产服务

```bash
# 克隆代码
git clone https://github.com/liubin18911671739/ichat.git .
git checkout main  # 确保是生产分支

# 构建和启动服务
docker-compose -f docker-compose.prod.yml up -d --build

# 初始化数据库
docker-compose -f docker-compose.prod.yml exec backend python manage.py db upgrade

# 创建管理员用户
docker-compose -f docker-compose.prod.yml exec backend python create_test_admin.py

# 检查服务状态
docker-compose -f docker-compose.prod.yml ps
```

#### 4. Nginx配置

```nginx
# /etc/nginx/sites-available/ichat
server {
    listen 80;
    server_name ichat.bisu.edu.cn;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ichat.bisu.edu.cn;

    # SSL配置
    ssl_certificate /etc/ssl/certs/ichat.bisu.edu.cn.crt;
    ssl_certificate_key /etc/ssl/private/ichat.bisu.edu.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 前端静态文件
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API接口
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 5. 监控和日志

```bash
# 查看实时日志
docker-compose -f docker-compose.prod.yml logs -f backend

# 查看应用日志
tail -f /opt/ichat/logs/app.log

# 设置日志轮转
sudo vim /etc/logrotate.d/ichat
```

`/etc/logrotate.d/ichat` 文件：

```
/opt/ichat/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        docker-compose -f /opt/ichat/docker-compose.prod.yml restart backend
    endscript
}
```

## 🐛 调试与排错

### 常见问题解决

#### 1. 向量模型问题

```python
# 检查模型是否正确加载
from services.embedding_service import embedding_service

try:
    embedding_service.load_model()
    print("模型加载成功")
    print(f"向量维度: {embedding_service.embedding_dim}")
except Exception as e:
    print(f"模型加载失败: {e}")
```

#### 2. 数据库连接问题

```bash
# 检查数据库连接
cd backend
python -c "
from models.database import db
try:
    db.engine.execute('SELECT 1')
    print('数据库连接正常')
except Exception as e:
    print(f'数据库连接失败: {e}')
"
```

#### 3. API响应调试

```python
# 添加调试中间件
from flask import g, request
import time

@app.before_request
def before_request():
    g.start_time = time.time()
    print(f"请求: {request.method} {request.path}")

@app.after_request
def after_request(response):
    duration = time.time() - g.start_time
    print(f"响应: {response.status_code} - {duration:.3f}s")
    return response
```

#### 4. 前端调试

```javascript
// 添加请求拦截器
import axios from 'axios'

axios.interceptors.request.use(
  config => {
    console.log('请求配置:', config)
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

axios.interceptors.response.use(
  response => {
    console.log('响应数据:', response.data)
    return response
  },
  error => {
    console.error('响应错误:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)
```

### 性能分析

#### 后端性能分析

```python
# 添加性能分析装饰器
import time
import functools
from flask import g

def performance_monitor(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            print(f"{func.__name__} 执行时间: {duration:.3f}s")
            return result
        except Exception as e:
            duration = time.time() - start_time
            print(f"{func.__name__} 执行失败 ({duration:.3f}s): {e}")
            raise
    return wrapper

# 使用示例
@app.route('/api/chat', methods=['POST'])
@performance_monitor
def chat():
    # 处理逻辑
    pass
```

#### 前端性能分析

```javascript
// 性能监控工具
class PerformanceMonitor {
  static measureComponent(name, fn) {
    return function(...args) {
      const start = performance.now()
      const result = fn.apply(this, args)
      const end = performance.now()
      console.log(`[Performance] ${name}: ${end - start}ms`)
      return result
    }
  }

  static measureAsync(name, fn) {
    return async function(...args) {
      const start = performance.now()
      try {
        const result = await fn.apply(this, args)
        const end = performance.now()
        console.log(`[Performance] ${name}: ${end - start}ms`)
        return result
      } catch (error) {
        const end = performance.now()
        console.error(`[Performance] ${name} failed (${end - start}ms):`, error)
        throw error
      }
    }
  }
}

// 使用示例
export default {
  methods: {
    sendMessage: PerformanceMonitor.measureAsync('sendMessage', async function(content) {
      // 发送消息逻辑
    })
  }
}
```

## 📊 性能优化

### 后端优化

#### 1. 数据库优化

```python
# 添加数据库索引
class Example(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    content = db.Column(db.Text)
    scene_id = db.Column(db.String(50), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # 复合索引
    __table_args__ = (
        db.Index('idx_user_scene', 'user_id', 'scene_id'),
        db.Index('idx_created_status', 'created_at', 'status'),
    )

# 查询优化
def get_user_examples_optimized(user_id: int, page: int, limit: int):
    """优化的用户示例查询"""
    query = (
        db.session.query(Example)
        .filter(Example.user_id == user_id)
        .filter(Example.status == 'active')
        .order_by(Example.created_at.desc())
        .options(
            db.joinedload(Example.scene),  # 预加载关联数据
            db.raiseload('*')  # 只加载需要的字段
        )
    )

    total = query.count()
    examples = query.offset((page - 1) * limit).limit(limit).all()

    return {
        'examples': examples,
        'total': total,
        'page': page,
        'limit': limit
    }
```

#### 2. 缓存策略

```python
# Redis缓存装饰器
import redis
import json
import pickle
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_result(expire_time=300, key_prefix=''):
    """缓存装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存键
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(kwargs))}"

            # 尝试从缓存获取
            cached_result = redis_client.get(cache_key)
            if cached_result:
                return pickle.loads(cached_result)

            # 执行函数并缓存结果
            result = func(*args, **kwargs)
            redis_client.setex(
                cache_key,
                expire_time,
                pickle.dumps(result)
            )
            return result
        return wrapper
    return decorator

# 使用示例
@cache_result(expire_time=600, key_prefix='chat')
def get_chat_response(prompt: str, scene_id: str):
    """获取聊天响应（带缓存）"""
    # 处理逻辑
    pass
```

### 前端优化

#### 1. 组件懒加载

```javascript
// 路由懒加载
const routes = [
  {
    path: '/chat',
    component: () => import('@/views/ChatView.vue')
  },
  {
    path: '/admin',
    component: () => import('@/views/AdminView.vue')
  }
]

// 组件异步加载
export default {
  components: {
    ChatBox: defineAsyncComponent(() => import('@/components/ChatBox.vue')),
    HistoryPanel: defineAsyncComponent(() => import('@/components/HistoryPanel.vue'))
  }
}
```

#### 2. 数据预加载

```javascript
// 数据预加载策略
export const useDataPreloader = () => {
  const preloadCommonData = async () => {
    try {
      // 并行预加载常用数据
      await Promise.all([
        store.dispatch('scenes/fetchScenes'),
        store.dispatch('user/fetchProfile'),
        store.dispatch('suggestions/fetchSuggestions')
      ])
    } catch (error) {
      console.warn('预加载数据失败:', error)
    }
  }

  return {
    preloadCommonData
  }
}
```

## 🔒 安全开发

### 安全最佳实践

#### 1. 输入验证

```python
# 输入验证装饰器
from functools import wraps
from flask import request, jsonify

def validate_json(schema):
    """JSON数据验证装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': '请求必须是JSON格式'}), 400

            data = request.get_json()
            errors = validate_schema(data, schema)

            if errors:
                return jsonify({
                    'error': '数据验证失败',
                    'details': errors
                }), 400

            return func(*args, **kwargs)
        return wrapper
    return decorator

# 验证模式
CHAT_SCHEMA = {
    'prompt': {'type': 'string', 'required': True, 'max_length': 1000},
    'scene_id': {'type': 'string', 'allowed': ['general', 'db_sizheng', 'db_xuexizhidao']},
    'user_id': {'type': 'integer', 'required': True}
}

# 使用示例
@app.route('/api/chat', methods=['POST'])
@validate_json(CHAT_SCHEMA)
def chat():
    data = request.get_json()
    # 处理逻辑
    pass
```

#### 2. SQL注入防护

```python
# 使用参数化查询
def get_user_examples(user_id: int, scene_id: str = None):
    """安全查询用户示例"""
    query = db.session.query(Example).filter(Example.user_id == user_id)

    if scene_id:
        query = query.filter(Example.scene_id == scene_id)

    return query.all()

# 避免字符串拼接
# 错误示例 ❌
def get_user_examples_unsafe(user_id):
    query = f"SELECT * FROM examples WHERE user_id = {user_id}"  # 危险！

# 正确示例 ✅
def get_user_examples_safe(user_id):
    query = text("SELECT * FROM examples WHERE user_id = :user_id")
    return db.session.execute(query, {'user_id': user_id}).fetchall()
```

#### 3. XSS防护

```javascript
// 前端XSS防护
import DOMPurify from 'dompurify'

export const sanitizeHtml = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class']
  })
}

// 在组件中使用
export default {
  methods: {
    renderContent(content) {
      return sanitizeHtml(content)
    }
  }
}
```

---

## 📞 开发支持

### 联系方式

- **技术负责人**: liubin18911671739
- **开发团队邮箱**: dev@ichat.bisu.edu.cn
- **问题反馈**: [GitHub Issues](https://github.com/liubin18911671739/ichat/issues)
- **内部文档**: [Confluence](https://confluence.bisu.edu.cn/display/ICHAT)

### 开发资源

- **API文档**: http://localhost:5000/api/docs
- **设计规范**: https://design.bisu.edu.cn/ichat
- **测试环境**: https://test.ichat.bisu.edu.cn
- **生产环境**: https://ichat.bisu.edu.cn

---

**[⬆ 返回顶部](#-棠心问答系统开发者指南)**

Made with ❤️ by iChat Development Team