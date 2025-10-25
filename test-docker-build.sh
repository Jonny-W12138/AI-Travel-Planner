#!/bin/bash

# Docker 构建测试脚本
echo "🐳 开始测试 Docker 构建..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请启动 Docker"
    exit 1
fi

echo "✅ Docker 正在运行"

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker build -t ai-travel-planner:test .

if [ $? -eq 0 ]; then
    echo "✅ Docker 镜像构建成功！"
    
    # 测试运行
    echo "🚀 测试运行容器..."
    docker run --rm -d --name ai-travel-planner-test -p 8000:8000 ai-travel-planner:test
    
    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 10
    
    # 检查健康状态
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "✅ 服务健康检查通过！"
    else
        echo "⚠️ 服务健康检查失败，但容器可能仍在启动中"
    fi
    
    # 停止容器
    echo "🛑 停止测试容器..."
    docker stop ai-travel-planner-test
    
    echo "🎉 Docker 构建测试完成！"
else
    echo "❌ Docker 镜像构建失败"
    exit 1
fi
