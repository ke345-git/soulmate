"""SoulMate 配置管理"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # 应用
    APP_NAME: str = "SoulMate"
    SECRET_KEY: str = "dev-secret-change-in-production-xxxxxxxxxx"
    DEBUG: bool = True

    # 数据库
    DATABASE_URL: str = "sqlite:///./soulmate.db"

    # JWT
    JWT_SECRET: str = "jwt-dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 168  # 7 days

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # 速率限制
    RATE_LIMIT_PER_MINUTE: str = "60/minute"
    RATE_LIMIT_PER_DAY: str = "1000/day"

    # 上传
    MAX_UPLOAD_SIZE_MB: int = 5
    UPLOAD_DIR: str = "uploads"

    # 管理员
    ADMIN_EMAIL: str = "admin@soulmate.app"
    ADMIN_PASSWORD: str = "admin123"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()

# 确保上传目录存在
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
