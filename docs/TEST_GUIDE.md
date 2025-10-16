# 测试文档

## 概述

本项目包含完整的测试套件，覆盖后端API、前端组件、集成测试和端到端测试。

## 测试结构

```
ichat/
├── backend/tests/          # 后端测试
│   ├── conftest.py        # Pytest配置和共享fixtures
│   ├── test_auth.py       # 认证测试
│   ├── test_chat.py       # 聊天功能测试
│   ├── test_questions.py  # 问题管理测试
│   ├── test_scenes.py     # 场景测试
│   ├── test_feedback.py   # 反馈测试
│   ├── test_search.py     # 搜索功能测试
│   ├── test_analytics.py  # 分析统计测试
│   ├── test_services.py   # 服务层测试
│   ├── test_integration.py # 集成测试
│   └── test_performance.py # 性能测试
│
├── frontend/src/tests/     # 前端测试
│   ├── App.spec.js        # App组件测试
│   ├── Chat.spec.js       # 聊天组件测试
│   ├── Login.spec.js      # 登录组件测试
│   ├── Scenes.spec.js     # 场景组件测试
│   ├── api.spec.js        # API服务测试
│   └── store.spec.js      # Vuex Store测试
│
└── cypress/integration/    # E2E测试
    └── e2e.spec.js        # 端到端测试
```

## 后端测试

### 运行测试

```bash
cd backend

# 运行所有测试
pytest

# 运行特定测试文件
pytest tests/test_auth.py

# 运行特定测试类
pytest tests/test_auth.py::TestAuthRoutes

# 运行特定测试函数
pytest tests/test_auth.py::TestAuthRoutes::test_login_success

# 显示详细输出
pytest -v

# 显示测试覆盖率
pytest --cov=. --cov-report=html

# 运行性能测试
pytest tests/test_performance.py
```

### 测试覆盖

- **认证测试** (`test_auth.py`)
  - 用户注册
  - 用户登录/登出
  - Token验证
  - 权限检查

- **聊天测试** (`test_chat.py`)
  - 基本聊天功能
  - 上下文处理
  - 场景切换
  - 建议生成

- **问题管理测试** (`test_questions.py`)
  - CRUD操作
  - 搜索和过滤
  - 权限控制

- **反馈测试** (`test_feedback.py`)
  - 提交反馈
  - 反馈查询
  - 统计分析

- **搜索测试** (`test_search.py`)
  - 关键词搜索
  - 语义搜索
  - 混合搜索
  - 分页和过滤

- **分析测试** (`test_analytics.py`)
  - 用户统计
  - 聊天统计
  - 热门问题
  - 时间范围过滤

- **服务层测试** (`test_services.py`)
  - ChatService
  - RAGService
  - 文档检索
  - 答案生成

- **集成测试** (`test_integration.py`)
  - 完整用户流程
  - 跨模块交互
  - 端到端场景

- **性能测试** (`test_performance.py`)
  - API响应时间
  - 并发处理
  - 负载测试
  - 数据库性能

## 前端测试

### 运行测试

```bash
cd frontend

# 安装依赖
npm install

# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test -- Chat.spec.js

# 监听模式
npm test -- --watch
```

### 测试覆盖

- **App测试** (`App.spec.js`)
  - 应用初始化
  - 路由配置

- **聊天组件测试** (`Chat.spec.js`)
  - 消息发送
  - 消息显示
  - 历史记录

- **登录组件测试** (`Login.spec.js`)
  - 表单验证
  - 登录流程
  - 错误处理

- **场景组件测试** (`Scenes.spec.js`)
  - 场景列表显示
  - 场景选择
  - 场景详情

- **API服务测试** (`api.spec.js`)
  - HTTP请求
  - 错误处理
  - 数据格式化

- **Store测试** (`store.spec.js`)
  - 状态管理
  - Mutations
  - Actions

## E2E测试

### 运行测试

```bash
# 打开Cypress测试界面
npm run cypress:open

# 运行所有E2E测试
npm run cypress:run

# 运行特定测试文件
npx cypress run --spec "cypress/integration/e2e.spec.js"
```

### 测试场景

- **用户流程**
  - 注册和登录
  - 聊天交互
  - 搜索功能
  - 提交反馈
  - 场景切换

- **管理员流程**
  - 问题管理
  - 分析仪表板
  - 反馈审核

## 配置

### Pytest配置 (pytest.ini)

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
```

### Jest配置 (jest.config.js)

```javascript
module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  testMatch: ['**/tests/**/*.spec.js'],
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/main.js',
    '!**/node_modules/**'
  ]
}
```

### Cypress配置 (cypress.config.js)

```javascript
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:8080',
    video: false,
    screenshotOnRunFailure: true
  }
}
```

## 持续集成

### GitHub Actions示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest --cov=. --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v2

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 16
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Run tests
        run: |
          cd frontend
          npm test -- --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run E2E tests
        uses: cypress-io/github-action@v4
        with:
          start: npm run serve
          wait-on: 'http://localhost:8080'
```

## 最佳实践

1. **测试隔离**: 每个测试应该独立运行，不依赖其他测试
2. **使用Fixtures**: 利用fixtures创建测试数据和共享设置
3. **Mock外部依赖**: 使用mock避免依赖外部服务
4. **清晰的测试名称**: 测试函数名应该清楚描述测试内容
5. **适当的断言**: 使用具体的断言，避免过于宽泛的检查
6. **测试覆盖率**: 目标至少80%的代码覆盖率
7. **定期运行**: 在每次提交前运行测试
8. **性能测试**: 定期运行性能测试以监控系统性能

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 确保测试数据库配置正确
   - 使用内存数据库进行测试

2. **异步测试失败**
   - 使用适当的等待和超时设置
   - 确保清理异步资源

3. **Mock不工作**
   - 检查mock的导入路径
   - 确保在测试前设置mock

4. **E2E测试不稳定**
   - 增加等待时间
   - 使用显式等待代替隐式等待

## 贡献

添加新功能时，请确保：
1. 编写对应的单元测试
2. 更新集成测试
3. 添加E2E测试场景
4. 更新文档

## 测试报告

测试运行后，可以查看以下报告：

- **后端覆盖率**: `backend/htmlcov/index.html`
- **前端覆盖率**: `frontend/coverage/index.html`
- **E2E截图**: `cypress/screenshots/`
- **E2E视频**: `cypress/videos/`
