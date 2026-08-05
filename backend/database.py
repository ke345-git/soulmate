"""SQLAlchemy 数据库配置"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

# SQLite 需要启用外键约束
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=False,
)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """启用 SQLite 外键约束和 WAL 模式"""
    if "sqlite" in settings.DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """获取数据库会话的依赖注入"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """初始化数据库，创建所有表"""
    from models.user import User
    from models.character import Character
    from models.chat import ChatSession, ChatMessage, ChatEmbedding
    from models.model_config import ModelConfig

    Base.metadata.create_all(bind=engine)

    # 创建管理员账户
    db = SessionLocal()
    try:
        from models.user import User
        if not db.query(User).filter(User.email == settings.ADMIN_EMAIL).first():
            admin = User(
                email=settings.ADMIN_EMAIL,
                username="admin",
                is_admin=True,
            )
            admin.set_password(settings.ADMIN_PASSWORD)
            db.add(admin)
            db.commit()

            # 初始化默认角色
            from services.character_service import init_default_characters
            init_default_characters(db)
    finally:
        db.close()
