"""
语音识别相关的 API 路由
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pydantic import BaseModel
from ..models import User
from ..auth import get_current_user
from ..services.voice_service import VoiceService
from ..services.ai_service import AIService
from ..schemas import VoiceRecognitionResponse

router = APIRouter(prefix="/voice", tags=["语音识别"])


class VoiceBase64Request(BaseModel):
    audio_data: str  # Base64 编码的音频数据
    format: str = "wav"


@router.post("/recognize", response_model=VoiceRecognitionResponse)
async def recognize_voice(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    语音识别（上传文件）
    支持的格式：wav, mp3, pcm 等
    """
    
    # 读取音频文件
    audio_data = await audio.read()
    
    # 获取文件格式
    file_format = audio.filename.split('.')[-1] if '.' in audio.filename else 'wav'
    
    # 进行语音识别
    text = VoiceService.recognize_audio_file(audio_data, file_format)
    
    if text is None:
        raise HTTPException(
            status_code=500,
            detail="语音识别失败，请重试"
        )
    
    return {
        "text": text,
        "confidence": None
    }


@router.post("/recognize-base64", response_model=VoiceRecognitionResponse)
async def recognize_voice_base64(
    request: VoiceBase64Request,
    current_user: User = Depends(get_current_user)
):
    """
    语音识别（Base64 编码）
    用于前端直接发送音频数据
    """
    
    # 进行语音识别
    text = VoiceService.recognize_from_base64(request.audio_data, request.format)
    
    if text is None:
        raise HTTPException(
            status_code=500,
            detail="语音识别失败，请重试"
        )
    
    return {
        "text": text,
        "confidence": None
    }


@router.post("/parse-query")
async def parse_voice_query(
    text: str,
    current_user: User = Depends(get_current_user)
):
    """
    解析语音查询
    使用 AI 从语音文本中提取旅行相关信息
    """
    
    result = AIService.parse_voice_query(text)
    
    return result

