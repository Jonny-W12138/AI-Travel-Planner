# 🐳 AI 旅行规划师 Docker 部署指南

## 📋 概述

本项目已完全容器化，包含所有依赖和数据库。用户只需通过环境变量配置 API 密钥，即可一键启动完整服务。

## 🚀 快速开始

### 方式 1：一键启动（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd AI-Travel-Planner

# 2. 运行启动脚本
./docker-start.sh
```

启动脚本会自动：
- ✅ 检查 Docker 环境
- ✅ 创建配置文件模板
- ✅ 构建 Docker 镜像
- ✅ 启动服务容器
- ✅ 验证服务状态

### 方式 2：Docker Compose

```bash
# 1. 配置环境变量
cp env.docker .env
# 编辑 .env 文件，填入您的 API 密钥

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f
```

### 方式 3：手动 Docker 命令

```bash
# 1. 构建镜像
docker build -t ai-travel-planner:latest .

# 2. 启动容器
docker run -d \
    --name ai-travel-planner \
    --env-file .env \
    -p 8000:8000 \
    -v "$(pwd)/data:/app/data" \
    --restart unless-stopped \
    ai-travel-planner:latest
```

## 🔑 环境变量配置

### 必需配置

创建 `.env` 文件并配置以下变量：

```env
# 基础配置
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=sqlite:///./data/travel_planner.db

# 阿里云百炼 API（AI 功能）
ALIYUN_BAILIAN_API_KEY=your-aliyun-bailian-api-key
ALIYUN_BAILIAN_APP_ID=your-app-id

# 阿里云语音识别 API（语音功能）
ALIYUN_ASR_APP_KEY=your-aliyun-asr-app-key
ALIYUN_ASR_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ASR_ACCESS_KEY_SECRET=your-access-key-secret

# 高德地图 API（地图功能）
AMAP_API_KEY=your-amap-api-key
AMAP_WEB_SERVICE_KEY=your-amap-web-service-key
```

### API 密钥获取

| 服务 | 获取地址 | 用途 |
|------|----------|------|
| **阿里云百炼** | https://bailian.console.aliyun.com/ | AI 旅行计划生成 |
| **阿里云语音识别** | https://nls-portal.console.aliyun.com/ | 语音输入识别 |
| **高德地图** | https://lbs.amap.com/ | 地图显示和路径规划 |

## 📊 服务架构

```
┌─────────────────────────────────────┐
│           Docker 容器                │
├─────────────────────────────────────┤
│  Python 3.13 + FastAPI              │
│  ├── AI 服务 (阿里云百炼)            │
│  ├── 语音服务 (阿里云 ASR)           │
│  ├── 地图服务 (高德地图)             │
│  ├── SQLite 数据库                   │
│  └── 前端静态文件                    │
└─────────────────────────────────────┘
           ↓ 端口 8000
┌─────────────────────────────────────┐
│           宿主机                    │
│  http://localhost:8000              │
└─────────────────────────────────────┘
```

## 🗄️ 数据持久化

- **数据库文件**: `./data/travel_planner.db`
- **用户数据**: 存储在 SQLite 数据库中
- **数据备份**: 定期备份 `./data` 目录

## 🔧 管理命令

### 查看服务状态

```bash
# 检查容器状态
docker ps | grep ai-travel-planner

# 查看健康状态
curl http://localhost:8000/api/health

# 查看日志
docker logs ai-travel-planner
```

### 服务管理

```bash
# 停止服务
docker stop ai-travel-planner

# 重启服务
docker restart ai-travel-planner

# 删除容器
docker rm -f ai-travel-planner

# 更新服务
docker pull ai-travel-planner:latest
docker stop ai-travel-planner
docker rm ai-travel-planner
./docker-start.sh
```

### 数据管理

```bash
# 备份数据
cp ./data/travel_planner.db ./backup-$(date +%Y%m%d).db

# 恢复数据
cp ./backup-20240101.db ./data/travel_planner.db
docker restart ai-travel-planner
```

## 🐛 故障排除

### 常见问题

#### 1. 容器启动失败

```bash
# 查看详细日志
docker logs ai-travel-planner

# 检查环境变量
docker exec ai-travel-planner env | grep -E "(ALIYUN|AMAP)"
```

#### 2. API 功能不可用

- ✅ 检查 API 密钥是否正确
- ✅ 确认 API 服务是否正常
- ✅ 查看容器日志中的错误信息

#### 3. 数据库问题

```bash
# 进入容器检查数据库
docker exec -it ai-travel-planner sqlite3 /app/data/travel_planner.db

# 重新初始化数据库
docker exec ai-travel-planner python -c "from backend.database import init_db; init_db()"
```

#### 4. 端口冲突

```bash
# 检查端口占用
lsof -i :8000

# 使用其他端口
docker run -p 8001:8000 ai-travel-planner:latest
```

### 日志分析

```bash
# 实时查看日志
docker logs -f ai-travel-planner

# 查看最近 100 行日志
docker logs --tail 100 ai-travel-planner

# 查看特定时间段的日志
docker logs --since "2024-01-01T00:00:00" ai-travel-planner
```

## 🔒 安全建议

### 生产环境配置

1. **修改默认密钥**
   ```env
   SECRET_KEY=your-very-long-random-secret-key
   ```

2. **使用 HTTPS**
   - 配置反向代理（Nginx）
   - 使用 Let's Encrypt SSL 证书

3. **数据备份**
   - 定期备份数据库文件
   - 使用云存储备份

4. **访问控制**
   - 配置防火墙规则
   - 使用 VPN 或内网访问

## 📈 性能优化

### 资源限制

```bash
# 限制内存使用
docker run -d \
    --name ai-travel-planner \
    --memory="512m" \
    --cpus="1.0" \
    ai-travel-planner:latest
```

### 缓存优化

- 使用 Redis 缓存 API 响应
- 配置 CDN 加速静态资源

## 🌐 网络配置

### 内网部署

```bash
# 绑定到内网 IP
docker run -d \
    --name ai-travel-planner \
    -p 192.168.1.100:8000:8000 \
    ai-travel-planner:latest
```

### 反向代理

```nginx
# Nginx 配置示例
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📝 更新日志

- **v1.0.0**: 初始版本，支持基础功能
- **v1.1.0**: 添加语音识别功能
- **v1.2.0**: 完整容器化部署

## 🤝 技术支持

如遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查 GitHub Issues
3. 提交新的 Issue 并附上日志信息
