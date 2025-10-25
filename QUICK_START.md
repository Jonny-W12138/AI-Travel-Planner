# 🚀 AI 旅行规划师 - 一键部署指南

## 📋 概述

AI 旅行规划师已完全容器化，包含 MySQL 数据库。用户只需配置 API 密钥，即可一键启动完整服务。

## ⚡ 快速开始

### 方式 1：一键启动（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd AI-Travel-Planner

# 2. 运行启动脚本
./docker-start.sh
```

### 方式 2：Docker Compose

```bash
# 1. 配置环境变量
cp env.docker .env
# 编辑 .env 文件，填入您的 API 密钥

# 2. 启动服务
docker-compose up -d
```

### 方式 3：直接拉取镜像

```bash
# 1. 拉取最新镜像
docker pull ghcr.io/yourusername/ai-travel-planner:latest

# 2. 运行容器
docker run -d \
    --name ai-travel-planner \
    -p 8000:8000 \
    -p 3306:3306 \
    -e SECRET_KEY="your-secret-key" \
    -e ALIYUN_BAILIAN_API_KEY="your-bailian-key" \
    -e ALIYUN_ASR_APP_KEY="your-asr-key" \
    -e ALIYUN_ASR_ACCESS_KEY_ID="your-access-key-id" \
    -e ALIYUN_ASR_ACCESS_KEY_SECRET="your-access-key-secret" \
    -e AMAP_API_KEY="your-amap-key" \
    -e AMAP_WEB_SERVICE_KEY="your-amap-web-key" \
    ai-travel-planner:latest
```

## 🔑 必需配置

用户只需要配置以下环境变量：

| 变量名 | 说明 | 获取地址 |
|--------|------|----------|
| `SECRET_KEY` | JWT 密钥 | 自定义 |
| `ALIYUN_BAILIAN_API_KEY` | 阿里云百炼 API 密钥 | https://bailian.console.aliyun.com/ |
| `ALIYUN_ASR_APP_KEY` | 阿里云语音识别 APP_KEY | https://nls-portal.console.aliyun.com/ |
| `ALIYUN_ASR_ACCESS_KEY_ID` | 阿里云访问密钥 ID | https://nls-portal.console.aliyun.com/ |
| `ALIYUN_ASR_ACCESS_KEY_SECRET` | 阿里云访问密钥 Secret | https://nls-portal.console.aliyun.com/ |
| `AMAP_API_KEY` | 高德地图 JS API Key | https://lbs.amap.com/ |
| `AMAP_WEB_SERVICE_KEY` | 高德地图 Web Service Key | https://lbs.amap.com/ |

## 🗄️ 数据库配置

**MySQL 配置已预设，用户无需配置：**

- **数据库名**: `travel_planner`
- **用户名**: `travel_user`
- **密码**: `travel_password`
- **Root 密码**: `root_password`
- **端口**: `3306`

## 📊 服务架构

```
┌─────────────────────────────────────┐
│           Docker 容器                │
├─────────────────────────────────────┤
│  Python 3.13 + FastAPI              │
│  ├── AI 服务 (阿里云百炼)            │
│  ├── 语音服务 (阿里云 ASR)           │
│  ├── 地图服务 (高德地图)             │
│  ├── MySQL 8.0 数据库               │
│  └── 前端静态文件                    │
└─────────────────────────────────────┘
           ↓ 端口 8000, 3306
┌─────────────────────────────────────┐
│           宿主机                    │
│  http://localhost:8000              │
│  MySQL: localhost:3306              │
└─────────────────────────────────────┘
```

## 🎯 使用流程

1. **配置 API 密钥** → 编辑 `.env` 文件
2. **启动服务** → 运行 `./docker-start.sh`
3. **访问应用** → 打开 http://localhost:8000
4. **开始使用** → 注册账号，创建旅行计划

## 🔧 管理命令

```bash
# 查看服务状态
docker ps | grep ai-travel-planner

# 查看日志
docker logs ai-travel-planner

# 停止服务
docker stop ai-travel-planner

# 重启服务
docker restart ai-travel-planner

# 删除容器
docker rm -f ai-travel-planner
```

## 🐛 故障排除

### 常见问题

1. **容器启动失败**
   ```bash
   docker logs ai-travel-planner
   ```

2. **MySQL 启动慢**
   - MySQL 需要 30-60 秒启动时间
   - 查看日志确认 MySQL 状态

3. **API 功能不可用**
   - 检查 API 密钥是否正确
   - 确认 API 服务是否正常

4. **端口冲突**
   ```bash
   # 使用其他端口
   docker run -p 8001:8000 -p 3307:3306 ai-travel-planner:latest
   ```

## 📈 性能优化

### 资源限制

```bash
docker run -d \
    --name ai-travel-planner \
    --memory="1g" \
    --cpus="2.0" \
    ai-travel-planner:latest
```

### 数据持久化

```bash
docker run -d \
    --name ai-travel-planner \
    -v ./data:/app/data \
    -v mysql_data:/var/lib/mysql \
    ai-travel-planner:latest
```

## 🔒 安全建议

1. **修改默认密钥**
   ```env
   SECRET_KEY=your-very-long-random-secret-key
   ```

2. **使用 HTTPS**
   - 配置反向代理
   - 使用 SSL 证书

3. **数据备份**
   ```bash
   # 备份数据库
   docker exec ai-travel-planner mysqldump -u travel_user -p travel_planner > backup.sql
   ```

## 🌐 网络配置

### 内网部署

```bash
docker run -d \
    --name ai-travel-planner \
    -p 192.168.1.100:8000:8000 \
    ai-travel-planner:latest
```

### 反向代理

```nginx
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

- **v1.0.0**: 基础功能
- **v1.1.0**: 语音识别
- **v1.2.0**: 完整容器化
- **v1.3.0**: 内置 MySQL 数据库

## 🤝 技术支持

遇到问题请：

1. 查看本文档故障排除部分
2. 检查 GitHub Issues
3. 提交新的 Issue
