# /api/insert API 测试指南

## Firefox RESTed 测试配置

### 基本设置
- **URL**: `http://localhost:5001/api/insert`
- **Method**: `POST`
- **Headers**:
  ```
  Content-Type: application/json
  Accept: application/json
  ```

## 测试用例

### 1. 正常插入问题
**请求体**:
```json
{
  "question": "什么是Python编程语言？",
  "answer": "Python是一种高级编程语言，以其简洁的语法和强大的功能而闻名。",
  "userid": "user001",
  "status": "unreview"
}
```

**预期响应** (201):
```json
{
  "status": "success",
  "message": "问题插入成功",
  "data": {
    "id": 1,
    "question": "什么是Python编程语言？",
    "answer": "Python是一种高级编程语言，以其简洁的语法和强大的功能而闻名。",
    "userid": "user001",
    "status": "unreview"
  }
}
```

### 2. 管理员插入（自动审核）
**请求体**:
```json
{
  "question": "图书馆的开放时间是什么？",
  "answer": "图书馆周一至周日8:00-22:00开放。",
  "userid": "admin",
  "status": "reviewed"
}
```

**预期响应** (201):
```json
{
  "status": "success",
  "message": "问题插入成功",
  "data": {
    "id": 2,
    "question": "图书馆的开放时间是什么？",
    "answer": "图书馆周一至周日8:00-22:00开放。",
    "userid": "admin",
    "status": "reviewed"
  }
}
```

### 3. 重复问题检测
**请求体** (使用与测试1相同的问题):
```json
{
  "question": "什么是Python编程语言？",
  "answer": "这是一个重复的问题。",
  "userid": "user002",
  "status": "unreview"
}
```

**预期响应** (409):
```json
{
  "status": "error",
  "message": "问题已存在",
  "duplicate_id": 1,
  "existing_question": "什么是Python编程语言？"
}
```

### 4. 缺少必填字段
**请求体**:
```json
{
  "question": "这是一个不完整的问题",
  "userid": "user003"
}
```

**预期响应** (400):
```json
{
  "status": "error",
  "message": "缺少必填字段: answer"
}
```

### 5. 无效状态值
**请求体**:
```json
{
  "question": "测试无效状态",
  "answer": "这是测试答案",
  "userid": "user004",
  "status": "invalid_status"
}
```

**预期响应** (400):
```json
{
  "status": "error",
  "message": "无效的状态值。允许的状态: reviewed, unreview"
}
```

### 6. 空请求体
**请求体**: (空或null)

**预期响应** (400):
```json
{
  "status": "error",
  "message": "请求数据不能为空"
}
```

## 测试步骤

1. **启动后端服务**:
   ```bash
   # 运行批处理脚本
   test-insert-api.bat
   ```

2. **在Firefox中安装并打开RESTed扩展**

3. **配置请求**:
   - URL: `http://localhost:5001/api/insert`
   - Method: `POST`
   - Headers: `Content-Type: application/json`

4. **依次测试上述用例**，验证响应是否符合预期

## 验证方法

### 检查插入的数据
使用 `/api/questions` 端点查看所有插入的问题:
- **URL**: `http://localhost:5001/api/questions`
- **Method**: `GET`

### 搜索特定问题
使用 `/api/search` 端点搜索问题:
- **URL**: `http://localhost:5001/api/search?query=什么是Python编程语言？`
- **Method**: `GET`

## 常见问题

1. **连接错误**: 确保后端服务正在运行
2. **503错误**: 检查目标API服务器是否可访问
3. **JSON格式错误**: 确保请求体是有效的JSON格式
4. **CORS错误**: 如果从浏览器页面测试，可能需要处理CORS问题

## 日志查看

检查后端控制台输出以获取详细的调试信息，包括：
- 请求接收日志
- 查重检查结果
- API调用结果
- 错误详情
