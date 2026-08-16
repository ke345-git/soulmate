"""SoulMate — AI 情感陪伴应用
FastAPI 入口
"""

import os
import sys
import threading
import webbrowser
from contextlib import asynccontextmanager

# Windows 控制台默认 GBK：打印 emoji 会抛 UnicodeEncodeError 导致打包版启动即闪退。
# 强制 UTF-8 输出并用 replace 容错。
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from fastapi import FastAPI, Request, HTTPException
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


def get_portraits_dir():
    """获取内置立绘目录（兼容 PyInstaller 打包）"""
    if getattr(sys, 'frozen', False):
        return os.path.join(sys._MEIPASS, "portraits")
    return os.path.join(os.path.dirname(__file__), "portraits")


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
    version="1.1.1",
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


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}


# 提供前端静态文件
STATIC_DIR = get_static_dir()
HAS_STATIC = os.path.exists(STATIC_DIR) and os.path.isdir(STATIC_DIR)

if HAS_STATIC:
    # 静态资源
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # 内置免费立绘（必须在 SPA fallback 之前挂载）
    portraits_dir = get_portraits_dir()
    if os.path.isdir(portraits_dir):
        app.mount("/portraits", StaticFiles(directory=portraits_dir), name="portraits")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """SPA fallback — 只处理非 API 请求"""
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    @app.get("/")
    async def root_spa():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "name": settings.APP_NAME,
            "version": "1.1.1",
            "status": "running",
            "docs": "/docs",
        }


# ─── 启动入口 ───────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    is_desktop = os.environ.get("SOULMATE_DESKTOP", "0") == "1"

    if is_desktop or getattr(sys, 'frozen', False):
        # 桌面模式：自动打开浏览器
        print(f"💝 SoulMate 启动中... 浏览器将自动打开 http://localhost:{port}")
        threading.Thread(target=open_browser, args=(port,), daemon=True).start()

    # 直接传 app 实例而非字符串 "app:app"：
    # PyInstaller 冻结环境下按模块名重新导入主脚本会失败（Could not import module "app"）
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
