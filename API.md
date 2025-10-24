# API 接口文档

本文档详细说明 AI 旅行规划师的所有 API 接口。

## 基础信息

- **基础 URL**: `http://localhost:8000`
- **认证方式**: JWT Bearer Token
- **请求格式**: JSON
- **响应格式**: JSON

## 认证流程

所有需要认证的接口都需要在请求头中包含：

```
Authorization: Bearer <your_token>
```

## API 端点

### 1. 认证接口 (`/auth`)

#### 1.1 用户注册

**请求**:
```http
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "created_at": "2025-10-20T10:00:00"
}
```

#### 1.2 用户登录

**请求**:
```http
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**响应**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### 1.3 获取当前用户信息

**请求**:
```http
GET /auth/me
Authorization: Bearer <token>
```

**响应**:
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "created_at": "2025-10-20T10:00:00"
}
```

### 2. 旅行计划接口 (`/travel`)

#### 2.1 创建旅行计划

**请求**:
```http
POST /travel/plan
Authorization: Bearer <token>
Content-Type: application/json

{
  "destination": "日本东京",
  "start_date": "2025-11-01",
  "end_date": "2025-11-05",
  "budget": 10000,
  "travelers_count": 2,
  "preferences": "喜欢美食和动漫，想去体验传统文化"
}
```

**响应**:
```json
{
  "travel_plan_id": 1,
  "title": "日本东京 5天游",
  "destination": "日本东京",
  "days": 5,
  "itinerary": {
    "overview": "这是一次结合美食、动漫文化和传统体验的东京之旅...",
    "daily_itinerary": [
      {
        "day": 1,
        "title": "抵达东京，探索秋叶原",
        "activities": [
          {
            "time": "09:00",
            "activity": "抵达成田机场",
            "location": "成田国际机场",
            "description": "乘坐 Narita Express 前往市区",
            "estimated_cost": 300,
            "duration": "1小时"
          }
        ],
        "meals": {
          "breakfast": "飞机餐",
          "lunch": "秋叶原拉面店",
          "dinner": "居酒屋体验"
        },
        "accommodation": "新宿商务酒店"
      }
    ],
    "transportation": {
      "to_destination": "往返机票约 3000 元",
      "local": "推荐购买 7日 JR Pass",
      "estimated_cost": 4000
    },
    "accommodation_summary": {
      "type": "商务酒店",
      "suggestions": ["新宿王子酒店", "上野世纪酒店"],
      "estimated_cost_per_night": 500,
      "total_nights": 4,
      "total_cost": 2000
    },
    "budget_breakdown": {
      "transportation": 4000,
      "accommodation": 2000,
      "meals": 2000,
      "attractions": 1500,
      "shopping": 300,
      "emergency": 200,
      "total": 10000
    },
    "tips": [
      "提前预订景点门票可以节省排队时间",
      "建议购买西瓜卡（Suica）用于交通支付",
      "日本很多地方只收现金，请准备适量现金"
    ]
  },
  "budget_breakdown": {
    "transportation": 4000,
    "accommodation": 2000,
    "meals": 2000,
    "attractions": 1500,
    "shopping": 300,
    "emergency": 200,
    "total": 10000
  }
}
```

#### 2.2 获取所有旅行计划

**请求**:
```http
GET /travel/plans
Authorization: Bearer <token>
```

**响应**:
```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "日本东京 5天游",
    "destination": "日本东京",
    "start_date": "2025-11-01T00:00:00",
    "end_date": "2025-11-05T00:00:00",
    "days": 5,
    "budget": 10000,
    "travelers_count": 2,
    "preferences": "喜欢美食和动漫",
    "itinerary": { ... },
    "budget_breakdown": { ... },
    "created_at": "2025-10-20T10:00:00",
    "updated_at": "2025-10-20T10:00:00"
  }
]
```

#### 2.3 获取指定旅行计划

**请求**:
```http
GET /travel/plans/{plan_id}
Authorization: Bearer <token>
```

**响应**: 同 2.2

#### 2.4 删除旅行计划

**请求**:
```http
DELETE /travel/plans/{plan_id}
Authorization: Bearer <token>
```

**响应**: `204 No Content`

### 3. 费用管理接口 (`/expenses`)

#### 3.1 添加费用记录

**请求**:
```http
POST /expenses/
Authorization: Bearer <token>
Content-Type: application/json

{
  "travel_plan_id": 1,
  "category": "餐饮",
  "amount": 150.5,
  "description": "午餐 - 寿司店"
}
```

**响应**:
```json
{
  "id": 1,
  "user_id": 1,
  "travel_plan_id": 1,
  "category": "餐饮",
  "amount": 150.5,
  "description": "午餐 - 寿司店",
  "expense_date": "2025-10-20T12:30:00",
  "created_at": "2025-10-20T12:30:00"
}
```

#### 3.2 获取费用记录

**请求**:
```http
GET /expenses/?travel_plan_id=1
Authorization: Bearer <token>
```

**响应**:
```json
[
  {
    "id": 1,
    "user_id": 1,
    "travel_plan_id": 1,
    "category": "餐饮",
    "amount": 150.5,
    "description": "午餐 - 寿司店",
    "expense_date": "2025-10-20T12:30:00",
    "created_at": "2025-10-20T12:30:00"
  }
]
```

#### 3.3 获取费用汇总

**请求**:
```http
GET /expenses/summary?travel_plan_id=1
Authorization: Bearer <token>
```

**响应**:
```json
{
  "total": 3500.5,
  "by_category": {
    "交通": 1200,
    "住宿": 1500,
    "餐饮": 650.5,
    "景点": 150
  },
  "budget": 10000,
  "remaining": 6499.5,
  "usage_percentage": 35.0,
  "ai_analysis": "您的预算使用情况良好，目前已花费 35% 的预算。建议后续控制餐饮开支，可以尝试更多性价比高的当地小吃..."
}
```

#### 3.4 删除费用记录

**请求**:
```http
DELETE /expenses/{expense_id}
Authorization: Bearer <token>
```

**响应**: `204 No Content`

### 4. 语音识别接口 (`/voice`)

#### 4.1 语音识别（文件上传）

**请求**:
```http
POST /voice/recognize
Authorization: Bearer <token>
Content-Type: multipart/form-data

audio: <音频文件>
```

**响应**:
```json
{
  "text": "我想去日本东京，五天，预算一万元，喜欢美食和动漫",
  "confidence": 0.95
}
```

#### 4.2 语音识别（Base64）

**请求**:
```http
POST /voice/recognize-base64
Authorization: Bearer <token>
Content-Type: application/json

{
  "audio_data": "base64_encoded_audio_data",
  "format": "wav"
}
```

**响应**: 同 4.1

#### 4.3 解析语音查询

**请求**:
```http
POST /voice/parse-query?text=我想去日本东京五天预算一万元
Authorization: Bearer <token>
```

**响应**:
```json
{
  "destination": "日本东京",
  "days": 5,
  "budget": 10000,
  "travelers_count": null,
  "preferences": null,
  "query_type": "travel_plan"
}
```

### 5. 地图服务接口 (`/map`)

#### 5.1 地理编码

**请求**:
```http
GET /map/geocode?address=东京塔
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "longitude": 139.745433,
    "latitude": 35.658581,
    "formatted_address": "日本东京都港区芝公园4-2-8"
  }
}
```

#### 5.2 搜索兴趣点

**请求**:
```http
GET /map/poi?query=拉面&city=东京
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "id": "B000A8LO2Y",
      "name": "一兰拉面",
      "type": "餐饮服务",
      "address": "涩谷区...",
      "location": {
        "longitude": 139.7,
        "latitude": 35.6
      },
      "tel": "03-xxxx-xxxx",
      "distance": "500"
    }
  ]
}
```

#### 5.3 路径规划

**请求**:
```http
GET /map/route?origin=139.7,35.6&destination=139.8,35.7&mode=walking
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "distance": "2500",
    "duration": "1800",
    "steps": [...]
  }
}
```

#### 5.4 获取天气信息

**请求**:
```http
GET /map/weather?city=东京
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "city": "东京",
    "province": "东京都",
    "weather": "晴",
    "temperature": "18",
    "winddirection": "东南",
    "windpower": "≤3"
  }
}
```

## 错误响应

所有接口在出错时都会返回以下格式的响应：

```json
{
  "detail": "错误信息描述"
}
```

常见 HTTP 状态码：

- `200 OK` - 请求成功
- `201 Created` - 资源创建成功
- `204 No Content` - 删除成功
- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未授权（未登录或 token 无效）
- `404 Not Found` - 资源不存在
- `422 Unprocessable Entity` - 数据验证失败
- `500 Internal Server Error` - 服务器错误

## 请求示例（Python）

```python
import requests

# 登录
response = requests.post('http://localhost:8000/auth/login', json={
    'username': 'testuser',
    'password': 'password123'
})
token = response.json()['access_token']

# 创建旅行计划
headers = {'Authorization': f'Bearer {token}'}
response = requests.post('http://localhost:8000/travel/plan', json={
    'destination': '日本东京',
    'start_date': '2025-11-01',
    'end_date': '2025-11-05',
    'budget': 10000,
    'travelers_count': 2,
    'preferences': '喜欢美食和动漫'
}, headers=headers)

plan = response.json()
print(plan)
```

## 请求示例（JavaScript）

```javascript
// 登录
const response = await fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123'
  })
});
const { access_token } = await response.json();

// 创建旅行计划
const planResponse = await fetch('http://localhost:8000/travel/plan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    destination: '日本东京',
    start_date: '2025-11-01',
    end_date: '2025-11-05',
    budget: 10000,
    travelers_count: 2,
    preferences: '喜欢美食和动漫'
  })
});

const plan = await planResponse.json();
console.log(plan);
```

## 限制说明

- 语音文件上传大小限制：10MB
- API 请求频率：建议每秒不超过 10 次
- Token 有效期：7 天

## 更多信息

启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc


