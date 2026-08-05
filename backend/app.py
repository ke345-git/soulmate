"""SoulMate — AI 情感陪伴应用
FastAPI 入口
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings
from database import init_db
from routes import auth_router, models_router, characters_router, chat_router

# 速率限制器
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="开源 AI 情感陪伴应用 — Replika 替代品",
    version="1.0.0",
    lifespan=lifespan,
)

# 速率限制
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求体大小限制中间件
MAX_BODY_SIZE = 5 * 1024 * 1024  # 5MB


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    if request.headers.get("content-length"):
        content_length = int(request.headers["content-length"])
        if content_length > MAX_BODY_SIZE:
            return JSONResponse(
                status_code=413,
                content={"detail": "请求体过大，最大允许 5MB"},
            )
    response = await call_next(request)
    return response


# 注册路由
app.include_router(auth_router)
app.include_router(models_router)
app.include_router(characters_router)
app.include_router(chat_router)


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    """健康检查接口"""
    return {"status": "ok", "app": settings.APP_NAME}


# Gunicorn 入口
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
