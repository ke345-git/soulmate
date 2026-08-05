"""模型配置模型"""

from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Float, Boolean
from sqlalchemy.orm import relationship
from database import Base
from models.user import generate_uuid


class ModelConfig(Base):
    __tablename__ = "model_configs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)  # 显示名称，如 "GPT-4"
    provider = Column(String, nullable=False)  # openai, anthropic, azure, custom
    api_key = Column(Text, default="")
    base_url = Column(String, default="https://api.openai.com/v1")
    model = Column(String, nullable=False)  # 模型 ID，如 "gpt-4o"
    is_active = Column(Boolean, default=False)
    max_tokens = Column(Integer, default=4096)
    temperature = Column(Float, default=0.7)
    top_p = Column(Float, default=1.0)
    extra_config = Column(Text, default="{}")  # 额外配置 JSON
    last_test_result = Column(String, default="")  # online/offline/unknown
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    user = relationship("User", back_populates="model_configs")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "provider": self.provider,
            "base_url": self.base_url,
            "model": self.model,
            "is_active": self.is_active,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "last_test_result": self.last_test_result or "unknown",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_safe_dict(self):
        """不含 API Key 的字典"""
        d = self.to_dict()
        d["has_api_key"] = bool(self.api_key)
        return d
