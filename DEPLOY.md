# 部署指南

本文档详细说明如何将 AI 旅行规划师部署到生产环境。

## 部署架构

```
用户浏览器
    ↓
负载均衡器 (Nginx)
    ↓
FastAPI 应用服务器 (Gunicorn + Uvicorn)
    ↓
MySQL 数据库
```

## 生产环境部署

### 1. 服务器要求

**推荐配置：**
- CPU: 2 核或以上
- 内存: 4GB 或以上
- 存储: 20GB 或以上
- 操作系统: Ubuntu 20.04 LTS 或 CentOS 8

### 2. 安装系统依赖

#### Ubuntu/Debian

```bash
# 更新系统
sudo apt update
sudo apt upgrade -y

# 安装 Python 3.8+
sudo apt install python3 python3-pip python3-venv -y

# 安装 MySQL
sudo apt install mysql-server -y

# 安装 Nginx
sudo apt install nginx -y

# 安装其他依赖
sudo apt install git build-essential -y
```

#### CentOS/RHEL

```bash
# 更新系统
sudo yum update -y

# 安装 Python 3.8+
sudo yum install python38 python38-pip -y

# 安装 MySQL
sudo yum install mysql-server -y

# 安装 Nginx
sudo yum install nginx -y

# 安装其他依赖
sudo yum install git gcc -y
```

### 3. 配置 MySQL

```bash
# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation

# 登录 MySQL
sudo mysql -u root -p

# 创建数据库和用户
CREATE DATABASE travel_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'traveluser'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON travel_planner.* TO 'traveluser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 部署应用

```bash
# 创建应用目录
sudo mkdir -p /var/www/travel-planner
cd /var/www/travel-planner

# 克隆代码
sudo git clone https://github.com/yourusername/AI-Travel-Planner.git .

# 创建虚拟环境
sudo python3 -m venv venv
sudo chown -R www-data:www-data venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 安装生产服务器
pip install gunicorn
```

### 5. 配置环境变量

```bash
# 创建 .env 文件
sudo nano .env
```

填入生产环境配置：

```env
DATABASE_URL=mysql+pymysql://traveluser:your_strong_password@localhost:3306/travel_planner
SECRET_KEY=your-very-long-and-random-secret-key
ALIYUN_BAILIAN_API_KEY=your-production-api-key
ALIYUN_BAILIAN_APP_ID=your-app-id
ALIYUN_ASR_APP_KEY=your-asr-app-key
ALIYUN_ASR_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ASR_ACCESS_KEY_SECRET=your-access-key-secret
AMAP_API_KEY=your-amap-api-key
AMAP_WEB_SERVICE_KEY=your-amap-web-service-key
HOST=127.0.0.1
PORT=8000
DEBUG=False
```

### 6. 初始化数据库

```bash
python -c "from backend.database import init_db; init_db()"
```

### 7. 配置 Systemd 服务

创建服务文件：

```bash
sudo nano /etc/systemd/system/travel-planner.service
```

内容如下：

```ini
[Unit]
Description=AI Travel Planner FastAPI Application
After=network.target mysql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/travel-planner
Environment="PATH=/var/www/travel-planner/venv/bin"
ExecStart=/var/www/travel-planner/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app --bind 127.0.0.1:8000

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
# 重载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start travel-planner

# 设置开机自启
sudo systemctl enable travel-planner

# 查看状态
sudo systemctl status travel-planner
```

### 8. 配置 Nginx

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/travel-planner
```

内容如下：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/travel-planner/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 请求
    location /auth {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /travel {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /expenses {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /voice {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 语音文件上传需要增大上传限制
        client_max_body_size 10M;
    }

    location /map {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API 文档
    location /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /redoc {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/travel-planner/frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/travel-planner /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 9. 配置 SSL (HTTPS)

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期（Certbot 会自动配置）
sudo systemctl status certbot.timer
```

## Docker 部署（推荐）

### 方式 1: 使用 Docker Hub / GitHub Container Registry

项目已经通过 GitHub Actions 自动构建并发布 Docker 镜像到 GitHub Container Registry。

#### 1. 拉取镜像

```bash
# 从 GitHub Container Registry 拉取最新镜像
docker pull ghcr.io/yourusername/ai-travel-planner:latest
```

#### 2. 创建环境变量文件

```bash
# 复制模板文件
cp env.template .env

# 编辑 .env 文件，填入你的配置
nano .env
```

#### 3. 运行容器

```bash
docker run -d \
  --name ai-travel-planner \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  ghcr.io/yourusername/ai-travel-planner:latest
```

#### 4. 访问应用

打开浏览器访问: `http://localhost:8000`

### 方式 2: 使用 docker-compose（本地构建）

#### 1. 配置环境变量

```bash
cp env.template .env
# 编辑 .env 文件
```

#### 2. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重新构建
docker-compose up -d --build
```

#### 3. 查看运行状态

```bash
# 查看容器状态
docker-compose ps

# 查看健康检查
docker ps

# 进入容器调试
docker-compose exec app bash
```

### GitHub Actions 自动构建

项目配置了 GitHub Actions 自动化 CI/CD 流程：

#### 触发条件

- 推送到 `main` 或 `master` 分支
- 创建 tag（如 `v1.0.0`）
- 手动触发（workflow_dispatch）

#### 构建流程

1. **代码检出**: 拉取最新代码
2. **设置构建环境**: 配置 QEMU 和 Docker Buildx
3. **登录 Registry**: 使用 GITHUB_TOKEN 登录 GHCR
4. **构建镜像**: 
   - 支持多架构: `linux/amd64`, `linux/arm64`
   - 自动生成标签和元数据
   - 使用 GitHub Actions 缓存加速构建
5. **推送镜像**: 发布到 GitHub Container Registry
6. **生成证明**: 创建构建溯源证明

#### 镜像标签策略

- `latest`: 最新的 main/master 分支构建
- `v1.0.0`: 对应 Git tag
- `main`: main 分支构建
- `pr-123`: Pull Request 预览

#### 查看构建状态

访问: `https://github.com/yourusername/AI-Travel-Planner/actions`

### 本地构建 Docker 镜像

```bash
# 构建镜像
docker build -t ai-travel-planner:local .

# 运行容器
docker run -d \
  --name ai-travel-planner \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  ai-travel-planner:local
```

### Docker 镜像优化

当前 Dockerfile 已包含以下优化:

1. **多阶段构建**: 减小最终镜像大小
2. **精简基础镜像**: 使用 `python:3.10-slim`
3. **层缓存优化**: 合理安排 COPY 顺序
4. **健康检查**: 自动监控容器健康状态
5. **安全加固**: 非 root 用户运行（可选）

## 监控和维护

### 查看日志

```bash
# 查看应用日志
sudo journalctl -u travel-planner -f

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 备份数据库

```bash
# 创建备份脚本
sudo nano /root/backup-db.sh
```

内容：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u root -p travel_planner > $BACKUP_DIR/travel_planner_$DATE.sql

# 保留最近 7 天的备份
find $BACKUP_DIR -name "travel_planner_*.sql" -mtime +7 -delete
```

设置定时任务：

```bash
sudo chmod +x /root/backup-db.sh
sudo crontab -e
```

添加：

```
0 2 * * * /root/backup-db.sh
```

## 安全建议

1. **防火墙配置**：
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **定期更新**：
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **监控日志**：定期检查异常访问和错误日志

4. **API 限流**：使用 Nginx 或 FastAPI 中间件限制请求频率

5. **数据库安全**：
   - 使用强密码
   - 禁止远程 root 登录
   - 定期备份

## 性能优化

1. **启用 Gzip 压缩**（Nginx）
2. **配置 Redis 缓存**（可选）
3. **使用 CDN 加速静态资源**
4. **数据库索引优化**
5. **应用程序监控**（如 Prometheus + Grafana）

## 故障排除

### 应用无法启动
1. 检查 `.env` 配置是否正确
2. 查看日志：`sudo journalctl -u travel-planner -n 50`
3. 检查数据库连接

### 502 Bad Gateway
1. 确认应用正在运行：`sudo systemctl status travel-planner`
2. 检查 Nginx 配置：`sudo nginx -t`
3. 查看应用端口：`sudo netstat -tulpn | grep 8000`

### 数据库连接失败
1. 确认 MySQL 正在运行：`sudo systemctl status mysql`
2. 检查用户权限
3. 测试连接：`mysql -u traveluser -p travel_planner`

---

如有问题，请查阅日志或联系技术支持。

