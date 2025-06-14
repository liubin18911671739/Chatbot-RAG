# Firefox RESTed 测试检查清单

## 准备工作 ✓
- [ ] 安装 Firefox RESTed 扩展
- [ ] 运行 `test-insert-api-with-rested.bat` 启动后端服务
- [ ] 确认服务在 http://localhost:5001 运行正常

## RESTed 基本设置 ✓
- [ ] URL: `http://localhost:5001/api/insert`
- [ ] Method: `POST`
- [ ] Headers: `Content-Type: application/json`

## 测试用例执行

### 1. 正常插入测试 ✓
**请求体**:
```json
{
  "question": "什么是人工智能？",
  "answer": "人工智能(AI)是指由机器展现出的智能，与人类和动物的自然智能形成对比。",
  "userid": "test_user_001",
  "status": "unreview"
}
```
- [ ] 状态码: 201
- [ ] 响应包含成功消息
- [ ] 返回问题ID

### 2. 管理员插入测试 ✓
**请求体**:
```json
{
  "question": "学校图书馆的借阅规则是什么？",
  "answer": "学生可以借阅图书最多10本，借期30天，可续借一次。",
  "userid": "admin",
  "status": "reviewed"
}
```
- [ ] 状态码: 201
- [ ] 状态自动设为 reviewed

### 3. 重复问题检测 ✓
**请求体** (重复第1个问题):
```json
{
  "question": "什么是人工智能？",
  "answer": "这是另一个关于AI的答案。",
  "userid": "test_user_002",
  "status": "unreview"
}
```
- [ ] 状态码: 409
- [ ] 返回重复错误信息
- [ ] 包含原问题ID

### 4. 缺少字段测试 ✓
**请求体**:
```json
{
  "question": "这是一个不完整的问题",
  "userid": "test_user_003"
}
```
- [ ] 状态码: 400
- [ ] 错误信息: "缺少必填字段: answer"

### 5. 无效状态测试 ✓
**请求体**:
```json
{
  "question": "测试问题",
  "answer": "测试答案", 
  "userid": "test_user_004",
  "status": "invalid_status"
}
```
- [ ] 状态码: 400
- [ ] 错误信息包含有效状态列表

### 6. 空请求体测试 ✓
**请求体**: `{}`
- [ ] 状态码: 400
- [ ] 错误信息: "请求数据不能为空"

## 数据验证

### 检查插入的数据 ✓
**GET** `http://localhost:5001/api/questions`
- [ ] 能看到插入的问题
- [ ] 数据格式正确

### 搜索功能验证 ✓
**GET** `http://localhost:5001/api/search?query=人工智能`
- [ ] 能找到相关问题
- [ ] 返回问题ID

## 测试结果记录

| 测试项目 | 预期状态码 | 实际状态码 | 通过 | 备注 |
|---------|-----------|-----------|------|------|
| 正常插入 | 201 | | [ ] | |
| 管理员插入 | 201 | | [ ] | |
| 重复检测 | 409 | | [ ] | |
| 缺少字段 | 400 | | [ ] | |
| 无效状态 | 400 | | [ ] | |
| 空请求体 | 400 | | [ ] | |
| 数据查询 | 200 | | [ ] | |
| 搜索功能 | 200 | | [ ] | |

## 常见问题解决

**连接失败**:
- 检查后端服务是否启动
- 确认端口5001未被占用

**JSON格式错误**:
- 使用双引号，不是单引号
- 检查逗号和括号匹配

**CORS错误**:
- RESTed通常不会有此问题
- 如有问题，重启浏览器和扩展

**503错误**:
- 目标API服务器(10.10.15.210:5000)不可访问
- 检查网络连接

---

## 快速复制粘贴区域

### Headers
```
Content-Type: application/json
Accept: application/json
```

### 测试1 - 正常插入
```json
{
  "question": "什么是人工智能？",
  "answer": "人工智能(AI)是指由机器展现出的智能，与人类和动物的自然智能形成对比。",
  "userid": "test_user_001",
  "status": "unreview"
}
```

### 测试2 - 管理员插入
```json
{
  "question": "学校图书馆的借阅规则是什么？",
  "answer": "学生可以借阅图书最多10本，借期30天，可续借一次。",
  "userid": "admin",
  "status": "reviewed"
}
```

### 测试3 - 重复检测
```json
{
  "question": "什么是人工智能？",
  "answer": "这是另一个关于AI的答案。",
  "userid": "test_user_002",
  "status": "unreview"
}
```

测试完成日期: ____________
测试人员: ____________
总体结果: ____________
