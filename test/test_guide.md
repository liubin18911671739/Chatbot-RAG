# ChatService 测试脚本使用指南

## 📋 概述

创建了两个测试脚本来测试 `chatService.js` 中的 `sendChatMessage()` 函数：

1. **test_sendChatMessage.js** - 完整功能测试脚本
2. **test_sendChatMessage_simple.js** - 简化快速测试脚本

## 🚀 快速开始

### 前置要求
确保已安装 Node.js 和 axios：
```bash
# 如果没有安装 axios
npm install axios
```

### 基本使用

#### 1. 简单快速测试
```bash
node test_sendChatMessage_simple.js
```

#### 2. 批量测试
```bash
node test_sendChatMessage_simple.js --batch
```

#### 3. 完整功能测试
```bash
node test_sendChatMessage.js
```

#### 4. 显示帮助信息
```bash
node test_sendChatMessage_simple.js --help
```

## 📁 文件说明

### test_sendChatMessage.js (完整版)
- **功能**: 完整的 ChatService 类实现和测试
- **特点**: 
  - 包含完整的错误处理和重试机制
  - 支持多种测试用例
  - 详细的日志输出
  - 性能监控
- **适用**: 深度测试和调试

### test_sendChatMessage_simple.js (简化版)
- **功能**: 快速测试核心功能
- **特点**:
  - 轻量级实现
  - 快速执行
  - 清晰的输出格式
  - 支持批量测试
- **适用**: 日常快速验证

## 🧪 测试用例

### 基本测试用例
```javascript
{
  prompt: '你好，请介绍一下北京第二外国语学院',
  scene_id: 'general'
}
```

### 批量测试用例
1. **简单问候**: `你好`
2. **专业咨询**: `北京第二外国语学院有哪些专业？`
3. **生活指导**: `如何申请奖学金？`

### 完整测试用例 (test_sendChatMessage.js)
1. **基本消息测试**: 一般问候
2. **学习场景测试**: 专业相关问题
3. **长消息测试**: 复杂详细问题
4. **空消息测试**: 验证错误处理
5. **特殊字符测试**: 多语言和特殊符号

## 📊 输出说明

### 成功输出示例
```
🧪 快速测试 ChatService.sendChatMessage()
==================================================
📡 测试API地址: http://10.10.15.210:5000
📝 测试消息: "你好，请介绍一下北京第二外国语学院"
🏷️ 场景ID: general

🚀 发送请求...
✅ 请求成功!
⏱️ 响应时间: 1234ms
📊 状态码: 200

📋 响应数据结构:
   类型: object
   字段: status, response, attachment_data

💬 AI回复:
   长度: 156 字符
   内容预览: 你好！北京第二外国语学院是一所以外语教学为特色...

📝 完整AI回复:
--------------------------------------------------
你好！北京第二外国语学院是一所以外语教学为特色的重点大学...
--------------------------------------------------
```

### 错误输出示例
```
❌ 测试失败:
   状态码: 500
   响应数据: { "status": "error", "message": "API调用失败" }
```

## 🔧 配置选项

### API地址配置
在脚本顶部修改：
```javascript
const API_BASE_URL = 'http://10.10.15.210:5000';
```

### 超时配置
```javascript
const TIMEOUT = 40000; // 40秒
```

### 环境变量支持
```bash
export VUE_APP_API_URL=http://10.10.15.211:5000
node test_sendChatMessage.js
```

## 🐛 故障排除

### 常见问题

#### 1. 连接失败
```
❌ 连接失败: connect ECONNREFUSED 10.10.15.210:5000
```
**解决方案**: 
- 检查后端服务是否运行
- 确认API地址是否正确
- 检查防火墙设置

#### 2. 超时错误
```
❌ 测试失败: timeout of 40000ms exceeded
```
**解决方案**:
- 增加超时时间
- 检查网络连接
- 检查服务器性能

#### 3. 响应格式错误
```
❌ 服务器响应格式异常，请稍后重试
```
**解决方案**:
- 检查后端 API 返回格式
- 查看后端日志
- 验证请求参数

### 调试技巧

#### 1. 启用详细日志
修改脚本中的 axios 拦截器来查看更多信息

#### 2. 使用 curl 验证
```bash
curl -X POST http://10.10.15.210:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"你好","scene_id":"general"}'
```

#### 3. 检查网络连通性
```bash
ping 10.10.15.210
telnet 10.10.15.210 5000
```

## 📈 性能监控

### 响应时间基准
- **正常响应**: < 5000ms
- **较慢响应**: 5000-15000ms  
- **超时**: > 40000ms

### 成功率监控
脚本会自动计算测试成功率：
```
📊 测试完成! 统计结果:
✅ 成功: 4 个测试
❌ 失败: 1 个测试
📈 成功率: 80.0%
```

## 🔄 持续集成

### 自动化测试
可以将测试脚本集成到 CI/CD 流程中：
```bash
# 在部署后运行测试
npm run test:simple
if [ $? -eq 0 ]; then
  echo "✅ API测试通过"
else
  echo "❌ API测试失败"
  exit 1
fi
```

### 定时测试
设置定时任务监控API健康状态：
```bash
# 每5分钟测试一次
*/5 * * * * cd /path/to/ichat && node test_sendChatMessage_simple.js
```

## 📝 扩展功能

### 添加新测试用例
在 `testCases` 数组中添加：
```javascript
{
  name: '新测试用例',
  prompt: '测试内容',
  sceneId: 'test_scene'
}
```

### 自定义输出格式
修改日志输出函数来自定义格式

### 集成测试报告
可以将测试结果输出到 JSON 文件用于报告生成

---

**✅ 测试脚本已就绪**：可以立即开始测试 `sendChatMessage()` 函数的各种场景和功能。
