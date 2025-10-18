"""
数据库模型单元测试（简化版）

直接测试模型创建和关系，避免会话分离问题
"""

import pytest
import pickle
import numpy as np
from datetime import datetime
from flask import Flask
from models.database import (
    db, User, Scene, Document, DocumentChunk,
    Embedding, Chat, Message
)


@pytest.fixture
def app():
    """创建测试应用"""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['TESTING'] = True

    db.init_app(app)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


def test_document_model_creation(app):
    """测试 Document 模型创建"""
    with app.app_context():
        # 创建依赖对象
        user = User(username='user1', email='user1@test.com', password_hash='hash')
        scene = Scene(id='test_scene', description='测试', icon='📖', status='active')
        db.session.add_all([user, scene])
        db.session.commit()

        # 创建文档
        doc = Document(
            filename='test.pdf',
            original_filename='测试.pdf',
            file_path='/uploads/test.pdf',
            file_type='pdf',
            file_size=1024,
            user_id=user.id,
            scene_id=scene.id,
            status='uploaded'
        )
        db.session.add(doc)
        db.session.commit()

        # 验证
        assert doc.id is not None
        assert doc.filename == 'test.pdf'
        assert doc.status == 'uploaded'
        assert doc.user.username == 'user1'
        assert doc.scene.id == 'test_scene'


def test_document_chunk_creation(app):
    """测试 DocumentChunk 模型创建"""
    with app.app_context():
        user = User(username='user2', email='user2@test.com', password_hash='hash')
        scene = Scene(id='scene2', description='测试', icon='📖', status='active')
        doc = Document(
            filename='doc.pdf',
            original_filename='doc.pdf',
            file_path='/uploads/doc.pdf',
            file_type='pdf',
            file_size=1024,
            user_id=user.id,
            scene_id=scene.id
        )
        db.session.add_all([user, scene, doc])
        db.session.commit()

        # 创建分片
        chunk = DocumentChunk(
            document_id=doc.id,
            content='这是测试内容',
            chunk_index=0,
            page_number=1,
            char_count=10
        )
        db.session.add(chunk)
        db.session.commit()

        # 验证
        assert chunk.id is not None
        assert chunk.content == '这是测试内容'
        assert chunk.document.filename == 'doc.pdf'


def test_embedding_creation(app):
    """测试 Embedding 模型创建和向量存储"""
    with app.app_context():
        user = User(username='user3', email='user3@test.com', password_hash='hash')
        scene = Scene(id='scene3', description='测试', icon='📖', status='active')
        doc = Document(
            filename='doc3.pdf',
            original_filename='doc3.pdf',
            file_path='/uploads/doc3.pdf',
            file_type='pdf',
            file_size=1024,
            user_id=user.id,
            scene_id=scene.id
        )
        chunk = DocumentChunk(
            document_id=doc.id,
            content='内容',
            chunk_index=0,
            char_count=2
        )
        db.session.add_all([user, scene, doc, chunk])
        db.session.commit()

        # 创建向量
        vector = np.array([1.0, 2.0, 3.0], dtype=np.float32)
        vector_binary = pickle.dumps(vector)

        embedding = Embedding(
            chunk_id=chunk.id,
            vector=vector_binary,
            vector_dimension=3,
            model_name='test-model'
        )
        db.session.add(embedding)
        db.session.commit()

        # 验证
        assert embedding.id is not None
        assert embedding.vector_dimension == 3

        # 验证向量可以还原
        restored = pickle.loads(embedding.vector)
        np.testing.assert_array_equal(vector, restored)


def test_chat_and_message_creation(app):
    """测试 Chat 和 Message 模型创建"""
    with app.app_context():
        user = User(username='user4', email='user4@test.com', password_hash='hash')
        scene = Scene(id='scene4', description='测试', icon='📖', status='active')
        db.session.add_all([user, scene])
        db.session.commit()

        # 创建对话
        chat = Chat(
            session_id='session_001',
            user_id=user.id,
            scene_id=scene.id,
            title='测试对话',
            status='active'
        )
        db.session.add(chat)
        db.session.commit()

        # 创建消息
        msg1 = Message(
            chat_id=chat.id,
            role='user',
            content='你好'
        )
        msg2 = Message(
            chat_id=chat.id,
            role='assistant',
            content='你好！',
            model_name='gemini',
            response_time=500
        )
        db.session.add_all([msg1, msg2])
        db.session.commit()

        # 更新消息计数
        chat.message_count = 2
        db.session.commit()

        # 验证
        assert chat.id is not None
        assert chat.session_id == 'session_001'
        assert len(chat.messages) == 2
        assert chat.messages[0].role == 'user'
        assert chat.messages[1].role == 'assistant'


def test_cascade_delete(app):
    """测试级联删除"""
    with app.app_context():
        user = User(username='user5', email='user5@test.com', password_hash='hash')
        scene = Scene(id='scene5', description='测试', icon='📖', status='active')
        doc = Document(
            filename='doc5.pdf',
            original_filename='doc5.pdf',
            file_path='/uploads/doc5.pdf',
            file_type='pdf',
            file_size=1024,
            user_id=user.id,
            scene_id=scene.id
        )
        chunk = DocumentChunk(
            document_id=doc.id,
            content='内容',
            chunk_index=0,
            char_count=2
        )
        vector = pickle.dumps(np.array([1.0, 2.0], dtype=np.float32))
        embedding = Embedding(
            chunk_id=chunk.id,
            vector=vector,
            vector_dimension=2,
            model_name='test'
        )
        db.session.add_all([user, scene, doc, chunk, embedding])
        db.session.commit()

        doc_id = doc.id
        chunk_id = chunk.id
        embedding_id = embedding.id

        # 删除文档
        db.session.delete(doc)
        db.session.commit()

        # 验证级联删除
        assert DocumentChunk.query.get(chunk_id) is None
        assert Embedding.query.get(embedding_id) is None


def test_to_dict_methods(app):
    """测试序列化方法"""
    with app.app_context():
        user = User(username='user6', email='user6@test.com', password_hash='hash')
        scene = Scene(id='scene6', description='测试', icon='📖', status='active')
        doc = Document(
            filename='doc6.pdf',
            original_filename='doc6.pdf',
            file_path='/uploads/doc6.pdf',
            file_type='pdf',
            file_size=1024,
            user_id=user.id,
            scene_id=scene.id
        )
        db.session.add_all([user, scene, doc])
        db.session.commit()

        # 测试 Document.to_dict()
        doc_dict = doc.to_dict()
        assert 'id' in doc_dict
        assert 'filename' in doc_dict
        assert 'created_at' in doc_dict
        assert doc_dict['filename'] == 'doc6.pdf'


def test_message_with_rag_data(app):
    """测试包含RAG数据的Message"""
    with app.app_context():
        user = User(username='user7', email='user7@test.com', password_hash='hash')
        scene = Scene(id='scene7', description='测试', icon='📖', status='active')
        chat = Chat(
            session_id='session_002',
            user_id=user.id,
            scene_id=scene.id
        )
        db.session.add_all([user, scene, chat])
        db.session.commit()

        # 创建带RAG数据的消息
        message = Message(
            chat_id=chat.id,
            role='assistant',
            content='这是基于文档的回答',
            retrieved_chunks=[1, 2, 3],
            sources=[
                {'chunk_id': 1, 'score': 0.95},
                {'chunk_id': 2, 'score': 0.88}
            ],
            model_name='gemini',
            response_time=1200
        )
        db.session.add(message)
        db.session.commit()

        # 验证
        assert message.retrieved_chunks == [1, 2, 3]
        assert len(message.sources) == 2
        assert message.sources[0]['score'] == 0.95
        assert message.model_name == 'gemini'

        # 测试序列化
        msg_dict = message.to_dict()
        assert msg_dict['retrieved_chunks'] == [1, 2, 3]
        assert 'sources' in msg_dict
