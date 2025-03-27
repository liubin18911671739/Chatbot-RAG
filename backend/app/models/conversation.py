from datetime import datetime
import json
from .. import db

class Conversation(db.Model):
    """对话模型，用于存储用户与RAG智能体的对话历史"""
    __tablename__ = 'conversations'
    
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(100), nullable=True)
    scene_id = db.Column(db.String(50), nullable=True)
    messages = db.Column(db.Text)  # 存储JSON字符串格式的消息历史
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __init__(self, **kwargs):
        if 'id' not in kwargs:
            kwargs['id'] = str(__import__('uuid').uuid4())
        if 'messages' not in kwargs:
            kwargs['messages'] = json.dumps([])
        super(Conversation, self).__init__(**kwargs)
    
    def add_message(self, role, content):
        """添加新消息到对话历史"""
        messages = self.get_messages()
        messages.append({
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat()
        })
        self.messages = json.dumps(messages)
    
    def get_messages(self):
        """获取解析后的消息历史"""
        if not self.messages:
            return []
        try:
            return json.loads(self.messages)
        except:
            return []
    
    def save(self):
        self.updated_at = datetime.now()
        db.session.add(self)
        db.session.commit()
    
    def delete(self):
        db.session.delete(self)
        db.session.commit()
    
    @classmethod
    def get_or_create(cls, conversation_id, user_id=None, scene_id=None):
        """获取或创建对话"""
        conversation = cls.query.get(conversation_id)
        if not conversation:
            conversation = cls(
                id=conversation_id,
                user_id=user_id,
                scene_id=scene_id
            )
            db.session.add(conversation)
            db.session.commit()
        return conversation
