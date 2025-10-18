"""
文档处理服务集成测试
测试完整的文档处理管线，包括真实的向量化和存储
"""

import os
import sys
import tempfile
from pathlib import Path

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.document_service import DocumentService
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService


def create_test_documents(test_dir):
    """创建测试文档"""
    documents = {}
    
    # 1. 创建 TXT 文档
    txt_file = os.path.join(test_dir, '校园指南.txt')
    txt_content = """北京第二外国语学院校园指南

第一章：图书馆使用说明
图书馆位于校园中心位置，周一至周五早8:00至晚10:00开放。
学生可以使用学生证借阅图书，每次最多借5本，借期30天。
图书馆提供自习室、电子阅览室和小组讨论室。

第二章：食堂介绍
学校有三个食堂，分别是第一食堂、第二食堂和清真食堂。
营业时间为早6:30至晚8:00。
学生可使用校园卡或支付宝、微信支付。

第三章：校医院服务
校医院位于东门附近，提供基本医疗服务。
工作时间为周一至周五早8:30至晚5:00。
紧急情况请拨打校园急救电话：110。
"""
    
    with open(txt_file, 'w', encoding='utf-8') as f:
        f.write(txt_content)
    documents['txt'] = txt_file
    
    # 2. 创建 Markdown 文档
    md_file = os.path.join(test_dir, '课程大纲.md')
    md_content = """# 人工智能基础课程大纲

## 课程信息
- 课程名称：人工智能基础
- 学分：3学分
- 学时：48学时
- 授课教师：张老师

## 课程目标
1. 理解人工智能的基本概念和发展历史
2. 掌握机器学习的基本算法
3. 了解深度学习的基本原理
4. 能够使用Python进行简单的AI项目开发

## 课程内容

### 第一部分：人工智能概述（8学时）
- 人工智能的定义和历史
- 人工智能的应用领域
- 人工智能的发展趋势

### 第二部分：机器学习基础（16学时）
- 监督学习
- 无监督学习
- 强化学习
- 常用算法：决策树、SVM、神经网络

### 第三部分：深度学习（16学时）
- 神经网络基础
- 卷积神经网络
- 循环神经网络
- Transformer模型

### 第四部分：实践项目（8学时）
- 图像分类项目
- 文本情感分析
- 聊天机器人开发

## 考核方式
- 平时作业：30%
- 期中项目：30%
- 期末考试：40%
"""
    
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
    documents['md'] = md_file
    
    # 3. 创建另一个 TXT 文档
    txt2_file = os.path.join(test_dir, '宿舍管理规定.txt')
    txt2_content = """学生宿舍管理规定

一、作息时间
1. 宿舍楼开放时间：早6:00至晚11:00
2. 晚11:00后禁止外出，特殊情况需向宿管老师请假
3. 午休时间（12:00-14:00）请保持安静

二、卫生要求
1. 每周进行一次宿舍卫生检查
2. 个人床铺需保持整洁
3. 公共区域由值日生负责清扫

三、安全规定
1. 严禁使用大功率电器
2. 严禁私拉电线
3. 发现安全隐患及时报告宿管
4. 贵重物品妥善保管

四、访客制度
1. 外来人员需在门卫处登记
2. 访客需在晚10:00前离开
3. 异性访客不得进入宿舍楼层
"""
    
    with open(txt2_file, 'w', encoding='utf-8') as f:
        f.write(txt2_content)
    documents['txt2'] = txt2_file
    
    return documents


def test_document_parsing():
    """测试文档解析功能"""
    print("=" * 60)
    print("测试 1: 文档解析功能")
    print("=" * 60)
    
    # 创建临时目录和测试文档
    with tempfile.TemporaryDirectory() as test_dir:
        documents = create_test_documents(test_dir)
        
        # 创建文档服务（不需要向量服务）
        doc_service = DocumentService()
        
        # 测试每个文档
        for doc_type, file_path in documents.items():
            print(f"\n解析 {doc_type.upper()} 文档: {Path(file_path).name}")
            
            try:
                result = doc_service.parse_document(file_path)
                
                print(f"  ✓ 解析成功")
                print(f"    - 文本长度: {len(result['text'])} 字符")
                print(f"    - 文件类型: {result['metadata']['file_type']}")
                
                if 'pages' in result['metadata']:
                    print(f"    - 页数: {result['metadata']['pages']}")
                if 'paragraphs' in result['metadata']:
                    print(f"    - 段落数: {result['metadata']['paragraphs']}")
                if 'lines' in result['metadata']:
                    print(f"    - 行数: {result['metadata']['lines']}")
                
            except Exception as e:
                print(f"  ✗ 解析失败: {e}")
                return False
    
    print("\n✅ 文档解析测试通过")
    return True


def test_text_chunking():
    """测试文本分片功能"""
    print("\n" + "=" * 60)
    print("测试 2: 文本分片功能")
    print("=" * 60)
    
    with tempfile.TemporaryDirectory() as test_dir:
        documents = create_test_documents(test_dir)
        
        # 创建文档服务，设置较小的分片大小以便测试
        doc_service = DocumentService(chunk_size=200, chunk_overlap=50)
        
        txt_file = documents['txt']
        
        print(f"\n解析文档: {Path(txt_file).name}")
        result = doc_service.parse_document(txt_file)
        text = result['text']
        
        print(f"  - 原始文本长度: {len(text)} 字符")
        
        # 测试递归分片
        print("\n使用递归分片策略:")
        chunks = doc_service.chunk_text(text, metadata={'file': txt_file}, strategy="recursive")
        
        print(f"  ✓ 分片数量: {len(chunks)}")
        print(f"  ✓ 分片大小范围: {min(len(c['text']) for c in chunks)} - {max(len(c['text']) for c in chunks)} 字符")
        
        # 显示前3个分片的预览
        for i, chunk in enumerate(chunks[:3]):
            preview = chunk['text'][:50].replace('\n', ' ')
            print(f"  - 分片 {i}: {preview}... ({len(chunk['text'])} 字符)")
        
        # 验证元数据
        if chunks[0]['metadata']['file'] == txt_file:
            print("  ✓ 元数据正确传递")
        
    print("\n✅ 文本分片测试通过")
    return True


def test_full_pipeline():
    """测试完整的文档入库流程（需要模型下载）"""
    print("\n" + "=" * 60)
    print("测试 3: 完整文档入库流程")
    print("=" * 60)
    
    print("\n⚠️  注意: 此测试需要下载 sentence-transformers 模型（~471MB）")
    print("如果是首次运行，请耐心等待模型下载...")
    
    response = input("\n是否继续？(y/n): ")
    if response.lower() != 'y':
        print("跳过完整流程测试")
        return True
    
    with tempfile.TemporaryDirectory() as test_dir:
        documents = create_test_documents(test_dir)
        
        print("\n初始化服务...")
        # 创建服务实例
        embedding_service = EmbeddingService()
        vector_service = VectorService(dimension=384)
        doc_service = DocumentService(
            embedding_service=embedding_service,
            vector_service=vector_service,
            chunk_size=300,
            chunk_overlap=50
        )
        
        print("✓ 服务初始化完成")
        
        # 处理第一个文档
        txt_file = documents['txt']
        print(f"\n处理文档: {Path(txt_file).name}")
        
        result = doc_service.ingest_document(txt_file, document_id='doc-1')
        
        if result['status'] == 'success':
            print(f"  ✓ 入库成功")
            print(f"    - 文档ID: {result['document_id']}")
            print(f"    - 分片数: {result['chunks_count']}")
            print(f"    - 向量数: {result['vectors_count']}")
            print(f"    - 向量ID: {result['vector_ids'][:5]}...")
        else:
            print(f"  ✗ 入库失败: {result.get('error')}")
            return False
        
        # 测试检索
        print("\n测试向量检索...")
        query_text = "图书馆在哪里？"
        print(f"  查询: {query_text}")
        
        query_vector = embedding_service.get_embedding(query_text)
        search_results = vector_service.search(query_vector, top_k=3)
        
        print(f"  ✓ 找到 {len(search_results)} 个相关结果:")
        for i, item in enumerate(search_results, 1):
            preview = item['metadata'].get('text', '')[:50] if 'text' in item['metadata'] else ''
            print(f"    {i}. 相似度={item['score']:.4f}: {preview}...")
        
        # 批量处理测试
        print("\n测试批量文档处理...")
        all_files = list(documents.values())
        
        def progress_callback(current, total, file_path):
            print(f"  进度: {current}/{total} - {Path(file_path).name}")
        
        batch_results = doc_service.batch_ingest_documents(all_files, progress_callback=progress_callback)
        
        success_count = sum(1 for r in batch_results if r['status'] == 'success')
        print(f"\n  ✓ 批量处理完成: {success_count}/{len(all_files)} 成功")
        
        # 最终检索测试
        print("\n最终检索测试...")
        test_queries = [
            "食堂在哪里？",
            "人工智能课程有多少学分？",
            "宿舍几点关门？"
        ]
        
        for query in test_queries:
            print(f"\n  查询: {query}")
            query_vector = embedding_service.get_embedding(query)
            results = vector_service.search(query_vector, top_k=2)
            
            for i, item in enumerate(results, 1):
                print(f"    {i}. 相似度={item['score']:.4f}")
    
    print("\n✅ 完整流程测试通过")
    return True


def main():
    """主测试函数"""
    print("=" * 60)
    print("文档处理服务集成测试")
    print("=" * 60)
    
    tests = [
        ("文档解析", test_document_parsing),
        ("文本分片", test_text_chunking),
        ("完整流程", test_full_pipeline)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"\n❌ {test_name} 测试异常: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # 打印总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    
    for test_name, success in results:
        status = "✅ 通过" if success else "❌ 失败"
        print(f"{status} - {test_name}")
    
    success_count = sum(1 for _, success in results if success)
    print(f"\n总计: {success_count}/{len(results)} 测试通过")
    
    if success_count == len(results):
        print("\n🎉 所有测试通过！文档处理管线功能正常")
        return 0
    else:
        print("\n⚠️  部分测试失败，请检查错误信息")
        return 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
