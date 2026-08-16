"""公益站 / 免费接口预设

为模型配置页面提供「一键填充」的公共 API 端点预设。
用户可从中快速选择（包括带免费额度的服务），也可以完全自定义。
注意：免费额度/政策会变化，仅作参考，请以各服务官网为准。
"""

PUBLIC_ENDPOINT_PRESETS = [
    {
        "id": "openai",
        "name": "OpenAI 官方",
        "provider": "openai",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4o-mini",
        "description": "官方接口，质量最高，需要付费 Key",
        "models": ["gpt-4o", "gpt-4o-mini", "gpt-4.1-mini"],
        "is_free": False,
    },
    {
        "id": "anthropic",
        "name": "Anthropic 官方",
        "provider": "anthropic",
        "base_url": "https://api.anthropic.com/v1",
        "model": "claude-sonnet-4-20250514",
        "description": "Claude 官方接口，情感陪伴表现出色",
        "models": ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"],
        "is_free": False,
    },
    {
        "id": "deepseek",
        "name": "DeepSeek",
        "provider": "custom",
        "base_url": "https://api.deepseek.com/v1",
        "model": "deepseek-chat",
        "description": "性价比极高的国产大模型，官方充值",
        "models": ["deepseek-chat", "deepseek-reasoner"],
        "is_free": False,
    },
    {
        "id": "moonshot",
        "name": "Moonshot Kimi",
        "provider": "custom",
        "base_url": "https://api.moonshot.cn/v1",
        "model": "moonshot-v1-8k",
        "description": "Kimi 官方接口，长文本能力强",
        "models": ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
        "is_free": False,
    },
    {
        "id": "zhipu",
        "name": "智谱 GLM",
        "provider": "custom",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "model": "glm-4-flash",
        "description": "智谱官方，glm-4-flash 有免费额度",
        "models": ["glm-4-flash", "glm-4-air", "glm-4-plus"],
        "is_free": True,
    },
    {
        "id": "siliconflow",
        "name": "硅基流动 SiliconFlow",
        "provider": "custom",
        "base_url": "https://api.siliconflow.cn/v1",
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "description": "聚合开源模型，部分模型免费",
        "models": ["Qwen/Qwen2.5-7B-Instruct", "deepseek-ai/DeepSeek-V3", "THUDM/glm-4-9b-chat"],
        "is_free": True,
    },
    {
        "id": "groq",
        "name": "Groq",
        "provider": "custom",
        "base_url": "https://api.groq.com/openai/v1",
        "model": "llama-3.3-70b-versatile",
        "description": "极速推理，免费额度充足",
        "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
        "is_free": True,
    },
    {
        "id": "openrouter",
        "name": "OpenRouter",
        "provider": "custom",
        "base_url": "https://openrouter.ai/api/v1",
        "model": "meta-llama/llama-3.3-70b-instruct:free",
        "description": "聚合 400+ 模型，:free 后缀模型免费",
        "models": ["meta-llama/llama-3.3-70b-instruct:free", "deepseek/deepseek-chat-v3-0324:free"],
        "is_free": True,
    },
    {
        "id": "dashscope",
        "name": "通义千问 DashScope",
        "provider": "custom",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "model": "qwen-plus",
        "description": "阿里云百炼，新用户有免费额度",
        "models": ["qwen-plus", "qwen-turbo", "qwen-max"],
        "is_free": True,
    },
    {
        "id": "lingyi",
        "name": "零一万物 Yi",
        "provider": "custom",
        "base_url": "https://api.lingyiwanwu.com/v1",
        "model": "yi-lightning",
        "description": "yi-lightning 限时免费",
        "models": ["yi-lightning", "yi-large"],
        "is_free": True,
    },
    {
        "id": "ollama",
        "name": "Ollama 本地",
        "provider": "custom",
        "base_url": "http://localhost:11434/v1",
        "model": "qwen2.5:7b",
        "description": "本地部署完全免费，无需联网",
        "models": ["qwen2.5:7b", "llama3.1:8b", "gemma2:9b"],
        "is_free": True,
    },
]


def get_public_presets() -> list:
    """返回公益站预设（脱敏、不可变拷贝）"""
    import copy

    return copy.deepcopy(PUBLIC_ENDPOINT_PRESETS)
