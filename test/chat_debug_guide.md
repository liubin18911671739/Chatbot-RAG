/**
 * 微信小程序聊天功能调试指南
 * 解决"发送"按钮无法发送消息的问题
 */

## 问题分析

根据代码检查，可能的原因包括：

### 1. 按钮状态问题
WXML中按钮的disabled属性：
```wxml
<button 
  class="send-btn {{inputText.trim() ? 'active' : ''}}"
  disabled="{{!inputText.trim() || isLoading}}"
  bindtap="onSendTap"
>
  发送
</button>
```

**可能问题**：
- `inputText.trim()` 为空时按钮被禁用
- `isLoading` 为true时按钮被禁用

### 2. API调用问题
当前的响应处理逻辑：
```javascript
if (response && response.response) {
  // 处理成功响应
} else {
  // 处理错误响应
}
```

**可能问题**：
- API返回的响应格式与预期不符
- 网络请求失败但没有正确显示错误信息

### 3. 输入验证问题
```javascript
const validation = utils.validateInput(text)
if (!validation.valid) {
  utils.showToast(validation.message)
  return
}
```

## 调试步骤

### 步骤1: 检查按钮状态
在微信开发者工具的调试面板中：
1. 打开Console
2. 输入一些文字到输入框
3. 观察调试日志中的输出

预期看到：
```
输入框内容变化: {
  inputText: "测试消息",
  trimmed: "测试消息",
  length: 4,
  isEmpty: false
}
```

### 步骤2: 检查按钮点击
点击发送按钮，观察日志：

预期看到：
```
发送按钮被点击 {
  inputText: "测试消息",
  isLoading: false
}
sendMessage 方法被调用 {
  customText: null,
  inputText: "测试消息",
  isLoading: false
}
准备发送的文本: 测试消息
输入验证结果: {valid: true}
```

### 步骤3: 检查API调用
如果前面的步骤都正常，观察API调用：

预期看到：
```
[API请求] POST http://10.10.15.211:5000/api/chat
API响应: {response: "...", sources: [...]}
```

## 快速修复方案

### 方案1: 简化按钮状态
如果按钮状态有问题，可以临时简化：

```wxml
<button 
  class="send-btn {{inputText ? 'active' : ''}}"
  bindtap="onSendTap"
>
  发送
</button>
```

### 方案2: 添加备用发送方法
在chat.js中添加一个简化的发送方法：

```javascript
// 测试发送方法
testSend() {
  console.log('测试发送方法被调用')
  this.setData({
    messages: [...this.data.messages, {
      id: utils.generateId(),
      content: '这是一条测试消息',
      sender: 'user',
      timestamp: Date.now(),
      type: 'text'
    }]
  })
}
```

然后在WXML中添加测试按钮：
```wxml
<button bindtap="testSend">测试发送</button>
```

### 方案3: 检查API配置
确保app.js中的API配置正确：

```javascript
// app.js
initializeApp() {
  this.globalData.apiBaseUrl = 'http://10.10.15.211:5000/api'
  console.log('API基础URL:', this.globalData.apiBaseUrl)
}
```

## 常见问题解决

### 问题1: 按钮显示为灰色无法点击
**原因**: disabled属性为true
**解决**: 检查inputText是否为空，isLoading是否为true

### 问题2: 点击按钮没有反应
**原因**: 事件绑定问题或JavaScript错误
**解决**: 检查Console中是否有错误信息

### 问题3: API请求失败
**原因**: 网络问题或API服务器未启动
**解决**: 
1. 检查网络连接
2. 确认API服务器运行状态
3. 检查API地址是否正确

### 问题4: 响应格式错误
**原因**: API返回的数据格式与预期不符
**解决**: 打印API响应日志，检查数据结构

## 完整调试代码

如果需要更详细的调试，可以在chat.js中添加：

```javascript
// 完整的调试版sendMessage方法
async sendMessage(customText = null) {
  try {
    console.log('=== 开始发送消息 ===')
    console.log('1. 输入参数:', { customText, inputText: this.data.inputText })
    
    const text = customText || this.data.inputText.trim()
    console.log('2. 处理后的文本:', text)
    
    if (!text) {
      console.log('3. 文本为空，终止发送')
      utils.showToast('请输入消息内容')
      return
    }
    
    console.log('4. 开始API调用')
    const response = await apiService.sendMessage(text, this.getUserId(), this.data.sceneId)
    console.log('5. API响应:', response)
    
    if (response && response.response) {
      console.log('6. 响应格式正确，添加消息')
      // 添加消息逻辑...
    } else {
      console.log('6. 响应格式错误')
      this.handleApiError('响应格式错误')
    }
    
  } catch (error) {
    console.log('7. 发生错误:', error)
    this.handleApiError('发送失败: ' + error.message)
  }
  
  console.log('=== 消息发送完成 ===')
}
```

这样可以帮助快速定位问题所在。
