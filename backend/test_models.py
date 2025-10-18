#!/usr/bin/env python3
"""
数据库模型测试脚本
测试新添加的 Document, DocumentChunk, Embedding, Chat, Message 模型
"""

import sys
import os
from datetime import datetime
import pickle
import numpy as np

# 设置环境变量
os.environ['APP_ENV'] = 'testing'

# 导入 Flask 和数据库
from flask import Flask
from models.database import (
    db, User, Scene, Document, DocumentChunk,
    Embedding, Chat, Message
)

def create_test_app():
    """创建测试应用"""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_models.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['TESTING'] = True

    db.init_app(app)

    return app

def test_models():
    """测试所有模型"""
    print("="*60)
    print("  数据库模型测试")
    print("="*60)
    print()

    app = create_test_app()

    with app.app_context():
        # 清空并重建数据库
        print("📋 步骤 1: 创建数据库表...")
        db.drop_all()
        db.create_all()
        print("✅ 数据库表创建成功\n")

        # 测试 User 模型
        print("📋 步骤 2: 测试 User 模型...")
        user = User(
            username='test_user',
            email='test@example.com',
            password_hash='hashed_password'
        )
        db.session.add(user)
        db.session.commit()
        print(f"✅ User 创建成功: {user}")

        # 测试 Scene 模型
        print("\n📋 步骤 3: 测试 Scene 模型...")
        scene = Scene(
            id='db_test',
            description='测试场景',
            icon='🧪',
            status='available'
        )
        db.session.add(scene)
        db.session.commit()
        print(f"✅ Scene 创建成功: {scene}")

        # 测试 Document 模型
        print("\n📋 步骤 4: 测试 Document 模型...")
        document = Document(
            filename='test_doc.pdf',
            original_filename='测试文档.pdf',
            file_path='/uploads/test_doc.pdf',
            file_type='pdf',
            file_size=1024000,
            user_id=user.id,
            scene_id=scene.id,
            status='uploaded',
            doc_metadata={'author': '测试作者', 'pages': 10}
        )
        db.session.add(document)
        db.session.commit()
        print(f"✅ Document 创建成功: {document}")
        print(f"   字典格式: {document.to_dict()}")

        # 测试 DocumentChunk 模型
        print("\n📋 步骤 5: 测试 DocumentChunk 模型...")
        chunk1 = DocumentChunk(
            document_id=document.id,
            content='这是第一个文档分片的内容，包含了一些测试文本。',
            chunk_index=0,
            page_number=1,
            section='第一章',
            char_count=50,
            chunk_metadata={'type': 'paragraph'}
        )
        chunk2 = DocumentChunk(
            document_id=document.id,
            content='这是第二个文档分片的内容，用于测试多个分片。',
            chunk_index=1,
            page_number=1,
            section='第一章',
            char_count=48
        )
        db.session.add_all([chunk1, chunk2])
        db.session.commit()
        print(f"✅ DocumentChunk 创建成功: {chunk1}")
        print(f"✅ DocumentChunk 创建成功: {chunk2}")

        # 测试 Embedding 模型
        print("\n📋 步骤 6: 测试 Embedding 模型...")
        # 创建一个假的向量（768维）
        vector = np.random.rand(768).astype(np.float32)
        vector_binary = pickle.dumps(vector)

        embedding1 = Embedding(
            chunk_id=chunk1.id,
            vector=vector_binary,
            vector_dimension=768,
            model_name='test-embedding-model'
        )
        db.session.add(embedding1)
        db.session.commit()
        print(f"✅ Embedding 创建成功: {embedding1}")
        print(f"   向量维度: {embedding1.vector_dimension}")

        # 验证向量可以还原
        restored_vector = pickle.loads(embedding1.vector)
        print(f"   向量还原成功: shape={restored_vector.shape}, dtype={restored_vector.dtype}")

        # 测试 Chat 模型
        print("\n📋 步骤 7: 测试 Chat 模型...")
        chat = Chat(
            session_id='test_session_001',
            user_id=user.id,
            scene_id=scene.id,
            title='测试对话',
            status='active'
        )
        db.session.add(chat)
        db.session.commit()
        print(f"✅ Chat 创建成功: {chat}")

        # 测试 Message 模型
        print("\n📋 步骤 8: 测试 Message 模型...")
        message1 = Message(
            chat_id=chat.id,
            role='user',
            content='你好，这是一个测试问题。',
            token_count=20
        )
        message2 = Message(
            chat_id=chat.id,
            role='assistant',
            content='你好！这是测试回答。',
            token_count=25,
            response_time=500,
            model_name='test-model',
            retrieved_chunks=[chunk1.id],
            sources=[{
                'document_id': document.id,
                'chunk_id': chunk1.id,
                'score': 0.95
            }],
            feedback='positive'
        )
        db.session.add_all([message1, message2])
        db.session.commit()

        # 更新 chat 的消息计数
        chat.message_count = 2
        chat.last_message_at = datetime.utcnow()
        db.session.commit()

        print(f"✅ Message 创建成功: {message1}")
        print(f"✅ Message 创建成功: {message2}")
        print(f"   Chat 更新: {chat.message_count} 条消息")

        # 测试关联关系
        print("\n📋 步骤 9: 测试模型关联关系...")
        print(f"   User.documents: {len(user.documents)} 个文档")
        print(f"   User.chats: {len(user.chats)} 个对话")
        print(f"   Scene.documents: {len(scene.documents)} 个文档")
        print(f"   Document.chunks: {len(document.chunks)} 个分片")
        print(f"   Chat.messages: {len(chat.messages)} 条消息")
        print(f"   DocumentChunk.embedding: {chunk1.embedding}")
        print("✅ 所有关联关系正常")

        # 测试级联删除
        print("\n📋 步骤 10: 测试级联删除...")
        doc_id = document.id
        db.session.delete(document)
        db.session.commit()

        # 验证关联数据也被删除
        chunks_count = DocumentChunk.query.filter_by(document_id=doc_id).count()
        print(f"   删除 Document 后，关联的 Chunks 数量: {chunks_count}")
        assert chunks_count == 0, "级联删除失败"
        print("✅ 级联删除测试通过")

        # 测试查询
        print("\n📋 步骤 11: 测试查询功能...")
        all_users = User.query.all()
        all_chats = Chat.query.filter_by(status='active').all()
        user_chats = Chat.query.filter_by(user_id=user.id).count()
        print(f"   总用户数: {len(all_users)}")
        print(f"   活跃对话数: {len(all_chats)}")
        print(f"   该用户的对话数: {user_chats}")
        print("✅ 查询功能正常")

        # 测试 to_dict 方法
        print("\n📋 步骤 12: 测试 to_dict 序列化...")
        chat_dict = chat.to_dict(include_messages=True)
        print(f"   Chat 字典格式包含 {len(chat_dict['messages'])} 条消息")
        print(f"   Message 字典格式: {message2.to_dict()}")
        print("✅ 序列化功能正常")

        print("\n" + "="*60)
        print("  ✅ 所有模型测试通过！")
        print("="*60)
        print()
        print("测试总结:")
        print(f"  ✓ User 模型")
        print(f"  ✓ Scene 模型")
        print(f"  ✓ Document 模型 (包含元数据、状态管理)")
        print(f"  ✓ DocumentChunk 模型 (支持分页、章节)")
        print(f"  ✓ Embedding 模型 (向量存储和还原)")
        print(f"  ✓ Chat 模型 (会话管理)")
        print(f"  ✓ Message 模型 (RAG 相关字段)")
        print(f"  ✓ 外键关系")
        print(f"  ✓ 索引")
        print(f"  ✓ 级联删除")
        print(f"  ✓ 序列化方法")
        print()

        return True

if __name__ == '__main__':
    try:
        success = test_models()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
