# Firefox RESTed 测试 /api/insert API 完整指南

## 前置准备

### 1. 安装 Firefox RESTed 扩展
1. 打开 Firefox 浏览器
2. 访问 Firefox 附加组件商店: `about:addons`
3. 搜索 "RESTed" 或访问: https://addons.mozilla.org/en-US/firefox/addon/rested/
4. 点击 "添加到 Firefox" 安装
5. 安装完成后，在工具栏或附加组件菜单中找到 RESTed 图标

### 2. 启动后端服务
**方法1: 使用批处理脚本**
```bash
# 在项目根目录运行
start-backend.bat
```

**方法2: 手动启动**
```bash
cd f:\project\ichat\backend
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=
python app.py
```

服务启动后应该显示:
```
* Running on http://127.0.0.1:5001
* Debug mode: on
```

## Firefox RESTed 配置步骤

### 1. 打开 RESTed
- 点击 Firefox 工具栏中的 RESTed 图标
- 或者通过 Firefox 菜单 > 开发者工具 > RESTed

### 2. 基本设置
在 RESTed 界面中配置:

**URL 栏**:
```
http://localhost:5001/api/insert
```

**方法下拉菜单**:
```
POST
```

**Headers 标签页**:
添加以下请求头：
```
Header Name: Content-Type
Header Value: application/json

Header Name: Accept  
Header Value: application/json
```

## 测试用例详解

### 测试 1: 正常插入新问题

**配置**:
- URL: `http://localhost:5001/api/insert`
- Method: `POST`
- Headers: `Content-Type: application/json`

**Body (JSON)**:
```json
{
  "question": "什么是人工智能？",
  "answer": "人工智能(AI)是指由机器展现出的智能，与人类和动物的自然智能形成对比。",
  "userid": "test_user_001",
  "status": "unreview"
}
```

**操作步骤**:
1. 在 Body 标签页中选择 "JSON" 格式
2. 粘贴上述 JSON 数据
3. 点击 "Send" 发送请求
4. 查看响应

**预期结果** (HTTP 201):
```json
{
  "status": "success",
  "message": "问题插入成功",
  "data": {
    "id": 1,
    "question": "什么是人工智能？",
    "answer": "人工智能(AI)是指由机器展现出的智能，与人类和动物的自然智能形成对比。",
    "userid": "test_user_001",
    "status": "unreview"
  }
}
```

### 测试 2: 管理员插入（自动审核）

**Body (JSON)**:
```json
{
  "question": "学校图书馆的借阅规则是什么？",
  "answer": "学生可以借阅图书最多10本，借期30天，可续借一次。",
  "userid": "admin",
  "status": "reviewed"
}
```

**预期结果** (HTTP 201):
问题会被直接设置为已审核状态。

### 测试 3: 重复问题检测

**Body (JSON)** (使用与测试1相同的问题):
```json
{
  "question": "什么是人工智能？",
  "answer": "这是另一个关于AI的答案。",
  "userid": "test_user_002",
  "status": "unreview"
}
```

**预期结果** (HTTP 409):
```json
{
  "status": "error",
  "message": "问题已存在",
  "duplicate_id": 1,
  "existing_question": "什么是人工智能？"
}
```

### 测试 4: 缺少必填字段

**Body (JSON)**:
```json
{
  "question": "这是一个不完整的问题",
  "userid": "test_user_003"
}
```

**预期结果** (HTTP 400):
```json
{
  "status": "error",
  "message": "缺少必填字段: answer"
}
```

### 测试 5: 无效状态值

**Body (JSON)**:
```json
{
  "question": "测试问题",
  "answer": "测试答案",
  "userid": "test_user_004",
  "status": "invalid_status"
}
```

**预期结果** (HTTP 400):
```json
{
  "status": "error",
  "message": "无效的状态值。允许的状态: reviewed, unreview"
}
```

### 测试 6: 空请求体

**Body**: 留空或发送 `{}`

**预期结果** (HTTP 400):
```json
{
  "status": "error",
  "message": "请求数据不能为空"
}
```

## 验证插入的数据

### 方法1: 查看所有问题
在 RESTed 中发送新请求:
- URL: `http://localhost:5001/api/questions`
- Method: `GET`
- 不需要 Body

### 方法2: 搜索特定问题
在 RESTed 中发送新请求:
- URL: `http://localhost:5001/api/search?query=人工智能`
- Method: `GET`
- 不需要 Body

## RESTed 操作提示

### 保存请求
1. 配置好请求后，点击 "Save" 按钮
2. 给请求命名，如 "Insert Question Test"
3. 下次可以直接从保存的请求列表中选择

### 查看历史
1. 点击 "History" 标签查看所有发送过的请求
2. 可以重新发送之前的请求

### 响应分析
1. **Status**: 查看 HTTP 状态码
2. **Headers**: 查看响应头信息
3. **Body**: 查看响应内容
4. **Time**: 查看请求耗时

## 故障排除

### 常见错误及解决方案

**1. 连接被拒绝 (Connection Refused)**
- 检查后端服务是否启动
- 确认端口 5001 是否被占用
- 重启后端服务

**2. JSON 解析错误**
- 检查请求体 JSON 格式是否正确
- 确保使用正确的引号 (双引号)
- 检查是否有多余的逗号

**3. CORS 错误**
- 这通常不会在 RESTed 中出现
- 如果出现，检查后端 CORS 配置

**4. 503 服务不可用**
- 检查目标 API 服务器 (10.10.15.210:5000) 是否可访问
- 确认网络连接正常

### 调试技巧

**1. 查看后端日志**
在运行 `start-backend.bat` 的命令行窗口中查看实时日志输出。

**2. 使用网络工具**
按 F12 打开 Firefox 开发者工具，查看网络标签页中的请求详情。

**3. 测试连接**
先发送简单的 GET 请求到 `http://localhost:5001/api/questions` 确认服务可用。

## 测试流程建议

1. **启动服务**: 运行 `start-backend.bat`
2. **基础测试**: 先测试正常插入功能
3. **边界测试**: 测试各种错误情况
4. **重复测试**: 验证查重功能
5. **数据验证**: 使用 GET 请求验证数据是否正确插入

## 完整测试记录模板

```
测试日期: ___________
测试人员: ___________

| 测试用例 | 状态码 | 响应时间 | 结果 | 备注 |
|---------|--------|----------|------|------|
| 正常插入 |        |          |      |      |
| 管理员插入 |      |          |      |      |
| 重复检测 |        |          |      |      |
| 缺少字段 |        |          |      |      |
| 无效状态 |        |          |      |      |
| 空请求体 |        |          |      |      |

总结:
- 成功测试: _____ 个
- 失败测试: _____ 个
- 需要修复的问题: ____________
```

测试完成后，请记录所有结果并报告任何发现的问题。
