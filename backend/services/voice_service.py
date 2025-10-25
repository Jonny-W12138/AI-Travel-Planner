"""
语音识别服务 - 使用阿里云语音识别 API
"""
import base64
import json
import time
import hmac
import hashlib
import io
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import quote
import requests
from ..config import settings

# 音频格式转换
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
    print("✅ pydub 可用，支持音频格式转换")
except ImportError:
    PYDUB_AVAILABLE = False
    print("⚠️ pydub 不可用，将尝试直接发送音频")


class VoiceService:
    """语音识别服务类"""
    
    # 缓存 token，避免频繁获取
    _cached_token = None
    _token_expire_time = 0
    
    @staticmethod
    def _convert_to_ogg_opus(audio_data: bytes, source_format: str) -> bytes:
        """
        将音频转换为 OGG/OPUS 格式（阿里云兼容格式）
        
        Args:
            audio_data: 原始音频数据
            source_format: 源格式 (webm, wav, etc.)
        
        Returns:
            转换后的 OGG/OPUS 格式音频数据
        """
        if not PYDUB_AVAILABLE:
            print("⚠️ pydub 不可用，无法转换格式，将直接发送原始音频")
            return audio_data
        
        try:
            print(f"🔄 开始转换音频格式: {source_format} -> ogg/opus")
            
            # 从字节流加载音频
            audio_io = io.BytesIO(audio_data)
            
            # 根据源格式加载音频
            if source_format == 'webm':
                # webm 通常是 opus 编码
                try:
                    audio = AudioSegment.from_file(audio_io, format="webm")
                except Exception as e:
                    print(f"⚠️ 无法直接加载 webm，尝试作为 opus: {e}")
                    audio_io.seek(0)
                    audio = AudioSegment.from_file(audio_io, format="opus")
            elif source_format == 'ogg':
                audio = AudioSegment.from_file(audio_io, format="ogg")
            elif source_format == 'wav':
                audio = AudioSegment.from_file(audio_io, format="wav")
            else:
                # 尝试自动检测
                audio = AudioSegment.from_file(audio_io)
            
            print(f"   原始音频: 采样率={audio.frame_rate}Hz, 声道={audio.channels}, 时长={len(audio)}ms")
            
            # 转换为单声道（阿里云要求）
            if audio.channels > 1:
                print(f"   转换为单声道")
                audio = audio.set_channels(1)
            
            # 设置采样率为 16000 Hz（阿里云要求）
            if audio.frame_rate != 16000:
                print(f"   重采样到 16000 Hz")
                audio = audio.set_frame_rate(16000)
            
            # 导出为 OGG/OPUS 格式
            output_io = io.BytesIO()
            audio.export(
                output_io,
                format="ogg",
                codec="libopus",
                parameters=["-ar", "16000", "-ac", "1"]
            )
            
            converted_data = output_io.getvalue()
            print(f"✅ 音频转换成功: {len(audio_data)} 字节 -> {len(converted_data)} 字节")
            
            return converted_data
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ 音频格式转换失败: {error_msg}")
            
            # 如果是 ffmpeg 相关错误，给出安装提示
            if "ffmpeg" in error_msg.lower() or "avconv" in error_msg.lower():
                print("💡 提示：需要安装 ffmpeg")
                print("   macOS: brew install ffmpeg")
                print("   Ubuntu: sudo apt-get install ffmpeg")
                print("   Windows: 从 https://ffmpeg.org/download.html 下载")
                raise Exception("音频格式转换失败：需要安装 ffmpeg。请安装后重试。")
            
            raise Exception(f"音频格式转换失败: {error_msg}")
    
    @staticmethod
    def recognize_audio_file(audio_data: bytes, format: str = "wav") -> Optional[str]:
        """
        识别音频文件 - 使用阿里云一句话识别 RESTful API
        
        Args:
            audio_data: 音频文件的字节数据
            format: 音频格式（wav, mp3, pcm 等）
            
        Returns:
            识别出的文本，如果失败返回 None
        """
        try:
            print(f"🎤 开始语音识别，音频大小: {len(audio_data)} 字节，格式: {format}")
            
            # 检查是否配置了 API key
            if not settings.ALIYUN_ASR_ACCESS_KEY_ID or not settings.ALIYUN_ASR_ACCESS_KEY_SECRET:
                print("❌ 未配置阿里云语音识别 API 凭证")
                raise Exception("未配置阿里云语音识别 API，请在 .env 文件中配置 ALIYUN_ASR_ACCESS_KEY_ID 和 ALIYUN_ASR_ACCESS_KEY_SECRET")
            
            if not settings.ALIYUN_ASR_APP_KEY:
                print("❌ 未配置阿里云语音识别 APP_KEY")
                raise Exception("未配置阿里云语音识别 APP_KEY，请在 .env 文件中配置 ALIYUN_ASR_APP_KEY")
            
            # 获取 token
            token = VoiceService._get_token()
            if not token:
                print("❌ 获取 Token 失败")
                raise Exception("获取阿里云 Token 失败")
            
            print(f"✅ 成功获取 Token: {token[:20]}...")
            
            # 构建请求 URL 和参数
            url = "https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/asr"
            
            # 原始格式
            audio_format = format.lower()
            sample_rate = 16000  # 阿里云支持的采样率：8000 或 16000
            
            # 🔄 音频格式转换：将 webm 等不兼容格式转换为 ogg/opus
            if audio_format == 'webm':
                print(f"🔄 检测到 webm 格式，需要转换为 ogg/opus（阿里云兼容格式）")
                try:
                    audio_data = VoiceService._convert_to_ogg_opus(audio_data, audio_format)
                    audio_format = 'opus'  # 转换后的格式
                    print(f"✅ 格式转换完成，现在使用: ogg/opus")
                except Exception as e:
                    print(f"❌ 格式转换失败: {str(e)}")
                    raise
            elif audio_format == 'ogg':
                audio_format = 'opus'  # ogg 容器使用 opus 编码
            elif audio_format == 'wav':
                # WAV 格式直接使用，或者也可以转换
                audio_format = 'pcm'
                print(f"   使用 PCM 格式（WAV 编码）")
            
            print(f"🎵 最终格式: {audio_format}, 采样率: {sample_rate}, 音频大小: {len(audio_data)} 字节")
            
            params = {
                "appkey": settings.ALIYUN_ASR_APP_KEY,
                "format": audio_format,
                "sample_rate": sample_rate,
                "enable_punctuation_prediction": True,
                "enable_inverse_text_normalization": True,
                "enable_voice_detection": True
            }
            
            headers = {
                "X-NLS-Token": token,
                "Content-Type": "application/octet-stream"
            }
            
            print(f"📤 发送语音识别请求到阿里云...")
            print(f"   URL: {url}")
            print(f"   参数: {params}")
            
            # 发送请求
            response = requests.post(
                url,
                params=params,
                headers=headers,
                data=audio_data,
                timeout=30
            )
            
            print(f"📢 阿里云语音识别 API 响应状态码: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"📢 阿里云语音识别 API 响应: {json.dumps(result, ensure_ascii=False)}")
                
                # 检查响应状态
                # 阿里云一句话识别成功的状态码是 20000000
                status = result.get("status")
                if status == 20000000:
                    # 提取识别文本
                    text = result.get("result", "").strip()
                    
                    if not text:
                        print(f"⚠️ 语音识别成功但结果为空 - 可能原因：")
                        print(f"   1. 录音时间太短（少于1秒）")
                        print(f"   2. 音频中没有清晰的语音")
                        print(f"   3. 音频格式或编码不完全兼容")
                        print(f"   4. 环境噪音太大")
                        print(f"   音频大小: {len(audio_data)} 字节")
                        raise Exception("语音识别结果为空，请确保：1) 录音时间足够长（3-5秒）2) 清晰说话 3) 环境安静")
                    
                    print(f"✅ 语音识别成功: {text}")
                    return text
                else:
                    # 识别失败
                    message = result.get("message", "未知错误")
                    print(f"❌ 语音识别失败 - 状态码: {status}, 消息: {message}")
                    raise Exception(f"语音识别失败: {message}")
            else:
                error_text = response.text
                print(f"❌ 语音识别 API 请求失败: HTTP {response.status_code}")
                print(f"   响应内容: {error_text}")
                raise Exception(f"语音识别 API 请求失败: HTTP {response.status_code}")
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ 语音识别错误: {error_msg}")
            import traceback
            traceback_str = traceback.format_exc()
            print(traceback_str)
            
            # 不返回 None，而是抛出异常让上层处理
            raise Exception(f"语音识别失败: {error_msg}")
    
    @staticmethod
    def _get_token() -> str:
        """
        获取阿里云 NLS Token (带缓存)
        使用 AccessKey 和 POP 签名机制获取临时 token
        文档: https://help.aliyun.com/zh/isi/getting-started/use-http-or-https-to-obtain-an-access-token
        """
        try:
            # 检查缓存的 token 是否还有效（token 有效期通常是 24 小时）
            current_time = time.time()
            if (VoiceService._cached_token and 
                current_time < VoiceService._token_expire_time):
                print(f"✅ 使用缓存的 Token")
                return VoiceService._cached_token
            
            print(f"🔑 开始获取阿里云 NLS Token（使用 POP 签名）...")
            
            # 1. 构造请求参数
            params = {
                "AccessKeyId": settings.ALIYUN_ASR_ACCESS_KEY_ID,
                "Action": "CreateToken",
                "Format": "JSON",
                "RegionId": "cn-shanghai",
                "SignatureMethod": "HMAC-SHA1",
                "SignatureNonce": str(hashlib.md5(str(time.time()).encode()).hexdigest()),
                "SignatureVersion": "1.0",
                "Timestamp": datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
                "Version": "2019-02-28"
            }
            
            print(f"   AccessKeyId: {settings.ALIYUN_ASR_ACCESS_KEY_ID[:10]}...")
            print(f"   Timestamp: {params['Timestamp']}")
            
            # 2. 构造规范化请求字符串
            sorted_params = sorted(params.items())
            canonicalized_query_string = "&".join([
                f"{quote(k, safe='~')}={quote(str(v), safe='~')}"
                for k, v in sorted_params
            ])
            
            # 3. 构造待签名字符串
            string_to_sign = (
                "GET&" +
                quote("/", safe='~') + "&" +
                quote(canonicalized_query_string, safe='~')
            )
            
            # 4. 计算签名
            key = (settings.ALIYUN_ASR_ACCESS_KEY_SECRET + "&").encode('utf-8')
            message = string_to_sign.encode('utf-8')
            signature = base64.b64encode(
                hmac.new(key, message, hashlib.sha1).digest()
            ).decode('utf-8')
            
            # 5. 构造完整 URL
            url = (
                f"http://nls-meta.cn-shanghai.aliyuncs.com/?"
                f"Signature={quote(signature, safe='~')}&{canonicalized_query_string}"
            )
            
            print(f"📤 发送 Token 请求...")
            
            # 6. 发送请求
            response = requests.get(url, timeout=10)
            
            print(f"📢 Token 服务响应状态码: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"📢 Token 服务响应: {json.dumps(result, ensure_ascii=False, indent=2)}")
                
                # 提取 token
                token_data = result.get("Token", {})
                token_id = token_data.get("Id", "")
                expire_time = token_data.get("ExpireTime", 0)
                
                if token_id:
                    # 缓存 token（提前 1 小时过期以保险）
                    VoiceService._cached_token = token_id
                    VoiceService._token_expire_time = expire_time - 3600
                    
                    print(f"✅ 成功获取 Token: {token_id[:20]}...")
                    print(f"   过期时间: {datetime.fromtimestamp(expire_time)}")
                    return token_id
                else:
                    print(f"❌ Token 响应中没有 Id 字段")
                    return ""
            else:
                error_text = response.text
                print(f"❌ 获取 Token 失败: HTTP {response.status_code}")
                print(f"   响应内容: {error_text}")
                return ""
            
        except Exception as e:
            print(f"❌ 获取 Token 异常: {str(e)}")
            import traceback
            print(traceback.format_exc())
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

