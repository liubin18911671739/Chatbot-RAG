from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models.document import Document
from app.utils.document_processor import process_document
from app.extensions import db

documents = Blueprint('documents', __name__)

@documents.route('/')
def index():
    """显示所有文档"""
    all_documents = Document.query.all()
    return render_template('documents/index.html', documents=all_documents)

@documents.route('/documents/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        file = request.files.get('file')
        if file:
            category = request.form.get('category')
            if process_document(file, category):
                flash('Document uploaded successfully!', 'success')
                return redirect(url_for('documents.index'))
            else:
                flash('Failed to process document.', 'danger')
        else:
            flash('No file selected.', 'danger')
    return render_template('documents/upload.html')