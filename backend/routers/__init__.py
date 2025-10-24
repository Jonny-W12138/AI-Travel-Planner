"""
路由模块
"""
from .auth_router import router as auth_router
from .travel_router import router as travel_router
from .expense_router import router as expense_router
from .voice_router import router as voice_router
from .map_router import router as map_router

__all__ = [
    "auth_router",
    "travel_router",
    "expense_router",
    "voice_router",
    "map_router"
]

