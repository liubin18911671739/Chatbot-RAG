# Lovable AI 前端超级提示词 - 完整版

> 💡 **使用说明**: 将以下完整提示词复制到 [Lovable.dev](https://lovable.dev/) 的AI助手中，选择React + TypeScript模板进行代码生成。

---

## 🎨 RAG问答机器人全栈前端开发 - React 18 + TypeScript + Ant Design

### 项目概述
创建一个完整的RAG问答机器人前端系统，包含用户界面和管理员界面。系统采用React 18 + TypeScript + Ant Design技术栈，实现现代化的智能问答平台，支持文档上传、知识库管理、用户管理和系统监控。

### 核心架构设计

#### 双界面架构
- **用户界面** (`/`) - 普通用户的智能问答平台
- **管理员界面** (`/admin`) - 系统管理控制台
- **统一认证系统** - 基于角色的访问控制(RBAC)
- **响应式设计** - 支持桌面、平板、移动端

#### 技术栈要求
- **框架**: React 18 + TypeScript 5.0+
- **UI库**: Ant Design 5.x (用户界面) + Ant Design Pro (管理员界面)
- **状态管理**: Zustand (简单状态) + Redux Toolkit (复杂状态)
- **路由**: React Router v6 + 路由守卫
- **数据获取**: TanStack Query (React Query) + Axios
- **图表**: Recharts (数据可视化)
- **样式**: CSS Modules + Styled Components
- **构建工具**: Vite + ESLint + Prettier

### 用户界面功能规范

#### 1. 认证系统
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

#### 2. 主聊天界面
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

#### 3. 个人中心
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

### 管理员界面功能规范

#### 1. 管理员仪表盘
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

#### 2. 用户管理系统
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

#### 3. 文档和知识库管理
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

#### 4. 系统监控
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

### 组件架构设计

#### 目录结构
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

#### 核心组件
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

### API集成规范

#### 用户界面API
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

#### 管理员界面API
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

### 状态管理设计

#### Zustand Store (用户界面)
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

#### Redux Toolkit Store (管理员界面)
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

### 样式和主题设计

#### 设计系统
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

### 性能优化策略

#### 代码分割
```typescript
// 路由级别的懒加载
const UserInterface = lazy(() => import('./pages/user/UserInterface'));
const AdminInterface = lazy(() => import('./pages/admin/AdminInterface'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));

// 组件级别的懒加载
const ChartComponent = lazy(() => import('./components/Chart'));
const DocumentPreview = lazy(() => import('./components/DocumentPreview'));
```

#### 缓存策略
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

### 安全要求

#### 认证和授权
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

### 部署和构建

#### Vite配置
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
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

#### 环境变量配置
```typescript
// .env.example
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_APP_NAME=RAG问答机器人
VITE_APP_VERSION=2.0.0
VITE_ENABLE_ANALYTICS=true
```

### 交付要求

#### 代码质量
- TypeScript严格模式，100%类型覆盖
- ESLint + Prettier代码规范化
- 单元测试覆盖率 > 80%
- 性能评分 > 90
- 无障碍访问支持
- SEO优化

#### 功能完整
- 用户界面和管理员界面完整实现
- 所有API接口正确集成
- 响应式设计完美适配
- 错误处理和异常情况覆盖
- 加载状态和空状态处理
- 主题切换（明/暗模式）

#### 用户体验
- 流畅的动画过渡
- 快速的页面加载（< 2秒）
- 直观的交互设计
- 完善的错误提示
- 操作确认和撤销
- 键盘快捷键支持

请创建一个完整的React应用，包含上述所有功能要求。确保代码质量高、架构清晰、性能优秀、用户体验出色。应用应该能够直接部署使用，并与FastAPI后端无缝集成。

---

### API集成配置

#### 后端API连接
```typescript
// 配置API基础URL
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000';

// 智普清言集成配置
const ZHIPU_CONFIG = {
  model: 'chatglm_turbo',
  embeddingModel: 'embedding-2',
  maxTokens: 2000,
  temperature: 0.7,
};

// WebSocket连接配置
const WS_URL = process.env.VITE_WS_URL || 'ws://localhost:8000/ws';
```

**🚀 开始生成**: 请基于上述完整规范创建一个生产就绪的RAG问答机器人前端系统。