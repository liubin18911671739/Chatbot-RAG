# React前端迁移项目结构设计

## 迁移策略

### 渐进式迁移方案
我们将采用渐进式迁移策略，确保在迁移过程中系统保持稳定运行：

1. **并行开发阶段** - 新React应用与现有Vue应用并存
2. **功能模块切换** - 逐个模块从Vue切换到React
3. **完全替换** - 完全迁移到React架构

### 项目结构设计

```
frontend-v2/                     # 新React前端根目录
├── packages/                     # Monorepo包管理
│   ├── shared/                   # 共享代码库
│   │   ├── components/           # 通用组件
│   │   │   ├── ui/              # 基础UI组件
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   └── index.ts
│   │   │   ├── layout/          # 布局组件
│   │   │   └── business/        # 业务组件
│   │   ├── hooks/               # 自定义Hooks
│   │   ├── utils/               # 工具函数
│   │   ├── types/               # TypeScript类型定义
│   │   ├── services/            # API服务
│   │   ├── constants/           # 常量定义
│   │   └── package.json
│   ├── user-app/                # 用户界面应用
│   │   ├── public/
│   │   │   ├── index.html
│   │   │   └── favicon.ico
│   │   ├── src/
│   │   │   ├── components/       # 应用特定组件
│   │   │   │   ├── Chat/
│   │   │   │   │   ├── ChatInterface.tsx
│   │   │   │   │   ├── MessageList.tsx
│   │   │   │   │   ├── MessageInput.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── RegisterForm.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Documents/
│   │   │   │   │   ├── DocumentUpload.tsx
│   │   │   │   │   ├── DocumentList.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── Profile/
│   │   │   │       ├── UserProfile.tsx
│   │   │   │       ├── Settings.tsx
│   │   │   │       └── index.ts
│   │   │   ├── pages/           # 页面组件
│   │   │   │   ├── ChatPage.tsx
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   ├── HistoryPage.tsx
│   │   │   │   └── NotFoundPage.tsx
│   │   │   ├── layouts/         # 布局组件
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── AuthLayout.tsx
│   │   │   │   └── index.ts
│   │   │   ├── stores/          # Zustand状态管理
│   │   │   │   ├── authStore.ts
│   │   │   │   ├── chatStore.ts
│   │   │   │   ├── documentStore.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/        # API服务层
│   │   │   │   ├── api.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── chat.ts
│   │   │   │   └── documents.ts
│   │   │   ├── hooks/           # 应用特定Hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useChat.ts
│   │   │   │   └── useDocuments.ts
│   │   │   ├── utils/           # 应用工具函数
│   │   │   │   ├── formatters.ts
│   │   │   │   ├── validators.ts
│   │   │   │   └── constants.ts
│   │   │   ├── styles/          # 样式文件
│   │   │   │   ├── globals.css
│   │   │   │   ├── variables.css
│   │   │   │   └── components.css
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── vite-env.d.ts
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── tailwind.config.js
│   └── admin-app/               # 管理员界面应用
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Dashboard/
│       │   │   │   ├── Overview.tsx
│       │   │   │   ├── Statistics.tsx
│       │   │   │   └── Metrics.tsx
│       │   │   ├── Users/
│       │   │   │   ├── UserList.tsx
│       │   │   │   ├── UserDetail.tsx
│       │   │   │   └── UserForm.tsx
│       │   │   ├── Documents/
│       │   │   │   ├── DocumentManager.tsx
│       │   │   │   ├── VectorStatus.tsx
│       │   │   │   └── ProcessingQueue.tsx
│       │   │   ├── RAG/
│       │   │   │   ├── PipelineConfig.tsx
│       │   │   │   ├── EmbeddingSettings.tsx
│       │   │   │   └── RetrievalSettings.tsx
│       │   │   └── System/
│       │   │       ├── Monitoring.tsx
│       │   │       ├── Logs.tsx
│       │   │       └── Settings.tsx
│       │   ├── pages/
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── UsersPage.tsx
│       │   │   ├── DocumentsPage.tsx
│       │   │   ├── RAGConfigPage.tsx
│       │   │   └── SystemPage.tsx
│       │   ├── layouts/
│       │   │   ├── AdminLayout.tsx
│       │   │   └── index.ts
│       │   ├── store/            # Redux状态管理
│       │   │   ├── index.ts
│       │   │   ├── slices/
│       │   │   │   ├── authSlice.ts
│       │   │   │   ├── dashboardSlice.ts
│       │   │   │   ├── usersSlice.ts
│       │   │   │   └── ragSlice.ts
│       │   │   └── api/
│       │   │       ├── authApi.ts
│       │   │       ├── dashboardApi.ts
│       │   │       ├── usersApi.ts
│       │   │       └── ragApi.ts
│       │   ├── hooks/
│       │   │   ├── useAdminAuth.ts
│       │   │   ├── useWebSocket.ts
│       │   │   └── usePermissions.ts
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
├── docker/                      # Docker配置
│   ├── user-app.Dockerfile
│   ├── admin-app.Dockerfile
│   └── nginx.conf
├── scripts/                     # 构建脚本
│   ├── build.sh
│   ├── dev.sh
│   └── deploy.sh
├── docs/                        # 文档
│   ├── migration-guide.md
│   ├── api-integration.md
│   └── deployment.md
├── package.json                 # 根package.json
├── lerna.json                   # Lerna配置
├── docker-compose.yml           # Docker Compose配置
└── README.md
```

## 开发环境配置

### 1. Monorepo管理
使用Lerna + Yarn Workspaces进行多包管理：

```json
// package.json (根目录)
{
  "name": "rag-frontend-v2",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev:user": "lerna run dev --scope=@rag/user-app",
    "dev:admin": "lerna run dev --scope=@rag/admin-app",
    "build": "lerna run build",
    "test": "lerna run test",
    "lint": "lerna run lint",
    "clean": "lerna clean && rm -rf node_modules"
  },
  "devDependencies": {
    "lerna": "^7.0.0"
  }
}
```

### 2. 共享包配置
```json
// packages/shared/package.json
{
  "name": "@rag/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.2.0"
  }
}
```

### 3. 用户应用配置
```json
// packages/user-app/package.json
{
  "name": "@rag/user-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "@rag/shared": "workspace:*",
    "antd": "^5.12.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^4.0.0",
    "react-router-dom": "^6.8.0",
    "react-markdown": "^8.0.0",
    "react-syntax-highlighter": "^15.5.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 4. 管理员应用配置
```json
// packages/admin-app/package.json
{
  "name": "@rag/admin-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite --port 3001",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "@rag/shared": "workspace:*",
    "antd": "^5.12.0",
    "@ant-design/pro-components": "^2.6.0",
    "@reduxjs/toolkit": "^1.9.0",
    "react-redux": "^8.1.0",
    "react-router-dom": "^6.8.0",
    "recharts": "^2.8.0",
    "@ant-design/icons": "^5.2.0"
  }
}
```

## Vite配置

### 用户应用Vite配置
```typescript
// packages/user-app/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
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

### 管理员应用Vite配置
```typescript
// packages/admin-app/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

## TypeScript配置

### 根TypeScript配置
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["packages/shared/src/*"],
      "@user-app/*": ["packages/user-app/src/*"],
      "@admin-app/*": ["packages/admin-app/src/*"]
    }
  },
  "include": [
    "packages/*/src",
    "packages/*/vite.config.ts"
  ],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/user-app" },
    { "path": "./packages/admin-app" }
  ]
}
```

## 迁移阶段规划

### 第一阶段：基础设施搭建（1周）
- [x] 创建Monorepo项目结构
- [x] 配置开发环境和构建工具
- [ ] 实现共享包基础功能
- [ ] 设置API服务层和类型定义

### 第二阶段：用户界面开发（2-3周）
- [ ] 实现用户认证系统
- [ ] 开发核心聊天功能
- [ ] 创建用户个人中心
- [ ] 实现历史记录管理

### 第三阶段：管理员界面开发（2-3周）
- [ ] 实现管理员认证和权限
- [ ] 开发用户管理功能
- [ ] 创建RAG管理面板
- [ ] 实现系统监控功能

### 第四阶段：集成测试和部署（1-2周）
- [ ] 端到端功能测试
- [ ] 性能优化
- [ ] 生产环境部署
- [ ] 与现有系统集成

## Docker部署配置

### Docker Compose配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  # 现有服务保持不变
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - APP_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/rag_db
    depends_on:
      - postgres
    networks:
      - app-network

  postgres:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: rag_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  # 新增React用户应用
  user-app:
    build:
      context: ./frontend-v2
      dockerfile: ../docker/user-app.Dockerfile
    ports:
      - "3000:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:5000
    depends_on:
      - backend
    networks:
      - app-network

  # 新增React管理员应用
  admin-app:
    build:
      context: ./frontend-v2
      dockerfile: ../docker/admin-app.Dockerfile
    ports:
      - "3001:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:5000
    depends_on:
      - backend
    networks:
      - app-network

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf
      - ./docker/ssl:/etc/nginx/ssl
    depends_on:
      - user-app
      - admin-app
      - backend
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

## 开发指南

### 1. 初始化项目
```bash
# 克隆项目
git clone <repository-url>
cd Chatbot-RAG

# 初始化前端v2项目
cd frontend-v2
npm install
npm run bootstrap

# 启动开发环境
npm run dev:user      # 启动用户应用（端口3000）
npm run dev:admin     # 启动管理员应用（端口3001）
```

### 2. 开发流程
1. 在shared包中开发通用功能
2. 在具体应用包中实现特定功能
3. 使用TypeScript进行类型检查
4. 运行测试确保代码质量
5. 提交前运行lint和格式化

### 3. 集成现有后端
- 保持与现有Flask后端的API兼容性
- 逐步迁移到FastAPI后端
- 使用统一的API服务层处理请求

### 4. 测试策略
- 单元测试：Vitest + React Testing Library
- 集成测试：Cypress
- API测试：模拟后端响应
- 端到端测试：完整用户流程

这个设计方案支持渐进式迁移，确保在迁移过程中系统保持稳定运行，同时为未来的功能扩展提供了良好的架构基础。