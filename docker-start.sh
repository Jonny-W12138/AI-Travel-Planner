#!/bin/bash

# AI 旅行规划师 Docker 快速启动脚本

set -e

echo "🚀 AI 旅行规划师 Docker 快速启动"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请启动 Docker"
    exit 1
fi

echo "✅ Docker 正在运行"

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件"
    echo "📋 创建示例配置文件..."
    cp env.docker .env
    echo "✅ 已创建 .env 文件，请编辑并填入您的 API 密钥"
    echo "   编辑命令: nano .env 或 vim .env"
    echo ""
    echo "🔑 必需的 API 密钥："
    echo "   - ALIYUN_BAILIAN_API_KEY (AI 功能)"
    echo "   - ALIYUN_ASR_APP_KEY (语音功能)"
    echo "   - AMAP_API_KEY (地图功能)"
    echo ""
    read -p "是否继续启动？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "请先配置 .env 文件后重新运行"
        exit 1
    fi
fi

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p ./data

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker build -t ai-travel-planner:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker 镜像构建成功"
else
    echo "❌ Docker 镜像构建失败"
    exit 1
fi

# 停止现有容器（如果存在）
echo "🛑 停止现有容器..."
docker stop ai-travel-planner 2>/dev/null || true
docker rm ai-travel-planner 2>/dev/null || true

# 启动容器
echo "🚀 启动容器..."
docker run -d \
    --name ai-travel-planner \
    --env-file .env \
    -p 8000:8000 \
    -v "$(pwd)/data:/app/data" \
    --restart unless-stopped \
    ai-travel-planner:latest

if [ $? -eq 0 ]; then
    echo "✅ 容器启动成功"
else
    echo "❌ 容器启动失败"
    exit 1
fi

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "✅ 服务健康检查通过"
    echo ""
    echo "🎉 AI 旅行规划师已成功启动！"
    echo "   访问地址: http://localhost:8000"
    echo "   健康检查: http://localhost:8000/api/health"
    echo ""
    echo "📋 管理命令："
    echo "   查看日志: docker logs ai-travel-planner"
    echo "   停止服务: docker stop ai-travel-planner"
    echo "   重启服务: docker restart ai-travel-planner"
    echo "   删除容器: docker rm -f ai-travel-planner"
else
    echo "⚠️  服务健康检查失败，但容器可能仍在启动中"
    echo "   查看日志: docker logs ai-travel-planner"
    echo "   访问地址: http://localhost:8000"
fi
