"""
Pydantic 数据模型（用于 API 请求和响应）
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List, Dict, Any


# 用户相关
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# 旅行计划相关
class TravelPlanRequest(BaseModel):
    """用户输入的旅行需求"""
    destination: str = Field(..., description="旅行目的地")
    start_date: str = Field(..., description="开始日期，格式：YYYY-MM-DD")
    end_date: str = Field(..., description="结束日期，格式：YYYY-MM-DD")
    budget: float = Field(..., gt=0, description="预算（人民币）")
    travelers_count: int = Field(default=1, gt=0, description="同行人数")
    preferences: str = Field(default="", description="旅行偏好，如：喜欢美食、动漫、带孩子等")


class TravelPlanCreate(BaseModel):
    title: str
    destination: str
    start_date: datetime
    end_date: datetime
    days: int
    budget: float
    travelers_count: int = 1
    preferences: Optional[str] = None
    itinerary: Optional[Dict[str, Any]] = None
    budget_breakdown: Optional[Dict[str, Any]] = None


class TravelPlanUpdate(BaseModel):
    """更新旅行计划"""
    title: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    days: Optional[int] = None
    budget: Optional[float] = None
    travelers_count: Optional[int] = None
    preferences: Optional[str] = None
    itinerary: Optional[Dict[str, Any]] = None
    budget_breakdown: Optional[Dict[str, Any]] = None


class TravelPlanResponse(BaseModel):
    id: int
    user_id: int
    title: str
    destination: str
    start_date: datetime
    end_date: datetime
    days: int
    budget: float
    travelers_count: int
    preferences: Optional[str]
    itinerary: Optional[Dict[str, Any]]
    budget_breakdown: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# 费用记录相关
class ExpenseCreate(BaseModel):
    travel_plan_id: Optional[int] = None
    category: str = Field(..., description="费用类别：交通、住宿、餐饮、景点、购物等")
    amount: float = Field(..., gt=0, description="金额")
    description: Optional[str] = Field(default="", description="描述")
    expense_date: Optional[datetime] = None


class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    travel_plan_id: Optional[int]
    category: str
    amount: float
    description: Optional[str]
    expense_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


# 语音识别相关
class VoiceRecognitionResponse(BaseModel):
    text: str
    confidence: Optional[float] = None


# AI 生成的行程响应
class ItineraryResponse(BaseModel):
    travel_plan_id: int
    title: str
    destination: str
    days: int
    budget: float
    itinerary: Dict[str, Any]
    budget_breakdown: Dict[str, Any]


# AI 修改行程请求
class ItineraryModificationRequest(BaseModel):
    """用户对行程的修改意见"""
    feedback: str = Field(..., description="用户的修改意见，如：我想多去几个博物馆、第二天想改成爬山等")

