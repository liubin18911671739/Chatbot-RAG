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


# ==================== 文档管理相关模型 ====================

class Document(db.Model):
    """文档模型 - 存储上传的文档信息"""
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # pdf, docx, txt, md
    file_size = db.Column(db.Integer, nullable=False)  # 字节

    # 关联信息
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    scene_id = db.Column(db.String(50), db.ForeignKey('scenes.id'), nullable=True)

    # 处理状态
    status = db.Column(db.String(20), nullable=False, default='uploaded')
    # 状态: uploaded, processing, completed, failed

    # 处理结果统计
    total_chunks = db.Column(db.Integer, default=0)
    processed_chunks = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text, nullable=True)

    # 元数据
    doc_metadata = db.Column(db.JSON, nullable=True)  # 存储额外的元数据（作者、标题等）

    # 时间戳
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    processed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    user = db.relationship('User', backref=db.backref('documents', lazy=True))
    scene = db.relationship('Scene', backref=db.backref('documents', lazy=True))
    chunks = db.relationship('DocumentChunk', backref='document', lazy=True, cascade='all, delete-orphan')

    # 索引
    __table_args__ = (
        db.Index('idx_document_user_id', 'user_id'),
        db.Index('idx_document_scene_id', 'scene_id'),
        db.Index('idx_document_status', 'status'),
        db.Index('idx_document_created_at', 'created_at'),
    )

    def __repr__(self):
        return f'<Document {self.filename} ({self.status})>'

    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'user_id': self.user_id,
            'scene_id': self.scene_id,
            'status': self.status,
            'total_chunks': self.total_chunks,
            'processed_chunks': self.processed_chunks,
            'error_message': self.error_message,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class DocumentChunk(db.Model):
    """文档分片模型 - 存储文档的文本分片"""
    __tablename__ = 'document_chunks'

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)

    # 分片内容
    content = db.Column(db.Text, nullable=False)
    chunk_index = db.Column(db.Integer, nullable=False)  # 在文档中的序号

    # 元数据
    page_number = db.Column(db.Integer, nullable=True)  # 来源页码（PDF）
    section = db.Column(db.String(255), nullable=True)  # 章节标题
    char_count = db.Column(db.Integer, nullable=False)
    chunk_metadata = db.Column(db.JSON, nullable=True)  # 分片的元数据

    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # 关联关系
    embedding = db.relationship('Embedding', backref='chunk', uselist=False, cascade='all, delete-orphan')

    # 索引
    __table_args__ = (
        db.Index('idx_chunk_document_id', 'document_id'),
        db.Index('idx_chunk_index', 'document_id', 'chunk_index'),
    )

    def __repr__(self):
        return f'<DocumentChunk {self.id} from Document {self.document_id}>'

    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'document_id': self.document_id,
            'content': self.content,
            'chunk_index': self.chunk_index,
            'page_number': self.page_number,
            'section': self.section,
            'char_count': self.char_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Embedding(db.Model):
    """向量嵌入模型 - 存储文本分片的向量表示"""
    __tablename__ = 'embeddings'

    id = db.Column(db.Integer, primary_key=True)
    chunk_id = db.Column(db.Integer, db.ForeignKey('document_chunks.id'), nullable=False, unique=True)

    # 向量数据
    vector = db.Column(db.LargeBinary, nullable=False)  # 使用 pickle 序列化的 numpy 数组
    vector_dimension = db.Column(db.Integer, nullable=False)  # 向量维度（例如 768）
    model_name = db.Column(db.String(100), nullable=False)  # 使用的嵌入模型名称

    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # 索引
    __table_args__ = (
        db.Index('idx_embedding_chunk_id', 'chunk_id'),
    )

    def __repr__(self):
        return f'<Embedding for Chunk {self.chunk_id} ({self.vector_dimension}d)>'

    def to_dict(self):
        """转换为字典格式（不包含向量数据）"""
        return {
            'id': self.id,
            'chunk_id': self.chunk_id,
            'vector_dimension': self.vector_dimension,
            'model_name': self.model_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ==================== 对话历史相关模型 ====================

class Chat(db.Model):
    """对话会话模型 - 存储对话会话信息"""
    __tablename__ = 'chats'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False, index=True)

    # 用户和场景
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # 可选，支持匿名会话
    scene_id = db.Column(db.String(50), db.ForeignKey('scenes.id'), nullable=True)

    # 会话元数据
    title = db.Column(db.String(255), nullable=True)  # 会话标题（可从首条消息生成）
    status = db.Column(db.String(20), nullable=False, default='active')  # active, archived, deleted

    # 统计信息
    message_count = db.Column(db.Integer, default=0)

    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at = db.Column(db.DateTime, nullable=True)

    # 关联关系
    user = db.relationship('User', backref=db.backref('chats', lazy=True))
    scene = db.relationship('Scene', backref=db.backref('chats', lazy=True))
    messages = db.relationship('Message', backref='chat', lazy=True, cascade='all, delete-orphan', order_by='Message.created_at')

    # 索引
    __table_args__ = (
        db.Index('idx_chat_user_id', 'user_id'),
        db.Index('idx_chat_scene_id', 'scene_id'),
        db.Index('idx_chat_created_at', 'created_at'),
        db.Index('idx_chat_status', 'status'),
    )

    def __repr__(self):
        return f'<Chat {self.session_id} ({self.message_count} messages)>'

    def to_dict(self, include_messages=False):
        """转换为字典格式"""
        result = {
            'id': self.id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'scene_id': self.scene_id,
            'title': self.title,
            'status': self.status,
            'message_count': self.message_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_message_at': self.last_message_at.isoformat() if self.last_message_at else None,
        }
        if include_messages:
            result['messages'] = [msg.to_dict() for msg in self.messages]
        return result


class Message(db.Model):
    """消息模型 - 存储对话中的单条消息"""
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=False)

    # 消息内容
    role = db.Column(db.String(20), nullable=False)  # user, assistant, system
    content = db.Column(db.Text, nullable=False)

    # 消息元数据
    token_count = db.Column(db.Integer, nullable=True)
    response_time = db.Column(db.Integer, nullable=True)  # 毫秒
    model_name = db.Column(db.String(100), nullable=True)  # 使用的模型名称

    # RAG 相关
    retrieved_chunks = db.Column(db.JSON, nullable=True)  # 检索到的文档片段ID列表
    sources = db.Column(db.JSON, nullable=True)  # 来源文档信息

    # 反馈
    feedback = db.Column(db.String(20), nullable=True)  # positive, negative, neutral

    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # 索引
    __table_args__ = (
        db.Index('idx_message_chat_id', 'chat_id'),
        db.Index('idx_message_created_at', 'created_at'),
        db.Index('idx_message_role', 'role'),
    )

    def __repr__(self):
        return f'<Message {self.id} ({self.role})>'

    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'chat_id': self.chat_id,
            'role': self.role,
            'content': self.content,
            'token_count': self.token_count,
            'response_time': self.response_time,
            'model_name': self.model_name,
            'retrieved_chunks': self.retrieved_chunks,
            'sources': self.sources,
            'feedback': self.feedback,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }