"""聊天与记忆模型"""

import json
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
from database import Base
from models.user import generate_uuid


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    character_id = Column(String, ForeignKey("characters.id"), nullable=False)
    title = Column(String, default="新对话")
    summary = Column(Text, default="")  # AI 生成的对话摘要
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    user = relationship("User", back_populates="chat_sessions")
    character = relationship("Character", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session",
                            cascade="all, delete-orphan",
                            order_by="ChatMessage.created_at")
    embeddings = relationship("ChatEmbedding", back_populates="session",
                              cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "character_id": self.character_id,
            "title": self.title,
            "summary": self.summary,
            "is_active": bool(self.is_active),
            "character_name": self.character.name if self.character else "",
            "character_avatar": self.character.avatar if self.character else "😊",
            "message_count": len(self.messages) if self.messages else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    session = relationship("ChatSession", back_populates="messages")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "role": self.role,
            "content": self.content,
            "token_count": self.token_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ChatEmbedding(Base):
    """记忆向量存储"""
    __tablename__ = "chat_embeddings"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    vector_json = Column(Text, default="[]")  # JSON 格式存储向量
    memory_type = Column(String, default="auto")  # auto=自动提取, manual=手动添加, important=重要记忆
    importance = Column(Integer, default=5)  # 1-10 重要度
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    session = relationship("ChatSession", back_populates="embeddings")

    @property
    def vector(self) -> list:
        try:
            return json.loads(self.vector_json)
        except (json.JSONDecodeError, TypeError):
            return []

    @vector.setter
    def vector(self, value: list):
        self.vector_json = json.dumps(value)

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "text": self.text,
            "memory_type": self.memory_type,
            "importance": self.importance,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
