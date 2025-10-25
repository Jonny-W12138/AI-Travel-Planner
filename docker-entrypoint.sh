#!/bin/bash

# AI 旅行规划师 Docker 启动脚本（包含 MySQL）

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
check_env "DATABASE_URL" "$DATABASE_URL" "mysql+pymysql://travel_user:travel_password@localhost:3306/travel_planner"
check_env "HOST" "$HOST" "0.0.0.0"
check_env "PORT" "$PORT" "8000"

# MySQL 配置
check_env "MYSQL_ROOT_PASSWORD" "$MYSQL_ROOT_PASSWORD" "root_password"
check_env "MYSQL_DATABASE" "$MYSQL_DATABASE" "travel_planner"
check_env "MYSQL_USER" "$MYSQL_USER" "travel_user"
check_env "MYSQL_PASSWORD" "$MYSQL_PASSWORD" "travel_password"

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

# 启动 MySQL 服务
echo "🗄️  启动 MySQL 服务..."
service mysql start

# 等待 MySQL 启动
echo "⏳ 等待 MySQL 启动..."
sleep 15

# 检查 MySQL 是否运行
if ! pgrep mysqld > /dev/null; then
    echo "❌ MySQL 启动失败"
    exit 1
fi

echo "✅ MySQL 服务已启动"

# 等待 MySQL 完全就绪
echo "⏳ 等待 MySQL 完全就绪..."
sleep 5

# 配置 MySQL（先设置 root 密码，然后创建用户和数据库）
echo "🔧 配置 MySQL..."
mysql -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';
FLUSH PRIVILEGES;
EOF

# 使用 root 密码创建数据库和用户
mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$MYSQL_USER'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';
CREATE USER IF NOT EXISTS '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'localhost';
GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'%';
FLUSH PRIVILEGES;
EOF

echo "✅ MySQL 配置完成"

# 初始化数据库表结构
echo "📋 初始化数据库表结构..."
mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /app/mysql-init.sql

echo "✅ 数据库表结构初始化完成"

# 测试数据库连接
echo "🔍 测试数据库连接..."
python -c "
import sys
sys.path.append('/app')
try:
    from backend.database import engine
    with engine.connect() as conn:
        result = conn.execute('SELECT 1')
        print('✅ 数据库连接测试成功')
except Exception as e:
    print(f'❌ 数据库连接测试失败: {e}')
    sys.exit(1)
"

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p /app/data

# 显示配置信息
echo "📋 当前配置:"
echo "   - 数据库: $DATABASE_URL"
echo "   - MySQL 用户: $MYSQL_USER"
echo "   - MySQL 数据库: $MYSQL_DATABASE"
echo "   - 主机: $HOST"
echo "   - 端口: $PORT"
echo "   - 调试模式: $DEBUG"

# 启动应用
echo "🌟 启动 AI 旅行规划师..."
echo "   访问地址: http://localhost:$PORT"
echo "   健康检查: http://localhost:$PORT/api/health"
echo "   MySQL 端口: 3306"

# 执行传入的命令
exec "$@"
