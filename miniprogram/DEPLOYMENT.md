# iChat 微信小程序部署指南

## 概述

本文档介绍如何将 iChat RAG-QA 系统的微信小程序版本部署到生产环境。

## 系统架构

```
微信小程序前端 -> 微信服务器 -> 您的后端API -> RAG系统
```

## 部署前准备

### 1. 微信小程序注册
- 在 [微信公众平台](https://mp.weixin.qq.com) 注册小程序账号
- 获取 AppID 和 AppSecret
- 配置服务器域名白名单

### 2. 后端API配置
- 确保后端API服务已部署并可访问
- 配置HTTPS（微信小程序要求）
- 添加CORS支持（允许小程序域名访问）

### 3. 域名配置
在微信公众平台后台配置以下域名：

**request合法域名:**
```
https://your-api-domain.com
```

**socket合法域名:**
```
wss://your-api-domain.com
```

## 部署步骤

### 1. 项目配置

修改 `project.config.json` 中的 AppID：
```json
{
  "appid": "your_actual_appid_here"
}
```

修改 `utils/api.js` 中的API地址：
```javascript
this.baseUrl = 'https://your-api-domain.com/api'
```

### 2. 微信开发者工具

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入小程序项目
3. 在工具中登录您的微信小程序账号
4. 确认项目配置无误

### 3. 代码调试

1. 在开发者工具中预览和调试
2. 测试各项功能是否正常
3. 检查网络请求是否成功
4. 验证数据存储和读取

### 4. 上传代码

1. 在微信开发者工具中点击"上传"
2. 填写版本号和项目备注
3. 确认上传成功

### 5. 提交审核

1. 登录微信公众平台
2. 进入版本管理页面
3. 提交刚上传的版本进行审核
4. 填写审核信息和功能描述

## 后端API配置要求

### 1. HTTPS配置
```nginx
server {
    listen 443 ssl http2;
    server_name your-api-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Flask CORS配置
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['https://servicewechat.com'])
```

### 3. API响应头配置
```python
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'https://servicewechat.com')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response
```

## 环境配置

### 开发环境
- API地址：`http://localhost:5000/api`
- 调试模式：开启
- 数据校验：关闭

### 生产环境
- API地址：`https://your-api-domain.com/api`
- 调试模式：关闭
- 数据校验：开启

## 功能特性

### 已实现功能
- ✅ 用户认证和登录
- ✅ 多场景聊天对话
- ✅ 聊天历史管理
- ✅ 个人设置和偏好
- ✅ 意见反馈系统
- ✅ 离线数据存储
- ✅ 响应式设计

### 待实现功能
- 🔄 语音输入支持
- 🔄 图片上传和识别
- 🔄 推送通知
- 🔄 多语言支持

## 监控和维护

### 1. 错误监控
- 配置微信小程序错误监控
- 监控API响应时间和错误率
- 设置告警机制

### 2. 用户反馈
- 定期查看用户反馈
- 及时处理问题和建议
- 持续优化用户体验

### 3. 数据统计
- 监控用户活跃度
- 分析使用场景偏好
- 优化内容和功能

## 常见问题

### Q: 小程序无法请求API
A: 检查域名是否在微信公众平台配置，确保使用HTTPS

### Q: 聊天记录丢失
A: 检查本地存储是否正常，可能需要用户重新登录

### Q: 页面加载缓慢
A: 优化图片资源大小，减少网络请求次数

### Q: 审核被拒绝
A: 查看审核意见，通常是内容合规或功能描述问题

## 联系支持

如有部署问题，请联系技术支持：
- 邮箱：support@bisu.edu.cn
- 电话：010-65778XXX
