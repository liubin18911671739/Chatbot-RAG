from datetime import datetime
from .. import db

class Document(db.Model):
    """文档模型，用于存储文档元数据和内容预览"""
    __tablename__ = 'documents'
    
    id = db.Column(db.String(36), primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    content = db.Column(db.Text)  # 存储预览内容
    category = db.Column(db.String(50), default='general')
    file_type = db.Column(db.String(20))
    file_size = db.Column(db.Integer)  # 文件大小（字节）
    chunk_count = db.Column(db.Integer, default=0)  # 分块数量
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __init__(self, **kwargs):
        if 'id' not in kwargs:
            kwargs['id'] = str(__import__('uuid').uuid4())
        super(Document, self).__init__(**kwargs)
    
    def save(self):
        db.session.add(self)
        db.session.commit()
        
    def delete(self):
        db.session.delete(self)
        db.session.commit()
        
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_name': self.original_name,
            'category': self.category,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'chunk_count': self.chunk_count,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
