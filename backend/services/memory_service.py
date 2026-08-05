"""记忆服务：关键词提取 + 向量检索"""

import re
import numpy as np
from sqlalchemy.orm import Session
from models.chat import ChatEmbedding, ChatMessage
from models.model_config import ModelConfig
from services.ai_service import chat_completion_stream


def _simple_tokenize(text: str) -> set:
    """简单中文分词：提取 2-4 字词组"""
    text = re.sub(r"[^一-鿿\w]", " ", text)
    words = set()
    # 提取 2-gram, 3-gram
    chars = list(text.replace(" ", ""))
    for n in [2, 3, 4]:
        for i in range(len(chars) - n + 1):
            words.add("".join(chars[i : i + n]))
    return words


def _cosine_similarity(v1: list, v2: list) -> float:
    """计算余弦相似度"""
    if not v1 or not v2:
        return 0.0
    a = np.array(v1)
    b = np.array(v2)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _text_to_keyword_vector(text: str, dimension: int = 128) -> list:
    """
    将文本转为伪向量（基于关键词哈希）。
    这是一个轻量级的替代方案，不需要外部 embedding API。
    当用户没有配置 API Key 时使用。
    """
    tokens = _simple_tokenize(text)
    vec = np.zeros(dimension)
    for token in tokens:
        h = hash(token) % dimension
        vec[h] += 1.0
    # 归一化
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


def search_memories(
    db: Session,
    user_id: str,
    session_id: str,
    query: str,
    top_k: int = 3,
) -> list:
    """
    搜索相关记忆：
    1. 优先搜索当前会话的记忆
    2. 也搜索其他会话的重要记忆
    使用本地关键词向量进行相似度匹配。
    """
    # 获取所有该用户的记忆
    all_memories = (
        db.query(ChatEmbedding)
        .filter(ChatEmbedding.user_id == user_id)
        .all()
    )

    if not all_memories:
        return []

    query_vec = _text_to_keyword_vector(query)

    scored = []
    updated_memories = []  # 记录需要持久化向量的记忆
    for mem in all_memories:
        if mem.vector:
            sim = _cosine_similarity(query_vec, mem.vector)
        else:
            # 如果没有预计算向量，现场计算并缓存
            mem_vec = _text_to_keyword_vector(mem.text)
            sim = _cosine_similarity(query_vec, mem_vec)
            mem.vector = mem_vec  # 缓存到内存
            updated_memories.append(mem)

        # 当前会话的记忆加权
        if mem.session_id == session_id:
            sim *= 1.5
        # 重要记忆加权
        sim *= (mem.importance / 5.0)

        scored.append((mem, sim))

    # 持久化新计算的向量
    if updated_memories:
        try:
            db.commit()
        except Exception:
            pass  # 向量持久化失败不影响搜索

    scored.sort(key=lambda x: x[1], reverse=True)

    # 过滤低相关度
    return [m for m, s in scored[:top_k] if s > 0.05]


def add_chat_memory(
    db: Session,
    user_id: str,
    session_id: str,
    user_message: str,
    assistant_message: str,
):
    """从一轮对话中自动提取记忆"""
    # 使用 (正则, 描述) 元组，避免从正则中手工解析动词
    memory_triggers = [
        (r"我叫(.{1,10})", "用户的名字是"),
        (r"我是(.{1,20})", "用户的身份是"),
        (r"我喜欢(.{1,30})", "用户喜欢"),
        (r"我讨厌(.{1,30})", "用户讨厌"),
        (r"我住在(.{1,20})", "用户住在"),
        (r"我的(.{1,5})是(.{1,20})", "用户的"),
        (r"我觉得(.{1,30})", "用户觉得"),
        (r"我感觉(.{1,30})", "用户感觉"),
    ]

    combined = user_message + " " + assistant_message

    for pattern, label in memory_triggers:
        matches = re.findall(pattern, combined)
        for match in matches:
            # match 可能是字符串（单个捕获组）或元组（多个捕获组）
            if isinstance(match, tuple):
                match_text = "".join(str(m) for m in match if m).strip()
            else:
                match_text = str(match).strip()
            if not match_text:
                continue
            text = f"{label}{match_text}"
            # 去重检查
            existing = (
                db.query(ChatEmbedding)
                .filter(
                    ChatEmbedding.user_id == user_id,
                    ChatEmbedding.text == text,
                )
                .first()
            )
            if not existing:
                vec = _text_to_keyword_vector(text)
                memory = ChatEmbedding(
                    session_id=session_id,
                    user_id=user_id,
                    text=text,
                    vector=vec,
                    memory_type="auto",
                    importance=7,
                )
                db.add(memory)

    db.commit()


async def generate_session_summary(
    db: Session,
    session_id: str,
    model_config: ModelConfig,
):
    """使用 LLM 生成对话摘要并存储为长期记忆"""
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    if not messages:
        return

    # 构建摘要请求
    conversation = "\n".join([
        f"{'用户' if m.role == 'user' else 'AI'}: {m.content[:200]}"
        for m in messages[-20:]
    ])

    summary_prompt = [
        {
            "role": "system",
            "content": "请用一段话（不超过100字）总结以下对话的核心内容和用户的关键信息。只输出总结，不要额外说明。",
        },
        {"role": "user", "content": conversation},
    ]

    try:
        summary_text = ""
        async for chunk in chat_completion_stream(
            provider=model_config.provider,
            api_key=model_config.api_key or "",
            base_url=model_config.base_url,
            model=model_config.model,
            messages=summary_prompt,
            max_tokens=200,
            temperature=0.3,
        ):
            summary_text += chunk

        if summary_text.strip():
            from models.chat import ChatSession
            session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if session:
                session.summary = summary_text.strip()
                db.commit()
    except Exception:
        pass  # 摘要失败不影响主流程
