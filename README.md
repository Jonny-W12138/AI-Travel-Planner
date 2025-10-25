# AI 旅行规划师 (AI Travel Planner)

[![Build and Push Docker Image](https://github.com/yourusername/AI-Travel-Planner/actions/workflows/docker-build.yml/badge.svg)](https://github.com/yourusername/AI-Travel-Planner/actions/workflows/docker-build.yml)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/yourusername/AI-Travel-Planner/pkgs/container/ai-travel-planner)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

一个基于 AI 的智能旅行规划 Web 应用，帮助用户轻松规划旅行路线、管理预算和记录开销。

## ✨ 功能特性

### 1. 智能行程规划
- 🎤 **语音输入**：支持语音描述旅行需求
- ✍️ **文字输入**：支持表单输入旅行信息
- 🤖 **AI 生成**：使用阿里云百炼大模型自动生成详细的旅行计划
- 📋 **详细行程**：包含每日活动安排、景点推荐、用餐建议、住宿推荐
- 💰 **预算分析**：AI 自动分析预算分配（交通、住宿、餐饮、景点等）

### 2. 费用预算与管理
- 💵 **费用记录**：支持语音和文字记录旅行开销
- 📊 **费用统计**：按类别统计费用，实时查看预算使用情况
- 🤖 **AI 分析**：AI 提供预算使用建议和优化方案

### 3. 用户管理与数据存储
- 👤 **注册登录**：安全的用户认证系统
- 💾 **云端同步**：所有数据存储在 MySQL 数据库，支持多设备访问
- 📱 **多计划管理**：保存和管理多个旅行计划

### 4. 地图导航
- 🗺️ **高德地图集成**：在地图上可视化展示旅行路线和景点
- 📍 **地理位置服务**：自动标记景点位置
- 🔍 **POI 搜索**：搜索附近的餐厅、酒店、景点

## 🛠️ 技术栈

### 后端
- **框架**：FastAPI (Python 3.8+)
- **数据库**：MySQL + SQLAlchemy ORM
- **认证**：JWT Token
- **AI 服务**：阿里云百炼大模型 API
- **语音识别**：阿里云语音识别 API
- **地图服务**：高德地图 Web 服务 API

### 前端
- **技术**：原生 HTML5 + CSS3 + JavaScript (ES6+)
- **地图**：高德地图 JavaScript API
- **语音**：Web Audio API + MediaRecorder API
- **样式**：响应式设计，支持移动端

## 📦 安装部署

### 🐳 方式 1: 使用 Docker (推荐)

**一键部署，包含 MySQL 数据库**

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/AI-Travel-Planner.git
cd AI-Travel-Planner

# 2. 配置 API 密钥
cp env.docker .env
# 编辑 .env 文件，填入您的 API 密钥

# 3. 一键启动
./docker-start.sh

# 4. 访问应用
打开浏览器: http://localhost:8000
```

**或者使用已发布的镜像：**

```bash
# 拉取镜像
docker pull ghcr.io/yourusername/ai-travel-planner:latest

# 运行容器（只需配置 API 密钥）
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
  ghcr.io/yourusername/ai-travel-planner:latest
```

**详细说明**: 查看 [QUICK_START.md](QUICK_START.md) 和 [DOCKER_DEPLOY.md](DOCKER_DEPLOY.md)

查看更多 Docker 部署选项：[DEPLOY.md](DEPLOY.md)

---

### 💻 方式 2: 手动安装部署

#### 环境要求

- **Python 3.13** 或更高版本（语音功能需要）
- MySQL 5.7 或更高版本（或使用 SQLite）
- **FFmpeg**（语音格式转换需要）
- 现代浏览器（Chrome、Firefox、Safari、Edge）

#### 1. 克隆项目

```bash
git clone https://github.com/yourusername/AI-Travel-Planner.git
cd AI-Travel-Planner
```

#### 2. 安装系统依赖

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Windows:**
从 [FFmpeg 官网](https://ffmpeg.org/download.html) 下载并安装

#### 3. 安装 Python 依赖

```bash
# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

#### 4. 配置数据库

创建 MySQL 数据库：

```sql
CREATE DATABASE travel_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

或者使用 SQLite（开发环境）：

```env
DATABASE_URL=sqlite:///./travel_planner.db
```

#### 5. 配置环境变量

复制 `env.template` 文件为 `.env`：

```bash
cp env.template .env
```

编辑 `.env` 文件，填入您的配置：

```env
# 数据库配置
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/travel_planner

# JWT 密钥（请生成一个随机的安全密钥）
SECRET_KEY=your-secret-key-here

# 阿里云百炼 API
ALIYUN_BAILIAN_API_KEY=your-aliyun-bailian-api-key
ALIYUN_BAILIAN_APP_ID=your-app-id

# 阿里云语音识别 API
ALIYUN_ASR_APP_KEY=your-aliyun-asr-app-key
ALIYUN_ASR_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ASR_ACCESS_KEY_SECRET=your-access-key-secret

# 高德地图 API
AMAP_API_KEY=your-amap-api-key
AMAP_WEB_SERVICE_KEY=your-amap-web-service-key

# 服务器配置
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

#### 6. 配置前端地图 API

编辑 `frontend/index.html`，将高德地图 API Key 替换为您的密钥：

```html
<script type="text/javascript" src="https://webapi.amap.com/maps?v=2.0&key=YOUR_AMAP_KEY"></script>
```

#### 7. 初始化数据库

```bash
python -c "from backend.database import init_db; init_db()"
```

#### 8. 启动服务

```bash
python run.py
```

服务将在 `http://localhost:8000` 启动。

浏览器访问：`http://localhost:8000`

## 🔑 API 密钥获取

### 阿里云百炼 API

1. 访问 [阿里云百炼平台](https://www.aliyun.com/product/bailian)
2. 注册并创建应用
3. 获取 API Key 和 App ID

### 阿里云语音识别 API

⚠️ **重要**：语音识别功能需要正确配置阿里云智能语音交互服务才能使用。

1. 访问 [阿里云智能语音交互](https://www.aliyun.com/product/nls)
2. 开通服务并创建项目
3. 获取：
   - **AppKey**：项目的应用密钥
   - **Access Key ID**：阿里云访问密钥 ID
   - **Access Key Secret**：阿里云访问密钥密文

📖 **详细配置步骤请参考**: [语音识别配置指南 (VOICE_SETUP.md)](VOICE_SETUP.md)

### 高德地图 API

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册开发者账号
3. 创建应用，获取 Web 端和 Web 服务的 API Key

## 📚 API 文档

启动服务后，访问以下地址查看自动生成的 API 文档：

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🎯 主要 API 端点

### 认证
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取当前用户信息

### 旅行计划
- `POST /travel/plan` - 创建旅行计划（AI 生成）
- `GET /travel/plans` - 获取所有旅行计划
- `GET /travel/plans/{plan_id}` - 获取指定旅行计划
- `DELETE /travel/plans/{plan_id}` - 删除旅行计划

### 费用管理
- `POST /expenses/` - 添加费用记录
- `GET /expenses/` - 获取费用记录
- `GET /expenses/summary` - 获取费用汇总（含 AI 分析）
- `DELETE /expenses/{expense_id}` - 删除费用记录

### 语音识别
- `POST /voice/recognize` - 语音识别（文件上传）
- `POST /voice/recognize-base64` - 语音识别（Base64）
- `POST /voice/parse-query` - 解析语音查询

### 地图服务
- `GET /map/geocode` - 地理编码
- `GET /map/poi` - 搜索兴趣点
- `GET /map/route` - 路径规划
- `GET /map/weather` - 获取天气信息

## 🚀 使用指南

### 1. 创建旅行计划

**方式一：语音输入**
1. 点击"开始录音"按钮
2. 说出您的旅行需求，例如："我想去日本东京，5天，预算1万元，喜欢美食和动漫，带孩子"
3. 点击"停止录音"
4. AI 会自动识别并填充表单
5. 补充完整信息后点击"生成旅行计划"

**方式二：文字输入**
1. 在表单中填写目的地、日期、预算等信息
2. 填写旅行偏好（可选）
3. 点击"生成旅行计划"

### 2. 查看行程

- AI 会生成详细的每日行程安排
- 地图上会自动标记所有景点位置
- 查看预算分析和旅行建议

### 3. 记录费用

- 在"费用管理"页面添加开销
- 支持按类别记录：交通、住宿、餐饮、景点、购物等
- 查看费用汇总和 AI 预算分析

## ⚠️ 注意事项

1. **API Key 安全**：
   - 切勿将 API Key 提交到 GitHub
   - `.env` 文件已添加到 `.gitignore`
   - 生产环境请使用环境变量或密钥管理服务

2. **语音权限**：
   - 首次使用语音功能需要授权麦克风访问
   - HTTPS 环境下语音功能更稳定

3. **浏览器兼容性**：
   - 推荐使用 Chrome、Firefox、Safari 最新版本
   - 某些旧版浏览器可能不支持 Web Audio API

## 🐛 常见问题

### 数据库连接失败
- 检查 MySQL 服务是否启动
- 确认 `.env` 中的数据库配置正确
- 检查数据库用户权限

### 语音识别不工作
- 确认已配置阿里云语音识别 API
- 检查浏览器是否授权麦克风访问
- 尝试使用 HTTPS 访问（某些浏览器要求）

### 地图不显示
- 确认高德地图 API Key 已正确配置
- 检查浏览器控制台是否有错误信息
- 确认 API Key 的配额和权限

## 📄 开源协议

本项目采用 MIT 协议开源，详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 GitHub Issue
- 发送邮件至：your-email@example.com

## 🙏 致谢

- [FastAPI](https://fastapi.tiangolo.com/) - 现代、快速的 Web 框架
- [阿里云百炼](https://www.aliyun.com/product/bailian) - AI 大模型服务
- [高德地图](https://lbs.amap.com/) - 地图和位置服务
- [SQLAlchemy](https://www.sqlalchemy.org/) - Python SQL 工具包

---

Made with ❤️ by Your Name
