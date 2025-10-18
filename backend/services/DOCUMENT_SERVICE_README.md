# 文档处理服务使用指南

## 概述

`DocumentService` 是 iChat RAG-QA 系统的文档处理模块，提供完整的文档处理管线：

**文档解析** → **文本分片** → **向量化** → **存储**

## 功能特性

### ✅ 支持的文件格式
- **PDF** (.pdf) - 使用 PyPDF2
- **Word文档** (.docx, .doc) - 使用 python-docx
- **纯文本** (.txt, .text)
- **Markdown** (.md, .markdown)

### ✅ 文本分片策略
- **递归分片**（推荐）：保持语义完整性，智能分隔符
- **简单分片**：基于换行符的简单分割

### ✅ 元数据管理
- 文件信息（文件名、路径、类型）
- 文档属性（标题、作者、主题）
- 分片信息（分片索引、大小、总数）
- 页码信息（PDF 支持）

## 快速开始

### 1. 基础使用（文档解析和分片）

```python
from services.document_service import DocumentService

# 创建服务实例
doc_service = DocumentService(
    chunk_size=500,      # 分片大小（字符数）
    chunk_overlap=50     # 分片重叠大小
)

# 解析文档
result = doc_service.parse_document('path/to/document.pdf')
print(f"文本长度: {len(result['text'])}")
print(f"元数据: {result['metadata']}")

# 文本分片
chunks = doc_service.chunk_text(
    text=result['text'],
    metadata=result['metadata'],
    strategy="recursive"  # 或 "simple"
)

print(f"分片数量: {len(chunks)}")
for i, chunk in enumerate(chunks):
    print(f"分片 {i}: {len(chunk['text'])} 字符")
```

### 2. 完整的文档入库流程

```python
from services.document_service import DocumentService
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService

# 初始化所有服务
embedding_service = EmbeddingService()
vector_service = VectorService(dimension=384)

doc_service = DocumentService(
    embedding_service=embedding_service,
    vector_service=vector_service,
    chunk_size=500,
    chunk_overlap=50
)

# 一键入库文档
result = doc_service.ingest_document(
    file_path='path/to/document.pdf',
    document_id='doc-123',
    additional_metadata={
        'category': '校园指南',
        'uploaded_by': 'admin'
    }
)

if result['status'] == 'success':
    print(f"✓ 入库成功")
    print(f"  文档ID: {result['document_id']}")
    print(f"  分片数: {result['chunks_count']}")
    print(f"  向量数: {result['vectors_count']}")
```

### 3. 批量处理文档

```python
# 准备文档列表
file_paths = [
    'docs/guide1.pdf',
    'docs/guide2.docx',
    'docs/guide3.txt'
]

# 定义进度回调
def show_progress(current, total, file_path):
    print(f"处理中: {current}/{total} - {file_path}")

# 批量处理
results = doc_service.batch_ingest_documents(
    file_paths=file_paths,
    progress_callback=show_progress
)

# 查看结果
for result in results:
    status = "✓" if result['status'] == 'success' else "✗"
    print(f"{status} {result['file_path']}")
```

## API 参考

### DocumentService 类

#### 初始化参数

```python
DocumentService(
    embedding_service: Optional[EmbeddingService] = None,
    vector_service: Optional[VectorService] = None,
    chunk_size: int = 500,
    chunk_overlap: int = 50
)
```

- `embedding_service`: Embedding 服务实例（可选）
- `vector_service`: 向量存储服务实例（可选）
- `chunk_size`: 分片大小（字符数），默认 500
- `chunk_overlap`: 分片重叠大小，默认 50

#### 主要方法

##### parse_document()

解析文档，提取文本和元数据。

```python
result = doc_service.parse_document(file_path: str) -> Dict[str, Any]
```

**返回值**:
```python
{
    'text': str,        # 提取的文本
    'metadata': dict,   # 元数据
    'pages': list       # 页面信息（PDF）
}
```

##### chunk_text()

将文本分片。

```python
chunks = doc_service.chunk_text(
    text: str,
    metadata: Optional[Dict[str, Any]] = None,
    strategy: str = "recursive"  # "recursive" 或 "simple"
) -> List[Dict[str, Any]]
```

**返回值**:
```python
[
    {
        'text': str,
        'metadata': dict,
        'chunk_index': int
    },
    ...
]
```

##### ingest_document()

完整的文档入库流程。

```python
result = doc_service.ingest_document(
    file_path: str,
    document_id: Optional[str] = None,
    additional_metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]
```

**返回值**:
```python
{
    'document_id': str,
    'file_path': str,
    'status': str,           # 'success', 'partial', 'failed'
    'chunks_count': int,
    'vectors_count': int,
    'vector_ids': list,
    'metadata': dict,
    'error': str             # 仅在失败时存在
}
```

##### batch_ingest_documents()

批量处理文档。

```python
results = doc_service.batch_ingest_documents(
    file_paths: List[str],
    progress_callback: Optional[callable] = None
) -> List[Dict[str, Any]]
```

##### get_supported_extensions()

获取支持的文件扩展名列表。

```python
extensions = doc_service.get_supported_extensions()
# 返回: ['.pdf', '.docx', '.doc', '.txt', '.text', '.md', '.markdown']
```

## 文档解析器

### 自定义解析器

可以通过继承 `DocumentParser` 抽象类来实现自定义解析器：

```python
from services.document_service import DocumentParser

class CustomParser(DocumentParser):
    def supports(self, file_extension: str) -> bool:
        return file_extension.lower() == '.custom'
    
    def parse(self, file_path: str) -> Dict[str, Any]:
        # 实现解析逻辑
        with open(file_path, 'r') as f:
            text = f.read()
        
        return {
            'text': text,
            'metadata': {
                'file_path': file_path,
                'file_type': 'custom'
            }
        }

# 注册解析器
doc_service.parsers.append(CustomParser())
```

## 文本分片策略

### 递归分片（推荐）

使用多级分隔符，保持语义完整性：

```python
分隔符优先级:
1. 双换行 (\n\n) - 段落分隔
2. 单换行 (\n) - 行分隔
3. 中文句号 (。！？) - 句子分隔
4. 英文句号 (. ! ?) - 句子分隔
5. 中文逗号 (；，) - 短语分隔
6. 英文逗号 (; ,) - 短语分隔
7. 空格 ( ) - 词语分隔
8. 字符 ("") - 强制分隔
```

### 简单分片

基于换行符的简单分割，适合结构化文本：

```python
chunks = doc_service.chunk_text(text, strategy="simple")
```

## 配置建议

### 分片大小选择

| 场景 | chunk_size | chunk_overlap | 说明 |
|------|-----------|---------------|------|
| 短文本 | 200-300 | 20-30 | 问答、对话 |
| 中等文本 | 500-800 | 50-80 | 文章、报告 |
| 长文本 | 1000-1500 | 100-150 | 书籍、论文 |

### 性能优化

```python
# 大文件处理建议
doc_service = DocumentService(
    chunk_size=800,        # 适中的分片大小
    chunk_overlap=80       # 10% 的重叠
)

# 批量处理时使用进度回调
def progress(current, total, file_path):
    percentage = (current / total) * 100
    print(f"进度: {percentage:.1f}% ({current}/{total})")

results = doc_service.batch_ingest_documents(
    file_paths=file_list,
    progress_callback=progress
)
```

## 错误处理

```python
from services.document_service import DocumentService

doc_service = DocumentService()

try:
    result = doc_service.ingest_document('document.pdf')
    
    if result['status'] == 'success':
        print("✓ 处理成功")
    elif result['status'] == 'partial':
        print("⚠ 部分完成（可能缺少服务）")
    else:
        print(f"✗ 处理失败: {result.get('error')}")

except FileNotFoundError as e:
    print(f"文件不存在: {e}")

except ValueError as e:
    print(f"文件格式不支持: {e}")

except Exception as e:
    print(f"未知错误: {e}")
```

## 元数据示例

### PDF 文档元数据

```python
{
    'file_path': '/path/to/document.pdf',
    'file_name': 'document.pdf',
    'file_type': 'pdf',
    'pages': 10,
    'title': '文档标题',
    'author': '作者名',
    'subject': '主题',
    'parsed_at': '2025-10-18T12:00:00',
    'chunk_index': 0,
    'chunk_size': 450,
    'total_chunks': 5
}
```

### 文本文档元数据

```python
{
    'file_path': '/path/to/document.txt',
    'file_name': 'document.txt',
    'file_type': 'txt',
    'encoding': 'utf-8',
    'lines': 100,
    'parsed_at': '2025-10-18T12:00:00',
    'chunk_index': 0,
    'chunk_size': 520,
    'total_chunks': 3
}
```

## 测试

### 单元测试

```bash
cd backend
python3 -m pytest tests/test_document_service.py -v
```

### 集成测试

```bash
cd backend
python3 test_document_integration.py
```

## 常见问题

### Q: PDF 解析失败

**A**: 检查 PDF 是否为扫描版（图片 PDF）。扫描版 PDF 需要 OCR 支持。

### Q: 中文编码问题

**A**: TXT 解析器会自动尝试多种编码（utf-8, gbk, gb2312, latin-1）。

### Q: 分片数量异常

**A**: 检查 `chunk_size` 设置。短文本可能只产生一个分片。

### Q: 内存占用大

**A**: 
- 减小 `chunk_size`
- 使用批量处理时控制并发数
- 考虑流式处理大文件

## 性能指标

| 操作 | 性能 |
|------|------|
| TXT 解析 | ~1ms (10KB文件) |
| PDF 解析 | ~50ms (10页) |
| DOCX 解析 | ~20ms (10页) |
| 文本分片 | ~5ms (1000字符) |
| 完整入库 | ~100ms (不含向量化) |

## 下一步

- 集成到文档管理 API (`routes/documents.py`)
- 添加更多文件格式支持（HTML, RTF 等）
- 实现 OCR 支持（扫描版 PDF）
- 添加文档预处理（去除噪声）
- 实现增量更新机制

---

**最后更新**: 2025-10-18  
**版本**: 1.0.0
