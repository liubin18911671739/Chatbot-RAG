# 测试快速入门指南

## 🚀 快速开始

### 1. 安装依赖

#### 后端依赖（✅ 必需）
```bash
cd backend
pip install -r requirements.txt
# pytest 和 pytest-cov 已包含在 requirements.txt 中
```

#### 前端依赖
```bash
cd frontend
npm install

# 可选：如需运行完整的前端单元测试，安装测试依赖
npm install --save-dev @vue/test-utils jest @vue/vue3-jest babel-jest

# 可选：如需E2E测试
npm install --save-dev cypress
```

### 2. 运行第一个测试

#### 后端测试（✅ 已配置）
```bash
cd backend
pytest tests/test_smoke.py -v
# 或运行所有核心测试
pytest tests/test_smoke.py tests/test_services.py -v
```

#### 前端测试（⚠️ 需要先安装测试依赖）
```bash
# 首先安装Jest测试依赖
cd frontend
npm install --save-dev @vue/test-utils jest @vue/vue3-jest babel-jest

# 然后运行测试
npm test -- Login.spec.js
```

### 3. 查看覆盖率

#### 后端
```bash
cd backend
pytest --cov=. --cov-report=html
open htmlcov/index.html  # Mac/Linux
# start htmlcov/index.html  # Windows
```

#### 前端
```bash
cd frontend
npm run test:coverage
open coverage/index.html  # Mac/Linux
# start coverage/index.html  # Windows
```

## 📝 常用命令

### 后端测试命令

```bash
# 运行所有测试
pytest

# 运行特定测试文件
pytest tests/test_chat.py

# 运行特定测试类
pytest tests/test_auth.py::TestAuthRoutes

# 运行特定测试函数
pytest tests/test_auth.py::TestAuthRoutes::test_login_success

# 显示打印输出
pytest -s

# 详细输出
pytest -v

# 只运行失败的测试
pytest --lf

# 生成覆盖率报告
pytest --cov=. --cov-report=html

# 运行带标记的测试
pytest -m unit
pytest -m integration
pytest -m performance
```

### 前端测试命令

> **注意**: 前端测试需要先安装测试依赖：
> ```bash
> cd frontend
> npm install --save-dev @vue/test-utils jest @vue/vue3-jest babel-jest
> ```

```bash
# 运行所有测试
npm test

# 监听模式
npm test -- --watch

# 运行特定文件
npm test -- Chat.spec.js

# 生成覆盖率
npm run test:coverage

# 更新快照
npm test -- -u
```

### E2E测试命令

> **注意**: E2E测试需要先安装Cypress：
> ```bash
> cd frontend
> npm install --save-dev cypress
> ```

```bash
# 打开Cypress界面
npm run cypress:open

# 运行所有E2E测试
npm run cypress:run

# 运行特定测试
npx cypress run --spec "cypress/integration/e2e.spec.js"

# 在特定浏览器运行
npx cypress run --browser chrome
```

## 🔍 调试测试

### 后端调试

```python
# 在测试中添加断点
import pdb; pdb.set_trace()

# 或使用
breakpoint()
```

```bash
# 运行并停在断点
pytest tests/test_auth.py -s
```

### 前端调试

```javascript
// 在测试中添加
console.log('Debug info:', data)

// 查看组件HTML
console.log(wrapper.html())
```

```bash
# 运行时显示控制台输出
npm test -- --verbose
```

### Cypress调试

1. 使用 `cy.pause()` 暂停执行
2. 在Cypress界面中使用时间旅行功能
3. 使用Chrome DevTools

## 📊 测试报告

### 查看测试报告位置

- **后端覆盖率**: `backend/htmlcov/index.html`
- **前端覆盖率**: `frontend/coverage/index.html`
- **Cypress截图**: `cypress/screenshots/`
- **Cypress视频**: `cypress/videos/`

## ⚡ 性能优化

### 加速测试运行

```bash
# 并行运行测试
pytest -n auto  # 需要安装 pytest-xdist

# 只运行快速测试
pytest -m "not slow"

# 跳过慢速测试
pytest tests/test_chat.py --ignore=tests/test_performance.py
```

## 🐛 常见问题

### 1. 导入错误

**问题**: `ModuleNotFoundError: No module named 'backend'`

**解决**:
```bash
# 设置PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:/Users/robin/project/ichat/backend"
```

### 2. 数据库错误

**问题**: `Database connection failed`

**解决**: 确保测试使用内存数据库
```python
# 在conftest.py中
flask_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
```

### 3. 前端测试失败

**问题**: `Cannot find module '@/components/Chat'`

**解决**: 检查jest.config.js中的moduleNameMapper配置

### 4. Cypress超时

**问题**: `Timed out waiting for element`

**解决**: 增加超时时间
```javascript
cy.get('.element', { timeout: 10000 })
```

## 📚 最佳实践

### 1. 测试命名
```python
# 好的命名
def test_user_can_login_with_valid_credentials():
    pass

# 不好的命名
def test1():
    pass
```

### 2. 使用Fixtures
```python
@pytest.fixture
def sample_data():
    return {'key': 'value'}

def test_with_fixture(sample_data):
    assert sample_data['key'] == 'value'
```

### 3. Mock外部调用
```python
from unittest.mock import patch

@patch('services.external_api.call')
def test_external_service(mock_call):
    mock_call.return_value = {'status': 'success'}
    # 测试代码
```

### 4. 清理测试数据
```python
@pytest.fixture
def setup_teardown(app):
    # Setup
    db.create_all()
    yield
    # Teardown
    db.session.remove()
    db.drop_all()
```

## 🎯 测试检查清单

开发新功能时:
- [ ] 编写单元测试
- [ ] 编写集成测试（如需要）
- [ ] 添加E2E测试（如需要）
- [ ] 测试边界情况
- [ ] 测试错误处理
- [ ] 检查测试覆盖率
- [ ] 运行所有测试
- [ ] 更新文档

提交代码前:
- [ ] 所有测试通过
- [ ] 覆盖率 > 80%
- [ ] 没有遗留的console.log
- [ ] 没有遗留的pdb/breakpoint
- [ ] 代码格式化正确

## 🔗 相关资源

- [Pytest文档](https://docs.pytest.org/)
- [Jest文档](https://jestjs.io/)
- [Vue Test Utils文档](https://test-utils.vuejs.org/)
- [Cypress文档](https://docs.cypress.io/)

## 💡 小贴士

1. **先写测试**: 采用TDD方法，先写测试再写代码
2. **保持简单**: 每个测试只测一个功能点
3. **独立性**: 测试之间不应相互依赖
4. **可读性**: 测试代码也要易读易懂
5. **定期运行**: 提交前运行所有测试
6. **快速反馈**: 使用监听模式进行开发

## 📞 获取帮助

如果遇到问题:
1. 查看测试输出的错误信息
2. 查阅 `TEST_GUIDE.md` 详细文档
3. 查看相关测试框架文档
4. 检查 `TEST_SUMMARY.md` 了解测试结构

---

祝测试愉快! 🎉
