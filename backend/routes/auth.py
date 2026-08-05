"""认证路由：注册、登录、用户信息"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from database import get_db
from models.user import User
from config import settings
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["认证"])


# --- Pydantic Schemas ---
class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserUpdateRequest(BaseModel):
    username: str | None = None
    avatar: str | None = None
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    custom_api_key: str | None = None
    custom_base_url: str | None = None
    default_model: str | None = None


# --- Helper ---
def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


# --- Routes ---
@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """用户注册"""
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="该邮箱已被注册")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="密码至少6位")

    user = User(email=req.email, username=req.username)
    user.set_password(req.password)
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "access_token": create_token(user.id),
        "user": user.to_safe_dict(),
    }


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.verify_password(req.password):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="账户已被禁用")

    return {
        "access_token": create_token(user.id),
        "user": user.to_safe_dict(),
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return {"user": current_user.to_safe_dict()}


@router.put("/me")
def update_me(
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新用户信息"""
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return {"user": current_user.to_safe_dict()}
