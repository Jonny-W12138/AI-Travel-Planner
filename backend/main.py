"""
FastAPI 主应用
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database import init_db
from .routers import (
    auth_router,
    travel_router,
    expense_router,
    voice_router,
    map_router
)

# 创建 FastAPI 应用
app = FastAPI(
    title="AI Travel Planner",
    description="AI 驱动的旅行规划助手",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth_router)
app.include_router(travel_router)
app.include_router(expense_router)
app.include_router(voice_router)
app.include_router(map_router)

# 静态文件服务（前端）
try:
    app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
except RuntimeError:
    pass  # 如果 frontend 目录不存在，跳过


@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    init_db()


@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "message": "AI Travel Planner API is running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

