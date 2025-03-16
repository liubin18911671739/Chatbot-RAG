from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base


Base = declarative_base()


class ChatRecord(Base):
    __tablename__ = 'chat_records'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    agent_id = Column(Integer, nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ChatRecord(id={self.id}, user_id={self.user_id}, agent_id={self.agent_id}, created_at={self.created_at})>"