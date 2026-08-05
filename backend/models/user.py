"""用户模型"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from passlib.context import CryptContext
from database import Base

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar = Column(String, default="👤")
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # API Keys (用户自带)
    openai_api_key = Column(String, default="")
    anthropic_api_key = Column(String, default="")
    custom_api_key = Column(String, default="")
    custom_base_url = Column(String, default="")
    default_model = Column(String, default="gpt-4o")

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # 关系
    characters = relationship("Character", back_populates="creator", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    model_configs = relationship("ModelConfig", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password: str):
        self.hashed_password = pwd_context.hash(password)

    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.hashed_password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "avatar": self.avatar,
            "is_admin": self.is_admin,
            "default_model": self.default_model,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_safe_dict(self):
        """不含敏感信息的字典"""
        d = self.to_dict()
        d["has_openai_key"] = bool(self.openai_api_key)
        d["has_anthropic_key"] = bool(self.anthropic_api_key)
        d["has_custom_key"] = bool(self.custom_api_key)
        d["custom_base_url"] = self.custom_base_url or ""
        return d
