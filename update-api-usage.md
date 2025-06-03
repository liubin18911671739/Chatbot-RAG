# 更新API使用说明

## API端点
`PUT /api/update/{id}`

## 功能描述
更新指定ID问题的答案内容和状态。该API支持部分更新，只需要提供需要更新的字段。

## 请求格式

### URL参数
- `id` (必需): 问题的唯一标识符

### 请求体 (JSON)
```json
{
  "question": "什么是Python?",        // 可选，问题内容
  "answer": "python是一种编程语言",    // 可选，答案内容  
  "userid": "user6",                 // 可选，用户ID
  "status": "reviewed"               // 可选，审核状态 (reviewed/unreview)
}
```

### 字段说明
- `question`: 问题内容（可选，字符串）
- `answer`: 答案内容（可选，字符串）
- `userid`: 用户ID（可选，字符串）
- `status`: 审核状态（可选，只接受 "reviewed" 或 "unreview"）

## 响应格式

### 成功响应 (200)
```json
{
  "status": "success",
  "message": "问题更新成功",
  "data": {
    "id": 1,
    "question": "什么是Python?",
    "answer": "python是一种编程语言",
    "userid": "user6",
    "status": "reviewed"
  }
}
```

### 错误响应

#### 400 Bad Request - 请求数据无效
```json
{
  "status": "error",
  "message": "请求数据不能为空"
}
```

#### 400 Bad Request - 无效状态值
```json
{
  "status": "error",
  "message": "无效的状态值。允许的状态: reviewed, unreview"
}
```

#### 404 Not Found - 问题不存在
```json
{
  "status": "error",
  "message": "问题不存在"
}
```

#### 503 Service Unavailable - 服务器连接失败
```json
{
  "status": "error",
  "message": "无法连接到目标API服务器"
}
```

## 使用示例

### Python 示例
```python
import requests

BASE_URL = "http://localhost:5000"

# 1. 完整更新
response = requests.put(f"{BASE_URL}/api/update/1", json={
    "question": "什么是Python?",
    "answer": "python是一种编程语言",
    "userid": "user6",
    "status": "reviewed"
})

if response.status_code == 200:
    result = response.json()
    print("更新成功:", result)
else:
    print("更新失败:", response.text)

# 2. 部分更新 - 只更新状态
response = requests.put(f"{BASE_URL}/api/update/1", json={
    "status": "reviewed"
})

# 3. 部分更新 - 只更新答案
response = requests.put(f"{BASE_URL}/api/update/1", json={
    "answer": "Python是一种高级编程语言，广泛用于数据科学、Web开发等领域"
})
```

### JavaScript 示例
```javascript
const BASE_URL = "http://localhost:5000";

// 完整更新
async function updateQuestion(id, data) {
    try {
        const response = await fetch(`${BASE_URL}/api/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('更新成功:', result);
            return result;
        } else {
            console.error('更新失败:', response.status);
            return null;
        }
    } catch (error) {
        console.error('请求错误:', error);
        return null;
    }
}

// 使用示例
updateQuestion(1, {
    "question": "什么是Python?",
    "answer": "python是一种编程语言",
    "userid": "user6",
    "status": "reviewed"
});

// 只更新状态
updateQuestion(1, {
    "status": "reviewed"
});
```

### cURL 示例
```bash
# 完整更新
curl -X PUT http://localhost:5000/api/update/1 \
  -H "Content-Type: application/json" \
  -d '{
    "question": "什么是Python?",
    "answer": "python是一种编程语言",
    "userid": "user6",
    "status": "reviewed"
  }'

# 部分更新 - 只更新状态
curl -X PUT http://localhost:5000/api/update/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "reviewed"}'
```

## 注意事项

1. **部分更新支持**: API支持部分更新，只需提供需要更新的字段
2. **状态值验证**: `status` 字段只接受 "reviewed" 或 "unreview"
3. **空值处理**: 空字符串或空值的字段会被忽略
4. **错误处理**: 请务必检查响应状态码和错误信息
5. **超时设置**: API请求有30秒超时限制
6. **代理转发**: 该API会将请求转发到后端服务器 (http://10.10.15.210:5001)

## 测试方法

运行提供的测试脚本:
```bash
python test-update-api.py
```

该脚本会测试:
- 完整更新功能
- 部分更新功能  
- 各种错误情况
- 数据验证
