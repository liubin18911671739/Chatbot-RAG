from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

class Scene(db.Model):
    __tablename__ = 'scenes'
    
    id = db.Column(db.String(50), primary_key=True)
    description = db.Column(db.String(255), nullable=False)
    icon = db.Column(db.String(10), nullable=True)
    status = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f'<Scene {self.id}>'

class Feedback(db.Model):
    __tablename__ = 'feedback'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)

    user = db.relationship('User', backref=db.backref('feedbacks', lazy=True))

    def __repr__(self):
        return f'<Feedback {self.id}>'

class Greeting(db.Model):
    __tablename__ = 'greetings'
    
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(255), nullable=False)

    def __repr__(self):
        return f'<Greeting {self.message}>'