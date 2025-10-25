# Docker 构建说明

## 🐳 Docker 镜像构建

本项目使用 Python 3.13 和 FFmpeg 来支持语音功能。

### 📋 系统要求

- **Python 3.13+**：语音处理库 `audioop-lts` 需要 Python 3.13
- **FFmpeg**：音频格式转换需要
- **Docker**：用于容器化部署

### 🔧 本地构建测试

```bash
# 1. 克隆项目
git clone <repository-url>
cd AI-Travel-Planner

# 2. 构建 Docker 镜像
docker build -t ai-travel-planner:latest .

# 3. 运行测试脚本
./test-docker-build.sh
```

### 🚀 GitHub Actions 自动构建

项目配置了 GitHub Actions 工作流，会在以下情况自动构建：

- 推送到 `main` 分支
- 创建版本标签（如 `v1.0.0`）
- 手动触发

### 📦 多架构支持

Docker 镜像支持以下架构：
- `linux/amd64`（Intel/AMD 64位）
- `linux/arm64`（ARM 64位，如 Apple Silicon）

### 🔍 构建过程

1. **基础镜像**：`python:3.13-slim`
2. **系统依赖**：安装 `build-essential`、`curl`、`ffmpeg`
3. **Python 依赖**：安装 `requirements.txt` 中的所有包
4. **应用代码**：复制后端和前端文件
5. **健康检查**：配置 `/api/health` 端点
6. **启动命令**：`python run.py`

### ⚠️ 常见问题

#### 问题 1：`audioop-lts` 安装失败
```
ERROR: Could not find a version that satisfies the requirement audioop-lts==0.2.2
```

**解决方案**：确保使用 Python 3.13+
```dockerfile
FROM python:3.13-slim
```

#### 问题 2：FFmpeg 未找到
```
ERROR: FFmpeg not found
```

**解决方案**：在 Dockerfile 中安装 FFmpeg
```dockerfile
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*
```

#### 问题 3：依赖版本冲突
```
ERROR: No matching distribution found
```

**解决方案**：使用版本范围而不是固定版本
```txt
# 使用 >= 而不是 ==
fastapi>=0.109.0
pydub>=0.25.1
audioop-lts>=0.2.2
```

### 🧪 测试验证

构建完成后，可以通过以下方式验证：

```bash
# 1. 运行容器
docker run -d --name test-container -p 8000:8000 ai-travel-planner:latest

# 2. 检查健康状态
curl http://localhost:8000/api/health

# 3. 检查日志
docker logs test-container

# 4. 清理
docker stop test-container
docker rm test-container
```

### 📊 镜像大小优化

当前镜像大小约 200-300MB，包含：
- Python 3.13 运行时
- FFmpeg 音频处理
- 所有 Python 依赖
- 应用代码

如需进一步优化，可以考虑：
- 使用多阶段构建
- 移除不必要的依赖
- 使用 Alpine Linux 基础镜像

### 🔄 持续集成

GitHub Actions 工作流配置：
- 自动构建多架构镜像
- 推送到 GitHub Container Registry
- 生成构建证明（attestation）
- 支持缓存加速构建

### 📝 版本管理

建议使用语义化版本标签：
```bash
# 创建版本标签
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions 会自动构建并推送镜像
# 镜像标签：ghcr.io/username/ai-travel-planner:v1.0.0
```
