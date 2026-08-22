"""聊天路由"""

import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import get_db
from models.user import User
from models.character import Character
from models.chat import ChatSession, ChatMessage, ChatEmbedding
from models.model_config import ModelConfig
from middleware.auth import get_current_user
from services.ai_service import chat_completion_stream
from services.memory_service import (
    add_chat_memory,
    search_memories,
    generate_session_summary,
)

router = APIRouter(prefix="/api/chat", tags=["聊天"])


# --- Schemas ---
class ChatRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    session_id: str | None = None
    character_id: str
    content: str
    model_id: str | None = None


class MemoryCreate(BaseModel):
    session_id: str
    text: str
    memory_type: str = "manual"
    importance: int = 5


# --- Routes ---
@router.get("/sessions")
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取当前用户的聊天会话列表"""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id, ChatSession.is_active == 1)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return {"sessions": [s.to_dict() for s in sessions]}


@router.post("/sessions")
def create_session(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """创建新聊天会话"""
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在")

    session = ChatSession(
        user_id=current_user.id,
        character_id=character_id,
        title=f"与{char.name}的对话",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session": session.to_dict()}


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除（软删除）聊天会话"""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    session.is_active = 0
    db.commit()
    return {"message": "删除成功"}


@router.get("/sessions/{session_id}/messages")
def get_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取聊天记录"""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return {"messages": [m.to_dict() for m in messages], "session": session.to_dict()}


@router.post("/send")
async def send_message(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """发送消息（SSE 流式返回）"""
    # 验证角色
    char = db.query(Character).filter(Character.id == req.character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在")

    # 获取或创建会话
    if req.session_id:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == req.session_id, ChatSession.user_id == current_user.id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")
    else:
        session = ChatSession(
            user_id=current_user.id,
            character_id=req.character_id,
            title=f"与{char.name}的对话",
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # 保存用户消息
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=req.content,
    )
    db.add(user_msg)
    db.commit()

    # 获取活跃模型配置
    if req.model_id:
        model_config = (
            db.query(ModelConfig)
            .filter(ModelConfig.id == req.model_id, ModelConfig.user_id == current_user.id)
            .first()
        )
    else:
        model_config = (
            db.query(ModelConfig)
            .filter(ModelConfig.user_id == current_user.id, ModelConfig.is_active == True)
            .first()
        )

    if not model_config:
        raise HTTPException(status_code=400, detail="请先配置并激活一个模型")

    # 获取历史消息（最近 20 轮）
    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(40)
        .all()
    )
    history.reverse()

    # 检索相关记忆
    memories = search_memories(db, current_user.id, session.id, req.content)

    # 构建消息列表
    messages = [{"role": "system", "content": char.system_prompt}]

    # 注入记忆上下文
    if memories:
        memory_context = "【相关记忆】\n" + "\n".join([f"- {m.text}" for m in memories])
        messages.append({"role": "system", "content": memory_context})

    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})

    async def generate():
        full_response = ""
        try:
            async for chunk in chat_completion_stream(
                provider=model_config.provider,
                api_key=model_config.api_key or getattr(current_user, f"{model_config.provider}_api_key", ""),
                base_url=model_config.base_url,
                model=model_config.model,
                messages=messages,
                max_tokens=model_config.max_tokens,
                temperature=model_config.temperature,
            ):
                full_response += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk}, ensure_ascii=False)}\n\n"

            # 保存 AI 回复
            assistant_msg = ChatMessage(
                session_id=session.id,
                role="assistant",
                content=full_response,
            )
            db.add(assistant_msg)
            session.updated_at = func.now()  # 显式更新时间戳
            db.commit()

            # 更新角色聊天计数
            char.chat_count = (char.chat_count or 0) + 1
            db.commit()

            # 异步添加记忆
            add_chat_memory(db, current_user.id, session.id, req.content, full_response)

            # 每 10 轮生成摘要
            msg_count = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).count()
            if msg_count % 20 == 0:
                generate_session_summary(db, session.id, model_config)

            yield f"data: {json.dumps({'type': 'done', 'session_id': session.id, 'message_id': assistant_msg.id}, ensure_ascii=False)}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/sessions/{session_id}/memories")
def get_memories(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取对话记忆"""
    memories = (
        db.query(ChatEmbedding)
        .filter(ChatEmbedding.session_id == session_id, ChatEmbedding.user_id == current_user.id)
        .order_by(ChatEmbedding.importance.desc(), ChatEmbedding.created_at.desc())
        .all()
    )
    return {"memories": [m.to_dict() for m in memories]}


@router.post("/memories")
def create_memory(
    req: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """手动添加重要记忆"""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == req.session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    memory = ChatEmbedding(
        session_id=req.session_id,
        user_id=current_user.id,
        text=req.text,
        memory_type=req.memory_type,
        importance=req.importance,
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return {"memory": memory.to_dict()}


@router.delete("/memories/{memory_id}")
def delete_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除记忆"""
    memory = (
        db.query(ChatEmbedding)
        .filter(ChatEmbedding.id == memory_id, ChatEmbedding.user_id == current_user.id)
        .first()
    )
    if not memory:
        raise HTTPException(status_code=404, detail="记忆不存在")
    db.delete(memory)
    db.commit()
    return {"message": "删除成功"}
