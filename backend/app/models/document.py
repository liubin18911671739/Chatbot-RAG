from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Document(Base):
    __tablename__ = 'documents'

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    uploaded_by = Column(String(255), nullable=False)
    upload_date = Column(String(50), nullable=False)

    def __repr__(self):
        return f"<Document(id={self.id}, title={self.title}, uploaded_by={self.uploaded_by}, upload_date={self.upload_date})>"