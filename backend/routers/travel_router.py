"""
旅行计划相关的 API 路由
"""
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, TravelPlan
from ..schemas import (
    TravelPlanRequest,
    TravelPlanCreate,
    TravelPlanResponse,
    ItineraryResponse
)
from ..auth import get_current_user
from ..services.ai_service import AIService

router = APIRouter(prefix="/travel", tags=["旅行计划"])


@router.post("/plan", response_model=ItineraryResponse, status_code=status.HTTP_201_CREATED)
async def create_travel_plan(
    request: TravelPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建旅行计划（使用 AI 生成）"""
    
    # 解析日期
    try:
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="日期格式错误，请使用 YYYY-MM-DD 格式"
        )
    
    # 计算天数
    days = (end_date - start_date).days + 1
    if days <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="结束日期必须晚于开始日期"
        )
    
    # 使用 AI 生成旅行计划
    try:
        ai_result = AIService.generate_travel_plan(
            destination=request.destination,
            days=days,
            budget=request.budget,
            travelers_count=request.travelers_count,
            preferences=request.preferences
        )
    except Exception as ai_error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 生成旅行计划失败: {str(ai_error)}"
        )
    
    # 创建旅行计划
    title = f"{request.destination} {days}天游"
    
    travel_plan = TravelPlan(
        user_id=current_user.id,
        title=title,
        destination=request.destination,
        start_date=start_date,
        end_date=end_date,
        days=days,
        budget=request.budget,
        travelers_count=request.travelers_count,
        preferences=request.preferences,
        itinerary=ai_result,
        budget_breakdown=ai_result.get("budget_breakdown", {})
    )
    
    db.add(travel_plan)
    db.commit()
    db.refresh(travel_plan)
    
    return {
        "travel_plan_id": travel_plan.id,
        "title": travel_plan.title,
        "destination": travel_plan.destination,
        "days": travel_plan.days,
        "budget": travel_plan.budget,
        "itinerary": travel_plan.itinerary,
        "budget_breakdown": travel_plan.budget_breakdown
    }


@router.get("/plans", response_model=List[TravelPlanResponse])
async def get_travel_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的所有旅行计划"""
    
    plans = db.query(TravelPlan).filter(
        TravelPlan.user_id == current_user.id
    ).order_by(TravelPlan.created_at.desc()).all()
    
    return plans


@router.get("/plans/{plan_id}", response_model=TravelPlanResponse)
async def get_travel_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取指定的旅行计划"""
    
    plan = db.query(TravelPlan).filter(
        TravelPlan.id == plan_id,
        TravelPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="旅行计划不存在"
        )
    
    return plan


@router.put("/plans/{plan_id}", response_model=TravelPlanResponse)
async def update_travel_plan(
    plan_id: int,
    plan_update: TravelPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新旅行计划"""
    
    plan = db.query(TravelPlan).filter(
        TravelPlan.id == plan_id,
        TravelPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="旅行计划不存在"
        )
    
    # 更新字段
    for field, value in plan_update.dict(exclude_unset=True).items():
        setattr(plan, field, value)
    
    db.commit()
    db.refresh(plan)
    
    return plan


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_travel_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除旅行计划"""
    
    plan = db.query(TravelPlan).filter(
        TravelPlan.id == plan_id,
        TravelPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="旅行计划不存在"
        )
    
    db.delete(plan)
    db.commit()
    
    return None

