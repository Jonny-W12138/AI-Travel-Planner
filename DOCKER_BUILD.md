# 🐳 Docker 构建说明

## 📋 系统要求

- **基础镜像**: Ubuntu 22.04 LTS
- **Python 版本**: 3.13（通过 deadsnakes PPA 安装）
- **数据库**: MySQL 8.0（官方 MySQL 包）
- **FFmpeg**: 音频格式转换
- **Docker**: 用于容器化部署

## 🔧 构建过程

### 1. 基础镜像选择
```dockerfile
FROM ubuntu:22.04
```

### 2. 系统依赖安装
```dockerfile
RUN apt-get update && apt-get install -y \
    software-properties-common \
    curl \
    wget \
    gnupg \
    lsb-release \
    build-essential \
    ffmpeg \
    mysql-server \      # 官方 MySQL 8.0
    mysql-client \     # 官方 MySQL 客户端
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y python3.13 python3.13-dev python3.13-distutils \
    && curl -sS https://bootstrap.pypa.io/get-pip.py | python3.13 \
    && ln -s /usr/bin/python3.13 /usr/bin/python \
    && ln -s /usr/bin/python3.13 /usr/bin/python3
```

### 3. Python 环境配置
- 通过 `deadsnakes` PPA 安装 Python 3.13
- 使用 `get-pip.py` 安装 pip
- 创建符号链接确保 `python` 和 `python3` 指向 Python 3.13

### 4. 数据库配置
- 使用官方 MySQL 8.0 包
- 预设用户和数据库配置
- 自动初始化表结构

## 🧪 本地测试

```bash
# 运行测试脚本
./test-docker-ubuntu.sh

# 手动测试
docker build -t ai-travel-planner:ubuntu-test .
docker run -d --name test -p 8000:8000 -p 3306:3306 ai-travel-planner:ubuntu-test
```

## ⚠️ 常见问题

### 问题 1：Python 3.13 安装失败
```
E: Package 'python3.13' has no installation candidate
```

**解决方案**：确保添加了 deadsnakes PPA
```dockerfile
RUN add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y python3.13
```

### 问题 2：MySQL 启动失败
```
ERROR: MySQL service failed to start
```

**解决方案**：增加等待时间，使用正确的 MySQL 配置
```bash
# 在启动脚本中
sleep 10  # 增加等待时间
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';"
```

### 问题 3：pip 安装失败
```
ERROR: pip install failed
```

**解决方案**：使用 get-pip.py 安装 pip
```dockerfile
RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3.13
```

## 📊 镜像大小

- **基础镜像**: Ubuntu 22.04 (~77MB)
- **系统依赖**: ~200MB
- **Python 3.13**: ~50MB
- **MySQL 8.0**: ~150MB
- **应用代码**: ~50MB
- **总计**: ~527MB

## 🔄 优化建议

### 多阶段构建（可选）
```dockerfile
# 构建阶段
FROM ubuntu:22.04 as builder
# ... 安装依赖和构建

# 运行阶段
FROM ubuntu:22.04 as runtime
# ... 复制构建结果
```

### 清理缓存
```dockerfile
RUN apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && pip cache purge
```

## 🚀 部署流程

1. **构建镜像**: `docker build -t ai-travel-planner:latest .`
2. **推送镜像**: `docker push ghcr.io/username/ai-travel-planner:latest`
3. **部署容器**: `docker run -d -p 8000:8000 -p 3306:3306 ai-travel-planner:latest`

## 📝 版本兼容性

| 组件 | 版本 | 兼容性 |
|------|------|--------|
| Ubuntu | 22.04 LTS | ✅ 长期支持 |
| Python | 3.13 | ✅ 最新稳定版 |
| MySQL | 8.0 | ✅ 官方支持 |
| FFmpeg | 4.4+ | ✅ 音频处理 |

## 🔄 持续集成

GitHub Actions 工作流配置：
- 自动构建多架构镜像
- 推送到 GitHub Container Registry
- 生成构建证明（attestation）
- 支持缓存加速构建

## 📝 版本管理

建议使用语义化版本标签：
```bash
# 创建版本标签
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions 会自动构建并推送镜像
# 镜像标签：ghcr.io/username/ai-travel-planner:v1.0.0
```