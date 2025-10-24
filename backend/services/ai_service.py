"""
AI 服务 - 使用阿里云百炼进行行程规划和预算分析
"""
import json
from typing import Dict, Any
import dashscope
from dashscope import Generation
from ..config import settings

# 设置阿里云百炼 API Key
dashscope.api_key = settings.ALIYUN_BAILIAN_API_KEY


class AIService:
    """AI 服务类"""
    
    @staticmethod
    def _clean_json_string(json_str: str) -> str:
        """
        清理和修复 AI 返回的 JSON 字符串中的常见问题
        """
        import re
        
        # 修复无效的 estimated_cost 值
        # 匹配 "estimated_cost": 后面跟着非数字的内容
        # 例如: "estimated_cost": 交通+门票 约100  -> "estimated_cost": 100
        json_str = re.sub(
            r'"estimated_cost":\s*[^0-9"\[\{,\}]+(\d+)',
            r'"estimated_cost": \1',
            json_str
        )
        
        # 修复纯中文的 estimated_cost
        # 例如: "estimated_cost": 视个人消费而定  -> "estimated_cost": 0
        json_str = re.sub(
            r'"estimated_cost":\s*[^\d\",\[\{][^,\}]*(?=,|\})',
            r'"estimated_cost": 0',
            json_str
        )
        
        # 修复数学表达式
        # 例如: "estimated_cost": 1000 + 100 = 1100  -> "estimated_cost": 1100
        json_str = re.sub(
            r'"estimated_cost":\s*[\d\s\+\-\*\/=]+?(\d+)(?=\s*[,\}])',
            r'"estimated_cost": \1',
            json_str
        )
        
        # 移除 JSON 中的注释（如果有）
        json_str = re.sub(r'//.*?\n', '\n', json_str)
        json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)
        
        # 修复结尾逗号问题（JSON 不允许尾随逗号）
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        
        return json_str
    
    @staticmethod
    def generate_travel_plan(
        destination: str,
        days: int,
        budget: float,
        travelers_count: int,
        preferences: str
    ) -> Dict[str, Any]:
        """
        生成旅行计划
        
        Args:
            destination: 目的地
            days: 旅行天数
            budget: 预算
            travelers_count: 旅行人数
            preferences: 旅行偏好
            
        Returns:
            包含行程和预算分析的字典
        """
        prompt = f"""你是一个专业且安全的旅行规划助手。请根据以下信息生成合法、健康、积极的旅行计划：

目的地：{destination}
旅行天数：{days}天
预算：{budget}元人民币
旅行人数：{travelers_count}人
偏好：{preferences or '常规旅游'}

要求：
1. 生成内容必须合法合规，不涉及任何敏感话题
2. 推荐正规的旅游景点和合法的商业场所
3. 所有费用估算必须使用纯数字（不要使用文字描述或数学表达式）
4. 确保返回完整有效的 JSON 格式
5. **重要**：每个活动必须包含 "poi_name" 字段，填写精确的景点名称用于地图搜索
   - 例如："参观总统府" 的 poi_name 应为 "南京总统府"
   - 例如："游览中山陵" 的 poi_name 应为 "中山陵"
   - 例如："夫子庙逛街" 的 poi_name 应为 "夫子庙"
   - poi_name 应该是可以在地图上直接搜索到的标准景点名称

请生成一个详细的旅行计划，包括每日行程、交通建议、住宿推荐和预算分析。

请严格按照以下 JSON 格式返回（注意：所有 cost 相关字段必须是纯数字）：
{{
    "overview": "行程概述",
    "daily_itinerary": [
        {{
            "day": 1,
            "title": "第一天标题",
            "activities": [
                {{
                    "time": "09:00",
                    "activity": "活动名称",
                    "location": "地点",
                    "poi_name": "精确的景点名称用于地图搜索",
                    "description": "详细描述",
                    "estimated_cost": 50,
                    "duration": "2小时"
                }}
            ],
            "meals": {{
                "breakfast": "早餐建议",
                "lunch": "午餐建议",
                "dinner": "晚餐建议"
            }},
            "accommodation": "住宿建议"
        }}
    ],
    "transportation": {{
        "to_destination": "前往目的地的交通方式",
        "local": "当地交通建议",
        "estimated_cost": 500
    }},
    "accommodation_summary": {{
        "type": "酒店类型",
        "suggestions": ["酒店建议1", "酒店建议2"],
        "estimated_cost_per_night": 200,
        "total_nights": 3,
        "total_cost": 600
    }},
    "budget_breakdown": {{
        "transportation": 500,
        "accommodation": 600,
        "meals": 400,
        "attractions": 300,
        "shopping": 200,
        "emergency": 100,
        "total": 2100
    }},
    "tips": ["旅行建议1", "旅行建议2", "旅行建议3"]
}}

请确保：
1. 预算分析合理，总费用接近但不超过预算
2. 所有数字字段使用纯数字（如 100 而不是 "约100" 或 "100元"）
3. 推荐的景点和场所都是真实存在的正规场所
4. 内容健康积极，不涉及任何敏感话题
5. **每个 activity 都必须有 poi_name 字段**，用于地图精确定位

示例说明：
- activity: "参观南京博物院", poi_name: "南京博物院"
- activity: "游览玄武湖", poi_name: "玄武湖"
- activity: "夫子庙品尝小吃", poi_name: "夫子庙"

只返回 JSON 内容，不要添加其他解释文字。
"""
        
        try:
            print(f"\n{'='*60}")
            print(f"开始调用 AI 生成旅行计划")
            print(f"目的地: {destination}, 天数: {days}, 预算: {budget}")
            print(f"{'='*60}\n")
            
            response = Generation.call(
                model='qwen-max',  # 使用通义千问最强模型
                prompt=prompt,
                result_format='message'
            )
            
            print(f"\n{'='*60}")
            print(f"AI API 响应状态码: {response.status_code}")
            print(f"完整响应对象: {response}")
            print(f"{'='*60}\n")
            
            if response.status_code == 200:
                content = response.output.choices[0].message.content
                
                print(f"\n{'='*60}")
                print(f"AI 返回的内容:")
                print(content)
                print(f"{'='*60}\n")
                
                # 尝试提取和修复 JSON
                try:
                    # 查找 JSON 块
                    start_idx = content.find('{')
                    end_idx = content.rfind('}')
                    if start_idx != -1 and end_idx != -1:
                        json_str = content[start_idx:end_idx + 1]
                        
                        # 清理 JSON 字符串，修复常见问题
                        json_str = AIService._clean_json_string(json_str)
                        
                        result = json.loads(json_str)
                        print(f"✅ JSON 解析成功")
                        return result
                    else:
                        error_msg = "AI 返回的内容中未找到 JSON 格式数据"
                        print(f"❌ {error_msg}")
                        raise Exception(error_msg)
                        
                except json.JSONDecodeError as json_err:
                    error_msg = f"JSON 解析失败: {str(json_err)}"
                    print(f"❌ {error_msg}")
                    print(f"尝试修复的 JSON 字符串前500字符:\n{json_str[:500]}")
                    raise Exception(error_msg)
            else:
                error_code = getattr(response, 'code', '')
                error_msg = f"API 调用失败 - 状态码: {response.status_code}, 消息: {response.message}"
                
                # 特殊处理内容审核失败
                if error_code == 'DataInspectionFailed' or 'inappropriate content' in str(response.message):
                    print(f"⚠️ 内容审核触发，尝试使用更保守的提示词")
                    error_msg = "AI 内容审核触发，请尝试修改旅行偏好或目的地描述，避免使用敏感词汇"
                
                print(f"❌ {error_msg}")
                if error_code:
                    error_msg += f", 错误代码: {error_code}"
                raise Exception(error_msg)
                
        except Exception as e:
            # 记录详细错误信息
            print(f"\n{'='*60}")
            print(f"❌ AI 生成旅行计划失败")
            print(f"错误类型: {type(e).__name__}")
            print(f"错误信息: {str(e)}")
            print(f"{'='*60}\n")
            
            import traceback
            traceback.print_exc()
            
            # 直接抛出异常，不返回默认数据
            raise Exception(f"AI 旅行计划生成失败: {str(e)}")
    
    @staticmethod
    def analyze_expense(
        travel_plan_info: str,
        current_expenses: float,
        budget: float
    ) -> str:
        """
        分析费用并提供建议
        
        Args:
            travel_plan_info: 旅行计划信息
            current_expenses: 当前花费
            budget: 总预算
            
        Returns:
            分析结果和建议
        """
        prompt = f"""你是一个旅行预算分析助手。请分析以下信息：

旅行计划：{travel_plan_info}
总预算：{budget}元
已花费：{current_expenses}元
剩余预算：{budget - current_expenses}元

请提供：
1. 预算使用情况分析
2. 是否超支或节省
3. 后续消费建议
4. 如何优化剩余预算

请用简洁友好的语言回答。
"""
        
        try:
            response = Generation.call(
                model='qwen-max',
                prompt=prompt,
                result_format='message'
            )
            
            if response.status_code == 200:
                return response.output.choices[0].message.content
            else:
                return "预算分析暂时不可用，请稍后再试。"
                
        except Exception as e:
            return f"预算分析失败：{str(e)}"
    
    @staticmethod
    def parse_voice_query(text: str) -> Dict[str, Any]:
        """
        解析语音查询，提取旅行相关信息
        
        Args:
            text: 语音识别的文本
            
        Returns:
            提取的旅行信息
        """
        prompt = f"""请从以下用户语音输入中提取旅行规划信息：

用户输入：{text}

请提取以下信息（如果有的话）：
- 目的地
- 旅行天数
- 预算
- 旅行人数
- 旅行偏好

以 JSON 格式返回：
{{
    "destination": "目的地或null",
    "days": 天数或null,
    "budget": 预算或null,
    "travelers_count": 人数或null,
    "preferences": "偏好描述或null",
    "query_type": "travel_plan或expense或query"
}}

如果是记录开销，query_type 应为 expense。
如果是查询信息，query_type 应为 query。
"""
        
        try:
            response = Generation.call(
                model='qwen-max',
                prompt=prompt,
                result_format='message'
            )
            
            if response.status_code == 200:
                content = response.output.choices[0].message.content
                
                # 提取 JSON
                start_idx = content.find('{')
                end_idx = content.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    json_str = content[start_idx:end_idx + 1]
                    result = json.loads(json_str)
                    return result
                    
            return {
                "raw_text": text,
                "query_type": "query"
            }
            
        except Exception as e:
            return {
                "raw_text": text,
                "error": str(e),
                "query_type": "query"
            }

