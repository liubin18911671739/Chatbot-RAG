from datetime import datetime
import json
from .. import db

class AgentConfig(db.Model):
    """智能体配置模型，用于管理不同的RAG智能体设置"""
    __tablename__ = 'agent_configs'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    model = db.Column(db.String(50), default='gpt-3.5-turbo')
    temperature = db.Column(db.Float, default=0.7)
    max_tokens = db.Column(db.Integer, default=800)
    system_prompt = db.Column(db.Text)
    knowledge_base_ids = db.Column(db.Text)  # 存储JSON字符串
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __init__(self, **kwargs):
        if 'id' not in kwargs:
            kwargs['id'] = str(__import__('uuid').uuid4())
        super(AgentConfig, self).__init__(**kwargs)
    
    def save(self):
        db.session.add(self)
        db.session.commit()
        
    def delete(self):
        db.session.delete(self)
        db.session.commit()
    
    def get_knowledge_base_ids(self):
        """获取解析后的知识库ID列表"""
        if not self.knowledge_base_ids:
            return []
        try:
            return json.loads(self.knowledge_base_ids)
        except:
            return []
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'model': self.model,
            'temperature': self.temperature,
            'max_tokens': self.max_tokens,
            'system_prompt': self.system_prompt,
            'knowledge_base_ids': self.get_knowledge_base_ids(),
            'active': self.active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
