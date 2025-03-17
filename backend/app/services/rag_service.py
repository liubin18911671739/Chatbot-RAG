from flask import jsonify, request
from app.services.vector_db import VectorDatabase
from app.services.model_service import ModelService
import asyncio
import os

class RAGService:
    def __init__(self, index_file="default_index.faiss"):
        self.vector_db_service = VectorDatabase(index_file)
        self.model_service = ModelService()

    def get_answer(self, user_query, scene):
        # Step 1: Retrieve relevant documents from the vector database based on the user query
        relevant_docs = self.vector_db_service.retrieve_documents(user_query, scene)

        # Step 2: Generate an answer using the retrieved documents
        answer = self.model_service.generate_response(user_query, relevant_docs)

        return jsonify({
            'query': user_query,
            'scene': scene,
            'answer': answer
        })

    def upload_document(self, file):
        # Process the uploaded document and store it in the vector database
        if file:
            self.vector_db_service.add_vectors(file)
            return jsonify({'message': 'Document uploaded successfully.'}), 201
        return jsonify({'error': 'No file provided.'}), 400

    def get_scenes(self):
        # Return a list of available scenes for the user
        scenes = ['general', 'arab_china', 'political_education', 'regional_country', 'arab_celebrity']
        return jsonify({'scenes': scenes})
        
    async def handle_user_input(self, student_id, prompt, sensitive_words, card_pinyin=None):
        """
        处理用户输入并生成回复
        
        :param student_id: 学生ID
        :param prompt: 用户输入的问题
        :param sensitive_words: 敏感词列表
        :param card_pinyin: 选择的知识库标识
        :return: 包含回答的字典
        """
        scene = card_pinyin if card_pinyin else "general"
        
        # 检索相关文档
        relevant_docs = self.vector_db_service.retrieve_documents(prompt, scene)
        
        # 生成回答
        answer = self.model_service.generate_response(prompt, relevant_docs)
        
        return {
            "answer": answer,
            "query": prompt,
            "scene": scene,
            "attachment_paths": []  # 如果有附件路径，可以在这里添加
        }