# YiYun Chat 系统 Render 部署指南

## 系统概述

YiYun Chat 是一个智能校园问答系统，包含以下组件：

1. **后端 API 服务** - Flask Python 应用，提供问答 API
2. **前端静态网站** - Vue.js 单页应用，提供用户界面
3. **微信小程序** - 校园网络访问控制的微信小程序客户端

## 部署架构

### 无数据库架构
经过分析，该系统主要通过调用外部 RAG 服务 API 来提供问答功能，而不依赖传统的数据库存储。系统采用无状态设计，所有数据处理都通过 API 调用完成。

### 服务组件

#### 1. 后端 API 服务 (yiyun-chat-backend)
- **运行时**: Python 3.11
- **服务器**: Gunicorn
- **健康检查**: `/api/health`
- **主要功能**: 
  - 聊天 API 处理
  - 场景管理
  - 用户反馈收集
  - 外部 RAG 服务调用

#### 2. 前端静态网站 (yiyun-chat-frontend)
- **运行时**: 静态文件服务
- **构建工具**: Vue CLI
- **主要功能**:
  - 用户界面
  - 聊天交互
  - 响应式设计

## 部署步骤

### 1. 准备工作

确保您有：
- GitHub 仓库（包含所有代码）
- Render 账户
- 必要的环境变量配置

### 2. 上传代码到 GitHub

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 3. 在 Render 上创建服务

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 点击 "New +" 按钮
3. 选择 "Blueprint"
4. 连接您的 GitHub 仓库
5. 选择包含 `render.yaml` 的仓库
6. Render 会自动读取 `render.yaml` 配置并创建服务

### 4. 配置环境变量

在 Render Dashboard 中，为每个服务配置以下环境变量：

#### 后端服务环境变量
- `APP_ENV`: production
- `SECRET_KEY`: 自动生成（或手动设置）
- `DEBUG`: false
- `RAG_SERVICE_URL`: 您的外部 RAG 服务 URL
- `FLASK_ENV`: production

#### 前端服务环境变量
- `NODE_ENV`: production
- `VUE_APP_API_BASE_URL`: 后端服务的 URL

### 5. 部署验证

部署完成后，验证以下端点：

1. **后端健康检查**: `https://your-backend-service.onrender.com/api/health`
2. **前端应用**: `https://your-frontend-service.onrender.com`
3. **API 文档**: `https://your-backend-service.onrender.com/api/docs`

## 重要配置说明

### 安全配置
- 启用了 CORS 跨域支持
- 添加了安全响应头
- 配置了 X-Frame-Options 防止点击劫持

### 性能优化
- 前端静态资源缓存配置
- Gunicorn 多进程配置
- 构建过程优化（忽略不必要的文件）

### 网络配置
- 前端到后端的 API 代理配置
- 健康检查端点
- 超时设置

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Python 依赖是否正确安装
   - 确认 Node.js 版本兼容性

2. **API 调用失败**
   - 验证 RAG_SERVICE_URL 是否可访问
   - 检查网络连接和防火墙设置

3. **前端加载失败**
   - 确认构建输出目录正确
   - 检查静态资源路径配置

### 日志查看
在 Render Dashboard 中查看服务日志：
1. 进入服务详情页面
2. 点击 "Logs" 选项卡
3. 查看实时日志输出

## 扩展配置

### 添加数据库支持
如果未来需要数据库支持，可以取消注释以下配置：

```yaml
databases:
  - name: yiyun-chat-db
    databaseName: yiyun_chat
    user: yiyun_user
    plan: free
```

然后在后端服务中添加数据库环境变量：
```yaml
- key: DATABASE_URL
  fromDatabase:
    name: yiyun-chat-db
    property: connectionString
```

### 自定义域名
在 Render Dashboard 中可以为服务配置自定义域名：
1. 进入服务设置
2. 在 "Custom Domains" 部分添加域名
3. 配置 DNS 记录

## 维护和更新

### 自动部署
当您向 GitHub 推送代码时，Render 会自动重新部署服务（如果启用了自动部署）。

### 手动部署
在 Render Dashboard 中点击 "Manual Deploy" 按钮可以手动触发部署。

### 监控
- 使用 Render 的内置监控功能
- 配置告警通知
- 定期检查服务状态

## 成本估算

使用 Render 的免费计划：
- 后端服务：免费计划（有使用限制）
- 前端静态网站：免费计划
- 总计：$0/月（在免费限制内）

升级到付费计划可获得：
- 更多计算资源
- 更长的运行时间
- 更好的性能
- 优先级支持

## 联系和支持

如果在部署过程中遇到问题，请：
1. 查看 Render 官方文档
2. 检查系统日志
3. 联系开发团队
