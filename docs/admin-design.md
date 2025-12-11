# RAG问答机器人管理员界面设计

## 技术栈与架构

### 技术选型
- **框架**: React 18 + TypeScript 5.0
- **UI框架**: Ant Design 5.x + Ant Design Pro 5.x
- **状态管理**: Redux Toolkit + RTK Query
- **路由**: React Router v6
- **图表库**: Recharts + ECharts
- **工具库**: Lodash, Day.js
- **构建工具**: Vite 5.x

### 项目结构
```
admin-app/
├── src/
│   ├── components/           # 组件库
│   │   ├── Layout/          # 布局组件
│   │   │   ├── ProLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── Charts/          # 图表组件
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   └── PieChart.tsx
│   │   ├── Tables/          # 表格组件
│   │   │   ├── UserTable.tsx
│   │   │   └── DocumentTable.tsx
│   │   ├── Forms/           # 表单组件
│   │   │   ├── UserForm.tsx
│   │   │   └── ConfigForm.tsx
│   │   └── Common/          # 通用组件
│   ├── pages/              # 页面组件
│   │   ├── Dashboard/       # 仪表盘
│   │   │   ├── Overview.tsx
│   │   │   ├── Statistics.tsx
│   │   │   └── Monitoring.tsx
│   │   ├── Users/           # 用户管理
│   │   │   ├── UserList.tsx
│   │   │   ├── UserDetail.tsx
│   │   │   └── UserAnalytics.tsx
│   │   ├── Documents/       # 文档管理
│   │   │   ├── DocumentList.tsx
│   │   │   ├── DocumentUpload.tsx
│   │   │   └── VectorStatus.tsx
│   │   ├── RAG/             # RAG管理
│   │   │   ├── PipelineConfig.tsx
│   │   │   ├── VectorSettings.tsx
│   │   │   └── RetrievalSettings.tsx
│   │   └── System/          # 系统管理
│   │       ├── Settings.tsx
│   │       ├── Logs.tsx
│   │       └── Security.tsx
│   ├── store/              # Redux Store
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── dashboardSlice.ts
│   │   │   ├── usersSlice.ts
│   │   │   └── ragSlice.ts
│   │   └── api/
│   │       ├── authApi.ts
│   │       ├── dashboardApi.ts
│   │       └── ragApi.ts
│   ├── hooks/              # 自定义Hooks
│   │   ├── useAuth.ts
│   │   ├── useDashboard.ts
│   │   └── useWebSocket.ts
│   ├── utils/              # 工具函数
│   │   ├── format.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── types/              # TypeScript类型
│   │   ├── api.ts
│   │   ├── user.ts
│   │   └── rag.ts
│   └── styles/             # 样式文件
├── public/
├── package.json
└── vite.config.ts
```

## 核心功能实现

### 1. Redux Store配置

#### Store初始化
```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authSlice } from './slices/authSlice';
import { dashboardSlice } from './slices/dashboardSlice';
import { usersSlice } from './slices/usersSlice';
import { ragSlice } from './slices/ragSlice';
import { authApi } from './api/authApi';
import { dashboardApi } from './api/dashboardApi';
import { usersApi } from './api/usersApi';
import { ragApi } from './api/ragApi';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    dashboard: dashboardSlice,
    users: usersSlice,
    rag: ragSlice,
    [authApi.reducerPath]: authApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [ragApi.reducerPath]: ragApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
      .concat(authApi.middleware)
      .concat(dashboardApi.middleware)
      .concat(usersApi.middleware)
      .concat(ragApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### 认证Slice
```typescript
// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  lastLogin: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('admin_token'),
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: AdminUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      localStorage.setItem('admin_token', action.payload.token);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('admin_token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
```

### 2. API服务

#### 认证API
```typescript
// src/store/api/authApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/admin/auth',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getProfile: builder.query<AdminUser, void>({
      query: () => '/profile',
    }),
    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: '/refresh',
        method: 'POST',
      }),
    }),
  }),
});

export const { useLoginMutation, useGetProfileQuery, useRefreshTokenMutation } = authApi;
```

#### 仪表盘API
```typescript
// src/store/api/dashboardApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  todayQuestions: number;
  systemHealth: 'good' | 'warning' | 'error';
}

export interface SystemMetrics {
  apiResponseTime: number;
  databasePerformance: number;
  memoryUsage: number;
  cpuUsage: number;
  concurrentUsers: number;
}

export interface AnalyticsData {
  questionTrends: DataPoint[];
  userGrowth: DataPoint[];
  documentTypes: DocumentTypeStats[];
  apiUsage: ApiUsageStats[];
}

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/admin/dashboard',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getStats: builder.query<DashboardStats, void>({
      query: () => '/stats',
    }),
    getMetrics: builder.query<SystemMetrics, void>({
      query: () => '/metrics',
    }),
    getAnalytics: builder.query<AnalyticsData, { timeRange: string }>({
      query: ({ timeRange }) => ({
        url: '/analytics',
        params: { timeRange },
      }),
    }),
  }),
});

export const {
  useGetStatsQuery,
  useGetMetricsQuery,
  useGetAnalyticsQuery,
} = dashboardApi;
```

### 3. 仪表盘组件

#### 统计卡片组件
```typescript
// src/components/Charts/StatCard.tsx
import { Card, Statistic } from 'antd';

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix,
  prefix,
  trend,
  color = '#1890ff',
  icon,
}) => {
  return (
    <Card>
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        prefix={prefix}
        valueStyle={{ color }}
        prefixCls="stat-card-icon"
      />
      {trend && (
        <div className="stat-trend" style={{ marginTop: 8 }}>
          <span style={{ color: trend.isPositive ? '#52c41a' : '#ff4d4f' }}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span style={{ marginLeft: 8 }}>较昨日</span>
        </div>
      )}
    </Card>
  );
};
```

#### 实时监控组件
```typescript
// src/pages/Dashboard/Monitoring.tsx
import { Card, Row, Col, Statistic, Progress } from 'antd';
import { useGetMetricsQuery } from '../../store/api/dashboardApi';
import { SystemMetrics } from '../../types';

export const Monitoring: React.FC = () => {
  const { data: metrics, isLoading } = useGetMetricsQuery();

  if (isLoading || !metrics) {
    return <div>Loading...</div>;
  }

  return (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card title="API响应时间">
          <Statistic
            value={metrics.apiResponseTime}
            suffix="ms"
            valueStyle={{
              color: metrics.apiResponseTime < 500 ? '#52c41a' : '#ff4d4f',
            }}
          />
          <Progress
            percent={Math.max(0, 100 - (metrics.apiResponseTime / 10))}
            size="small"
            strokeColor={metrics.apiResponseTime < 500 ? '#52c41a' : '#ff4d4f'}
          />
        </Card>
      </Col>

      <Col span={6}>
        <Card title="数据库性能">
          <Statistic
            value={metrics.databasePerformance}
            suffix="ms"
            valueStyle={{
              color: metrics.databasePerformance < 100 ? '#52c41a' : '#ff4d4f',
            }}
          />
        </Card>
      </Col>

      <Col span={6}>
        <Card title="内存使用">
          <Statistic
            value={metrics.memoryUsage}
            suffix="%"
            valueStyle={{
              color: metrics.memoryUsage < 80 ? '#52c41a' : '#ff4d4f',
            }}
          />
          <Progress
            percent={metrics.memoryUsage}
            size="small"
            strokeColor={metrics.memoryUsage < 80 ? '#52c41a' : '#ff4d4f'}
          />
        </Card>
      </Col>

      <Col span={6}>
        <Card title="CPU使用">
          <Statistic
            value={metrics.cpuUsage}
            suffix="%"
            valueStyle={{
              color: metrics.cpuUsage < 70 ? '#52c41a' : '#ff4d4f',
            }}
          />
          <Progress
            percent={metrics.cpuUsage}
            size="small"
            strokeColor={metrics.cpuUsage < 70 ? '#52c41a' : '#ff4d4f'}
          />
        </Card>
      </Col>
    </Row>
  );
};
```

### 4. 用户管理

#### 用户表格组件
```typescript
// src/components/Tables/UserTable.tsx
import { Table, Button, Tag, Space, Modal } from 'antd';
import { useGetUsersQuery, useUpdateUserMutation } from '../../store/api/usersApi';
import type { ColumnsType } from 'antd/es/table';

interface UserTableProps {
  onEdit: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ onEdit }) => {
  const { data: users, isLoading } = useGetUsersQuery();
  const [updateUser] = useUpdateUserMutation();

  const handleStatusChange = async (user: User, status: string) => {
    try {
      await updateUser({ id: user.id, data: { status } });
    } catch (error) {
      Modal.error({
        title: '更新失败',
        content: error.message,
      });
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: User) => (
        <Tag
          color={status === 'active' ? 'green' : 'orange'}
          style={{ cursor: 'pointer' }}
          onClick={() => handleStatusChange(record, status === 'active' ? 'inactive' : 'active')}
        >
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: User) => (
        <Space size="middle">
          <Button type="link" onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users}
      loading={isLoading}
      rowKey="id"
      pagination={{
        total: users?.length,
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
    />
  );
};
```

### 5. RAG管理面板

#### 向量化状态监控
```typescript
// src/pages/RAG/VectorStatus.tsx
import { Card, Progress, List, Tag, Space, Button } from 'antd';
import { useGetVectorizationStatusQuery } from '../../store/api/ragApi';

export const VectorStatus: React.FC = () => {
  const { data: vectorStatus, isLoading } = useGetVectorizationStatusQuery();

  if (isLoading || !vectorStatus) {
    return <Card loading />;
  }

  return (
    <div>
      <Card title="向量化进度概览" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Progress
              type="circle"
              percent={vectorStatus.overallProgress}
              format={(percent) => `${percent}%`}
            />
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              总体进度
            </div>
          </Col>
          <Col span={8}>
            <Statistic
              title="已处理文档"
              value={vectorStatus.processedDocuments}
              suffix={`/ ${vectorStatus.totalDocuments}`}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="向量总数"
              value={vectorStatus.totalVectors}
            />
          </Col>
        </Row>
      </Card>

      <Card title="处理队列">
        <List
          dataSource={vectorStatus.queue}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.documentName}
                description={
                  <Space>
                    <Tag color={getStatusColor(item.status)}>
                      {item.status}
                    </Tag>
                    <Progress
                      percent={item.progress}
                      size="small"
                      style={{ width: 200 }}
                    />
                  </Space>
                }
              />
              <div>
                <Button size="small" disabled={item.status !== 'completed'}>
                  查看详情
                </Button>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'orange',
    processing: 'blue',
    completed: 'green',
    failed: 'red',
  };
  return colors[status] || 'default';
};
```

### 6. 系统监控

#### 实时数据监控
```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface SystemEvent {
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  data?: any;
}

export const useWebSocket = () => {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/admin/ws`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data: SystemEvent = JSON.parse(event.data);
      setEvents(prev => [data, ...prev].slice(0, 100)); // 保留最近100条
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [token]);

  return events;
};
```

## 开发和部署

### 快速开始
```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 类型检查
npm run type-check

# 构建
npm run build

# 预览
npm run preview
```

### 环境配置
```typescript
// src/config/env.ts
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
  environment: import.meta.env.MODE || 'development',
};
```

### Docker部署
```dockerfile
# apps/admin-app/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 下一步计划

1. **基础架构搭建** (1周)
   - 项目结构创建
   - Redux store配置
   - 基础组件开发

2. **核心功能开发** (2-3周)
   - 用户管理系统
   - RAG管理面板
   - 系统监控

3. **高级功能** (1-2周)
   - 实时监控
   - 数据可视化
   - 性能优化

4. **测试和部署** (1周)
   - 单元测试
   - 集成测试
   - 生产部署