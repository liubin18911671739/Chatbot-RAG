from datetime import datetime
from app import db  # 这里可以直接导入，因为db已经在app/__init__.py中定义
from bson import ObjectId
from flask import current_app
from app import mongo

class News(db.Model):
    __tablename__ = 'news'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text)
    summary = db.Column(db.Text)
    source = db.Column(db.String(100))
    url = db.Column(db.String(500))
    country = db.Column(db.String(50))
    language = db.Column(db.String(50))
    published_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<News {self.id}: {self.title}>"
    
    def save(self):
        """保存当前实例到数据库"""
        db.session.add(self)
        db.session.commit()
        return self
    
    def delete(self):
        """从数据库中删除当前实例"""
        db.session.delete(self)
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'summary': self.summary,
            'source': self.source,
            'url': self.url,
            'country': self.country,
            'language': self.language,
            'published_date': self.published_date.strftime('%Y-%m-%d %H:%M:%S') if self.published_date else None,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

# 添加 NewsArticle 类作为 News 的别名，以兼容现有代码
NewsArticle = News

class NewsDocument:
    """MongoDB版本的News模型"""
    
    collection_name = 'news'
    
    @staticmethod
    def get_collection():
        return mongo.db[NewsDocument.collection_name]
    
    @classmethod
    def find_one(cls, query):
        """根据查询条件获取单个新闻"""
        return cls.get_collection().find_one(query)
    
    @classmethod
    def find(cls, query=None, sort=None, skip=0, limit=0):
        """根据条件查询新闻列表"""
        query = query or {}
        cursor = cls.get_collection().find(query).skip(skip).limit(limit)
        if sort:
            cursor = cursor.sort(sort)
        return list(cursor)
    
    @classmethod
    def count(cls, query=None):
        """计数"""
        query = query or {}
        return cls.get_collection().count_documents(query)
    
    @classmethod
    def get_by_id(cls, news_id):
        """根据ID获取新闻"""
        if isinstance(news_id, str):
            try:
                news_id = ObjectId(news_id)
            except:
                return None
        return cls.find_one({"_id": news_id})
    
    @classmethod
    def save(cls, news_data):
        """保存新闻"""
        if '_id' in news_data and not news_data['_id']:
            del news_data['_id']
        
        # 确保有published_date字段
        if 'published_date' not in news_data:
            news_data['published_date'] = datetime.utcnow()
            
        if '_id' in news_data:
            # 更新
            news_id = news_data['_id']
            cls.get_collection().update_one(
                {"_id": news_id},
                {"$set": news_data}
            )
            return news_id
        else:
            # 创建
            result = cls.get_collection().insert_one(news_data)
            return result.inserted_id
    
    @classmethod
    def delete(cls, news_id):
        """删除新闻"""
        if isinstance(news_id, str):
            news_id = ObjectId(news_id)
        return cls.get_collection().delete_one({"_id": news_id})
    
    @classmethod
    def to_dict(cls, news_doc):
        """将MongoDB文档转换为字典"""
        if not news_doc:
            return None
            
        # 转换_id为字符串
        news_dict = dict(news_doc)
        if '_id' in news_dict:
            news_dict['id'] = str(news_dict['_id'])
            del news_dict['_id']
            
        # 处理日期
        if 'published_date' in news_dict and isinstance(news_dict['published_date'], datetime):
            news_dict['published_date'] = news_dict['published_date'].isoformat()
            
        return news_dict