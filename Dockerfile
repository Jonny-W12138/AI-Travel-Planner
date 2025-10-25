# AI 旅行规划师 - 完整容器化部署（包含 MySQL）
FROM python:3.13-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖（包括 MySQL 服务器）
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    ffmpeg \
    mysql-server \
    mysql-client \
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
COPY mysql-init.sql .

# 设置执行权限
RUN chmod +x docker-entrypoint.sh

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 8000 3306

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# 设置环境变量默认值
ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=mysql+pymysql://travel_user:travel_password@localhost:3306/travel_planner
ENV SECRET_KEY=your-secret-key-change-in-production
ENV HOST=0.0.0.0
ENV PORT=8000
ENV DEBUG=False

# MySQL 配置（预设账号密码）
ENV MYSQL_ROOT_PASSWORD=root_password
ENV MYSQL_DATABASE=travel_planner
ENV MYSQL_USER=travel_user
ENV MYSQL_PASSWORD=travel_password

# 数据卷
VOLUME ["/app/data", "/var/lib/mysql"]

# 启动脚本
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["python", "run.py"]

