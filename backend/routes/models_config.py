"""模型配置路由"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.model_config import ModelConfig
from middleware.auth import get_current_user
from services.ai_service import test_model_connection

router = APIRouter(prefix="/api/models", tags=["模型配置"])


# --- Schemas ---
class ModelCreate(BaseModel):
    name: str
    provider: str  # openai, anthropic, custom
    api_key: str = ""
    base_url: str = "https://api.openai.com/v1"
    model: str
    is_active: bool = False
    max_tokens: int = 4096
    temperature: float = 0.7
    top_p: float = 1.0


class ModelUpdate(BaseModel):
    name: str | None = None
    provider: str | None = None
    api_key: str | None = None
    base_url: str | None = None
    model: str | None = None
    is_active: bool | None = None
    max_tokens: int | None = None
    temperature: float | None = None
    top_p: float | None = None


class TestRequest(BaseModel):
    provider: str
    api_key: str
    base_url: str = "https://api.openai.com/v1"
    model: str


# --- Routes ---
@router.get("")
def list_models(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取当前用户的所有模型配置"""
    models = (
        db.query(ModelConfig)
        .filter(ModelConfig.user_id == current_user.id)
        .order_by(ModelConfig.updated_at.desc())
        .all()
    )
    return {"models": [m.to_safe_dict() for m in models]}


@router.post("")
def create_model(
    req: ModelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """添加新模型配置"""
    if req.is_active:
        # 取消其他模型的激活状态
        db.query(ModelConfig).filter(
            ModelConfig.user_id == current_user.id, ModelConfig.is_active == True
        ).update({"is_active": False})

    model = ModelConfig(user_id=current_user.id, **req.model_dump())
    db.add(model)
    db.commit()
    db.refresh(model)
    return {"model": model.to_safe_dict()}


@router.put("/{model_id}")
def update_model(
    model_id: str,
    req: ModelUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新模型配置"""
    model = (
        db.query(ModelConfig)
        .filter(ModelConfig.id == model_id, ModelConfig.user_id == current_user.id)
        .first()
    )
    if not model:
        raise HTTPException(status_code=404, detail="模型配置不存在")

    update_data = req.model_dump(exclude_unset=True)

    if update_data.get("is_active"):
        db.query(ModelConfig).filter(
            ModelConfig.user_id == current_user.id, ModelConfig.is_active == True
        ).update({"is_active": False})

    for field, value in update_data.items():
        setattr(model, field, value)

    db.commit()
    db.refresh(model)
    return {"model": model.to_safe_dict()}


@router.delete("/{model_id}")
def delete_model(
    model_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除模型配置"""
    model = (
        db.query(ModelConfig)
        .filter(ModelConfig.id == model_id, ModelConfig.user_id == current_user.id)
        .first()
    )
    if not model:
        raise HTTPException(status_code=404, detail="模型配置不存在")

    db.delete(model)
    db.commit()
    return {"message": "删除成功"}


@router.post("/test")
async def test_model(
    req: TestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """测试模型连接是否可用"""
    # 如果没传 api_key，尝试从用户配置或模型配置中获取
    api_key = req.api_key
    if not api_key:
        # 尝试从用户存储的 key 获取
        key_attr = f"{req.provider}_api_key"
        api_key = getattr(current_user, key_attr, "")
    if not api_key:
        # 尝试从该用户的同名模型配置获取
        model_cfg = (
            db.query(ModelConfig)
            .filter(
                ModelConfig.user_id == current_user.id,
                ModelConfig.provider == req.provider,
            )
            .first()
        )
        if model_cfg and model_cfg.api_key:
            api_key = model_cfg.api_key
    if not api_key:
        return {"success": False, "message": "未找到 API Key，请先在设置页面配置"}

    try:
        result = await test_model_connection(
            provider=req.provider,
            api_key=api_key,
            base_url=req.base_url,
            model=req.model,
        )
        return {"success": result, "message": "连接正常 ✓" if result else "连接失败，请检查 API Key 和网络"}
    except Exception as e:
        return {"success": False, "message": f"连接异常: {str(e)[:100]}"}
