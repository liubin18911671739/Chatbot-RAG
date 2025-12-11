# RAG问答机器人前端实现方案

## 技术选型与项目结构

### 技术栈
- **框架**: React 18 + TypeScript 5.0
- **UI组件库**: Ant Design 5.x (用户) / Ant Design Pro 5.x (管理员)
- **状态管理**: Zustand (用户) / Redux Toolkit (管理员)
- **路由**: React Router v6
- **数据获取**: TanStack Query + Axios
- **样式方案**: CSS Modules + Styled Components
- **构建工具**: Vite 5.x
- **测试框架**: Vitest + React Testing Library

### 项目结构
```
rag-frontend/
├── apps/
│   ├── user-app/           # 用户界面应用
│   │   ├── src/
│   │   │   ├── components/     # 通用组件
│   │   │   │   ├── Chat/
│   │   │   │   ├── Auth/
│   │   │   │   ├── Layout/
│   │   │   │   └── Common/
│   │   │   ├── pages/        # 页面组件
│   │   │   │   ├── Chat/
│   │   │   │   ├── Auth/
│   │   │   │   ├── Profile/
│   │   │   │   └── History/
│   │   │   ├── stores/       # Zustand状态管理
│   │   │   ├── services/     # API服务
│   │   │   ├── hooks/        # 自定义Hooks
│   │   │   ├── utils/        # 工具函数
│   │   │   ├── types/        # TypeScript类型
│   │   │   └── styles/       # 样式文件
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── admin-app/          # 管理员界面应用
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   │   ├── Dashboard/
│       │   │   ├── Users/
│       │   │   ├── Documents/
│       │   │   ├── Monitoring/
│       │   │   └── Settings/
│       │   ├── store/        # Redux store
│       │   ├── services/
│       │   ├── hooks/
│       │   ├── utils/
│       │   └── types/
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
├── shared/                  # 共享代码
│   ├── components/           # 通用组件
│   ├── hooks/               # 通用Hooks
│   ├── utils/               # 工具函数
│   ├── types/               # TypeScript类型
│   └── services/            # API服务
├── docs/                   # 项目文档
└── scripts/               # 构建脚本
```

## 快速开始

### 环境要求
- Node.js 18+
- npm 9+ 或 pnpm 8+

### 初始化用户界面
```bash
# 创建用户界面应用
cd apps/user-app

# 安装依赖
npm install

# 安装UI和状态管理依赖
npm install antd zustand react-router-dom @tanstack/react-query axios

# 安装开发依赖
npm install -D vite @vitejs/plugin-react typescript eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser

# 启动开发服务器
npm run dev
```

### 初始化管理员界面
```bash
# 创建管理员界面应用
cd apps/admin-app

# 安装依赖
npm install

# 安装Ant Design Pro相关依赖
npm install antd-pro @ant-design/pro-components @ant-design/icons
npm install @reduxjs/toolkit react-redux

# 安装图表相关依赖
npm install recharts

# 启动开发服务器
npm run dev
```

## 核心功能实现

### 1. 用户认证系统

#### JWT服务
```typescript
// shared/services/auth.ts
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private static readonly API_BASE = import.meta.env.VITE_API_BASE_URL;

  static async login(email: string, password: string): Promise<AuthTokens> {
    const response = await fetch(`${this.API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    localStorage.setItem('tokens', JSON.stringify(data));
    return data;
  }

  static async register(userData: RegisterData): Promise<User> {
    const response = await fetch(`${this.API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    return response.json();
  }

  static getAccessToken(): string | null {
    const tokens = localStorage.getItem('tokens');
    return tokens ? JSON.parse(tokens).accessToken : null;
  }

  static async refreshToken(): Promise<AuthTokens> {
    const tokens = localStorage.getItem('tokens');
    if (!tokens) throw new Error('No tokens found');

    const response = await fetch(`${this.API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(tokens).refreshToken}`,
      },
    });

    const data = await response.json();
    localStorage.setItem('tokens', JSON.stringify(data));
    return data;
  }

  static logout(): void {
    localStorage.removeItem('tokens');
  }
}
```

#### 认证状态管理
```typescript
// apps/user-app/src/stores/authStore.ts
import { create } from 'zustand';
import { AuthService } from '../../../shared/services/auth';

interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await AuthService.login(email, password);
      await get().checkAuth();
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  register: async (userData: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      const user = await AuthService.register(userData);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    AuthService.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = AuthService.getAccessToken();
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }

    try {
      // 验证token有效性
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const user = await response.json();
        set({ user, isAuthenticated: true });
      } else {
        AuthService.logout();
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      AuthService.logout();
      set({ user: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
```

### 2. 聊天功能实现

#### 聊天服务
```typescript
// shared/services/chat.ts
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface Source {
  documentId: string;
  documentTitle: string;
  content: string;
  similarity: number;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  knowledgeBase?: string;
  topK?: number;
  similarityThreshold?: number;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  metadata?: Record<string, any>;
}

export class ChatService {
  private static readonly API_BASE = import.meta.env.VITE_API_BASE_URL;

  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const token = AuthService.getAccessToken();

    const response = await fetch(`${this.API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  }

  static async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const token = AuthService.getAccessToken();

    const response = await fetch(`${this.API_BASE}/api/chat/history/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.json();
  }

  static async getConversations(): Promise<Conversation[]> {
    const token = AuthService.getAccessToken();

    const response = await fetch(`${this.API_BASE}/api/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.json();
  }

  static async deleteConversation(sessionId: string): Promise<void> {
    const token = AuthService.getAccessToken();

    await fetch(`${this.API_BASE}/api/chat/conversations/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
```

#### 聊天状态管理
```typescript
// apps/user-app/src/stores/chatStore.ts
import { create } from 'zustand';
import { ChatService, ChatMessage, ChatRequest } from '../../../shared/services/chat';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentSessionId: string | null;
  conversations: Conversation[];
}

interface ChatActions {
  sendMessage: (message: string, knowledgeBase?: string) => Promise<void>;
  loadHistory: (sessionId: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  createNewConversation: () => void;
  clearMessages: () => void;
  setError: (error: string) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  currentSessionId: null,
  conversations: [],

  sendMessage: async (message: string, knowledgeBase?: string) => Promise<void> => {
    set({ isLoading: true, error: null });

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };

    set(state => ({
      messages: [...state.messages, userMessage],
    }));

    try {
      const response = await ChatService.sendMessage({
        message,
        sessionId: get().currentSessionId || undefined,
        knowledgeBase,
      });

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        createdAt: new Date().toISOString(),
        metadata: response.metadata,
      };

      set(state => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  loadHistory: async (sessionId: string) => {
    set({ isLoading: true, error: null });

    try {
      const history = await ChatService.getHistory(sessionId);
      set({ messages: history, currentSessionId: sessionId, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadConversations: async () => {
    try {
      const conversations = await ChatService.getConversations();
      set({ conversations });
    } catch (error) {
      set({ error: error.message });
    }
  },

  createNewConversation: () => {
    const sessionId = Date.now().toString();
    set({
      messages: [],
      currentSessionId: sessionId,
      error: null,
    });
  },

  clearMessages: () => set({ messages: [] }),

  setError: (error: string) => set({ error }),
  clearError: () => set({ error: null }),
}));
```

### 3. 路由配置

#### 用户界面路由
```typescript
// apps/user-app/src/router/index.tsx
import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { lazy } from 'react';

const Layout = lazy(() => import('../components/Layout'));
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const ChatPage = lazy(() => import('../pages/Chat/ChatPage'));
const ProfilePage = lazy(() => import('../pages/User/ProfilePage'));
const HistoryPage = lazy(() => import('../pages/User/HistoryPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/chat" replace /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'history', element: <HistoryPage /> },
    ],
  },
  {
    path: '/auth',
    element: <Layout />,
    children: [
      { path: 'login', element: <LoginPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/chat" replace />,
  },
]);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" />;
};
```

### 4. API服务封装

#### HTTP客户端配置
```typescript
// shared/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AuthService } from './auth';

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private static instance: AxiosInstance;

  static getInstance(): AxiosInstance {
    if (!ApiService.instance) {
      ApiService.instance = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // 请求拦截器
      ApiService.instance.interceptors.request.use(
        (config) => {
          const token = AuthService.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      // 响应拦截器
      ApiService.instance.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;

          // Token过期，尝试刷新
          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
              await AuthService.refreshToken();
              const token = AuthService.getAccessToken();

              originalRequest.headers.Authorization = `Bearer ${token}`;
              return ApiService.instance(originalRequest);
            } catch (refreshError) {
              AuthService.logout();
              window.location.href = '/auth/login';
            }
          }

          throw new ApiError(
            error.response?.data?.message || error.message,
            error.response?.status,
            error.response?.data?.code
          );
        }
      );
    }

    return ApiService.instance;
  }

  static async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.getInstance().request<T>(config);
    return response.data;
  }

  static async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  static async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  static async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  static async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

export default ApiService;
```

## 构建和部署

### Vite配置
```typescript
// apps/user-app/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../shared'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          router: ['react-router-dom'],
        },
      },
    },
  },
});
```

### 部署配置
```json
// apps/user-app/package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "antd": "^5.12.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^4.0.0",
    "axios": "^1.6.0",
    "react-markdown": "^8.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "react-hot-toast": "^2.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/react-syntax-highlighter": "^15.5.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.45.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

## 下一步计划

1. **基础架构搭建** (第1周)
   - 创建项目结构
   - 配置开发环境
   - 实现基础组件

2. **用户界面开发** (第2-3周)
   - 实现认证系统
   - 开发聊天界面
   - 添加个人中心和历史功能

3. **管理员界面开发** (第4-5周)
   - 实现管理员登录
   - 开发用户管理
   - 添加系统监控

4. **集成测试和优化** (第6周)
   - 进行功能测试
   - 性能优化
   - 部署上线