"""
数据库模型定义
"""
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    """用户表"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    travel_plans = relationship("TravelPlan", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")


class TravelPlan(Base):
    """旅行计划表"""
    __tablename__ = "travel_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    destination = Column(String(200), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    days = Column(Integer, nullable=False)
    budget = Column(Float, nullable=False)
    travelers_count = Column(Integer, default=1)
    preferences = Column(Text)  # 旅行偏好
    
    # AI 生成的详细行程（JSON 格式）
    itinerary = Column(JSON)  # 包括交通、住宿、景点、餐厅等
    
    # 预算分析（JSON 格式）
    budget_breakdown = Column(JSON)  # AI 生成的预算分析
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user = relationship("User", back_populates="travel_plans")
    expenses = relationship("Expense", back_populates="travel_plan", cascade="all, delete-orphan")


class Expense(Base):
    """费用记录表"""
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    travel_plan_id = Column(Integer, ForeignKey("travel_plans.id"), nullable=True)
    category = Column(String(50), nullable=False)  # 交通、住宿、餐饮、景点、购物等
    amount = Column(Float, nullable=False)
    description = Column(Text)
    expense_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    user = relationship("User", back_populates="expenses")
    travel_plan = relationship("TravelPlan", back_populates="expenses")

