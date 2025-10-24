#!/bin/bash

echo "================================================"
echo "AI 旅行规划师 - 安装脚本"
echo "================================================"

# 检查 Python 版本
echo "检查 Python 版本..."
python3 --version

# 创建虚拟环境
echo "创建虚拟环境..."
python3 -m venv venv

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "安装依赖..."
pip install --upgrade pip
pip install -r requirements.txt

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "警告: .env 文件不存在"
    echo "请复制 .env.example 为 .env 并填写配置"
    echo "命令: cp .env.example .env"
else
    echo "✓ .env 文件已存在"
fi

echo ""
echo "================================================"
echo "安装完成！"
echo "================================================"
echo ""
echo "下一步："
echo "1. 配置 MySQL 数据库"
echo "2. 编辑 .env 文件，填写 API Keys"
echo "3. 初始化数据库: python -c 'from backend.database import init_db; init_db()'"
echo "4. 启动服务: python run.py"
echo ""
echo "详细文档请查看 README.md"
echo "================================================"

