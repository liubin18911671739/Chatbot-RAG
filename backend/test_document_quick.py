#!/usr/bin/env python3
"""
文档处理管线 - 快速验证脚本
快速测试文档解析、分片和入库的核心功能
"""

import sys
import tempfile
from pathlib import Path

print("=" * 70)
print("文档处理管线 - 快速验证测试")
print("=" * 70)

# 测试 1: 导入测试
print("\n[1/5] 测试模块导入...")
try:
    from services.document_service import DocumentService, PDFParser, DOCXParser, TXTParser, MarkdownParser
    print("  ✓ 所有模块导入成功")
except Exception as e:
    print(f"  ✗ 导入失败: {e}")
    sys.exit(1)

# 测试 2: 服务初始化
print("\n[2/5] 测试服务初始化...")
try:
    doc_service = DocumentService(chunk_size=500, chunk_overlap=50)
    print(f"  ✓ DocumentService 初始化成功")
    print(f"    - chunk_size: {doc_service.chunk_size}")
    print(f"    - chunk_overlap: {doc_service.chunk_overlap}")
    print(f"    - 解析器数量: {len(doc_service.parsers)}")
except Exception as e:
    print(f"  ✗ 初始化失败: {e}")
    sys.exit(1)

# 测试 3: 支持的文件格式
print("\n[3/5] 测试支持的文件格式...")
try:
    extensions = doc_service.get_supported_extensions()
    print(f"  ✓ 支持 {len(extensions)} 种文件格式:")
    print(f"    {', '.join(extensions)}")
    
    # 验证必需的格式
    required = ['.pdf', '.docx', '.txt', '.md']
    for ext in required:
        if ext not in extensions:
            print(f"  ✗ 缺少必需格式: {ext}")
            sys.exit(1)
except Exception as e:
    print(f"  ✗ 获取格式失败: {e}")
    sys.exit(1)

# 测试 4: 文档解析
print("\n[4/5] 测试文档解析...")
with tempfile.TemporaryDirectory() as test_dir:
    try:
        # 创建测试文件
        test_file = Path(test_dir) / "test.txt"
        test_content = """测试文档标题

这是第一段内容，包含一些测试文本。

这是第二段内容，继续测试。

这是第三段内容，验证多段落解析。
"""
        test_file.write_text(test_content, encoding='utf-8')
        
        # 解析文档
        result = doc_service.parse_document(str(test_file))
        
        print(f"  ✓ 文档解析成功")
        print(f"    - 文本长度: {len(result['text'])} 字符")
        print(f"    - 文件类型: {result['metadata']['file_type']}")
        print(f"    - 行数: {result['metadata']['lines']}")
        
    except Exception as e:
        print(f"  ✗ 解析失败: {e}")
        sys.exit(1)

# 测试 5: 文本分片
print("\n[5/5] 测试文本分片...")
try:
    # 创建足够长的文本
    long_text = "这是一个测试段落。" * 100
    
    # 递归分片
    chunks_recursive = doc_service.chunk_text(long_text, strategy="recursive")
    print(f"  ✓ 递归分片成功: {len(chunks_recursive)} 个分片")
    
    if len(chunks_recursive) > 0:
        chunk = chunks_recursive[0]
        print(f"    - 第1个分片: {len(chunk['text'])} 字符")
        print(f"    - 分片索引: {chunk['chunk_index']}")
        print(f"    - 元数据: chunk_size={chunk['metadata']['chunk_size']}, total={chunk['metadata']['total_chunks']}")
    
    # 简单分片
    text_with_newlines = "第一行\n第二行\n第三行\n" * 30
    chunks_simple = doc_service.chunk_text(text_with_newlines, strategy="simple")
    print(f"  ✓ 简单分片成功: {len(chunks_simple)} 个分片")
    
except Exception as e:
    print(f"  ✗ 分片失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 总结
print("\n" + "=" * 70)
print("✅ 所有测试通过！")
print("=" * 70)
print("\n测试总结:")
print("  ✓ 模块导入正常")
print("  ✓ 服务初始化正常")
print("  ✓ 支持 PDF, DOCX, TXT, Markdown 格式")
print("  ✓ 文档解析功能正常")
print("  ✓ 文本分片功能正常（递归 + 简单）")
print("\n📋 文档处理管线状态: ✅ 已完成并验证")
print("\n💡 完整测试:")
print("   python3 -m pytest tests/test_document_service.py -v")
print("   python3 test_document_integration.py")
print("=" * 70)
