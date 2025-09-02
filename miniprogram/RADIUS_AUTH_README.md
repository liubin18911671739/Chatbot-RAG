# 微信小程序 RADIUS 认证功能说明

## 功能概述

本小程序已集成 RADIUS 认证功能，用户需要通过校园网账号进行认证后才能使用聊天、历史记录、场景等功能。

## 主要特性

### 1. RADIUS 认证服务
- **认证服务器**: `http://10.10.15.211:5000/api/auth/radius-login`
- **支持开发模式**: 测试账号 `testing / password`
- **认证状态持久化**: 使用微信小程序本地存储
- **自动状态检查**: 页面加载时自动检查认证状态

### 2. 认证流程
1. 用户在首页点击"RADIUS登录"按钮
2. 弹出登录窗口，输入用户名和密码
3. 发送认证请求到RADIUS服务器
4. 认证成功后保存用户信息到本地存储
5. 更新页面状态，显示已认证用户信息

### 3. 权限控制
- **首页**: 未认证时只显示登录界面，认证后显示功能入口
- **聊天页面**: 需要认证才能访问
- **历史记录**: 需要认证才能查看
- **场景页面**: 需要认证才能使用
- **个人页面**: 显示认证状态，提供退出功能

## 文件结构

```
miniprogram/
├── utils/
│   └── auth.js                 # RADIUS认证服务
├── pages/
│   ├── index/
│   │   ├── index.js           # 首页（含登录功能）
│   │   ├── index.wxml         # 首页模板（含登录弹窗）
│   │   └── index.wxss         # 首页样式（含登录样式）
│   ├── chat/
│   │   └── chat.js            # 聊天页面（添加认证检查）
│   ├── history/
│   │   └── history.js         # 历史页面（添加认证检查）
│   ├── scenes/
│   │   └── scenes.js          # 场景页面（添加认证检查）
│   └── profile/
│       ├── profile.js         # 个人页面（显示认证状态）
│       ├── profile.wxml       # 个人页面模板
│       └── profile.wxss       # 个人页面样式
├── app.js                     # 全局应用（添加认证检查）
├── app.wxss                   # 全局样式
└── test/
    └── radius-auth-test.js    # 认证功能测试
```

## 使用说明

### 开发环境测试
```javascript
// 测试账号（开发模式）
用户名: testing
密码: password
```

### 生产环境
使用真实的校园网账号和密码

### API 接口
- **登录接口**: `POST /api/auth/radius-login`
- **请求参数**: 
  ```json
  {
    "username": "用户名",
    "password": "密码"
  }
  ```
- **响应格式**:
  ```json
  {
    "message": "Login successful",
    "token": "可选的认证令牌"
  }
  ```

## 核心方法

### AuthService 类
```javascript
// 检查登录状态
authService.checkLoginStatus()

// 获取当前用户信息
authService.getCurrentUser()

// RADIUS登录
authService.loginWithRADIUS(username, password)

// 退出登录
authService.logout()
```

### 页面认证检查
```javascript
// 在每个需要认证的页面的 onLoad 或 onShow 中调用
checkAuthStatus() {
  const isLoggedIn = authService.checkLoginStatus()
  if (!isLoggedIn) {
    wx.showModal({
      title: '需要登录',
      content: '请先进行认证',
      showCancel: false,
      success: () => {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })
    return false
  }
  return true
}
```

## 样式说明

### 登录弹窗样式
- 模态窗口设计
- 响应式布局
- 品牌色彩搭配
- 输入验证反馈

### 认证状态显示
- 用户名显示
- 认证类型标识
- 认证时间戳
- 退出登录按钮

## 注意事项

1. **网络要求**: 需要能访问校园网环境下的认证服务器
2. **存储安全**: 用户密码不会保存在本地，只保存认证状态
3. **会话管理**: 认证状态在小程序重启后依然有效
4. **错误处理**: 包含完整的错误处理和用户提示
5. **开发调试**: 支持开发模式的测试账号

## 问题排查

### 常见问题
1. **网络连接失败**: 检查是否在校园网环境
2. **认证服务器无响应**: 确认服务器地址和端口
3. **登录失败**: 检查用户名密码是否正确
4. **状态丢失**: 检查本地存储是否正常

### 调试方法
```javascript
// 在控制台运行测试
import { testRadiusAuth } from './test/auth-test.js'
testRadiusAuth()
```

## 更新日志

- **v1.0.0**: 初始版本，基础RADIUS认证功能
- 集成登录界面到首页
- 添加全局认证状态管理
- 实现页面级权限控制
- 添加用户友好的错误提示
