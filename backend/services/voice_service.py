"""
语音识别服务 - 使用阿里云语音识别 API
"""
import base64
import json
import time
from typing import Optional
import requests
from ..config import settings


class VoiceService:
    """语音识别服务类"""
    
    @staticmethod
    def recognize_audio_file(audio_data: bytes, format: str = "wav") -> Optional[str]:
        """
        识别音频文件
        
        Args:
            audio_data: 音频文件的字节数据
            format: 音频格式（wav, mp3, pcm 等）
            
        Returns:
            识别出的文本，如果失败返回 None
        """
        try:
            # 使用阿里云一句话识别 API
            # 注意：这里使用的是 REST API，需要根据实际的阿里云文档调整
            
            # 如果没有配置 API key，返回模拟结果
            if not settings.ALIYUN_ASR_ACCESS_KEY_ID:
                return "这是模拟的语音识别结果。请配置阿里云语音识别 API。"
            
            # Base64 编码音频数据
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # 构建请求
            url = "https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/asr"
            
            headers = {
                "Content-Type": "application/json",
                "X-NLS-Token": VoiceService._get_token()
            }
            
            payload = {
                "appkey": settings.ALIYUN_ASR_APP_KEY,
                "format": format,
                "sample_rate": 16000,
                "enable_punctuation_prediction": True,
                "enable_inverse_text_normalization": True,
                "enable_voice_detection": True
            }
            
            # 发送请求
            response = requests.post(
                url,
                headers=headers,
                data=audio_data,
                params=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == 20000000:
                    return result.get("result", {}).get("text", "")
            
            return None
            
        except Exception as e:
            print(f"语音识别错误: {str(e)}")
            return None
    
    @staticmethod
    def _get_token() -> str:
        """
        获取阿里云 NLS Token
        这是一个简化版本，实际使用时需要实现完整的 Token 获取逻辑
        """
        try:
            url = "https://nls-meta.cn-shanghai.aliyuncs.com/token"
            
            params = {
                "AccessKeyId": settings.ALIYUN_ASR_ACCESS_KEY_ID,
                "Action": "CreateToken"
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                return result.get("Token", {}).get("Id", "")
            
            return ""
            
        except Exception as e:
            print(f"获取 Token 失败: {str(e)}")
            return ""
    
    @staticmethod
    def recognize_from_base64(audio_base64: str, format: str = "wav") -> Optional[str]:
        """
        从 Base64 编码的音频数据识别
        
        Args:
            audio_base64: Base64 编码的音频数据
            format: 音频格式
            
        Returns:
            识别出的文本
        """
        try:
            # 解码 Base64
            audio_data = base64.b64decode(audio_base64)
            return VoiceService.recognize_audio_file(audio_data, format)
        except Exception as e:
            print(f"Base64 解码错误: {str(e)}")
            return None

