#!/bin/bash

# Docker 构建测试脚本（Ubuntu 22.04 + Python 3.13 + MySQL）

echo "🐳 开始测试 Docker 构建（Ubuntu 22.04 + Python 3.13 + MySQL）..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请启动 Docker"
    exit 1
fi

echo "✅ Docker 正在运行"

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker build -t ai-travel-planner:ubuntu-test .

if [ $? -eq 0 ]; then
    echo "✅ Docker 镜像构建成功！"
    
    # 测试运行
    echo "🚀 测试运行容器..."
    docker run --rm -d \
        --name ai-travel-planner-test \
        -p 8000:8000 \
        -p 3306:3306 \
        -e SECRET_KEY="test-secret-key" \
        -e ALIYUN_BAILIAN_API_KEY="test-bailian-key" \
        -e ALIYUN_ASR_APP_KEY="test-asr-key" \
        -e ALIYUN_ASR_ACCESS_KEY_ID="test-access-key-id" \
        -e ALIYUN_ASR_ACCESS_KEY_SECRET="test-access-key-secret" \
        -e AMAP_API_KEY="test-amap-key" \
        -e AMAP_WEB_SERVICE_KEY="test-amap-web-key" \
        ai-travel-planner:ubuntu-test
    
    # 等待服务启动
    echo "⏳ 等待服务启动（MySQL 需要更长时间）..."
    sleep 30
    
    # 检查服务状态
    echo "🔍 检查服务状态..."
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "✅ 服务健康检查通过"
        echo ""
        echo "🎉 AI 旅行规划师已成功启动！"
        echo "   访问地址: http://localhost:8000"
        echo "   健康检查: http://localhost:8000/api/health"
        echo "   MySQL 端口: 3306"
        echo ""
        echo "📋 测试 MySQL 连接："
        echo "   docker exec ai-travel-planner-test mysql -u travel_user -p travel_planner"
        echo ""
        echo "📋 查看日志："
        echo "   docker logs ai-travel-planner-test"
    else
        echo "⚠️  服务健康检查失败，但容器可能仍在启动中"
        echo "   查看日志: docker logs ai-travel-planner-test"
        echo "   访问地址: http://localhost:8000"
    fi
    
    # 停止容器
    echo "🛑 停止测试容器..."
    docker stop ai-travel-planner-test
    
    echo "🎉 Docker 构建测试完成！"
else
    echo "❌ Docker 镜像构建失败"
    exit 1
fi
