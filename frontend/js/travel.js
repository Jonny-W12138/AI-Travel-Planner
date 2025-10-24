/**
 * 旅行计划模块
 */

class TravelPlanner {
    constructor() {
        this.currentPlan = null;
    }

    async createPlan(formData) {
        try {
            showLoading('AI 正在为你规划旅程...');

            const planData = {
                destination: formData.destination,
                start_date: formData.startDate,
                end_date: formData.endDate,
                budget: parseFloat(formData.budget),
                travelers_count: parseInt(formData.travelersCount),
                preferences: formData.preferences || ''
            };

            console.log('📤 发送旅行计划请求:', planData);
            
            const result = await api.createTravelPlan(planData);
            
            console.log('📥 收到旅行计划响应:', result);
            
            this.currentPlan = result;
            this.displayItinerary(result);
            
            showMessage('success', '旅行计划生成成功！');
        } catch (error) {
            console.error('❌ 创建旅行计划错误:', error);
            console.error('错误详情:', {
                message: error.message,
                stack: error.stack
            });
            
            // 显示详细错误信息
            const errorMsg = error.message || '生成旅行计划失败，请重试';
            showMessage('error', errorMsg);
            
            // 在页面上也显示错误详情
            const resultSection = document.getElementById('itineraryResult');
            const content = document.getElementById('itineraryContent');
            content.innerHTML = `
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; color: #721c24;">
                    <h4 style="margin-top: 0;">❌ 生成失败</h4>
                    <p><strong>错误信息：</strong></p>
                    <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto;">${errorMsg}</pre>
                    <p style="margin-top: 15px;"><strong>可能的原因：</strong></p>
                    <ul>
                        <li>AI API Key 未配置或无效</li>
                        <li>AI 服务暂时不可用</li>
                        <li>网络连接问题</li>
                        <li>API 配额已用尽</li>
                    </ul>
                    <p style="margin-top: 15px;"><strong>解决方法：</strong></p>
                    <ol>
                        <li>检查后端日志获取详细错误信息</li>
                        <li>确认 .env 文件中的 ALIYUN_BAILIAN_API_KEY 配置正确</li>
                        <li>访问阿里云控制台检查 API Key 状态</li>
                    </ol>
                </div>
            `;
            resultSection.classList.remove('hidden');
        } finally {
            hideLoading();
        }
    }

    displayItinerary(plan) {
        const resultSection = document.getElementById('itineraryResult');
        const content = document.getElementById('itineraryContent');

        // 确保 itinerary 是对象，如果是字符串则解析
        let itinerary = plan.itinerary;
        if (typeof itinerary === 'string') {
            try {
                itinerary = JSON.parse(itinerary);
            } catch (e) {
                console.error('解析行程数据失败:', e);
                itinerary = { overview: itinerary };
            }
        }

        let html = `
            <div class="itinerary-header">
                <h4>${plan.title}</h4>
                <p class="meta">📍 ${plan.destination} | 📅 ${plan.days} 天 | 💰 预算 ¥${plan.budget}</p>
            </div>
        `;

        // 如果有错误信息，显示错误
        if (itinerary.error) {
            html += `
                <div class="error-section" style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px;">
                    <h5 style="color: #856404; margin: 0 0 10px 0;">⚠️ AI 服务提示</h5>
                    <p style="color: #856404; margin: 0;">${itinerary.error}</p>
                </div>
            `;
        }

        // 行程概述
        if (itinerary.overview) {
            // 移除可能存在的 JSON 代码块标记
            let overview = itinerary.overview.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            html += '<h4 style="margin-top: 30px; margin-bottom: 20px; color: #4CAF50; font-size: 24px;">📝 行程概述</h4>';
            html += `
                <div class="overview-section">
                    <p>${overview}</p>
                </div>
            `;
        }

        // 每日行程
        if (itinerary.daily_itinerary && itinerary.daily_itinerary.length > 0) {
            html += '<div class="daily-section">';
            itinerary.daily_itinerary.forEach(day => {
                html += `
                    <div class="day-itinerary">
                        <h4>第 ${day.day} 天${day.title ? ': ' + day.title : ''}</h4>
                `;

                // 活动安排
                if (day.activities) {
                    day.activities.forEach(activity => {
                        html += `
                            <div class="activity-item">
                                <div class="activity-time">${activity.time || ''}</div>
                                <div class="activity-name">${activity.activity}</div>
                                ${activity.location ? `<div class="activity-location">📍 ${activity.location}</div>` : ''}
                                ${activity.description ? `<div class="activity-desc">${activity.description}</div>` : ''}
                                ${activity.duration ? `<div class="activity-duration">⏱️ ${activity.duration}</div>` : ''}
                                ${activity.estimated_cost ? `<div class="activity-cost">💰 约 ¥${activity.estimated_cost}</div>` : ''}
                            </div>
                        `;
                    });
                }

                // 用餐建议
                if (day.meals) {
                    html += '<div class="meals-section">';
                    html += '<h5>🍽️ 用餐建议</h5>';
                    if (day.meals.breakfast) html += `<p><strong>早餐:</strong> ${day.meals.breakfast}</p>`;
                    if (day.meals.lunch) html += `<p><strong>午餐:</strong> ${day.meals.lunch}</p>`;
                    if (day.meals.dinner) html += `<p><strong>晚餐:</strong> ${day.meals.dinner}</p>`;
                    html += '</div>';
                }

                // 住宿建议
                if (day.accommodation) {
                    html += `
                        <div class="accommodation-section">
                            <h5>🏨 住宿</h5>
                            <p>${day.accommodation}</p>
                        </div>
                    `;
                }

                html += '</div>';
            });
            html += '</div>';
        }

        // 交通建议
        if (itinerary.transportation) {
            const trans = itinerary.transportation;
            html += '<h4 style="margin-top: 30px; margin-bottom: 20px; color: #4CAF50; font-size: 24px;">🚗 交通建议</h4>';
            html += `
                <div class="transportation-section">
                    ${trans.to_destination ? `<p><strong>前往目的地:</strong> ${trans.to_destination}</p>` : ''}
                    ${trans.local ? `<p><strong>当地交通:</strong> ${trans.local}</p>` : ''}
                    ${trans.estimated_cost ? `<p><strong>预计交通费用:</strong> ¥${trans.estimated_cost}</p>` : ''}
                </div>
            `;
        }

        // 住宿总结
        if (itinerary.accommodation_summary) {
            const acc = itinerary.accommodation_summary;
            html += '<h4 style="margin-top: 30px; margin-bottom: 20px; color: #4CAF50; font-size: 24px;">🏨 住宿总结</h4>';
            html += `
                <div class="accommodation-summary">
                    ${acc.type ? `<p><strong>类型:</strong> ${acc.type}</p>` : ''}
                    ${acc.suggestions ? `<p><strong>推荐:</strong> ${acc.suggestions.join('、')}</p>` : ''}
                    ${acc.total_cost ? `<p><strong>总费用:</strong> ¥${acc.total_cost}</p>` : ''}
                </div>
            `;
        }

        // 预算分析
        if (plan.budget_breakdown) {
            // 独立的标题行
            html += '<h4 style="margin-top: 30px; margin-bottom: 20px; color: #4CAF50; font-size: 24px;">💰 预算分析</h4>';
            
            // 预算详情表格
            html += '<div class="budget-breakdown">';
            
            const breakdown = plan.budget_breakdown;
            const categories = [
                { key: 'transportation', label: '交通', icon: '🚗' },
                { key: 'accommodation', label: '住宿', icon: '🏨' },
                { key: 'meals', label: '餐饮', icon: '🍽️' },
                { key: 'attractions', label: '景点', icon: '🎫' },
                { key: 'shopping', label: '购物', icon: '🛍️' },
                { key: 'emergency', label: '应急', icon: '🚨' }
            ];

            categories.forEach(cat => {
                if (breakdown[cat.key]) {
                    html += `
                        <div class="budget-item">
                            <h5>${cat.icon} ${cat.label}</h5>
                            <div class="amount">¥${breakdown[cat.key]}</div>
                        </div>
                    `;
                }
            });

            if (breakdown.total) {
                html += `
                    <div class="budget-item total">
                        <h5>💵 总计</h5>
                        <div class="amount">¥${breakdown.total}</div>
                    </div>
                `;
            }

            html += '</div>';
        }

        // 旅行建议
        if (itinerary.tips && itinerary.tips.length > 0) {
            html += '<h4 style="margin-top: 30px; margin-bottom: 20px; color: #4CAF50; font-size: 24px;">💡 旅行建议</h4>';
            html += '<div class="tips-section">';
            html += '<ul>';
            itinerary.tips.forEach(tip => {
                html += `<li>${tip}</li>`;
            });
            html += '</ul>';
            html += '</div>';
        }

        content.innerHTML = html;
        resultSection.classList.remove('hidden');

        // 在地图上显示行程
        console.log('🗺️ 准备在地图上显示行程:', itinerary);
        mapManager.showItineraryOnMap(itinerary, plan.destination);

        // 滚动到结果
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    async loadMyPlans() {
        try {
            showLoading('加载中...');
            const plans = await api.getTravelPlans();
            this.displayPlansList(plans);
        } catch (error) {
            console.error('加载旅行计划错误:', error);
            showMessage('error', '加载失败');
        } finally {
            hideLoading();
        }
    }

    displayPlansList(plans) {
        const plansList = document.getElementById('plansList');

        if (plans.length === 0) {
            plansList.innerHTML = '<p class="empty-message">暂无旅行计划，快去创建一个吧！</p>';
            return;
        }

        let html = '';
        plans.forEach(plan => {
            const startDate = new Date(plan.start_date).toLocaleDateString('zh-CN');
            const endDate = new Date(plan.end_date).toLocaleDateString('zh-CN');
            
            html += `
                <div class="plan-card" data-plan-id="${plan.id}">
                    <h4>${plan.title}</h4>
                    <div class="meta">📍 ${plan.destination}</div>
                    <div class="meta">📅 ${startDate} - ${endDate} (${plan.days}天)</div>
                    <div class="meta">💰 预算 ¥${plan.budget}</div>
                    <div class="meta">👥 ${plan.travelers_count} 人</div>
                    <div class="plan-actions">
                        <button class="btn btn-primary btn-sm view-plan">查看详情</button>
                        <button class="btn btn-secondary btn-sm delete-plan">删除</button>
                    </div>
                </div>
            `;
        });

        plansList.innerHTML = html;

        // 绑定事件
        plansList.querySelectorAll('.view-plan').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.viewPlanDetail(plans[index]);
            });
        });

        plansList.querySelectorAll('.delete-plan').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePlan(plans[index].id);
            });
        });
    }

    viewPlanDetail(plan) {
        showSection('home');
        this.currentPlan = plan;
        this.displayItinerary(plan);
    }

    async deletePlan(planId) {
        if (!confirm('确定要删除这个旅行计划吗？')) {
            return;
        }

        try {
            showLoading('删除中...');
            await api.deleteTravelPlan(planId);
            showMessage('success', '删除成功');
            this.loadMyPlans();
        } catch (error) {
            console.error('删除旅行计划错误:', error);
            showMessage('error', '删除失败');
        } finally {
            hideLoading();
        }
    }
}

// 创建全局旅行计划实例
const travelPlanner = new TravelPlanner();

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 表单提交
    document.getElementById('planningForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!auth.isLoggedIn()) {
            showMessage('warning', '请先登录');
            auth.showAuthModal(true);
            return;
        }

        const formData = {
            destination: document.getElementById('destination').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            budget: document.getElementById('budget').value,
            travelersCount: document.getElementById('travelersCount').value,
            preferences: document.getElementById('preferences').value
        };

        travelPlanner.createPlan(formData);
    });
});

