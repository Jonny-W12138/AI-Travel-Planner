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


class VoiceQueryRequest(BaseModel):
    text: str  # 语音识别后的文本


@router.post("/recognize", response_model=VoiceRecognitionResponse)
async def recognize_voice(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    语音识别（上传文件）
    支持的格式：wav, mp3, pcm 等
    """
    
    try:
        print(f"📢 收到语音识别请求，文件名: {audio.filename}, 类型: {audio.content_type}")
        
        # 读取音频文件
        audio_data = await audio.read()
        print(f"📢 音频数据大小: {len(audio_data)} 字节")
        
        # 获取文件格式 - 优先从 content_type 获取
        file_format = 'wav'  # 默认格式
        if audio.content_type:
            # 从 content_type 提取格式，如 'audio/webm' -> 'webm'
            content_type = audio.content_type.split(';')[0].strip()
            if '/' in content_type:
                file_format = content_type.split('/')[1]
                print(f"📢 从 content_type 提取格式: {file_format}")
        
        # 如果 content_type 无效，尝试从文件名提取
        if not file_format or file_format == 'octet-stream':
            file_format = audio.filename.split('.')[-1] if '.' in audio.filename else 'wav'
            print(f"📢 从文件名提取格式: {file_format}")
        
        # 进行语音识别
        text = VoiceService.recognize_audio_file(audio_data, file_format)
        
        if not text:
            raise HTTPException(
                status_code=500,
                detail="语音识别返回空结果，请重试"
            )
        
        print(f"✅ 语音识别成功: {text}")
        
        return {
            "text": text,
            "confidence": None
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"❌ 语音识别路由错误: {error_msg}")
        
        # 提取更友好的错误信息
        if "未配置" in error_msg:
            detail = "服务器未配置语音识别服务，请联系管理员"
        elif "Token" in error_msg:
            detail = "获取语音识别凭证失败，请检查服务器配置"
        elif "HTTP" in error_msg:
            detail = f"语音识别服务调用失败，请重试"
        else:
            detail = f"语音识别失败: {error_msg}"
        
        raise HTTPException(
            status_code=500,
            detail=detail
        )


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
    request: VoiceQueryRequest,
    current_user: User = Depends(get_current_user)
):
    """
    解析语音查询
    使用 AI 从语音文本中提取旅行相关信息
    """
    
    try:
        print(f"📢 解析语音查询: {request.text}")
        
        result = AIService.parse_voice_query(request.text)
        
        print(f"✅ 语音查询解析成功: {result}")
        
        return result
    except Exception as e:
        print(f"❌ 解析语音查询错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"解析语音查询失败: {str(e)}"
        )

