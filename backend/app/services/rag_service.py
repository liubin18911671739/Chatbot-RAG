from flask import jsonify, request
from app.services.vector_db import VectorDatabase
from app.services.model_service import ModelService

class RAGService:
    def __init__(self):
        self.vector_db_service = VectorDatabase()
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