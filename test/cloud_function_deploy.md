# 腾讯云函数快速部署方案

## 为什么选择云函数？
1. **自动HTTPS**：无需配置SSL证书
2. **无需备案**：使用腾讯云提供的域名
3. **自动白名单**：腾讯云域名自动在微信小程序白名单中
4. **快速部署**：几分钟即可上线

## 部署步骤

### 1. 创建云函数
在腾讯云控制台创建新的云函数，代码如下：

```javascript
// index.js - 云函数代码
const axios = require('axios')

exports.main = async (event, context) => {
  // 允许跨域
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    // 转发请求到您的原始API
    const response = await axios({
      method: 'POST',
      url: 'http://10.10.15.211:5000/chat', // 您的原始API
      data: event.body ? JSON.parse(event.body) : {},
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 35000 // 35秒超时，给云函数留5秒处理时间
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    }
  } catch (error) {
    console.error('请求失败:', error.message)
    
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        code: error.response?.status || 500
      })
    }
  }
}
```

### 2. 配置package.json
```json
{
  "name": "ichat-proxy",
  "version": "1.0.0",
  "description": "iChat API代理云函数",
  "main": "index.js",
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

### 3. 获取云函数访问地址
部署完成后，腾讯云会提供一个HTTPS访问地址，格式类似：
```
https://service-xxxxxxxx-1234567890.gz.apigw.tencentcs.com/release/
```

### 4. 更新小程序配置
将获得的云函数地址配置到环境文件中：

```javascript
// config/env.js
const envConfig = {
  development: {
    baseURL: 'http://10.10.15.211:5000', // 开发环境直连
    timeout: 40000
  },
  production: {
    baseURL: 'https://service-xxxxxxxx-1234567890.gz.apigw.tencentcs.com/release', // 云函数代理
    timeout: 30000
  }
}
```

## 更简单的方案：使用现成的代理服务

如果您不想配置云函数，我可以为您创建一个简单的代理服务：

```javascript
// utils/proxy.js - 本地代理方案
class ProxyService {
  constructor() {
    this.proxyUrl = 'https://cors-anywhere.herokuapp.com/' // 公共代理（仅限测试）
    this.targetUrl = 'http://10.10.15.211:5000'
  }

  async request(endpoint, data) {
    const url = `${this.proxyUrl}${this.targetUrl}${endpoint}`
    
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method: 'POST',
        data,
        header: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 40000,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`))
          }
        },
        fail: reject
      })
    })
  }
}

module.exports = new ProxyService()
```

## 推荐的完整解决方案

让我为您的项目更新配置，支持云函数代理：
