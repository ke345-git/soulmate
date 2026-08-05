"""角色模型"""

import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from database import Base
from models.user import generate_uuid


class Character(Base):
    __tablename__ = "characters"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # NULL = 系统预设
    name = Column(String, nullable=False)
    avatar = Column(String, default="😊")  # emoji 或 base64 图片
    avatar_image = Column(Text, default="")  # base64 编码的自定义立绘
    system_prompt = Column(Text, nullable=False)
    personality = Column(Text, default="[]")  # JSON 数组字符串
    background = Column(Text, default="")
    style = Column(Text, default="")
    example_dialogues = Column(Text, default="[]")  # JSON 数组字符串
    source_type = Column(String, default="custom")  # custom, preset, novel
    source_text = Column(Text, default="")
    greeting = Column(String, default="你好呀~")
    is_preset = Column(Integer, default=0)  # 0=用户创建, 1=系统预设
    chat_count = Column(Integer, default=0)  # 聊天次数统计
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # 关系
    creator = relationship("User", back_populates="characters")
    chat_sessions = relationship("ChatSession", back_populates="character", cascade="all, delete-orphan")

    @property
    def personality_list(self) -> list:
        try:
            return json.loads(self.personality)
        except (json.JSONDecodeError, TypeError):
            return []

    @personality_list.setter
    def personality_list(self, value: list):
        self.personality = json.dumps(value, ensure_ascii=False)

    @property
    def example_dialogues_list(self) -> list:
        try:
            return json.loads(self.example_dialogues)
        except (json.JSONDecodeError, TypeError):
            return []

    @example_dialogues_list.setter
    def example_dialogues_list(self, value: list):
        self.example_dialogues = json.dumps(value, ensure_ascii=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "avatar": self.avatar,
            "avatar_image": self.avatar_image or "",
            "system_prompt": self.system_prompt,
            "personality": self.personality_list,
            "background": self.background,
            "style": self.style,
            "example_dialogues": self.example_dialogues_list,
            "source_type": self.source_type,
            "source_text": self.source_text,
            "greeting": self.greeting,
            "is_preset": bool(self.is_preset),
            "chat_count": self.chat_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
