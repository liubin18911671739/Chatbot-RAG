"""
向量数据库使用示例
演示如何在实际场景中使用 embedding 和 vector 服务
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from services.embedding_service import get_embedding_service
from services.vector_service import VectorService


def example_1_basic_usage():
    """示例 1: 基本使用"""
    print("\n" + "="*60)
    print("示例 1: 基本使用")
    print("="*60)
    
    # 初始化服务
    embedding_service = get_embedding_service()
    vector_service = VectorService(
        dimension=embedding_service.embedding_dimension,
        metric="IP"
    )
    
    # 添加一些文档
    documents = [
        "Python是一种高级编程语言",
        "JavaScript用于Web开发",
        "机器学习是AI的核心技术"
    ]
    
    print(f"\n添加 {len(documents)} 个文档...")
    embeddings = embedding_service.get_embeddings(documents)
    metadata = [{"text": doc} for doc in documents]
    vector_service.add_vectors(embeddings, metadata)
    
    # 查询
    query = "什么是Python？"
    print(f"\n查询: {query}")
    query_emb = embedding_service.get_embedding(query)
    results = vector_service.search(query_emb, top_k=2)
    
    print("\n结果:")
    for i, r in enumerate(results, 1):
        print(f"  {i}. (分数: {r['score']:.4f}) {r['metadata']['text']}")


def example_2_knowledge_base():
    """示例 2: 构建小型知识库"""
    print("\n" + "="*60)
    print("示例 2: 构建技术知识库")
    print("="*60)
    
    # 初始化
    embedding_service = get_embedding_service()
    vector_service = VectorService(
        dimension=embedding_service.embedding_dimension,
        metric="IP"
    )
    
    # 技术知识库
    kb = {
        "Python": "Python是一种高级编程语言，广泛应用于Web开发、数据科学和人工智能领域。",
        "Flask": "Flask是一个轻量级的Python Web框架，易于学习和使用。",
        "Docker": "Docker是一个容器化平台，可以将应用程序及其依赖打包到容器中。",
        "PostgreSQL": "PostgreSQL是一个强大的开源关系型数据库管理系统。",
        "Redis": "Redis是一个高性能的内存键值存储数据库，常用于缓存和会话管理。"
    }
    
    print(f"\n构建知识库 ({len(kb)} 条)...")
    texts = list(kb.values())
    embeddings = embedding_service.get_embeddings(texts)
    metadata = [{"title": k, "content": v} for k, v in kb.items()]
    vector_service.add_vectors(embeddings, metadata)
    
    # 多个查询
    queries = [
        "如何开发Web应用？",
        "什么数据库可以用来存储数据？",
        "容器化技术有哪些？"
    ]
    
    print("\n执行查询:")
    for query in queries:
        print(f"\n  Q: {query}")
        query_emb = embedding_service.get_embedding(query)
        results = vector_service.search(query_emb, top_k=2)
        
        for i, r in enumerate(results, 1):
            print(f"    {i}. [{r['metadata']['title']}] "
                  f"(分数: {r['score']:.3f})")


def example_3_persistence():
    """示例 3: 持久化和加载"""
    print("\n" + "="*60)
    print("示例 3: 索引持久化")
    print("="*60)
    
    # 初始化
    embedding_service = get_embedding_service()
    vector_service = VectorService(
        dimension=embedding_service.embedding_dimension,
        metric="IP"
    )
    
    # 添加数据
    docs = [
        "机器学习算法可以从数据中学习模式",
        "深度学习使用多层神经网络",
        "强化学习通过奖励信号学习策略"
    ]
    
    print("\n添加文档并保存索引...")
    embeddings = embedding_service.get_embeddings(docs)
    metadata = [{"text": d, "id": i} for i, d in enumerate(docs)]
    vector_service.add_vectors(embeddings, metadata)
    
    # 保存
    vector_service.save()
    print("✓ 索引已保存")
    
    # 创建新服务并加载
    print("\n创建新服务并加载索引...")
    new_service = VectorService(
        dimension=embedding_service.embedding_dimension,
        metric="IP"
    )
    new_service.load()
    print(f"✓ 索引已加载 (向量数: {new_service.index.ntotal})")
    
    # 验证
    query = "什么是深度学习？"
    query_emb = embedding_service.get_embedding(query)
    results = new_service.search(query_emb, top_k=1)
    
    print(f"\n查询测试: {query}")
    print(f"结果: {results[0]['metadata']['text']}")


def example_4_similarity_comparison():
    """示例 4: 相似度比较"""
    print("\n" + "="*60)
    print("示例 4: 文本相似度比较")
    print("="*60)
    
    embedding_service = get_embedding_service()
    
    # 文本组
    texts = [
        "今天天气很好",
        "今天阳光明媚",
        "机器学习是AI的核心",
        "深度学习属于机器学习"
    ]
    
    print("\n文本列表:")
    for i, t in enumerate(texts):
        print(f"  {i}. {t}")
    
    # 生成向量
    embeddings = embedding_service.get_embeddings(texts)
    
    # 计算相似度矩阵
    print("\n相似度矩阵 (余弦相似度):")
    print("     ", end="")
    for i in range(len(texts)):
        print(f"{i:6}", end="")
    print()
    
    for i in range(len(texts)):
        print(f"{i:2}.  ", end="")
        for j in range(len(texts)):
            sim = embedding_service.compute_similarity(
                embeddings[i],
                embeddings[j],
                metric="cosine"
            )
            print(f"{sim:6.3f}", end="")
        print()
    
    # 分析
    print("\n分析:")
    print("  - 文本0和1 (天气相关) 应该相似度高")
    print("  - 文本2和3 (机器学习相关) 应该相似度高")
    print("  - 跨组文本相似度应该较低")


def example_5_rag_simulation():
    """示例 5: 模拟 RAG 流程"""
    print("\n" + "="*60)
    print("示例 5: RAG 检索增强生成模拟")
    print("="*60)
    
    # 初始化
    embedding_service = get_embedding_service()
    vector_service = VectorService(
        dimension=embedding_service.embedding_dimension,
        metric="IP"
    )
    
    # 模拟文档库 (FAQ)
    faq_data = [
        {
            "question": "如何修改密码？",
            "answer": "登录后点击右上角头像，选择'账户设置'，然后点击'修改密码'，按提示操作即可。"
        },
        {
            "question": "忘记密码怎么办？",
            "answer": "在登录页面点击'忘记密码'，输入注册邮箱，系统会发送重置链接到您的邮箱。"
        },
        {
            "question": "如何上传文件？",
            "answer": "点击'文件管理'菜单，然后点击'上传文件'按钮，选择要上传的文件即可。支持PDF、Word等格式。"
        },
        {
            "question": "系统支持哪些浏览器？",
            "answer": "系统支持Chrome、Firefox、Safari和Edge等主流浏览器，建议使用最新版本。"
        }
    ]
    
    print(f"\n构建FAQ知识库 ({len(faq_data)} 条)...")
    
    # 向量化问题和答案
    texts = [f"{item['question']} {item['answer']}" for item in faq_data]
    embeddings = embedding_service.get_embeddings(texts)
    metadata = [{"question": item['question'], "answer": item['answer']} 
                for item in faq_data]
    vector_service.add_vectors(embeddings, metadata)
    
    # 用户查询
    user_questions = [
        "怎么改密码？",
        "我想上传一个PDF文件",
        "密码忘了怎么找回？"
    ]
    
    print("\nRAG 检索过程:")
    for user_q in user_questions:
        print(f"\n用户问题: {user_q}")
        
        # 1. 检索相关文档
        query_emb = embedding_service.get_embedding(user_q)
        results = vector_service.search(query_emb, top_k=2)
        
        print("  检索结果:")
        for i, r in enumerate(results, 1):
            print(f"    {i}. (相关度: {r['score']:.3f})")
            print(f"       Q: {r['metadata']['question']}")
            print(f"       A: {r['metadata']['answer']}")
        
        # 2. 构建上下文 (在实际RAG中会传给LLM)
        context = results[0]['metadata']['answer']
        print(f"\n  最佳答案: {context}")


def main():
    """运行所有示例"""
    print("\n" + "="*60)
    print("向量数据库使用示例集")
    print("="*60)
    
    try:
        example_1_basic_usage()
        example_2_knowledge_base()
        example_3_persistence()
        example_4_similarity_comparison()
        example_5_rag_simulation()
        
        print("\n" + "="*60)
        print("✅ 所有示例运行完成")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ 示例运行失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
