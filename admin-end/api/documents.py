from flask import Blueprint, request, jsonify
from app.models.document import Document
from app import db

documents_api = Blueprint('documents_api', __name__)

@documents_api.route('/documents', methods=['GET'])
def get_documents():
    documents = Document.query.all()
    return jsonify([doc.to_dict() for doc in documents]), 200

@documents_api.route('/documents', methods=['POST'])
def upload_document():
    data = request.json
    new_document = Document(title=data['title'], content=data['content'])
    db.session.add(new_document)
    db.session.commit()
    return jsonify(new_document.to_dict()), 201

@documents_api.route('/documents/<int:document_id>', methods=['DELETE'])
def delete_document(document_id):
    document = Document.query.get_or_404(document_id)
    db.session.delete(document)
    db.session.commit()
    return jsonify({'message': 'Document deleted successfully'}), 200

@documents_api.route('/documents/<int:document_id>', methods=['PUT'])
def update_document(document_id):
    document = Document.query.get_or_404(document_id)
    data = request.json
    document.title = data.get('title', document.title)
    document.content = data.get('content', document.content)
    db.session.commit()
    return jsonify(document.to_dict()), 200