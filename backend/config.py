"""SoulMate 配置管理"""

import os
import sys

from pydantic import model_validator
from pydantic_settings import BaseSettings
from typing import List


def _default_data_dir() -> str:
    """数据目录（数据库 / 上传文件）：
    - 源码运行：backend 目录（与之前行为一致）
    - PyInstaller 打包版：优先 exe 所在目录（便携模式）；
      若不可写（如安装到 Program Files 后从快捷方式启动），
      回退到 %APPDATA%/SoulMate —— 否则启动即闪退。
    """
    if getattr(sys, "frozen", False):
        exe_dir = os.path.dirname(os.path.abspath(sys.executable))
        try:
            probe = os.path.join(exe_dir, ".soulmate_write_probe")
            with open(probe, "w", encoding="utf-8") as f:
                f.write("ok")
            os.remove(probe)
            return exe_dir
        except OSError:
            appdata = os.environ.get("APPDATA") or os.path.expanduser("~")
            fallback = os.path.join(appdata, "SoulMate")
            os.makedirs(fallback, exist_ok=True)
            return fallback
    return os.path.dirname(os.path.abspath(__file__))


DATA_DIR = _default_data_dir()


class Settings(BaseSettings):
    # 应用
    APP_NAME: str = "SoulMate"
    SECRET_KEY: str = "dev-secret-change-in-production-xxxxxxxxxx"
    DEBUG: bool = True

    # 数据库（默认放在数据目录；.env 中可覆盖）
    DATABASE_URL: str = ""

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
    UPLOAD_DIR: str = ""

    # 管理员
    ADMIN_EMAIL: str = "admin@soulmate.app"
    ADMIN_PASSWORD: str = "admin123"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @model_validator(mode="after")
    def _fill_defaults(self):
        frozen = getattr(sys, "frozen", False)
        if not self.DATABASE_URL or (frozen and self.DATABASE_URL.startswith("sqlite:///./")):
            # 打包版：无论是否提供了相对路径，都固定到数据目录（避免 CWD 不可写闪退）
            db_path = os.path.join(DATA_DIR, "soulmate.db").replace(os.sep, "/")
            self.DATABASE_URL = f"sqlite:///{db_path}"
        if not self.UPLOAD_DIR:
            self.UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
        return self

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()

# 确保数据目录与上传目录存在（不可写时启动即失败，提前给出清晰报错）
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except OSError as e:
    raise RuntimeError(
        f"无法创建数据目录 {settings.UPLOAD_DIR}，请检查磁盘权限: {e}"
    )
