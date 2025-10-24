# 多阶段构建 - AI 旅行规划师
FROM python:3.10-slim as backend-base

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend/ ./backend/
COPY run.py .

# 复制前端静态文件
COPY frontend/ ./frontend/

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# 设置环境变量
ENV PYTHONUNBUFFERED=1

# 启动命令
CMD ["python", "run.py"]

