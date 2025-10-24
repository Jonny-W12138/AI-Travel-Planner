# Docker 部署指南

本文档详细说明如何使用 Docker 部署 AI 旅行规划师。

## 📋 目录

- [快速开始](#快速开始)
- [使用预构建镜像](#使用预构建镜像)
- [本地构建](#本地构建)
- [GitHub Actions 自动构建](#github-actions-自动构建)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

## 🚀 快速开始

### 方式 1: 使用 docker-compose（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/AI-Travel-Planner.git
cd AI-Travel-Planner

# 2. 配置环境变量
cp env.template .env
# 编辑 .env 文件，填入你的 API Keys

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 访问应用
# 打开浏览器: http://localhost:8000
```

### 方式 2: 使用 Docker 命令

```bash
# 1. 构建镜像
docker build -t ai-travel-planner:latest .

# 2. 运行容器
docker run -d \
  --name ai-travel-planner \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  ai-travel-planner:latest

# 3. 查看容器状态
docker ps

# 4. 查看日志
docker logs -f ai-travel-planner
```

## 📦 使用预构建镜像

项目通过 GitHub Actions 自动构建并发布镜像到 GitHub Container Registry。

### 拉取镜像

```bash
# 最新版本
docker pull ghcr.io/yourusername/ai-travel-planner:latest

# 特定版本
docker pull ghcr.io/yourusername/ai-travel-planner:v1.0.0

# 特定分支
docker pull ghcr.io/yourusername/ai-travel-planner:main
```

### 运行预构建镜像

```bash
docker run -d \
  --name ai-travel-planner \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  ghcr.io/yourusername/ai-travel-planner:latest
```

### 支持的架构

镜像支持多架构，可在以下平台运行：

- `linux/amd64` - x86_64 (Intel/AMD)
- `linux/arm64` - ARM64 (Apple Silicon, Raspberry Pi 4, AWS Graviton)

Docker 会自动选择适合你系统的架构。

## 🛠️ 本地构建

### 基础构建

```bash
# 构建镜像
docker build -t ai-travel-planner:local .

# 指定平台构建
docker build --platform linux/amd64 -t ai-travel-planner:amd64 .
docker build --platform linux/arm64 -t ai-travel-planner:arm64 .
```

### 多架构构建

```bash
# 创建 buildx builder
docker buildx create --name multiarch --use

# 构建多架构镜像
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ai-travel-planner:multiarch \
  --push \
  .
```

### 查看镜像信息

```bash
# 查看镜像列表
docker images ai-travel-planner

# 查看镜像详细信息
docker inspect ai-travel-planner:latest

# 查看镜像构建历史
docker history ai-travel-planner:latest
```

## 🔄 GitHub Actions 自动构建

项目配置了 GitHub Actions，可自动构建和发布 Docker 镜像。

### 触发构建

**自动触发：**
- 推送代码到 `main` 或 `master` 分支
- 创建新的 tag（如 `v1.0.0`）
- 提交 Pull Request（仅构建，不推送）

**手动触发：**
1. 访问 GitHub 项目的 Actions 页面
2. 选择 "Build and Push Docker Image" workflow
3. 点击 "Run workflow"
4. 选择分支并运行

### 查看构建状态

访问: `https://github.com/yourusername/AI-Travel-Planner/actions`

### 镜像标签规则

| Git 操作 | 镜像标签 | 示例 |
|---------|---------|------|
| push to main | `main`, `latest` | `ghcr.io/.../ai-travel-planner:main` |
| push to master | `master`, `latest` | `ghcr.io/.../ai-travel-planner:latest` |
| create tag v1.0.0 | `v1.0.0`, `1.0`, `1`, `latest` | `ghcr.io/.../ai-travel-planner:v1.0.0` |
| PR #123 | `pr-123` | `ghcr.io/.../ai-travel-planner:pr-123` |

### 配置 Secrets

如果需要推送到 Docker Hub，需要配置以下 Secrets：

1. 访问: `Settings -> Secrets and variables -> Actions`
2. 添加 Secrets:
   - `DOCKERHUB_USERNAME`: Docker Hub 用户名
   - `DOCKERHUB_TOKEN`: Docker Hub Access Token

## ⚙️ 环境变量配置

### 必需的环境变量

```env
# 数据库配置（使用 SQLite）
DATABASE_URL=sqlite:///./travel_planner.db

# JWT 密钥
SECRET_KEY=your-secret-key-change-in-production

# 阿里云百炼 API Key
ALIYUN_BAILIAN_API_KEY=sk-xxxxxxxxxxxxx

# 高德地图 API Keys
AMAP_WEB_SERVICE_KEY=your-web-service-key
AMAP_JS_API_KEY=your-js-api-key
AMAP_SECURITY_JS_CODE=your-security-code
```

### 可选的环境变量

```env
# 阿里云语音识别（可选）
ALIYUN_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_APP_KEY=your-app-key

# 服务器配置
HOST=0.0.0.0
PORT=8000
DEBUG=False
```

### 在 docker-compose 中使用

`docker-compose.yml` 会自动读取 `.env` 文件中的环境变量。

## 🔍 常见问题

### 1. 容器启动失败

**问题**: 容器启动后立即退出

**解决方法**:
```bash
# 查看容器日志
docker logs ai-travel-planner

# 常见原因：
# - .env 文件配置错误
# - 缺少必需的 API Keys
# - 端口已被占用
```

### 2. 无法访问应用

**问题**: 浏览器无法打开 http://localhost:8000

**解决方法**:
```bash
# 1. 检查容器是否运行
docker ps

# 2. 检查端口映射
docker port ai-travel-planner

# 3. 检查防火墙
# Linux: sudo ufw allow 8000
# Mac: 系统偏好设置 -> 安全性与隐私 -> 防火墙
```

### 3. 数据持久化

**问题**: 容器重启后数据丢失

**解决方法**:
```bash
# 使用数据卷挂载
docker run -d \
  --name ai-travel-planner \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \  # 挂载数据目录
  ai-travel-planner:latest
```

### 4. 更新镜像

**问题**: 如何更新到最新版本

**解决方法**:
```bash
# 停止并删除旧容器
docker stop ai-travel-planner
docker rm ai-travel-planner

# 拉取最新镜像
docker pull ghcr.io/yourusername/ai-travel-planner:latest

# 重新运行容器
docker run -d \
  --name ai-travel-planner \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  ghcr.io/yourusername/ai-travel-planner:latest
```

### 5. 构建缓慢

**问题**: 构建镜像很慢

**解决方法**:
```bash
# 使用构建缓存
docker build --cache-from ai-travel-planner:latest -t ai-travel-planner:latest .

# 使用 buildkit（更快）
DOCKER_BUILDKIT=1 docker build -t ai-travel-planner:latest .
```

### 6. 健康检查失败

**问题**: 容器显示 unhealthy

**解决方法**:
```bash
# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' ai-travel-planner | jq

# 手动测试健康检查
docker exec ai-travel-planner curl -f http://localhost:8000/api/health
```

## 📚 更多资源

- [Dockerfile 参考](Dockerfile)
- [docker-compose.yml 参考](docker-compose.yml)
- [GitHub Actions 工作流](.github/workflows/docker-build.yml)
- [部署指南](DEPLOY.md)
- [API 文档](API.md)

## 💡 最佳实践

### 生产环境部署

1. **使用特定版本标签** - 避免使用 `latest`
   ```bash
   docker pull ghcr.io/yourusername/ai-travel-planner:v1.0.0
   ```

2. **配置重启策略**
   ```bash
   docker run -d --restart=unless-stopped ...
   ```

3. **使用环境变量文件** - 不要在命令行中暴露敏感信息
   ```bash
   docker run -d --env-file .env ...
   ```

4. **限制资源使用**
   ```bash
   docker run -d \
     --memory=1g \
     --cpus=2 \
     ...
   ```

5. **定期备份数据**
   ```bash
   # 备份数据卷
   docker run --rm \
     -v ai-travel-planner_data:/data \
     -v $(pwd):/backup \
     alpine tar czf /backup/data-backup.tar.gz /data
   ```

### 开发环境

1. **挂载代码目录** - 实时同步代码修改
   ```yaml
   # docker-compose.yml
   volumes:
     - ./backend:/app/backend
     - ./frontend:/app/frontend
   ```

2. **启用调试模式**
   ```env
   DEBUG=True
   ```

3. **查看实时日志**
   ```bash
   docker-compose logs -f
   ```

---

如有问题，请提交 Issue 或查阅[完整文档](README.md)。

