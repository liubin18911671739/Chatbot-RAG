from datetime import datetime
from app.extensions import db

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    filename = db.Column(db.String(120))
    file_path = db.Column(db.String(255))
    file_type = db.Column(db.String(20))
    content = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, processing, processed, error
    category = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    def __repr__(self):
        return f'<Document {self.title}>'