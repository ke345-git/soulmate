"""AI 模型调用服务"""

import json
import httpx
from typing import AsyncIterator


async def chat_completion_stream(
    provider: str,
    api_key: str,
    base_url: str,
    model: str,
    messages: list,
    max_tokens: int = 4096,
    temperature: float = 0.7,
) -> AsyncIterator[str]:
    """
    流式调用 LLM API，逐块返回文本。
    支持 OpenAI 兼容接口和 Anthropic。
    """
    if provider == "anthropic":
        async for chunk in _anthropic_stream(api_key, model, messages, max_tokens, temperature):
            yield chunk
    else:
        # openai / azure / custom — 都兼容 OpenAI API 格式
        async for chunk in _openai_compatible_stream(
            api_key, base_url, model, messages, max_tokens, temperature
        ):
            yield chunk


async def _openai_compatible_stream(
    api_key: str,
    base_url: str,
    model: str,
    messages: list,
    max_tokens: int,
    temperature: float,
) -> AsyncIterator[str]:
    """OpenAI 兼容的流式请求"""
    url = f"{base_url.rstrip('/')}/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    body = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", url, headers=headers, json=body) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue


async def _anthropic_stream(
    api_key: str,
    model: str,
    messages: list,
    max_tokens: int,
    temperature: float,
) -> AsyncIterator[str]:
    """Anthropic 流式请求"""
    url = "https://api.anthropic.com/v1/messages"

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    # 分离 system 消息
    system_prompts = [m["content"] for m in messages if m["role"] == "system"]
    chat_messages = [m for m in messages if m["role"] != "system"]

    body = {
        "model": model,
        "messages": chat_messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": True,
    }
    if system_prompts:
        body["system"] = "\n\n".join(system_prompts)

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", url, headers=headers, json=body) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    try:
                        data = json.loads(data_str)
                        if data.get("type") == "content_block_delta":
                            delta = data.get("delta", {})
                            text = delta.get("text", "")
                            if text:
                                yield text
                    except (json.JSONDecodeError, KeyError):
                        continue


async def test_model_connection(
    provider: str,
    api_key: str,
    base_url: str,
    model: str,
) -> bool:
    """测试模型连接是否可用 — 发送一个简单请求"""
    test_messages = [{"role": "user", "content": "Hi"}]

    try:
        if provider == "anthropic":
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            }
            body = {
                "model": model,
                "messages": test_messages,
                "max_tokens": 10,
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, json=body)
                return resp.status_code == 200
        else:
            url = f"{base_url.rstrip('/')}/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            body = {
                "model": model,
                "messages": test_messages,
                "max_tokens": 10,
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, json=body)
                return resp.status_code == 200
    except Exception:
        return False
