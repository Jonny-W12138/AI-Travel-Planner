"""
地图服务 - 使用高德地图 API
"""
from typing import Dict, List, Optional, Any
import requests
from ..config import settings


class MapService:
    """高德地图服务类"""
    
    BASE_URL = "https://restapi.amap.com/v3"
    
    @staticmethod
    def geocode(address: str) -> Optional[Dict[str, Any]]:
        """
        地理编码：将地址转换为经纬度
        
        Args:
            address: 地址字符串
            
        Returns:
            包含经纬度的字典
        """
        try:
            url = f"{MapService.BASE_URL}/geocode/geo"
            params = {
                "key": settings.AMAP_WEB_SERVICE_KEY,
                "address": address
            }
            
            print(f"\n📍 地理编码请求:")
            print(f"  地址: {address}")
            print(f"  URL: {url}")
            print(f"  API Key 前10位: {settings.AMAP_WEB_SERVICE_KEY[:10]}...")
            
            response = requests.get(url, params=params, timeout=10)
            print(f"  响应状态码: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  响应数据: {data}")
                
                if data.get("status") == "1" and data.get("geocodes"):
                    geocode = data["geocodes"][0]
                    location = geocode.get("location", "").split(",")
                    if len(location) == 2:
                        result = {
                            "longitude": float(location[0]),
                            "latitude": float(location[1]),
                            "formatted_address": geocode.get("formatted_address", address)
                        }
                        print(f"  ✅ 地理编码成功: {result}")
                        return result
                else:
                    error_msg = data.get("info", "未知错误")
                    print(f"  ❌ 地理编码失败: status={data.get('status')}, info={error_msg}")
                    return None
            else:
                print(f"  ❌ HTTP 请求失败: {response.status_code}")
            return None
        except Exception as e:
            print(f"❌ 地理编码异常: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    @staticmethod
    def search_poi(
        query: str,
        city: Optional[str] = None,
        types: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        搜索兴趣点（POI）
        
        Args:
            query: 搜索关键词
            city: 城市名称
            types: POI 类型（如：景点、餐饮、酒店等）
            
        Returns:
            POI 列表
        """
        try:
            url = f"{MapService.BASE_URL}/place/text"
            params = {
                "key": settings.AMAP_WEB_SERVICE_KEY,
                "keywords": query,
                "offset": 20
            }
            
            if city:
                params["city"] = city
            if types:
                params["types"] = types
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "1":
                    pois = []
                    for poi in data.get("pois", []):
                        location = poi.get("location", "").split(",")
                        pois.append({
                            "id": poi.get("id"),
                            "name": poi.get("name"),
                            "type": poi.get("type"),
                            "address": poi.get("address"),
                            "location": {
                                "longitude": float(location[0]) if len(location) > 0 else None,
                                "latitude": float(location[1]) if len(location) > 1 else None
                            },
                            "tel": poi.get("tel"),
                            "distance": poi.get("distance")
                        })
                    return pois
            return []
        except Exception as e:
            print(f"POI 搜索错误: {str(e)}")
            return []
    
    @staticmethod
    def get_route(
        origin: str,
        destination: str,
        mode: str = "driving"
    ) -> Optional[Dict[str, Any]]:
        """
        路径规划
        
        Args:
            origin: 起点（经纬度，格式：lon,lat）
            destination: 终点（经纬度，格式：lon,lat）
            mode: 出行方式（driving、walking、transit）
            
        Returns:
            路径信息
        """
        try:
            if mode == "driving":
                url = f"{MapService.BASE_URL}/direction/driving"
            elif mode == "walking":
                url = f"{MapService.BASE_URL}/direction/walking"
            elif mode == "transit":
                url = f"{MapService.BASE_URL}/direction/transit/integrated"
            else:
                return None
            
            params = {
                "key": settings.AMAP_WEB_SERVICE_KEY,
                "origin": origin,
                "destination": destination
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "1":
                    route = data.get("route", {})
                    paths = route.get("paths", [])
                    if paths:
                        path = paths[0]
                        return {
                            "distance": path.get("distance"),
                            "duration": path.get("duration"),
                            "steps": path.get("steps", [])
                        }
            return None
        except Exception as e:
            print(f"路径规划错误: {str(e)}")
            return None
    
    @staticmethod
    def get_weather(city: str) -> Optional[Dict[str, Any]]:
        """
        获取天气信息
        
        Args:
            city: 城市名称或城市编码
            
        Returns:
            天气信息
        """
        try:
            url = f"{MapService.BASE_URL}/weather/weatherInfo"
            params = {
                "key": settings.AMAP_WEB_SERVICE_KEY,
                "city": city,
                "extensions": "all"  # 返回预报天气
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "1":
                    return data.get("forecasts", [{}])[0]
            return None
        except Exception as e:
            print(f"天气查询错误: {str(e)}")
            return None

