"""
地图相关的 API 路由
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from ..models import User
from ..auth import get_current_user
from ..services.map_service import MapService

router = APIRouter(prefix="/map", tags=["地图服务"])


@router.get("/geocode")
async def geocode_address(
    address: str = Query(..., description="地址"),
    current_user: User = Depends(get_current_user)
):
    """地理编码：地址转经纬度"""
    
    result = MapService.geocode(address)
    
    if result is None:
        return {
            "success": False,
            "message": "地理编码失败"
        }
    
    return {
        "success": True,
        "data": result
    }


@router.get("/poi")
async def search_poi(
    query: str = Query(..., description="搜索关键词"),
    city: Optional[str] = Query(None, description="城市名称"),
    types: Optional[str] = Query(None, description="POI 类型"),
    current_user: User = Depends(get_current_user)
):
    """搜索兴趣点"""
    
    pois = MapService.search_poi(query, city, types)
    
    return {
        "success": True,
        "count": len(pois),
        "data": pois
    }


@router.get("/route")
async def get_route(
    origin: str = Query(..., description="起点经纬度（lon,lat）"),
    destination: str = Query(..., description="终点经纬度（lon,lat）"),
    mode: str = Query("driving", description="出行方式：driving, walking, transit"),
    current_user: User = Depends(get_current_user)
):
    """路径规划"""
    
    result = MapService.get_route(origin, destination, mode)
    
    if result is None:
        return {
            "success": False,
            "message": "路径规划失败"
        }
    
    return {
        "success": True,
        "data": result
    }


@router.get("/weather")
async def get_weather(
    city: str = Query(..., description="城市名称"),
    current_user: User = Depends(get_current_user)
):
    """获取天气信息"""
    
    result = MapService.get_weather(city)
    
    if result is None:
        return {
            "success": False,
            "message": "天气查询失败"
        }
    
    return {
        "success": True,
        "data": result
    }

