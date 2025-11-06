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
6. **必须提供具体的酒店名称和餐厅名称**，不要使用笼统的建议
   - 酒店：必须给出3-5个具体酒店名称，包含酒店的完整名称、大致价格区间、地址
   - 餐厅：每餐必须推荐1-2个具体餐厅名称、特色菜品、人均消费、地址

请生成一个详细的旅行计划，包括每日行程、交通建议、具体的酒店和餐厅推荐、预算分析。

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
                "breakfast": {{
                    "restaurant_name": "具体餐厅名称",
                    "address": "餐厅地址",
                    "specialty": "特色菜品",
                    "avg_cost": 30,
                    "poi_name": "餐厅POI名称用于地图搜索"
                }},
                "lunch": {{
                    "restaurant_name": "具体餐厅名称",
                    "address": "餐厅地址",
                    "specialty": "特色菜品",
                    "avg_cost": 50,
                    "poi_name": "餐厅POI名称用于地图搜索"
                }},
                "dinner": {{
                    "restaurant_name": "具体餐厅名称",
                    "address": "餐厅地址",
                    "specialty": "特色菜品",
                    "avg_cost": 80,
                    "poi_name": "餐厅POI名称用于地图搜索"
                }}
            }},
            "accommodation": {{
                "hotel_name": "具体酒店名称",
                "address": "酒店地址",
                "room_type": "房型建议",
                "price_per_night": 300,
                "poi_name": "酒店POI名称用于地图搜索",
                "features": ["酒店特色1", "酒店特色2"]
            }}
        }}
    ],
    "transportation": {{
        "to_destination": "前往目的地的交通方式",
        "local": "当地交通建议",
        "estimated_cost": 500
    }},
    "accommodation_summary": {{
        "type": "酒店类型",
        "hotels": [
            {{
                "name": "具体酒店名称1",
                "address": "酒店地址",
                "price_range": "价格区间（如：200-400元/晚）",
                "rating": "评分（如：4.5星）",
                "poi_name": "酒店POI名称",
                "features": ["特色1", "特色2"]
            }},
            {{
                "name": "具体酒店名称2",
                "address": "酒店地址",
                "price_range": "价格区间",
                "rating": "评分",
                "poi_name": "酒店POI名称",
                "features": ["特色1", "特色2"]
            }}
        ],
        "estimated_cost_per_night": 200,
        "total_nights": 3,
        "total_cost": 600
    }},
    "restaurant_recommendations": [
        {{
            "name": "推荐餐厅名称1",
            "cuisine_type": "菜系",
            "address": "餐厅地址",
            "specialty": "招牌菜",
            "avg_cost": 60,
            "poi_name": "餐厅POI名称",
            "recommended_for": "推荐用餐时段（早餐/午餐/晚餐）"
        }},
        {{
            "name": "推荐餐厅名称2",
            "cuisine_type": "菜系",
            "address": "餐厅地址",
            "specialty": "招牌菜",
            "avg_cost": 80,
            "poi_name": "餐厅POI名称",
            "recommended_for": "推荐用餐时段"
        }}
    ],
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
3. 推荐的景点、酒店、餐厅都是真实存在的正规场所
4. 内容健康积极，不涉及任何敏感话题
5. **每个 activity、hotel、restaurant 都必须有 poi_name 字段**，用于地图精确定位
6. **必须提供具体的酒店和餐厅名称**，包含完整地址和联系方式建议

酒店推荐示例：
- name: "南京金陵饭店", address: "汉中路2号", price_range: "500-800元/晚", poi_name: "南京金陵饭店"

餐厅推荐示例：
- restaurant_name: "南京大牌档（德基广场店）", address: "中山路18号德基广场", specialty: "盐水鸭、鸭血粉丝汤", avg_cost: 80, poi_name: "南京大牌档德基广场店"

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
    def modify_itinerary_with_feedback(
        current_itinerary: Dict[str, Any],
        destination: str,
        days: int,
        budget: float,
        travelers_count: int,
        user_feedback: str
    ) -> Dict[str, Any]:
        """
        根据用户反馈修改现有行程
        
        Args:
            current_itinerary: 当前的行程数据
            destination: 目的地
            days: 旅行天数
            budget: 预算
            travelers_count: 旅行人数
            user_feedback: 用户的修改意见
            
        Returns:
            修改后的行程数据
        """
        # 将当前行程转换为简洁的文本描述
        current_plan_summary = json.dumps(current_itinerary, ensure_ascii=False, indent=2)
        
        prompt = f"""你是一个专业的旅行规划助手。用户有一个现有的旅行计划，现在需要根据他们的反馈进行调整。

原始旅行计划信息：
- 目的地：{destination}
- 旅行天数：{days}天
- 预算：{budget}元人民币
- 旅行人数：{travelers_count}人

当前行程内容：
{current_plan_summary}

用户的修改意见：
{user_feedback}

请根据用户的反馈，对行程进行相应的调整。要求：
1. 保持原有行程的合理结构
2. 只修改用户提到的部分，其他部分尽量保持不变
3. 如果用户要求更换景点，请推荐{destination}的其他合适景点
4. 如果用户要求调整时间，请合理安排活动顺序
5. 如果用户要求控制预算，请调整活动选择和档次
6. 确保修改后的行程仍然合理可行
7. 所有费用必须使用纯数字（不要使用文字描述或数学表达式）
8. **每个活动必须包含 "poi_name" 字段**，用于地图搜索
9. **必须提供具体的酒店和餐厅名称**，包含完整地址

请严格按照以下 JSON 格式返回修改后的完整行程（格式与原行程相同）：
{{
    "overview": "行程概述（根据修改更新）",
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
                "breakfast": {{
                    "restaurant_name": "具体餐厅名称",
                    "address": "餐厅地址",
                    "specialty": "特色菜品",
                    "avg_cost": 30,
                    "poi_name": "餐厅POI名称"
                }},
                "lunch": {{"restaurant_name": "...", "address": "...", "specialty": "...", "avg_cost": 50, "poi_name": "..."}},
                "dinner": {{"restaurant_name": "...", "address": "...", "specialty": "...", "avg_cost": 80, "poi_name": "..."}}
            }},
            "accommodation": {{
                "hotel_name": "具体酒店名称",
                "address": "酒店地址",
                "room_type": "房型建议",
                "price_per_night": 300,
                "poi_name": "酒店POI名称",
                "features": ["酒店特色1", "酒店特色2"]
            }}
        }}
    ],
    "transportation": {{
        "to_destination": "前往目的地的交通方式",
        "local": "当地交通建议",
        "estimated_cost": 500
    }},
    "accommodation_summary": {{
        "type": "酒店类型",
        "hotels": [
            {{"name": "...", "address": "...", "price_range": "...", "rating": "...", "poi_name": "...", "features": [...]}},
            {{"name": "...", "address": "...", "price_range": "...", "rating": "...", "poi_name": "...", "features": [...]}}
        ],
        "estimated_cost_per_night": 200,
        "total_nights": 3,
        "total_cost": 600
    }},
    "restaurant_recommendations": [
        {{"name": "...", "cuisine_type": "...", "address": "...", "specialty": "...", "avg_cost": 60, "poi_name": "...", "recommended_for": "..."}}
    ],
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

注意事项：
1. 返回完整的行程JSON，不要省略任何部分
2. 所有数字字段使用纯数字
3. 确保修改后的行程符合用户的反馈要求
4. 保持JSON格式完整有效
5. 不要在JSON外添加任何解释文字

只返回 JSON 内容，不要添加其他解释文字。
"""
        
        try:
            print(f"\n{'='*60}")
            print(f"开始调用 AI 修改行程")
            print(f"用户反馈: {user_feedback}")
            print(f"{'='*60}\n")
            
            response = Generation.call(
                model='qwen-max',
                prompt=prompt,
                result_format='message'
            )
            
            print(f"\n{'='*60}")
            print(f"AI API 响应状态码: {response.status_code}")
            print(f"{'='*60}\n")
            
            if response.status_code == 200:
                content = response.output.choices[0].message.content
                
                print(f"\n{'='*60}")
                print(f"AI 返回的内容（前500字符）:")
                print(content[:500])
                print(f"{'='*60}\n")
                
                # 提取和修复 JSON
                try:
                    start_idx = content.find('{')
                    end_idx = content.rfind('}')
                    if start_idx != -1 and end_idx != -1:
                        json_str = content[start_idx:end_idx + 1]
                        
                        # 清理 JSON 字符串
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
                    raise Exception(error_msg)
            else:
                error_msg = f"API 调用失败 - 状态码: {response.status_code}, 消息: {response.message}"
                print(f"❌ {error_msg}")
                raise Exception(error_msg)
                
        except Exception as e:
            print(f"\n{'='*60}")
            print(f"❌ AI 修改行程失败")
            print(f"错误类型: {type(e).__name__}")
            print(f"错误信息: {str(e)}")
            print(f"{'='*60}\n")
            
            import traceback
            traceback.print_exc()
            
            raise Exception(f"AI 行程修改失败: {str(e)}")
    
    @staticmethod
    def parse_voice_query(text: str) -> Dict[str, Any]:
        """
        解析语音查询，提取旅行相关信息
        
        Args:
            text: 语音识别的文本
            
        Returns:
            提取的旅行信息
        """
        prompt = f"""请从以下用户语音输入中智能识别并提取信息：

用户输入：{text}

首先判断用户意图：
1. 如果是旅行规划（如"去XX旅游"、"规划旅行"），提取旅行信息
2. 如果是费用记录（如"花了XX元"、"XX费用"、"记录开销"），提取费用信息

对于旅行规划，提取：
- 目的地：旅行的目的地
- 出发日期：格式 YYYY-MM-DD
- 结束日期：格式 YYYY-MM-DD
- 旅行天数：如果没有明确日期，根据天数计算
- 预算：旅行预算（纯数字）
- 旅行人数：参与旅行的人数
- 旅行偏好：用户的喜好、特殊要求（如：喜欢美食、带孩子、历史文化等）

对于费用记录，提取：
- 类别：交通、住宿、餐饮、景点、购物、其他
- 金额：费用金额（纯数字）
- 描述：费用的具体说明

⚠️ 重要：必须返回严格的 JSON 格式，不能包含注释、额外的文字说明或markdown标记。

判断规则：
- 如果提到"花了"、"费用"、"开销"、"记录"、"支出"等，query_type 为 "expense"
- 如果提到"去"、"旅游"、"旅行"、"规划"、"想要"、"日期"、"预算"、"人数"等旅行相关内容，query_type 为 "travel_plan"
- 如果无法判断，query_type 为 "query"

返回 JSON 格式示例：

旅行规划示例：
{{
    "query_type": "travel_plan",
    "destination": "重庆",
    "start_date": "2025-10-27",
    "end_date": "2025-10-31",
    "days": 5,
    "budget": 3000,
    "travelers_count": 2,
    "preferences": null
}}

费用记录示例：
{{
    "query_type": "expense",
    "category": "住宿",
    "amount": 300,
    "description": "住宿费用"
}}

只返回 JSON，不要包含任何其他内容！
"""
        
        try:
            response = Generation.call(
                model='qwen-max',
                prompt=prompt,
                result_format='message'
            )
            
            if response.status_code == 200:
                content = response.output.choices[0].message.content
                print(f"📢 AI 原始响应: {content[:200]}...")
                
                # 提取 JSON
                start_idx = content.find('{')
                end_idx = content.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    json_str = content[start_idx:end_idx + 1]
                    
                    # 使用 _clean_json_string 清理 JSON
                    json_str = AIService._clean_json_string(json_str)
                    print(f"🧹 清理后的 JSON: {json_str[:200]}...")
                    
                    result = json.loads(json_str)
                    print(f"✅ JSON 解析成功: query_type={result.get('query_type')}")
                    return result
                else:
                    print(f"❌ 未找到有效的 JSON 结构")
                    
            return {
                "raw_text": text,
                "query_type": "query"
            }
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析错误: {str(e)}")
            print(f"   问题 JSON: {json_str if 'json_str' in locals() else 'N/A'}")
            return {
                "raw_text": text,
                "error": str(e),
                "query_type": "query"
            }
        except Exception as e:
            print(f"❌ 语音查询解析异常: {str(e)}")
            return {
                "raw_text": text,
                "error": str(e),
                "query_type": "query"
            }

