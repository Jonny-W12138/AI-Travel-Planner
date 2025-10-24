"""
配置文件管理
从环境变量中读取配置信息
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""
    
    # 数据库配置
    DATABASE_URL: str
    
    # JWT 配置
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 天
    
    # 阿里云百炼配置
    ALIYUN_BAILIAN_API_KEY: str
    ALIYUN_BAILIAN_APP_ID: str = ""
    
    # 阿里云语音识别配置
    ALIYUN_ASR_APP_KEY: str = ""
    ALIYUN_ASR_ACCESS_KEY_ID: str = ""
    ALIYUN_ASR_ACCESS_KEY_SECRET: str = ""
    
    # 高德地图配置
    AMAP_API_KEY: str
    AMAP_WEB_SERVICE_KEY: str
    
    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


settings = get_settings()

