# AI 旅行规划师 - 完整容器化部署
FROM python:3.13-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖（包括数据库）
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    ffmpeg \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY run.py .
COPY docker-entrypoint.sh .

# 设置执行权限
RUN chmod +x docker-entrypoint.sh

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# 设置环境变量默认值
ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=sqlite:///./data/travel_planner.db
ENV SECRET_KEY=your-secret-key-change-in-production
ENV HOST=0.0.0.0
ENV PORT=8000
ENV DEBUG=False

# 数据卷
VOLUME ["/app/data"]

# 启动脚本
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["python", "run.py"]

