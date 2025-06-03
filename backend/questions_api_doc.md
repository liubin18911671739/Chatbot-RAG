# 问题管理API文档

## 概述

本文档描述了问题管理系统的RESTful API接口，提供问题列表的查询、筛选、搜索和统计功能。

## 基础信息

- **基础URL**: `http://localhost:5000/api`
- **内容类型**: `application/json`
- **字符编码**: `UTF-8`

## 数据模型

### 问题对象 (Question)

```json
{
  "id": 1555,
  "question": "什么是Python?",
  "answer": "python是一种编程语言",
  "userid": "test",
  "status": "unreviewed"
}
```

**字段说明:**
- `id` (integer): 问题唯一标识符
- `question` (string): 问题内容
- `answer` (string): 答案内容
- `userid` (string): 提交用户ID
- `status` (string): 审核状态，可选值：`reviewed`（已审核）、`unreviewed`（未审核）

## API 端点

### 1. 获取问题列表

**请求:**
```
GET /api/questions
```

**查询参数:**
- `page` (int, 可选): 页码，默认为1
- `per_page` (int, 可选): 每页数量，默认为10，最大100
- `status` (string, 可选): 状态筛选，可选值：`reviewed`、`unreviewed`、`all`，默认为`all`
- `userid` (string, 可选): 用户ID筛选
- `search` (string, 可选): 搜索关键词，在问题和答案中搜索
- `sort` (string, 可选): 排序方式，可选值：`id_asc`、`id_desc`，默认为`id_desc`

**示例请求:**
```bash
# 获取第一页的10个问题
curl "http://localhost:5001/api/questions"

# 获取已审核的问题，每页5个
curl "http://localhost:5001/api/questions?status=reviewed&per_page=5"

# 搜索包含"Python"的问题
curl "http://localhost:5001/api/questions?search=Python"

# 获取特定用户的问题
curl "http://localhost:5001/api/questions?userid=test"
```

**响应示例:**
```json
{
  "status": "success",
  "qas": [
    {
      "id": 1555,
      "question": "什么是Python?",
      "answer": "python是一种编程语言",
      "userid": "test",
      "status": "unreviewed"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_count": 5,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  },
  "filters": {
    "status": "all",
    "userid": "",
    "search": "",
    "sort": "id_desc"
  }
}
```

### 2. 根据ID获取单个问题

**请求:**
```
GET /api/questions/{question_id}
```

**路径参数:**
- `question_id` (int): 问题ID

**示例请求:**
```bash
curl "http://localhost:5001/api/questions/1555"
```

**响应示例:**
```json
{
  "status": "success",
  "qa": {
    "id": 1555,
    "question": "什么是Python?",
    "answer": "python是一种编程语言",
    "userid": "test",
    "status": "unreviewed"
  }
}
```

**错误响应 (404):**
```json
{
  "status": "error",
  "message": "未找到ID为1555的问题"
}
```

### 3. 获取问题统计信息

**请求:**
```
GET /api/questions/stats
```

**示例请求:**
```bash
curl "http://localhost:5001/api/questions/stats"
```

**响应示例:**
```json
{
  "status": "success",
  "stats": {
    "total_questions": 5,
    "reviewed_questions": 3,
    "unreviewed_questions": 2,
    "review_rate": 60.0,
    "user_stats": {
      "test": {
        "total": 1,
        "reviewed": 0,
        "unreviewed": 1
      },
      "ding": {
        "total": 1,
        "reviewed": 1,
        "unreviewed": 0
      }
    }
  }
}
```

### 4. 高级搜索

**请求:**
```
POST /api/questions/search
```

**请求体:**
```json
{
  "keywords": ["关键词1", "关键词2"],
  "status": "reviewed",
  "userid": "user1"
}
```

**请求体参数:**
- `keywords` (array, 可选): 关键词列表
- `status` (string, 可选): 状态筛选
- `userid` (string, 可选): 用户ID筛选

**示例请求:**
```bash
curl -X POST "http://localhost:5001/api/questions/search" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["Python", "编程"],
    "status": "unreviewed"
  }'
```

**响应示例:**
```json
{
  "status": "success",
  "qas": [
    {
      "id": 1555,
      "question": "什么是Python?",
      "answer": "python是一种编程语言",
      "userid": "test",
      "status": "unreviewed"
    }
  ],
  "search_criteria": {
    "keywords": ["Python", "编程"],
    "status": "unreviewed",
    "userid": ""
  },
  "result_count": 1
}
```

## 错误处理

### 错误响应格式

```json
{
  "status": "error",
  "message": "错误描述信息"
}
```

### 常见错误代码

- **400 Bad Request**: 请求参数错误
  - 页码小于1
  - 每页数量小于1
  - 无效的状态值
  - 无效的排序方式

- **404 Not Found**: 资源不存在
  - 指定ID的问题不存在
  - 页码超出范围

- **500 Internal Server Error**: 服务器内部错误

## 使用示例

### Python 示例

```python
import requests

# 获取问题列表
response = requests.get('http://localhost:5001/api/questions')
data = response.json()

if data['status'] == 'success':
    questions = data['qas']
    for q in questions:
        print(f"问题: {q['question']}")
        print(f"答案: {q['answer']}")
        print(f"状态: {q['status']}")
        print("-" * 40)

# 搜索问题
search_data = {
    "keywords": ["Python"],
    "status": "unreviewed"
}
response = requests.post(
    'http://localhost:5001/api/questions/search',
    json=search_data
)
```

### JavaScript 示例

```javascript
// 获取问题列表
fetch('http://localhost:5001/api/questions')
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      console.log('问题列表:', data.qas);
      console.log('分页信息:', data.pagination);
    }
  });

// 高级搜索
fetch('http://localhost:5001/api/questions/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    keywords: ['Python'],
    status: 'unreviewed'
  })
})
.then(response => response.json())
.then(data => console.log('搜索结果:', data));
```

### curl 示例

```bash
# 基本查询
curl "http://localhost:5001/api/questions"

# 分页查询
curl "http://localhost:5001/api/questions?page=2&per_page=5"

# 状态筛选
curl "http://localhost:5001/api/questions?status=reviewed"

# 用户筛选
curl "http://localhost:5001/api/questions?userid=test"

# 关键词搜索
curl "http://localhost:5001/api/questions?search=Python"

# 组合筛选
curl "http://localhost:5001/api/questions?status=reviewed&search=编程&sort=id_asc"

# 获取单个问题
curl "http://localhost:5001/api/questions/1555"

# 获取统计信息
curl "http://localhost:5001/api/questions/stats"

# 高级搜索
curl -X POST "http://localhost:5001/api/questions/search" \
  -H "Content-Type: application/json" \
  -d '{"keywords": ["Python", "编程"], "status": "unreviewed"}'
```

## 性能说明

- 分页查询支持最大每页100条记录
- 搜索功能在问题和答案字段中进行不区分大小写的匹配
- 排序当前支持按ID升序和降序
- 统计信息实时计算，适合小到中等规模的数据集

## 注意事项

1. 所有文本搜索都是不区分大小写的
2. 分页从第1页开始计数
3. 搜索关键词会在问题和答案中同时匹配
4. 状态筛选区分大小写，必须使用准确的值：`reviewed` 或 `unreviewed`
5. 当前使用内存模拟数据库，服务重启后数据会重置

## 版本信息

- API版本: 1.0
- 最后更新: 2025-06-03
- 兼容性: Python 3.7+, Flask 2.0+
