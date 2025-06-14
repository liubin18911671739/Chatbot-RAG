# Chat.py 备用API实现说明

## 📋 功能概述

已成功实现 `chat.py` 的备用API功能，当主API `http://10.10.15.210:5000/api/chat` 无响应时，自动调用 `call_gemini_api` 作为备用方案。

## 🔧 实现逻辑

### 1. **主API优先策略**
```python
# 首先尝试主API
try:
    response = requests.post(
        "http://10.10.15.210:5000/api/chat",
        json={"prompt": prompt, "scene_id": scene_id},
        headers={"Content-Type": "application/json"},
        timeout=40
    )
    
    if response.status_code == 200:
        return jsonify(response.json())  # 主API成功，直接返回
    else:
        raise Exception(f"主API调用失败，状态码: {response.status_code}")
```

### 2. **备用API故障转移**
```python
# 主API失败时自动调用备用API
except Exception as e:
    print("主API失败，调用备用API (Gemini/DeepSeek)...")
    api_response = call_gemini_api(prompt, scene_id)
    
    return jsonify({
        "status": "success",
        "response": api_response,
        "attachment_data": [],
        "special_note": "响应来自备用API服务"  # 标识备用API
    })
```

## 📊 处理流程

```
用户请求 → chat.py
    ↓
1. 验证输入数据
    ↓
2. 尝试主API (http://10.10.15.210:5000/api/chat)
    ↓
3a. 主API成功 → 返回主API响应
    ↓
3b. 主API失败 → 调用 call_gemini_api()
    ↓
4. 返回备用API响应 (包含特殊标识)
```

## 🔍 错误处理机制

### 1. **主API错误类型**
- **连接错误**: `requests.exceptions.RequestException`
- **HTTP错误**: 非200状态码
- **超时错误**: 40秒超时限制
- **其他异常**: 通用Exception捕获

### 2. **备用API错误处理**
```python
try:
    api_response = call_gemini_api(prompt, scene_id)
    # 成功返回
except Exception as e:
    # 所有API都失败时返回错误
    return jsonify({
        "status": "error", 
        "message": "所有API调用均失败，请稍后再试",
        "error_detail": str(e)
    }), 500
```

## 📝 响应格式

### 主API成功响应
```json
{
    "status": "success",
    "response": "主API的回答内容",
    "attachment_data": [],
    // 其他主API字段...
}
```

### 备用API响应
```json
{
    "status": "success",
    "response": "备用API的回答内容",
    "attachment_data": [],
    "special_note": "响应来自备用API服务"
}
```

### 全部失败响应
```json
{
    "status": "error",
    "message": "所有API调用均失败，请稍后再试",
    "error_detail": "具体错误信息"
}
```

## 🧪 测试方法

### 1. **使用测试脚本**
```bash
# 运行备用API功能测试
python test_chat_api_failover.py
```

### 2. **手动测试**
```bash
# 测试正常情况
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"你好","scene_id":"general"}'

# 测试备用API（需要主API不可用）
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"测试备用API","scene_id":"general"}'
```

### 3. **测试场景**
- ✅ 主API正常工作
- ✅ 主API连接失败
- ✅ 主API超时
- ✅ 主API返回错误状态码
- ✅ 备用API正常工作
- ✅ 所有API都失败

## 🔧 配置说明

### 1. **主API配置**
```python
# 在 chat() 函数中修改主API地址
"http://10.10.15.210:5000/api/chat"
```

### 2. **超时配置**
```python
timeout=40  # 40秒超时
```

### 3. **备用API配置**
备用API使用 `call_gemini_api()` 函数，支持：
- DeepSeek API（当前启用）
- Gemini API（注释状态，可按需启用）

## 📈 性能特点

### 1. **响应时间**
- **主API可用**: 快速响应（主API响应时间）
- **主API不可用**: 较慢响应（超时时间 + 备用API响应时间）

### 2. **可靠性**
- **双重保障**: 主API + 备用API
- **自动故障转移**: 无需人工干预
- **详细日志**: 便于问题排查

### 3. **资源使用**
- **成本优化**: 优先使用主API，备用API仅在必要时调用
- **请求限制**: 备用API通常有更严格的调用限制

## 🚨 注意事项

### 1. **API密钥安全**
- DeepSeek API密钥已在代码中配置
- 建议在生产环境中使用环境变量

### 2. **请求限制**
- 备用API可能有调用频率限制
- 需要监控API使用量

### 3. **响应差异**
- 主API和备用API的响应内容可能不同
- 通过 `special_note` 字段可以识别响应来源

### 4. **错误监控**
- 建议添加监控来跟踪主API的可用性
- 记录备用API的使用频率

## 🔄 故障排除

### 1. **主API始终失败**
- 检查主API服务是否运行
- 验证网络连接
- 检查防火墙设置

### 2. **备用API失败**
- 检查API密钥是否有效
- 验证网络连接到外部服务
- 检查API调用限制

### 3. **响应格式错误**
- 检查主API返回格式
- 验证备用API响应处理逻辑

## 📊 监控建议

### 1. **主API可用性监控**
```python
# 记录主API成功/失败次数
main_api_success_count = 0
main_api_failure_count = 0
backup_api_usage_count = 0
```

### 2. **响应时间监控**
```python
# 记录响应时间分布
response_times = []
```

### 3. **错误日志分析**
- 定期分析错误日志
- 识别主API故障模式
- 优化备用API调用策略

---

**✅ 实现完成**：`chat.py` 现在具有完善的备用API功能，确保在主API不可用时能够自动切换到备用服务，提供持续可用的聊天功能。
