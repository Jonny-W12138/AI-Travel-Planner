"""
费用记录相关的 API 路由
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import User, Expense, TravelPlan
from ..schemas import ExpenseCreate, ExpenseResponse
from ..auth import get_current_user
from ..services.ai_service import AIService

router = APIRouter(prefix="/expenses", tags=["费用管理"])


@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """记录费用"""
    
    # 如果关联了旅行计划，验证计划是否存在且属于当前用户
    if expense.travel_plan_id:
        plan = db.query(TravelPlan).filter(
            TravelPlan.id == expense.travel_plan_id,
            TravelPlan.user_id == current_user.id
        ).first()
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="旅行计划不存在"
            )
    
    # 创建费用记录
    db_expense = Expense(
        user_id=current_user.id,
        travel_plan_id=expense.travel_plan_id,
        category=expense.category,
        amount=expense.amount,
        description=expense.description,
        expense_date=expense.expense_date
    )
    
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    return db_expense


@router.get("/", response_model=List[ExpenseResponse])
async def get_expenses(
    travel_plan_id: Optional[int] = Query(None, description="旅行计划 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取费用记录"""
    
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    if travel_plan_id:
        query = query.filter(Expense.travel_plan_id == travel_plan_id)
    
    expenses = query.order_by(Expense.expense_date.desc()).all()
    
    return expenses


@router.get("/summary")
async def get_expense_summary(
    travel_plan_id: Optional[int] = Query(None, description="旅行计划 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取费用汇总"""
    
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    if travel_plan_id:
        query = query.filter(Expense.travel_plan_id == travel_plan_id)
    
    # 按类别统计
    category_summary = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total")
    ).filter(
        Expense.user_id == current_user.id
    )
    
    if travel_plan_id:
        category_summary = category_summary.filter(Expense.travel_plan_id == travel_plan_id)
    
    category_summary = category_summary.group_by(Expense.category).all()
    
    # 总费用
    total = sum(cat[1] for cat in category_summary)
    
    result = {
        "total": total,
        "by_category": {cat[0]: float(cat[1]) for cat in category_summary}
    }
    
    # 如果关联了旅行计划，添加预算分析
    if travel_plan_id:
        plan = db.query(TravelPlan).filter(
            TravelPlan.id == travel_plan_id,
            TravelPlan.user_id == current_user.id
        ).first()
        
        if plan:
            result["budget"] = plan.budget
            result["remaining"] = plan.budget - total
            result["usage_percentage"] = (total / plan.budget * 100) if plan.budget > 0 else 0
            
            # 使用 AI 分析预算
            analysis = AIService.analyze_expense(
                travel_plan_info=f"{plan.destination} {plan.days}天游",
                current_expenses=total,
                budget=plan.budget
            )
            result["ai_analysis"] = analysis
    
    return result


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense_update: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新费用记录"""
    
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="费用记录不存在"
        )
    
    # 更新字段
    expense.category = expense_update.category
    expense.amount = expense_update.amount
    expense.description = expense_update.description
    
    db.commit()
    db.refresh(expense)
    
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除费用记录"""
    
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="费用记录不存在"
        )
    
    db.delete(expense)
    db.commit()
    
    return None

