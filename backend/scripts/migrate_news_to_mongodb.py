import sys
import os
from datetime import datetime
from flask import Flask
from app import create_app, db, mongo
from app.models import News  # 旧的SQLAlchemy模型

def migrate_news():
    """将News表数据从SQL数据库迁移至MongoDB"""
    # 创建应用上下文
    app = create_app('development')
    
    with app.app_context():
        print("开始迁移新闻数据...")
        
        # 获取所有新闻
        news_items = News.query.all()
        total = len(news_items)
        print(f"找到 {total} 条新闻记录")
        
        # 迁移计数
        success_count = 0
        error_count = 0
        
        # 逐个迁移
        for i, news in enumerate(news_items, 1):
            try:
                # 转换为字典
                news_dict = {
                    'title': news.title,
                    'content': news.content,
                    'summary': news.summary if hasattr(news, 'summary') else '',
                    'language': news.language,
                    'country': news.country if hasattr(news, 'country') else '',
                    'source': news.source if hasattr(news, 'source') else '',
                    'url': news.url if hasattr(news, 'url') else '',
                    'published_date': news.published_date if hasattr(news, 'published_date') else datetime.utcnow(),
                }
                
                # 添加向量嵌入（如果存在）
                if hasattr(news, 'vector_embedding') and news.vector_embedding is not None:
                    news_dict['vector_embedding'] = news.vector_embedding.tolist() if hasattr(news.vector_embedding, 'tolist') else news.vector_embedding
                
                # 保存到MongoDB
                mongo.db.news.insert_one(news_dict)
                success_count += 1
                
                # 打印进度
                if i % 100 == 0 or i == total:
                    print(f"进度: {i}/{total}")
                    
            except Exception as e:
                error_count += 1
                print(f"迁移ID为{news.id}的新闻时出错: {str(e)}")
                
        print(f"迁移完成! 成功: {success_count}, 失败: {error_count}")

        # 在迁移脚本后或管理员界面中执行
        # 创建多语言文本索引
        mongo.db.news.create_index([
            ('title', 'text'), 
            ('content', 'text')
        ], 
        weights={
            'title': 10,  # 标题权重更高
            'content': 5
        },
        default_language='english')

if __name__ == "__main__":
    migrate_news()