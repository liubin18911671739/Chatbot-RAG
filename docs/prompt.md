# RAG问答机器人系统 - Lovable + FastAI 超级提示词

## 📋 目录
1. [Lovable前端超级提示词](#lovable前端超级提示词)
2. [FastAPI后端超级提示词](#fastapi后端超级提示词)
3. [使用指南](#使用指南)

---

## 🎨 Lovable前端超级提示词

### 用户界面 + 管理员界面一体化提示词

```
# RAG问答机器人全栈前端开发 - React 18 + TypeScript + Ant Design

## 项目概述
创建一个完整的RAG问答机器人前端系统，包含用户界面和管理员界面。系统采用React 18 + TypeScript + Ant Design技术栈，实现现代化的智能问答平台，支持文档上传、知识库管理、用户管理和系统监控。

## 核心架构设计

### 双界面架构
- **用户界面** (`/`) - 普通用户的智能问答平台
- **管理员界面** (`/admin`) - 系统管理控制台
- **统一认证系统** - 基于角色的访问控制(RBAC)
- **响应式设计** - 支持桌面、平板、移动端

### 技术栈要求
- **框架**: React 18 + TypeScript 5.0+
- **UI库**: Ant Design 5.x (用户界面) + Ant Design Pro (管理员界面)
- **状态管理**: Zustand (简单状态) + Redux Toolkit (复杂状态)
- **路由**: React Router v6 + 路由守卫
- **数据获取**: TanStack Query (React Query) + Axios
- **图表**: Recharts (数据可视化)
- **样式**: CSS Modules + Styled Components
- **构建工具**: Vite + ESLint + Prettier

## 用户界面功能规范

### 1. 认证系统
```typescript
// 用户认证流程
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 登录/注册表单
- 邮箱 + 密码登录
- 用户注册（邮箱验证）
- 密码重置功能
- JWT token管理
- 自动登录保持
```

### 2. 主聊天界面
```typescript
// 三栏布局设计
interface ChatLayout {
  leftSidebar: {
    newChatButton: boolean;
    historyList: ChatHistory[];
    userProfile: UserMenu;
  };
  mainChat: {
    messageList: Message[];
    messageInput: InputComponent;
    typingIndicator: boolean;
  };
  rightSidebar: {
    documentUpload: UploadZone;
    documentList: Document[];
    knowledgeSelector: Select;
  }
}

// 核心功能
- 实时聊天对话
- Markdown渲染（代码高亮）
- 流式打字机效果
- 消息历史持久化
- 文档拖拽上传
- 引用来源显示
- 快捷键支持（Ctrl+Enter）
```

### 3. 个人中心
```typescript
interface UserCenter {
  profile: {
    avatar: string;
    email: string;
    nickname: string;
  };
  settings: {
    theme: 'light' | 'dark';
    language: string;
    notifications: NotificationSettings;
  };
  statistics: {
    totalChats: number;
    totalMessages: number;
    apiUsage: ApiUsageStats;
  };
  history: {
    exportHistory: boolean;
    clearHistory: boolean;
    searchHistory: boolean;
  };
}
```

## 管理员界面功能规范

### 1. 管理员仪表盘
```typescript
interface AdminDashboard {
  overview: {
    statsCards: {
      totalUsers: number;
      activeUsers: number;
      totalDocuments: number;
      todayQuestions: number;
      systemHealth: 'good' | 'warning' | 'error';
    };
    charts: {
      questionTrends: LineChart;
      userGrowth: AreaChart;
      documentTypes: PieChart;
      apiUsage: BarChart;
    };
  };
  realTimeMonitor: {
    systemStatus: StatusIndicator;
    apiCalls: Counter;
    errorRate: Percentage;
    activeConnections: number;
  };
}
```

### 2. 用户管理系统
```typescript
interface UserManagement {
  userList: {
    search: SearchBar;
    filters: FilterGroup;
    pagination: Pagination;
    bulkActions: BulkActionGroup;
  };
  userDetail: {
    basicInfo: UserForm;
    permissions: PermissionMatrix;
    activityLog: ActivityLog;
    statistics: UserStats;
  };
  userAnalytics: {
    behaviorAnalysis: BehaviorChart;
    usagePatterns: UsageHeatmap;
    retentionMetrics: RetentionChart;
  };
}
```

### 3. 文档和知识库管理
```typescript
interface DocumentManagement {
  documentList: {
    upload: BatchUpload;
    preview: DocumentPreview;
    status: ProcessingStatus;
    actions: DocumentActions;
  };
  knowledgeBase: {
    categories: CategoryTree;
    settings: KnowledgeSettings;
    vectorStatus: VectorizationStatus;
  };
  ragPipeline: {
    embeddingConfig: EmbeddingSettings;
    retrievalSettings: RetrievalConfig;
    similarityThreshold: ThresholdSlider;
  };
}
```

### 4. 系统监控
```typescript
interface SystemMonitoring {
  performance: {
    apiResponseTime: LineChart;
    databaseQueries: QueryMonitor;
    memoryUsage: MemoryChart;
    cpuUsage: CpuChart;
  };
  errorTracking: {
    errorLogs: LogViewer;
    errorDistribution: ErrorChart;
    alertSettings: AlertConfig;
  };
  security: {
    accessLogs: AccessLogTable;
    securityEvents: SecurityEventList;
    threatDetection: ThreatMonitor;
  };
}
```

## 组件架构设计

### 目录结构
```
src/
├── components/           # 通用组件
│   ├── ui/              # UI基础组件
│   ├── layout/          # 布局组件
│   ├── charts/          # 图表组件
│   └── forms/           # 表单组件
├── pages/               # 页面组件
│   ├── auth/           # 认证页面
│   ├── user/           # 用户界面页面
│   └── admin/          # 管理员界面页面
├── hooks/              # 自定义Hooks
├── stores/             # 状态管理
├── services/           # API服务
├── utils/              # 工具函数
├── types/              # TypeScript类型
├── constants/          # 常量定义
└── styles/             # 全局样式
```

### 核心组件
```typescript
// 布局组件
<MainLayout />
<AdminLayout />
<ChatLayout />
<PageHeader />

// 业务组件
<ChatInterface />
<MessageList />
<DocumentUploader />
<UserTable />
<SystemMonitor />

// 通用组件
<LoadingSpinner />
<EmptyState />
<ErrorBoundary />
<ConfirmDialog />
```

## API集成规范

### 用户界面API
```typescript
const USER_API = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
  },
  chat: {
    sendMessage: '/api/chat',
    getHistory: '/api/chat/history',
    deleteChat: '/api/chat/:id',
  },
  documents: {
    upload: '/api/documents',
    getList: '/api/documents',
    delete: '/api/documents/:id',
  },
  user: {
    profile: '/api/user/profile',
    settings: '/api/user/settings',
    statistics: '/api/user/stats',
  },
};
```

### 管理员界面API
```typescript
const ADMIN_API = {
  users: {
    list: '/api/admin/users',
    detail: '/api/admin/users/:id',
    create: '/api/admin/users',
    update: '/api/admin/users/:id',
    delete: '/api/admin/users/:id',
  },
  documents: {
    list: '/api/admin/documents',
    approve: '/api/admin/documents/:id/approve',
    reject: '/api/admin/documents/:id/reject',
  },
  statistics: {
    overview: '/api/admin/statistics/overview',
    users: '/api/admin/statistics/users',
    usage: '/api/admin/statistics/usage',
  },
  system: {
    health: '/api/admin/system/health',
    logs: '/api/admin/system/logs',
    config: '/api/admin/system/config',
  },
};
```

## 状态管理设计

### Zustand Store (用户界面)
```typescript
interface UserStore {
  // 认证状态
  auth: AuthState;

  // 聊天状态
  chat: {
    currentChat: Chat | null;
    messageHistory: Chat[];
    isLoading: boolean;
  };

  // 文档状态
  documents: {
    uploadedDocuments: Document[];
    isUploading: boolean;
  };

  // 用户设置
  settings: UserSettings;
}
```

### Redux Toolkit Store (管理员界面)
```typescript
interface AdminStore {
  // 用户管理
  users: {
    list: User[];
    detail: User | null;
    loading: boolean;
    pagination: PaginationState;
  };

  // 系统状态
  system: {
    health: SystemHealth;
    statistics: SystemStats;
    logs: LogEntry[];
  };

  // 文档管理
  documents: {
    list: Document[];
    processing: ProcessingJob[];
    categories: Category[];
  };
}
```

## 样式和主题设计

### 设计系统
```typescript
// 颜色系统
const theme = {
  colors: {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    text: {
      primary: '#262626',
      secondary: '#595959',
      disabled: '#bfbfbf',
    },
    background: {
      primary: '#ffffff',
      secondary: '#fafafa',
      disabled: '#f5f5f5',
    },
  },

  // 间距系统
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  // 字体系统
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
    },
  },
};
```

### 响应式设计
```typescript
// 断点系统
const breakpoints = {
  xs: '480px',
  sm: '768px',
  md: '992px',
  lg: '1200px',
  xl: '1600px',
};

// 响应式组件示例
const ResponsiveLayout = styled.div`
  display: grid;
  grid-template-columns:
    minmax(250px, 1fr)
    minmax(400px, 3fr)
    minmax(300px, 1fr);

  @media (max-width: ${breakpoints.lg}) {
    grid-template-columns: 1fr 2fr;
  }

  @media (max-width: ${breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;
```

## 性能优化策略

### 代码分割
```typescript
// 路由级别的懒加载
const UserInterface = lazy(() => import('./pages/user/UserInterface'));
const AdminInterface = lazy(() => import('./pages/admin/AdminInterface'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));

// 组件级别的懒加载
const ChartComponent = lazy(() => import('./components/Chart'));
const DocumentPreview = lazy(() => import('./components/DocumentPreview'));
```

### 虚拟化长列表
```typescript
// 使用react-window优化长列表
import { FixedSizeList as List } from 'react-window';

const VirtualizedMessageList = ({ messages }: { messages: Message[] }) => (
  <List
    height={600}
    itemCount={messages.length}
    itemSize={80}
    itemData={messages}
  >
    {MessageItem}
  </List>
);
```

### 缓存策略
```typescript
// TanStack Query配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
      retry: 3,
    },
  },
});
```

## 安全要求

### 认证和授权
```typescript
// JWT Token管理
interface TokenManager {
  getToken: () => string | null;
  setToken: (token: string) => void;
  removeToken: () => void;
  refreshToken: () => Promise<void>;
  isTokenExpired: (token: string) => boolean;
}

// 路由守卫
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: UserRole }> = ({
  children,
  requiredRole = 'user',
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};
```

### 数据安全
```typescript
// XSS防护
import DOMPurify from 'dompurify';

const SafeMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const cleanContent = DOMPurify.sanitize(content);
  return <ReactMarkdown>{cleanContent}</ReactMarkdown>;
};

// CSRF防护
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});
```

## 测试策略

### 单元测试
```typescript
// 组件测试示例
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInterface } from './ChatInterface';

describe('ChatInterface', () => {
  test('sends message when form is submitted', () => {
    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('输入您的问题...');
    const button = screen.getByRole('button', { name: '发送' });

    fireEvent.change(input, { target: { value: '测试消息' } });
    fireEvent.click(button);

    expect(input).toHaveValue('');
  });
});
```

### 集成测试
```typescript
// API集成测试
import { renderHook, act } from '@testing-library/react-hooks';
import { useChat } from './hooks/useChat';

describe('useChat', () => {
  test('sends message and receives response', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useChat());

    act(() => {
      result.current.sendMessage('测试问题');
    });

    await waitForNextUpdate();

    expect(result.current.messages).toHaveLength(2);
  });
});
```

## 部署和构建

### Vite配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

### 环境变量配置
```typescript
// .env.example
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
VITE_APP_NAME=RAG问答机器人
VITE_APP_VERSION=2.0.0
VITE_ENABLE_ANALYTICS=true
```

## 开发规范

### 代码规范
```typescript
// ESLint配置
module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'prefer-const': 'error',
  },
};
```

### 提交规范
```bash
# Git提交消息规范
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建工具或辅助工具的变动
```

## 交付要求

### 代码质量
- TypeScript严格模式，100%类型覆盖
- ESLint + Prettier代码规范化
- 单元测试覆盖率 > 80%
- 性能评分 > 90
- 无障碍访问支持
- SEO优化

### 功能完整
- 用户界面和管理员界面完整实现
- 所有API接口正确集成
- 响应式设计完美适配
- 错误处理和异常情况覆盖
- 加载状态和空状态处理
- 主题切换（明/暗模式）

### 用户体验
- 流畅的动画过渡
- 快速的页面加载（< 2秒）
- 直观的交互设计
- 完善的错误提示
- 操作确认和撤销
- 键盘快捷键支持

请创建一个完整的React应用，包含上述所有功能要求。确保代码质量高、架构清晰、性能优秀、用户体验出色。应用应该能够直接部署使用，并与后端API无缝集成。
```

---

## 🚀 FastAPI后端超级提示词

```
# RAG问答机器人后端开发 - FastAPI + PostgreSQL + 智普清言

## 项目概述
开发一个高性能的RAG问答机器人后端系统，使用FastAPI框架、PostgreSQL数据库、pgvector向量扩展和智普清言AI服务。系统提供完整的用户认证、文档管理、向量检索和智能问答功能。

## 技术架构

### 核心技术栈
- **Web框架**: FastAPI 0.104+ (Python 3.11+)
- **数据库**: PostgreSQL 15+ with pgvector
- **ORM**: SQLAlchemy 2.0+ + Alembic
- **AI服务**: 智普清言 API (Embedding + Chat)
- **认证**: JWT + OAuth2 (password flow)
- **缓存**: Redis (可选)
- **任务队列**: Celery + Redis (异步处理)
- **文档**: OpenAPI/Swagger自动生成
- **监控**: Prometheus + Grafana (可选)

### 项目结构
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI应用入口
│   ├── config.py              # 配置管理
│   ├── database.py            # 数据库连接
│   ├── dependencies.py        # 依赖注入
│   ├── models/                # SQLAlchemy模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── document.py
│   │   ├── chat.py
│   │   └── vector.py
│   ├── schemas/               # Pydantic模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── document.py
│   │   ├── chat.py
│   │   └── auth.py
│   ├── services/              # 业务逻辑服务
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── rag_service.py
│   │   ├── document_service.py
│   │   ├── embedding_service.py
│   │   └── notification_service.py
│   ├── api/                   # API路由
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── documents.py
│   │   │   ├── chat.py
│   │   │   └── admin.py
│   │   └── deps.py
│   ├── core/                  # 核心功能
│   │   ├── __init__.py
│   │   ├── security.py
│   │   ├── exceptions.py
│   │   ├── middleware.py
│   │   └── logging.py
│   ├── utils/                 # 工具函数
│   │   ├── __init__.py
│   │   ├── text_processing.py
│   │   ├── file_utils.py
│   │   └── validators.py
│   └── tasks/                 # Celery任务
│       ├── __init__.py
│       ├── document_processing.py
│       └── vector_operations.py
├── alembic/                   # 数据库迁移
├── tests/                     # 测试文件
├── requirements.txt           # 依赖包
├── .env.example              # 环境变量示例
├── docker-compose.yml        # Docker配置
├── Dockerfile               # Docker镜像
└── README.md                # 项目说明
```

## 数据库设计

### PostgreSQL + pgvector配置
```sql
-- 启用pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    avatar_url VARCHAR(500),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 文档表
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size INTEGER,
    user_id UUID NOT NULL REFERENCES users(id),
    knowledge_base VARCHAR(100) DEFAULT 'default',
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 文档分块表
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 向量表 (pgvector)
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    vector vector(1536) NOT NULL, -- 假设智普清言embedding维度为1536
    model_name VARCHAR(100) DEFAULT 'zhipuai-embedding',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 聊天会话表
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(200),
    knowledge_base VARCHAR(100) DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 聊天消息表
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系统统计表
CREATE TABLE system_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    total_documents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建向量索引
CREATE INDEX ON embeddings USING ivfflat (vector vector_cosine_ops);
CREATE INDEX ON documents (user_id, knowledge_base);
CREATE INDEX ON chat_sessions (user_id);
CREATE INDEX ON chat_messages (session_id, created_at);
```

### SQLAlchemy模型
```python
# models/base.py
from sqlalchemy import Column, DateTime, UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# models/user.py
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from .base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nickname = Column(String(100))
    avatar_url = Column(String(500))
    role = Column(String(20), default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime(timezone=True))

    # 关系
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
```

## 核心服务实现

### 认证服务 (auth_service.py)
```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from .core.security import create_access_token, verify_password, get_password_hash
from .models.user import User
from .schemas.auth import UserCreate, UserLogin, Token

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    async def register_user(self, user_data: UserCreate) -> User:
        """注册新用户"""
        # 检查邮箱是否已存在
        if self.db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )

        # 创建用户
        user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            nickname=user_data.nickname,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    async def authenticate_user(self, login_data: UserLogin) -> User:
        """用户认证"""
        user = self.db.query(User).filter(User.email == login_data.email).first()

        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="邮箱或密码错误"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="账户已被禁用"
            )

        # 更新最后登录时间
        user.last_login = datetime.utcnow()
        self.db.commit()

        return user

    async def login_user(self, login_data: UserLogin) -> Token:
        """用户登录"""
        user = await self.authenticate_user(login_data)

        # 生成访问令牌
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role},
            expires_delta=access_token_expires
        )

        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=1800  # 30分钟
        )
```

### RAG服务 (rag_service.py)
```python
import asyncio
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from .core.config import get_settings
from .services.embedding_service import EmbeddingService
from .models.chat import ChatSession, ChatMessage
from .models.document import Document, DocumentChunk, Embedding
from .schemas.chat import ChatRequest, ChatResponse

class RAGService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        self.embedding_service = EmbeddingService()

    async def process_chat_request(
        self,
        request: ChatRequest,
        user_id: str
    ) -> ChatResponse:
        """处理聊天请求"""

        # 1. 检索相关文档片段
        relevant_chunks = await self._retrieve_relevant_chunks(
            query=request.message,
            knowledge_base=request.knowledge_base,
            top_k=request.top_k or 5,
            similarity_threshold=request.similarity_threshold or 0.7
        )

        # 2. 构建上下文
        context = self._build_context(relevant_chunks)

        # 3. 调用智普清言API生成回答
        response = await self._generate_response(
            question=request.message,
            context=context,
            chat_history=request.chat_history
        )

        # 4. 保存聊天记录
        await self._save_chat_message(
            session_id=request.session_id,
            user_id=user_id,
            user_message=request.message,
            assistant_message=response["answer"],
            metadata={
                "sources": [chunk["document_id"] for chunk in relevant_chunks],
                "model": response.get("model"),
                "usage": response.get("usage")
            }
        )

        return ChatResponse(
            answer=response["answer"],
            sources=[
                {
                    "document_id": chunk["document_id"],
                    "document_title": chunk["document_title"],
                    "content": chunk["content"][:200] + "...",
                    "similarity": chunk["similarity"]
                }
                for chunk in relevant_chunks
            ],
            metadata=response.get("metadata", {})
        )

    async def _retrieve_relevant_chunks(
        self,
        query: str,
        knowledge_base: str,
        top_k: int,
        similarity_threshold: float
    ) -> List[Dict[str, Any]]:
        """检索相关文档片段"""

        # 1. 向量化查询
        query_vector = await self.embedding_service.get_embedding(query)
        vector_str = "[" + ",".join(map(str, query_vector)) + "]"

        # 2. 执行向量相似度搜索
        sql_query = text("""
            SELECT
                dc.id,
                dc.content,
                dc.chunk_index,
                d.id as document_id,
                d.title as document_title,
                1 - (e.vector <=> :query_vector::vector) as similarity
            FROM embeddings e
            JOIN document_chunks dc ON e.chunk_id = dc.id
            JOIN documents d ON dc.document_id = d.id
            WHERE d.knowledge_base = :knowledge_base
            AND d.status = 'completed'
            AND 1 - (e.vector <=> :query_vector::vector) > :threshold
            ORDER BY similarity DESC
            LIMIT :top_k
        """)

        result = self.db.execute(
            sql_query,
            {
                "query_vector": vector_str,
                "knowledge_base": knowledge_base,
                "threshold": similarity_threshold,
                "top_k": top_k
            }
        ).fetchall()

        return [
            {
                "id": row.id,
                "content": row.content,
                "chunk_index": row.chunk_index,
                "document_id": row.document_id,
                "document_title": row.document_title,
                "similarity": float(row.similarity)
            }
            for row in result
        ]

    def _build_context(self, chunks: List[Dict[str, Any]]) -> str:
        """构建上下文"""
        context_parts = []

        for i, chunk in enumerate(chunks):
            context_parts.append(
                f"文档片段 {i+1} (来自: {chunk['document_title']}):\n"
                f"{chunk['content']}\n"
            )

        return "\n".join(context_parts)

    async def _generate_response(
        self,
        question: str,
        context: str,
        chat_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """调用智普清言API生成回答"""

        # 构建系统提示词
        system_prompt = f"""
        你是一个专业的AI助手，请基于以下提供的文档内容回答用户问题。

        文档内容：
        {context}

        回答要求：
        1. 基于提供的文档内容回答，不要编造信息
        2. 如果文档中没有相关信息，请如实说明
        3. 回答要准确、清晰、有条理
        4. 引用具体的文档内容作为依据
        """

        # 构建对话历史
        messages = [{"role": "system", "content": system_prompt}]

        # 添加历史对话
        for msg in chat_history[-5:]:  # 只保留最近5轮对话
            messages.append({"role": "user", "content": msg.get("user", "")})
            messages.append({"role": "assistant", "content": msg.get("assistant", "")})

        # 添加当前问题
        messages.append({"role": "user", "content": question})

        # 调用智普清言API
        response = await self._call_zhipu_api(messages)

        return response

    async def _call_zhipu_api(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """调用智普清言API"""
        import httpx

        headers = {
            "Authorization": f"Bearer {self.settings.ZHIPU_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "chatglm_turbo",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 2000,
            "stream": False
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://open.bigmodel.cn/api/paas/v4/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"智普清言API调用失败: {response.text}"
                )

            result = response.json()

            return {
                "answer": result["choices"][0]["message"]["content"],
                "model": result["model"],
                "usage": result.get("usage", {}),
                "metadata": {
                    "finish_reason": result["choices"][0]["finish_reason"],
                    "prompt_tokens": result.get("usage", {}).get("prompt_tokens"),
                    "completion_tokens": result.get("usage", {}).get("completion_tokens"),
                    "total_tokens": result.get("usage", {}).get("total_tokens")
                }
            }

    async def _save_chat_message(
        self,
        session_id: str,
        user_id: str,
        user_message: str,
        assistant_message: str,
        metadata: Dict[str, Any]
    ):
        """保存聊天消息"""

        # 保存用户消息
        user_msg = ChatMessage(
            session_id=session_id,
            role="user",
            content=user_message,
            metadata=metadata
        )

        # 保存助手消息
        assistant_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=assistant_message,
            metadata=metadata
        )

        self.db.add_all([user_msg, assistant_msg])

        # 更新会话时间
        session = self.db.query(ChatSession).filter(
            ChatSession.id == session_id
        ).first()

        if session:
            session.updated_at = datetime.utcnow()

        self.db.commit()
```

### 向量化服务 (embedding_service.py)
```python
import asyncio
from typing import List, Optional
import httpx
from sqlalchemy.orm import Session
from .core.config import get_settings
from .models.document import DocumentChunk, Embedding
from .services.text_processing import TextProcessor

class EmbeddingService:
    def __init__(self):
        self.settings = get_settings()
        self.text_processor = TextProcessor()
        self.batch_size = 100  # 批处理大小

    async def get_embedding(self, text: str) -> List[float]:
        """获取单个文本的向量表示"""
        return await self._call_embedding_api([text])

    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """批量获取文本向量表示"""
        embeddings = []

        for i in range(0, len(texts), self.batch_size):
            batch_texts = texts[i:i + self.batch_size]
            batch_embeddings = await self._call_embedding_api(batch_texts)
            embeddings.extend(batch_embeddings)

        return embeddings

    async def _call_embedding_api(self, texts: List[str]) -> List[List[float]]:
        """调用智普清言Embedding API"""
        headers = {
            "Authorization": f"Bearer {self.settings.ZHIPU_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "embedding-2",
            "input": texts
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://open.bigmodel.cn/api/paas/v4/embeddings",
                headers=headers,
                json=payload,
                timeout=30.0
            )

            if response.status_code != 200:
                raise Exception(f"智普清言Embedding API调用失败: {response.text}")

            result = response.json()
            embeddings = [item["embedding"] for item in result["data"]]

            return embeddings

    async def process_document_chunk(
        self,
        db: Session,
        chunk: DocumentChunk
    ) -> bool:
        """处理单个文档分块的向量化"""
        try:
            # 预处理文本
            processed_text = self.text_processor.preprocess_text(chunk.content)

            # 获取向量表示
            embedding = await self.get_embedding(processed_text)

            # 保存到数据库
            embedding_record = Embedding(
                chunk_id=chunk.id,
                vector=embedding,
                model_name="embedding-2"
            )

            db.add(embedding_record)
            db.commit()

            return True

        except Exception as e:
            db.rollback()
            print(f"处理文档分块失败: {e}")
            return False

    async def reprocess_document(
        self,
        db: Session,
        document_id: str
    ) -> bool:
        """重新处理整个文档的向量化"""
        try:
            # 删除旧的向量数据
            db.query(Embedding).join(DocumentChunk).filter(
                DocumentChunk.document_id == document_id
            ).delete()

            db.commit()

            # 获取文档分块
            chunks = db.query(DocumentChunk).filter(
                DocumentChunk.document_id == document_id
            ).all()

            # 批量处理
            for chunk in chunks:
                await self.process_document_chunk(db, chunk)

            return True

        except Exception as e:
            db.rollback()
            print(f"重新处理文档失败: {e}")
            return False
```

## API路由设计

### 主路由 (api/v1/chat.py)
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..deps import get_current_user, get_db
from ..services.rag_service import RAGService
from ..schemas.chat import ChatRequest, ChatResponse, ChatHistoryResponse
from ..models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """发送聊天消息"""
    rag_service = RAGService(db)

    try:
        response = await rag_service.process_chat_request(
            request=request,
            user_id=str(current_user.id)
        )

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"处理聊天请求失败: {str(e)}"
        )

@router.get("/history/{session_id}", response_model=List[ChatHistoryResponse])
async def get_chat_history(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取聊天历史"""
    from ..models.chat import ChatMessage

    messages = db.query(ChatMessage).join(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).order_by(ChatMessage.created_at).all()

    return [
        ChatHistoryResponse(
            role=msg.role,
            content=msg.content,
            timestamp=msg.created_at,
            metadata=msg.metadata
        )
        for msg in messages
    ]
```

### 文档管理路由 (api/v1/documents.py)
```python
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..deps import get_current_user, get_db
from ..services.document_service import DocumentService
from ..schemas.document import DocumentResponse, DocumentUploadResponse
from ..models.user import User

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    knowledge_base: str = "default",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """上传文档"""
    document_service = DocumentService(db)

    try:
        # 验证文件类型
        if not document_service.validate_file_type(file.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不支持的文件类型"
            )

        # 处理文档
        document = await document_service.process_document(
            file=file,
            user_id=str(current_user.id),
            knowledge_base=knowledge_base
        )

        return DocumentUploadResponse(
            document_id=str(document.id),
            title=document.title,
            status="processing",
            message="文档上传成功，正在处理中"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文档上传失败: {str(e)}"
        )

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    knowledge_base: str = "default",
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取文档列表"""
    from ..models.document import Document

    documents = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.knowledge_base == knowledge_base,
        Document.status == "completed"
    ).offset(skip).limit(limit).all()

    return [
        DocumentResponse(
            id=str(doc.id),
            title=doc.title,
            file_name=doc.file_name,
            file_type=doc.file_type,
            file_size=doc.file_size,
            created_at=doc.created_at,
            knowledge_base=doc.knowledge_base
        )
        for doc in documents
    ]
```

## 异步任务处理

### Celery任务 (tasks/document_processing.py)
```python
from celery import Celery
from sqlalchemy.orm import Session
from ..core.config import get_settings
from ..database import get_db
from ..services.document_service import DocumentService
from ..services.embedding_service import EmbeddingService

celery_app = Celery(
    "rag_bot",
    broker=get_settings().REDIS_URL,
    backend=get_settings().REDIS_URL
)

@celery_app.task(bind=True)
def process_document_task(self, document_id: str):
    """异步处理文档任务"""
    db = next(get_db())

    try:
        document_service = DocumentService(db)
        embedding_service = EmbeddingService()

        # 获取文档
        document = db.query(Document).filter(
            Document.id == document_id
        ).first()

        if not document:
            raise Exception(f"文档 {document_id} 不存在")

        # 更新状态为处理中
        document.status = "processing"
        db.commit()

        # 解析文档内容
        chunks = await document_service.parse_document(document)

        # 保存文档分块
        saved_chunks = []
        for i, chunk_content in enumerate(chunks):
            chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=i,
                content=chunk_content,
                metadata={"chunk_size": len(chunk_content)}
            )
            db.add(chunk)
            saved_chunks.append(chunk)

        db.commit()

        # 向量化处理
        for chunk in saved_chunks:
            db.refresh(chunk)  # 确保获取chunk的ID
            await embedding_service.process_document_chunk(db, chunk)

        # 更新文档状态
        document.status = "completed"
        db.commit()

        return {
            "status": "success",
            "document_id": document_id,
            "chunks_count": len(saved_chunks)
        }

    except Exception as e:
        # 更新文档状态为失败
        document.status = "failed"
        db.commit()

        raise self.retry(exc=e, countdown=60, max_retries=3)

    finally:
        db.close()
```

## 配置管理

### 配置文件 (core/config.py)
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 应用配置
    APP_NAME: str = "RAG问答机器人"
    VERSION: str = "2.0.0"
    DEBUG: bool = False

    # 数据库配置
    DATABASE_URL: str
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "rag_bot"

    # Redis配置
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT配置
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 智普清言API配置
    ZHIPU_API_KEY: str
    ZHIPU_API_BASE: str = "https://open.bigmodel.cn/api/paas/v4"

    # 文件上传配置
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    ALLOWED_FILE_TYPES: list = [".pdf", ".docx", ".txt", ".md"]

    # 向量检索配置
    DEFAULT_TOP_K: int = 5
    DEFAULT_SIMILARITY_THRESHOLD: float = 0.7
    EMBEDDING_MODEL: str = "embedding-2"
    CHAT_MODEL: str = "chatglm_turbo"

    # CORS配置
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]

    class Config:
        env_file = ".env"
        case_sensitive = True

# 全局配置实例
settings = Settings()

def get_settings() -> Settings:
    return settings
```

## 部署配置

### Dockerfile
```dockerfile
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非root用户
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  # PostgreSQL数据库
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # FastAPI后端
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379/0
      - ZHIPU_API_KEY=${ZHIPU_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Celery Worker
  celery-worker:
    build: .
    command: celery -A tasks.celery_app worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379/0
      - ZHIPU_API_KEY=${ZHIPU_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads

  # Celery Beat (定时任务)
  celery-beat:
    build: .
    command: celery -A tasks.celery_app beat --loglevel=info
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
```

## 测试策略

### 单元测试 (tests/test_rag_service.py)
```python
import pytest
from unittest.mock import Mock, patch
from app.services.rag_service import RAGService
from app.schemas.chat import ChatRequest

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def rag_service(mock_db):
    return RAGService(mock_db)

@pytest.mark.asyncio
async def test_process_chat_request(rag_service, mock_db):
    """测试聊天请求处理"""
    # 模拟数据
    request = ChatRequest(
        message="什么是人工智能？",
        session_id="test-session-id",
        knowledge_base="default"
    )

    # 模拟检索结果
    mock_chunks = [
        {
            "id": "chunk-1",
            "content": "人工智能是计算机科学的一个分支",
            "document_id": "doc-1",
            "document_title": "AI基础知识",
            "similarity": 0.85
        }
    ]

    with patch.object(rag_service, '_retrieve_relevant_chunks', return_value=mock_chunks):
        with patch.object(rag_service, '_generate_response', return_value={
            "answer": "人工智能是计算机科学的一个分支...",
            "model": "chatglm_turbo",
            "usage": {"total_tokens": 100}
        }):
            with patch.object(rag_service, '_save_chat_message'):
                response = await rag_service.process_chat_request(
                    request=request,
                    user_id="test-user-id"
                )

                assert response.answer == "人工智能是计算机科学的一个分支..."
                assert len(response.sources) == 1
                assert response.sources[0]["document_title"] == "AI基础知识"
```

### API测试 (tests/test_api.py)
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """测试健康检查端点"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_register_user():
    """测试用户注册"""
    user_data = {
        "email": "test@example.com",
        "password": "testpassword",
        "nickname": "测试用户"
    }

    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201
    assert response.json()["email"] == user_data["email"]

def test_login_user():
    """测试用户登录"""
    login_data = {
        "email": "test@example.com",
        "password": "testpassword"
    }

    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    assert "access_token" in response.json()
```

## 性能优化

### 数据库优化
```python
# 连接池配置
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)

# 查询优化示例
def get_documents_optimized(db: Session, user_id: str, skip: int, limit: int):
    """优化的文档查询"""
    return db.query(Document).options(
        joinedload(Document.chunks).joinedload(Document.embeddings)
    ).filter(
        Document.user_id == user_id,
        Document.status == "completed"
    ).offset(skip).limit(limit).all()
```

### 缓存策略
```python
from functools import wraps
import redis
import json

redis_client = redis.Redis.from_url(settings.REDIS_URL)

def cache_result(expire_time: int = 3600):
    """缓存装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 生成缓存键
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

            # 尝试从缓存获取
            cached_result = redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)

            # 执行函数
            result = await func(*args, **kwargs)

            # 存入缓存
            redis_client.setex(
                cache_key,
                expire_time,
                json.dumps(result, default=str)
            )

            return result

        return wrapper
    return decorator

# 使用示例
@cache_result(expire_time=1800)
async def get_document_statistics(user_id: str):
    """获取文档统计信息（缓存30分钟）"""
    # 复杂的统计查询逻辑
    pass
```

## 监控和日志

### 日志配置 (core/logging.py)
```python
import logging
import sys
from loguru import logger

# 移除默认的日志处理器
logger.remove()

# 添加控制台输出
logger.add(
    sys.stdout,
    level="INFO",
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    colorize=True
)

# 添加文件输出
logger.add(
    "logs/app.log",
    rotation="10 MB",
    retention="30 days",
    level="DEBUG",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    compression="zip"
)

# 请求日志中间件
from fastapi import Request
import time

async def log_requests(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time

    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.4f}s"
    )

    return response
```

### 性能监控
```python
from prometheus_client import Counter, Histogram, generate_latest
from fastapi import Response

# Prometheus指标
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

# 中间件
async def prometheus_middleware(request, call_next):
    start_time = time.time()

    response = await call_next(request)

    # 记录指标
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_DURATION.observe(time.time() - start_time)

    return response

# 指标端点
@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

## 交付要求

### 代码质量
- 100%类型注解覆盖
- 全面的错误处理
- 完整的日志记录
- 性能监控和指标
- 安全漏洞防护
- 数据库迁移脚本

### 性能要求
- API响应时间 < 500ms
- 并发用户支持 > 1000
- 数据库查询优化
- 内存使用优化
- 缓存策略实施

### 安全要求
- JWT token认证
- SQL注入防护
- XSS防护
- CSRF保护
- API限流
- 数据验证

### 可靠性
- 健康检查端点
- 优雅关闭处理
- 异常恢复机制
- 数据备份策略
- 监控告警

请创建一个完整的FastAPI后端应用，包含上述所有功能。确保代码质量高、性能优秀、安全可靠、易于部署和维护。应用应该能够与前端无缝集成，提供稳定可靠的RAG问答服务。
```

---

## 📖 使用指南

### 1. Lovable前端开发步骤

1. **访问平台**: [https://lovable.dev/](https://lovable.dev/)
2. **创建项目**: 选择React + TypeScript模板
3. **应用提示词**: 复制上述"Lovable前端超级提示词"到AI助手中
4. **生成代码**: AI将自动生成完整的前端应用
5. **预览测试**: 在线预览和测试功能
6. **导出代码**: 下载生成的代码到本地
7. **本地开发**:
   ```bash
   cd rag-frontend
   npm install
   npm run dev
   ```

### 2. FastAPI后端开发步骤

1. **环境准备**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install fastapi uvicorn sqlalchemy psycopg2-binary celery redis python-multipart python-jose[cryptography] passlib[bcrypt] alembic pydantic-settings httpx
   ```

2. **配置环境变量**:
   ```bash
   cp .env.example .env
   # 编辑.env文件，配置数据库和API密钥
   ```

3. **数据库初始化**:
   ```bash
   # 创建数据库迁移
   alembic revision --autogenerate -m "Initial migration"

   # 应用迁移
   alembic upgrade head
   ```

4. **启动服务**:
   ```bash
   # 启动后端API
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

   # 启动Celery Worker (另一个终端)
   celery -A tasks.celery_app worker --loglevel=info
   ```

### 3. 完整系统部署

1. **使用Docker Compose**:
   ```bash
   # 配置环境变量
   export ZHIPU_API_KEY="your_api_key"
   export SECRET_KEY="your_secret_key"
   export POSTGRES_PASSWORD="your_password"

   # 启动完整系统
   docker-compose up --build
   ```

2. **服务访问地址**:
   - 前端界面: http://localhost:3000
   - 管理员界面: http://localhost:3001
   - 后端API: http://localhost:8000
   - API文档: http://localhost:8000/docs

### 4. 开发建议

- **迭代开发**: 先实现核心功能，再添加高级特性
- **测试驱动**: 每个功能都应该有对应的测试
- **性能优化**: 关注API响应时间和数据库查询性能
- **安全优先**: 始终考虑数据安全和用户隐私
- **监控运维**: 建立完善的日志和监控系统

### 5. 故障排除

- **数据库连接**: 检查PostgreSQL服务状态和连接配置
- **API调用失败**: 验证智普清言API密钥和网络连接
- **向量化错误**: 检查pgvector扩展是否正确安装
- **前端构建**: 确保Node.js版本兼容和依赖安装完整

这套超级提示词和指南将帮助您快速构建一个完整、现代化的RAG问答机器人系统。