#!/bin/bash

# AI 旅行规划师 Docker 启动脚本

set -e

echo "🚀 AI 旅行规划师启动中..."

# 检查必要的环境变量
check_env() {
    local var_name=$1
    local var_value=$2
    local default_value=$3
    
    if [ -z "$var_value" ]; then
        echo "⚠️  环境变量 $var_name 未设置，使用默认值: $default_value"
        export $var_name="$default_value"
    else
        echo "✅ 环境变量 $var_name 已设置"
    fi
}

# 检查关键环境变量
echo "🔍 检查环境变量配置..."
check_env "SECRET_KEY" "$SECRET_KEY" "your-secret-key-change-in-production"
check_env "DATABASE_URL" "$DATABASE_URL" "sqlite:///./data/travel_planner.db"
check_env "HOST" "$HOST" "0.0.0.0"
check_env "PORT" "$PORT" "8000"

# 检查 API 密钥
if [ -z "$ALIYUN_BAILIAN_API_KEY" ]; then
    echo "⚠️  ALIYUN_BAILIAN_API_KEY 未设置，AI 功能将不可用"
fi

if [ -z "$ALIYUN_ASR_APP_KEY" ]; then
    echo "⚠️  ALIYUN_ASR_APP_KEY 未设置，语音功能将不可用"
fi

if [ -z "$AMAP_API_KEY" ]; then
    echo "⚠️  AMAP_API_KEY 未设置，地图功能将不可用"
fi

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p /app/data

# 初始化数据库
echo "🗄️  初始化数据库..."
python -c "
import sys
sys.path.append('/app')
try:
    from backend.database import init_db
    init_db()
    print('✅ 数据库初始化成功')
except Exception as e:
    print(f'❌ 数据库初始化失败: {e}')
    sys.exit(1)
"

# 检查数据库文件
if [ -f "/app/data/travel_planner.db" ]; then
    echo "✅ 数据库文件已创建"
else
    echo "⚠️  数据库文件未找到，但继续启动..."
fi

# 显示配置信息
echo "📋 当前配置:"
echo "   - 数据库: $DATABASE_URL"
echo "   - 主机: $HOST"
echo "   - 端口: $PORT"
echo "   - 调试模式: $DEBUG"

# 启动应用
echo "🌟 启动 AI 旅行规划师..."
echo "   访问地址: http://localhost:$PORT"
echo "   健康检查: http://localhost:$PORT/api/health"

# 执行传入的命令
exec "$@"
