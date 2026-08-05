"""SoulMate — AI 情感陪伴应用
FastAPI 入口
"""

import os
import sys
import threading
import webbrowser
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings
from database import init_db
from routes import auth_router, models_router, characters_router, chat_router

# 速率限制器
limiter = Limiter(key_func=get_remote_address)


def get_static_dir():
    """获取前端静态文件目录（兼容 PyInstaller 打包）"""
    # PyInstaller 打包后的路径
    if getattr(sys, 'frozen', False):
        return os.path.join(sys._MEIPASS, "static")
    # 正常 Python 运行
    return os.path.join(os.path.dirname(__file__), "static")


def open_browser(port: int):
    """延迟打开浏览器"""
    import time
    time.sleep(2)
    webbrowser.open(f"http://localhost:{port}")


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


# 注册 API 路由
app.include_router(auth_router)
app.include_router(models_router)
app.include_router(characters_router)
app.include_router(chat_router)

# 提供前端静态文件
STATIC_DIR = get_static_dir()
HAS_STATIC = os.path.exists(STATIC_DIR) and os.path.isdir(STATIC_DIR)

if HAS_STATIC:
    # 静态资源
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """SPA fallback"""
        file_path = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    @app.get("/")
    async def root_spa():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
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
    return {"status": "ok", "app": settings.APP_NAME}


# ─── 启动入口 ───────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    is_desktop = os.environ.get("SOULMATE_DESKTOP", "0") == "1"

    if is_desktop or getattr(sys, 'frozen', False):
        # 桌面模式：自动打开浏览器
        print(f"💝 SoulMate 启动中... 浏览器将自动打开 http://localhost:{port}")
        threading.Thread(target=open_browser, args=(port,), daemon=True).start()

    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
