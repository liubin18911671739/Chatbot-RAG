import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_default_secret_key'
    DEBUG = os.environ.get('DEBUG', 'False').lower() in ['true', '1']
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'mysql://user:password@localhost/db_name'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    VECTOR_DB_URI = os.environ.get('VECTOR_DB_URI') or 'http://localhost:8000'
    RAG_MODEL_URI = os.environ.get('RAG_MODEL_URI') or 'http://localhost:5000'
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or 'backend/data/uploaded_docs'
    ALLOWED_EXTENSIONS = {'pdf', 'docx'}