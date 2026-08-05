from .auth import router as auth_router
from .models_config import router as models_router
from .characters import router as characters_router
from .chat import router as chat_router

__all__ = ["auth_router", "models_router", "characters_router", "chat_router"]
