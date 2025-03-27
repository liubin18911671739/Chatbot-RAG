#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
模拟数据生成器：用于生成新闻文档和对应的向量表示，
并将它们插入到MongoDB数据库和FAISS向量索引中
"""

import os
import sys
import json
import random
import datetime
import argparse
import numpy as np
from pymongo import MongoClient
import faiss
from faker import Faker
from tqdm import tqdm

# 添加项目根目录到系统路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 初始化随机生成器，支持多语言
fake_zh = Faker('zh_CN')
fake_en = Faker('en_US')

# 向量维度
VECTOR_DIM = 768  # BERT/Sentence-BERT的标准维度

def generate_random_vector(dim=VECTOR_DIM):
    """
    生成随机单位向量
    """
    vec = np.random.randn(dim).astype('float32')
    # 归一化为单位向量
    vec = vec / np.linalg.norm(vec)
    return vec

def generate_news_article(lang='zh', with_vector=True):
    """
    生成一篇模拟的新闻文章
    
    Args:
        lang: 语言代码，'zh'为中文，'en'为英文
        with_vector: 是否生成对应的向量表示
    
    Returns:
        article_doc: MongoDB文档对象
        vector: 如果with_vector为True，返回文章的向量表示
    """
    faker = fake_zh if lang == 'zh' else fake_en
    
    # 创建随机发布日期（过去两年内）
    publish_date = faker.date_time_between(start_date='-2y', end_date='now')
    
    # 创建新闻来源
    sources_zh = ['新华社', '人民日报', '中国日报', '环球时报', '南方周末']
    sources_en = ['CNN', 'BBC', 'Reuters', 'Associated Press', 'The New York Times']
    source = random.choice(sources_zh if lang == 'zh' else sources_en)
    
    # 创建新闻分类
    categories = ['政治', '经济', '科技', '文化', '体育', '国际', '社会', '健康'] if lang == 'zh' else \
                 ['Politics', 'Economy', 'Technology', 'Culture', 'Sports', 'International', 'Society', 'Health']
    category = random.choice(categories)
    
    # 创建标题和内容
    if lang == 'zh':
        title = faker.sentence()[:20]  # 限制标题长度
        content_paragraphs = [faker.paragraph() for _ in range(random.randint(3, 8))]
        content = '\n\n'.join(content_paragraphs)
        summary = faker.text()[:100]  # 生成摘要
    else:
        title = faker.sentence()[:30]
        content_paragraphs = [faker.paragraph() for _ in range(random.randint(4, 10))]
        content = '\n\n'.join(content_paragraphs)
        summary = faker.text()[:120]
    
    # 生成标签
    tags = [faker.word() for _ in range(random.randint(2, 5))]
    
    # 创建文档对象
    article_doc = {
        "_id": str(random.randint(100000, 999999)),  # 模拟ID
        "title": title,
        "content": content,
        "summary": summary,
        "source": source,
        "publishDate": publish_date,
        "category": category,
        "language": lang,
        "tags": tags,
        "url": faker.url(),
        "author": faker.name(),
        "createdAt": datetime.datetime.now(),
        "updatedAt": datetime.datetime.now()
    }
    
    # 生成向量表示
    vector = None
    if with_vector:
        vector = generate_random_vector()
        # 在实际应用中，这里应该使用模型来生成向量
        # 例如：vector = sentence_model.encode(title + " " + summary)
    
    return article_doc, vector

def create_mock_dataset(num_articles=1000, langs=['zh', 'en'], mongo_uri=None, faiss_index_path=None):
    """
    创建模拟数据集并存入MongoDB和FAISS索引
    
    Args:
        num_articles: 要生成的文章数量
        langs: 要包含的语言列表
        mongo_uri: MongoDB连接URI，如果为None则只生成不存储
        faiss_index_path: FAISS索引保存路径，如果为None则只生成不存储
    """
    articles = []
    vectors = []
    
    print(f"开始生成{num_articles}篇新闻文章...")
    
    # 生成文章和向量
    for i in tqdm(range(num_articles)):
        lang = random.choice(langs)
        article, vector = generate_news_article(lang=lang)
        articles.append(article)
        vectors.append(vector)
    
    # 存储到MongoDB
    if mongo_uri:
        try:
            print(f"开始将{len(articles)}篇文章存入MongoDB...")
            client = MongoClient(mongo_uri)
            db = client.news_system
            collection = db.articles
            
            # 清空现有数据（可选）
            # collection.delete_many({})
            
            # 批量插入
            result = collection.insert_many(articles)
            print(f"成功插入{len(result.inserted_ids)}篇文章")
        except Exception as e:
            print(f"MongoDB插入失败: {e}")
    
    # 构建并存储FAISS索引
    if faiss_index_path and vectors:
        try:
            print("开始构建FAISS索引...")
            # 转换为numpy数组
            vectors_np = np.array(vectors).astype('float32')
            
            # 创建索引
            index = faiss.IndexFlatIP(VECTOR_DIM)  # 使用内积（余弦相似度）
            index.add(vectors_np)
            
            # 保存索引
            faiss.write_index(index, faiss_index_path)
            
            # 保存文章ID到向量索引的映射
            id_map = {i: articles[i]["_id"] for i in range(len(articles))}
            with open(f"{faiss_index_path}.map.json", 'w', encoding='utf-8') as f:
                json.dump(id_map, f, ensure_ascii=False, indent=2)
            
            print(f"FAISS索引已保存到 {faiss_index_path}")
            print(f"ID映射已保存到 {faiss_index_path}.map.json")
        except Exception as e:
            print(f"FAISS索引构建失败: {e}")
    
    print("模拟数据生成完成！")
    return articles, vectors

def main():
    parser = argparse.ArgumentParser(description="生成模拟新闻数据并存储到MongoDB和FAISS")
    parser.add_argument('--count', type=int, default=1000, help='要生成的文章数量')
    parser.add_argument('--langs', nargs='+', default=['zh', 'en'], help='要包含的语言列表')
    parser.add_argument('--mongo_uri', type=str, default="mongodb://localhost:27017/", 
                        help='MongoDB连接URI')
    parser.add_argument('--skip_mongo', action='store_true', help='跳过MongoDB存储')
    parser.add_argument('--faiss_path', type=str, default="./data/news_vectors.index", 
                        help='FAISS索引保存路径')
    parser.add_argument('--skip_faiss', action='store_true', help='跳过FAISS索引构建')
    
    args = parser.parse_args()
    
    # 确保FAISS索引目录存在
    if not args.skip_faiss:
        os.makedirs(os.path.dirname(args.faiss_path), exist_ok=True)
    
    create_mock_dataset(
        num_articles=args.count,
        langs=args.langs,
        mongo_uri=None if args.skip_mongo else args.mongo_uri,
        faiss_index_path=None if args.skip_faiss else args.faiss_path
    )

if __name__ == "__main__":
    main()
