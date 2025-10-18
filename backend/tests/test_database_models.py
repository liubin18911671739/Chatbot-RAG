"""
数据库模型单元测试

测试新添加的 Document, DocumentChunk, Embedding, Chat, Message 模型
"""

import pytest
import pickle
import numpy as np
from datetime import datetime
from models.database import (
    db, User, Scene, Document, DocumentChunk,
    Embedding, Chat, Message
)


class TestDocumentModel:
    """Document 模型测试"""

    def test_create_document(self, app, test_user, test_scene):
        """测试创建文档"""
        with app.app_context():
            doc = Document(
                filename='test.pdf',
                original_filename='测试.pdf',
                file_path='/uploads/test.pdf',
                file_type='pdf',
                file_size=1024,
                user_id=test_user.id,
                scene_id=test_scene.id,
                status='uploaded'
            )
            db.session.add(doc)
            db.session.commit()

            assert doc.id is not None
            assert doc.filename == 'test.pdf'
            assert doc.status == 'uploaded'
            assert doc.total_chunks == 0

    def test_document_to_dict(self, app, test_user, test_scene):
        """测试文档序列化"""
        with app.app_context():
            doc = Document(
                filename='test.pdf',
                original_filename='测试.pdf',
                file_path='/uploads/test.pdf',
                file_type='pdf',
                file_size=1024,
                user_id=test_user.id,
                scene_id=test_scene.id,
                status='completed',
                doc_metadata={'author': '测试作者'}
            )
            db.session.add(doc)
            db.session.commit()

            doc_dict = doc.to_dict()
            assert doc_dict['filename'] == 'test.pdf'
            assert doc_dict['status'] == 'completed'
            assert 'created_at' in doc_dict

    def test_document_relationships(self, app, test_user, test_scene):
        """测试文档关联关系"""
        with app.app_context():
            doc = Document(
                filename='test.pdf',
                original_filename='测试.pdf',
                file_path='/uploads/test.pdf',
                file_type='pdf',
                file_size=1024,
                user_id=test_user.id,
                scene_id=test_scene.id
            )
            db.session.add(doc)
            db.session.commit()

            # 测试与 User 的关系
            assert doc.user.id == test_user.id
            assert doc in test_user.documents

            # 测试与 Scene 的关系
            assert doc.scene.id == test_scene.id
            assert doc in test_scene.documents


class TestDocumentChunkModel:
    """DocumentChunk 模型测试"""

    def test_create_chunk(self, app, test_document):
        """测试创建文档分片"""
        with app.app_context():
            chunk = DocumentChunk(
                document_id=test_document.id,
                content='这是测试内容',
                chunk_index=0,
                page_number=1,
                section='第一章',
                char_count=10
            )
            db.session.add(chunk)
            db.session.commit()

            assert chunk.id is not None
            assert chunk.content == '这是测试内容'
            assert chunk.chunk_index == 0

    def test_chunk_cascade_delete(self, app, test_document):
        """测试分片级联删除"""
        with app.app_context():
            chunk = DocumentChunk(
                document_id=test_document.id,
                content='测试内容',
                chunk_index=0,
                char_count=4
            )
            db.session.add(chunk)
            db.session.commit()

            chunk_id = chunk.id
            doc_id = test_document.id

            # 删除文档
            db.session.delete(test_document)
            db.session.commit()

            # 验证分片也被删除
            assert DocumentChunk.query.get(chunk_id) is None


class TestEmbeddingModel:
    """Embedding 模型测试"""

    def test_create_embedding(self, app, test_chunk):
        """测试创建向量嵌入"""
        with app.app_context():
            # 创建测试向量
            vector = np.random.rand(768).astype(np.float32)
            vector_binary = pickle.dumps(vector)

            embedding = Embedding(
                chunk_id=test_chunk.id,
                vector=vector_binary,
                vector_dimension=768,
                model_name='test-model'
            )
            db.session.add(embedding)
            db.session.commit()

            assert embedding.id is not None
            assert embedding.vector_dimension == 768
            assert embedding.model_name == 'test-model'

    def test_embedding_vector_serialization(self, app, test_chunk):
        """测试向量序列化和反序列化"""
        with app.app_context():
            # 原始向量
            original_vector = np.array([1.0, 2.0, 3.0], dtype=np.float32)
            vector_binary = pickle.dumps(original_vector)

            embedding = Embedding(
                chunk_id=test_chunk.id,
                vector=vector_binary,
                vector_dimension=3,
                model_name='test'
            )
            db.session.add(embedding)
            db.session.commit()

            # 反序列化
            restored_vector = pickle.loads(embedding.vector)
            np.testing.assert_array_equal(original_vector, restored_vector)


class TestChatModel:
    """Chat 模型测试"""

    def test_create_chat(self, app, test_user, test_scene):
        """测试创建对话"""
        with app.app_context():
            chat = Chat(
                session_id='test_session_001',
                user_id=test_user.id,
                scene_id=test_scene.id,
                title='测试对话',
                status='active'
            )
            db.session.add(chat)
            db.session.commit()

            assert chat.id is not None
            assert chat.session_id == 'test_session_001'
            assert chat.message_count == 0

    def test_chat_to_dict(self, app, test_chat):
        """测试对话序列化"""
        with app.app_context():
            chat_dict = test_chat.to_dict()
            assert 'session_id' in chat_dict
            assert 'created_at' in chat_dict
            assert 'messages' not in chat_dict  # 默认不包含

            chat_dict_with_messages = test_chat.to_dict(include_messages=True)
            assert 'messages' in chat_dict_with_messages


class TestMessageModel:
    """Message 模型测试"""

    def test_create_message(self, app, test_chat):
        """测试创建消息"""
        with app.app_context():
            message = Message(
                chat_id=test_chat.id,
                role='user',
                content='你好',
                token_count=5
            )
            db.session.add(message)
            db.session.commit()

            assert message.id is not None
            assert message.role == 'user'
            assert message.content == '你好'

    def test_message_with_rag_data(self, app, test_chat, test_chunk):
        """测试包含RAG数据的消息"""
        with app.app_context():
            message = Message(
                chat_id=test_chat.id,
                role='assistant',
                content='这是回答',
                retrieved_chunks=[test_chunk.id],
                sources=[{'chunk_id': test_chunk.id, 'score': 0.95}],
                model_name='gemini',
                response_time=500
            )
            db.session.add(message)
            db.session.commit()

            assert message.retrieved_chunks == [test_chunk.id]
            assert message.sources[0]['score'] == 0.95
            assert message.model_name == 'gemini'

    def test_message_to_dict(self, app, test_chat):
        """测试消息序列化"""
        with app.app_context():
            message = Message(
                chat_id=test_chat.id,
                role='user',
                content='测试',
                token_count=10
            )
            db.session.add(message)
            db.session.commit()

            msg_dict = message.to_dict()
            assert msg_dict['role'] == 'user'
            assert msg_dict['content'] == '测试'
            assert 'created_at' in msg_dict


# Pytest Fixtures
@pytest.fixture
def app():
    """创建测试应用"""
    from flask import Flask
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


@pytest.fixture
def test_user(app):
    """创建测试用户"""
    with app.app_context():
        user = User(
            username='test_user',
            email='test@example.com',
            password_hash='hashed'
        )
        db.session.add(user)
        db.session.commit()
        # 返回ID而不是对象，避免会话分离问题
        user_id = user.id
    return user_id


@pytest.fixture
def test_scene(app):
    """创建测试场景"""
    with app.app_context():
        scene = Scene(
            id='db_test',
            description='测试场景',
            icon='🧪',
            status='available'
        )
        db.session.add(scene)
        db.session.commit()
        scene_id = scene.id
    return scene_id


@pytest.fixture
def test_document(app, test_user, test_scene):
    """创建测试文档"""
    with app.app_context():
        doc = Document(
            filename='test.pdf',
            original_filename='测试.pdf',
            file_path='/uploads/test.pdf',
            file_type='pdf',
            file_size=1024,
            user_id=test_user,  # 使用ID
            scene_id=test_scene  # 使用ID
        )
        db.session.add(doc)
        db.session.commit()
        doc_id = doc.id
    return doc_id


@pytest.fixture
def test_chunk(app, test_document):
    """创建测试分片"""
    with app.app_context():
        chunk = DocumentChunk(
            document_id=test_document,  # 使用ID
            content='测试内容',
            chunk_index=0,
            char_count=4
        )
        db.session.add(chunk)
        db.session.commit()
        chunk_id = chunk.id
    return chunk_id


@pytest.fixture
def test_chat(app, test_user, test_scene):
    """创建测试对话"""
    with app.app_context():
        chat = Chat(
            session_id='test_session',
            user_id=test_user,  # 使用ID
            scene_id=test_scene,  # 使用ID
            status='active'
        )
        db.session.add(chat)
        db.session.commit()
        chat_id = chat.id
    return chat_id
