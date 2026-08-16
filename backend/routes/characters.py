"""角色管理路由"""

import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.character import Character
from models.model_config import ModelConfig
from middleware.auth import get_current_user
from services.character_service import (
    create_character_from_dict,
    get_preset_characters,
    build_character_from_chatlog,
    build_character_from_novel,
)
from services.ai_service import generate_portrait_image

router = APIRouter(prefix="/api/characters", tags=["角色管理"])


# --- Schemas ---
class CharacterCreate(BaseModel):
    name: str
    avatar: str = "😊"
    avatar_image: str = ""
    system_prompt: str = ""
    personality: list = []
    background: str = ""
    style: str = ""
    example_dialogues: list = []
    greeting: str = "你好呀~"
    source_type: str = "custom"  # custom, preset, novel, chatlog
    source_text: str = ""


class CharacterUpdate(BaseModel):
    name: str | None = None
    avatar: str | None = None
    avatar_image: str | None = None
    system_prompt: str | None = None
    personality: list | None = None
    background: str | None = None
    style: str | None = None
    example_dialogues: list | None = None
    greeting: str | None = None
    source_type: str | None = None
    source_text: str | None = None


class NovelImportRequest(BaseModel):
    text: str
    character_name: str | None = None


class ChatlogImportRequest(BaseModel):
    text: str
    name: str | None = None
    user_label: str | None = None


class PortraitRequest(BaseModel):
    prompt: str | None = None  # 自定义提示词
    model: str | None = None  # 默认 gpt-image-1


# --- Routes ---
@router.get("")
def list_characters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取所有可用角色（预设 + 用户创建）"""
    presets = get_preset_characters()
    user_chars = (
        db.query(Character)
        .filter(
            Character.user_id == current_user.id,
            Character.is_preset == 0,
        )
        .order_by(Character.updated_at.desc())
        .all()
    )
    return {
        "characters": presets + [c.to_dict() for c in user_chars],
        "total": len(presets) + len(user_chars),
    }


@router.get("/presets")
def list_presets():
    """获取系统预设角色"""
    presets = get_preset_characters()
    return {"characters": presets, "total": len(presets)}


@router.post("")
def create_character(
    req: CharacterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """创建新角色"""
    char = create_character_from_dict(db, current_user.id, req.model_dump())
    return {"character": char.to_dict()}


@router.get("/{character_id}")
def get_character(
    character_id: str,
    db: Session = Depends(get_db),
):
    """获取角色详情"""
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在")
    return {"character": char.to_dict()}


@router.put("/{character_id}")
def update_character(
    character_id: str,
    req: CharacterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新角色"""
    char = (
        db.query(Character)
        .filter(Character.id == character_id, Character.user_id == current_user.id)
        .first()
    )
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在或无权修改")

    update_data = req.model_dump(exclude_unset=True)
    if "personality" in update_data:
        char.personality_list = update_data.pop("personality")
    if "example_dialogues" in update_data:
        char.example_dialogues_list = update_data.pop("example_dialogues")

    for field, value in update_data.items():
        setattr(char, field, value)

    db.commit()
    db.refresh(char)
    return {"character": char.to_dict()}


@router.delete("/{character_id}")
def delete_character(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除角色"""
    char = (
        db.query(Character)
        .filter(Character.id == character_id, Character.user_id == current_user.id)
        .first()
    )
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在或无权删除")
    if char.is_preset:
        raise HTTPException(status_code=400, detail="不能删除系统预设角色")

    db.delete(char)
    db.commit()
    return {"message": "删除成功"}


@router.post("/{character_id}/upload-avatar")
async def upload_avatar(
    character_id: str,
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """上传角色立绘（Base64 存储，限制 5MB）"""
    import base64

    char = (
        db.query(Character)
        .filter(Character.id == character_id, Character.user_id == current_user.id)
        .first()
    )
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件大小不能超过 5MB")

    mime_type = file.content_type or "image/png"
    b64 = base64.b64encode(content).decode("utf-8")
    char.avatar_image = f"data:{mime_type};base64,{b64}"
    db.commit()
    return {"message": "上传成功", "avatar_image": char.avatar_image[:100] + "..."}


@router.post("/import-novel")
def import_novel(
    req: NovelImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """从小说文本导入角色：正则提取说话人 + 台词风格分析，返回角色草稿"""
    try:
        draft = build_character_from_novel(req.text, req.character_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    from services.character_service import extract_names_from_text

    candidates = extract_names_from_text(req.text)[:6]
    return {"draft": draft, "candidates": candidates}


@router.post("/import-chatlog")
def import_chatlog(
    req: ChatlogImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """从聊天记录导入角色：解析双方对话，模拟其中一方的性格"""
    try:
        draft = build_character_from_chatlog(req.name or "", req.text, req.user_label)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"draft": draft}


@router.post("/{character_id}/generate-portrait")
async def generate_portrait(
    character_id: str,
    req: PortraitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AI 抽卡：调用 gpt-image-1 等图像模型为角色生成立绘"""
    char = (
        db.query(Character)
        .filter(Character.id == character_id, Character.user_id == current_user.id)
        .first()
    )
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在")

    # 取 API Key：优先用户的 OpenAI Key，其次用户配置的 openai/custom 模型
    api_key = current_user.openai_api_key or ""
    if not api_key:
        model_cfg = (
            db.query(ModelConfig)
            .filter(
                ModelConfig.user_id == current_user.id,
                ModelConfig.provider.in_(["openai", "custom"]),
            )
            .order_by(ModelConfig.updated_at.desc())
            .first()
        )
        if model_cfg and model_cfg.api_key:
            api_key = model_cfg.api_key
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="未找到 OpenAI API Key，请先在「设置」或「模型配置」中配置",
        )

    image_model = req.model or "gpt-image-1"

    # 构建绘画提示词
    personality = "、".join(char.personality_list) if char.personality_list else "温柔"
    base_prompt = req.prompt or (
        f"二次元动漫风格立绘，半身像，人物：{char.name}，"
        f"性格：{personality}。"
        f"背景设定：{char.background[:80] if char.background else '无特定背景'}。"
        f"画面精致唯美，柔和光影，高质量插画，无文字水印。"
    )

    try:
        data_url = await generate_portrait_image(api_key, image_model, base_prompt)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"生成立绘失败: {str(e)[:150]}")

    if not data_url:
        raise HTTPException(status_code=502, detail="图像接口未返回有效结果")

    # 限制存储体积（约 4MB 上限，防止 SQLite 膨胀）
    if len(data_url) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="生成的图片过大，请尝试其他模型")

    char.avatar_image = data_url
    db.commit()
    return {
        "message": "立绘生成成功",
        "avatar_image": data_url,
        "character": char.to_dict(),
    }
