from flask import Blueprint, request, jsonify
from app.services.rag_service import RAGService

chat_bp = Blueprint('chat', __name__)
rag_service = RAGService()

@chat_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_question = data.get('question')
    scene = data.get('scene')

    if not user_question or not scene:
        return jsonify({'error': 'Question and scene are required.'}), 400

    try:
        response = rag_service.get_response(user_question, scene)
        return jsonify({'response': response}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500