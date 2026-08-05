"""角色管理路由"""

import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.character import Character
from middleware.auth import get_current_user
from services.character_service import (
    create_character_from_dict,
    get_preset_characters,
)

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


class NovelImportRequest(BaseModel):
    text: str
    character_name: str | None = None


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
    """从小说文本导入角色（V2功能，MVP阶段返回基础分析）"""
    import re

    # 简单正则提取人名（中文双字/三字）
    names = set(re.findall(r"[一-龥]{2,3}(?:说道|说|道|：|,)", req.text))
    extracted_names = [n.replace("说道", "").replace("说", "").replace("道", "").replace("：", "").replace(",", "") for n in names]
    extracted_names = list(set(extracted_names))[:10]

    # 提取对话
    dialogues = re.findall(r"「([^」]+)」|\"([^\"]+)\"", req.text)
    sample_dialogues = [d[0] or d[1] for d in dialogues[:10]]

    return {
        "extracted_names": extracted_names,
        "sample_dialogues": sample_dialogues,
        "text_length": len(req.text),
        "message": "小说分析完成。完整角色提取功能将在 V2 中上线，目前可以使用提取的信息手动创建角色。",
    }
