from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

class Scene(db.Model):
    __tablename__ = 'scenes'
    
    id = db.Column(db.String(50), primary_key=True)
    description = db.Column(db.String(255), nullable=False)
    icon = db.Column(db.String(10), nullable=True)
    status = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f'<Scene {self.id}>'

class Feedback(db.Model):
    __tablename__ = 'feedback'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)

    user = db.relationship('User', backref=db.backref('feedbacks', lazy=True))

    def __repr__(self):
        return f'<Feedback {self.id}>'

class Greeting(db.Model):
    __tablename__ = 'greetings'

    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(255), nullable=False)

    def __repr__(self):
        return f'<Greeting {self.message}>'

class SearchAnalytics(db.Model):
    __tablename__ = 'search_analytics'

    id = db.Column(db.Integer, primary_key=True)
    query_text = db.Column(db.Text, nullable=False)
    normalized_query = db.Column(db.Text, nullable=False)
    scene_id = db.Column(db.String(50), db.ForeignKey('scenes.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(100), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    response_time = db.Column(db.Integer, nullable=True)
    response_status = db.Column(db.String(20), nullable=False)
    api_source = db.Column(db.String(50), nullable=True)
    query_length = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # 关联关系
    scene = db.relationship('Scene', backref='search_analytics')
    user = db.relationship('User', backref='search_analytics')

    def __repr__(self):
        return f'<SearchAnalytics {self.query_text[:50]}>'

class SearchKeywords(db.Model):
    __tablename__ = 'search_keywords'

    id = db.Column(db.Integer, primary_key=True)
    keyword = db.Column(db.Text, unique=True, nullable=False)
    search_count = db.Column(db.Integer, default=1)
    last_searched = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<SearchKeywords {self.keyword}>'