from datetime import datetime
from app.extensions import db

class Log(db.Model):
    __tablename__ = 'logs'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    level = db.Column(db.String(20))
    message = db.Column(db.Text)
    source = db.Column(db.String(50))
    
    def __repr__(self):
        return f'<Log {self.id}: {self.level}>'