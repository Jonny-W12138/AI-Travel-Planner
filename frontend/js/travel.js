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

        // 生成侧边栏导航目录
        let sidebarHtml = '<div class="itinerary-sidebar">';
        sidebarHtml += '<h5>📑 快速导航</h5>';
        sidebarHtml += '<div class="sidebar-nav-links">';
        
        // 添加概述链接
        if (itinerary.overview) {
            sidebarHtml += '<a href="javascript:void(0)" class="sidebar-nav-link" data-target="overview">📝 行程概述</a>';
        }
        
        // 添加每日行程链接
        if (itinerary.daily_itinerary && itinerary.daily_itinerary.length > 0) {
            itinerary.daily_itinerary.forEach(day => {
                sidebarHtml += `<a href="javascript:void(0)" class="sidebar-nav-link" data-target="day-${day.day}">📅 第${day.day}天</a>`;
            });
        }
        
        // 添加其他快速链接
        if (itinerary.transportation) {
            sidebarHtml += '<a href="javascript:void(0)" class="sidebar-nav-link" data-target="transportation">🚗 交通建议</a>';
        }
        if (itinerary.accommodation_summary) {
            sidebarHtml += '<a href="javascript:void(0)" class="sidebar-nav-link" data-target="hotels">🏨 酒店推荐</a>';
        }
        if (itinerary.restaurant_recommendations && itinerary.restaurant_recommendations.length > 0) {
            sidebarHtml += '<a href="javascript:void(0)" class="sidebar-nav-link" data-target="restaurants">🍴 美食推荐</a>';
        }
        if (plan.budget_breakdown) {
            sidebarHtml += '<a href="javascript:void(0)" class="sidebar-nav-link" data-target="budget-analysis">💰 预算分析</a>';
        }
        if (itinerary.tips && itinerary.tips.length > 0) {
            sidebarHtml += '<a href="javascript:void(0)" class="sidebar-nav-link" data-target="tips">💡 旅行建议</a>';
        }
        
        sidebarHtml += '</div>';
        sidebarHtml += '</div>';

        let html = `
            <div class="itinerary-container">
                ${sidebarHtml}
                <div class="itinerary-main">
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
            html += '<h4 id="overview" class="section-title" style="margin-top: 30px; margin-bottom: 20px; color: #4CAF50; font-size: 24px;">📝 行程概述</h4>';
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
                    <div class="day-itinerary" id="day-${day.day}">
                        <h4 class="section-title">第 ${day.day} 天${day.title ? ': ' + day.title : ''}</h4>
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

                // 检查是否是最后一天（离开日期）
                const isLastDay = itinerary.daily_itinerary && day.day === itinerary.daily_itinerary.length;
                const isDepartureDay = day.title && (day.title.includes('离开') || day.title.includes('返回') || day.title.includes('回程'));
                
                // 用餐建议 - 离开当天不显示
                if (day.meals && !isDepartureDay) {
                    html += '<div class="meals-section">';
                    html += '<h5>🍽️ 用餐建议</h5>';
                    
                    // 早餐
                    if (day.meals.breakfast) {
                        if (typeof day.meals.breakfast === 'object') {
                            html += `<div class="meal-item">
                                <p><strong>早餐:</strong> ${day.meals.breakfast.restaurant_name || '待定'}</p>
                                ${day.meals.breakfast.address ? `<p class="meal-detail">📍 ${day.meals.breakfast.address}</p>` : ''}
                                ${day.meals.breakfast.specialty ? `<p class="meal-detail">🍴 推荐: ${day.meals.breakfast.specialty}</p>` : ''}
                                ${day.meals.breakfast.avg_cost ? `<p class="meal-detail">💰 人均: ¥${day.meals.breakfast.avg_cost}</p>` : ''}
                            </div>`;
                        } else {
                            html += `<p><strong>早餐:</strong> ${day.meals.breakfast}</p>`;
                        }
                    }
                    
                    // 午餐
                    if (day.meals.lunch) {
                        if (typeof day.meals.lunch === 'object') {
                            html += `<div class="meal-item">
                                <p><strong>午餐:</strong> ${day.meals.lunch.restaurant_name || '待定'}</p>
                                ${day.meals.lunch.address ? `<p class="meal-detail">📍 ${day.meals.lunch.address}</p>` : ''}
                                ${day.meals.lunch.specialty ? `<p class="meal-detail">🍴 推荐: ${day.meals.lunch.specialty}</p>` : ''}
                                ${day.meals.lunch.avg_cost ? `<p class="meal-detail">💰 人均: ¥${day.meals.lunch.avg_cost}</p>` : ''}
                            </div>`;
                        } else {
                            html += `<p><strong>午餐:</strong> ${day.meals.lunch}</p>`;
                        }
                    }
                    
                    // 晚餐
                    if (day.meals.dinner) {
                        if (typeof day.meals.dinner === 'object') {
                            html += `<div class="meal-item">
                                <p><strong>晚餐:</strong> ${day.meals.dinner.restaurant_name || '待定'}</p>
                                ${day.meals.dinner.address ? `<p class="meal-detail">📍 ${day.meals.dinner.address}</p>` : ''}
                                ${day.meals.dinner.specialty ? `<p class="meal-detail">🍴 推荐: ${day.meals.dinner.specialty}</p>` : ''}
                                ${day.meals.dinner.avg_cost ? `<p class="meal-detail">💰 人均: ¥${day.meals.dinner.avg_cost}</p>` : ''}
                            </div>`;
                        } else {
                            html += `<p><strong>晚餐:</strong> ${day.meals.dinner}</p>`;
                        }
                    }
                    
                    html += '</div>';
                }

                // 住宿建议 - 离开当天不显示
                if (day.accommodation && !isDepartureDay) {
                    html += '<div class="accommodation-section">';
                    html += '<h5>🏨 住宿</h5>';
                    
                    if (typeof day.accommodation === 'object') {
                        html += `<div class="hotel-item">
                            <p><strong>${day.accommodation.hotel_name || '待定'}</strong></p>
                            ${day.accommodation.address ? `<p class="hotel-detail">📍 ${day.accommodation.address}</p>` : ''}
                            ${day.accommodation.room_type ? `<p class="hotel-detail">🛏️ 房型: ${day.accommodation.room_type}</p>` : ''}
                            ${day.accommodation.price_per_night ? `<p class="hotel-detail">💰 价格: ¥${day.accommodation.price_per_night}/晚</p>` : ''}
                            ${day.accommodation.features && day.accommodation.features.length > 0 ? `<p class="hotel-detail">✨ 特色: ${day.accommodation.features.join('、')}</p>` : ''}
                        </div>`;
                    } else {
                        html += `<p>${day.accommodation}</p>`;
                    }
                    
                    html += '</div>';
                }

                html += '</div>';
            });
            html += '</div>';
        }

        // 交通建议
        if (itinerary.transportation) {
            const trans = itinerary.transportation;
            html += '<h4 id="transportation" class="section-title" style="margin-top: 30px; margin-bottom: 20px; color: #4CAF50; font-size: 24px;">🚗 交通建议</h4>';
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
            html += '<h4 id="hotels" class="section-title" style="margin-top: 30px; margin-bottom: 20px; color: #4CAF50; font-size: 24px;">🏨 推荐酒店</h4>';
            html += '<div class="accommodation-summary">';
            
            // 如果有具体的酒店列表
            if (acc.hotels && acc.hotels.length > 0) {
                acc.hotels.forEach(hotel => {
                    html += `
                        <div class="hotel-card" style="background: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 15px 0; border-radius: 8px;">
                            <h5 style="margin-top: 0; color: #333;">${hotel.name}</h5>
                            ${hotel.address ? `<p style="margin: 8px 0;">📍 ${hotel.address}</p>` : ''}
                            ${hotel.price_range ? `<p style="margin: 8px 0;">💰 ${hotel.price_range}</p>` : ''}
                            ${hotel.rating ? `<p style="margin: 8px 0;">⭐ ${hotel.rating}</p>` : ''}
                            ${hotel.features && hotel.features.length > 0 ? `<p style="margin: 8px 0;">✨ ${hotel.features.join('、')}</p>` : ''}
                        </div>
                    `;
                });
            } else {
                // 兼容旧格式
                html += `
                    ${acc.type ? `<p><strong>类型:</strong> ${acc.type}</p>` : ''}
                    ${acc.suggestions ? `<p><strong>推荐:</strong> ${acc.suggestions.join('、')}</p>` : ''}
                `;
            }
            
            if (acc.total_cost) {
                html += `<p style="margin-top: 15px; font-size: 16px;"><strong>预计住宿总费用:</strong> <span style="color: #4CAF50; font-size: 18px;">¥${acc.total_cost}</span></p>`;
            }
            
            html += '</div>';
        }

        // 餐厅推荐
        if (itinerary.restaurant_recommendations && itinerary.restaurant_recommendations.length > 0) {
            html += '<h4 id="restaurants" class="section-title" style="margin-top: 30px; margin-bottom: 20px; color: #4CAF50; font-size: 24px;">🍴 推荐餐厅</h4>';
            html += '<div class="restaurant-recommendations">';
            
            itinerary.restaurant_recommendations.forEach(restaurant => {
                html += `
                    <div class="restaurant-card" style="background: #f9f9f9; border-left: 4px solid #FF9800; padding: 15px; margin: 15px 0; border-radius: 8px;">
                        <h5 style="margin-top: 0; color: #333;">${restaurant.name}</h5>
                        ${restaurant.cuisine_type ? `<p style="margin: 8px 0;">🍳 菜系: ${restaurant.cuisine_type}</p>` : ''}
                        ${restaurant.address ? `<p style="margin: 8px 0;">📍 ${restaurant.address}</p>` : ''}
                        ${restaurant.specialty ? `<p style="margin: 8px 0;">🍴 招牌菜: ${restaurant.specialty}</p>` : ''}
                        ${restaurant.avg_cost ? `<p style="margin: 8px 0;">💰 人均消费: ¥${restaurant.avg_cost}</p>` : ''}
                        ${restaurant.recommended_for ? `<p style="margin: 8px 0;">⏰ 推荐: ${restaurant.recommended_for}</p>` : ''}
                    </div>
                `;
            });
            
            html += '</div>';
        }

        // 预算分析
        if (plan.budget_breakdown) {
            // 独立的标题行
            html += '<h4 id="budget-analysis" class="section-title" style="margin-top: 30px; margin-bottom: 20px; color: #4CAF50; font-size: 24px;">💰 预算分析</h4>';
            
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
            html += '<h4 id="tips" class="section-title" style="margin-top: 30px; margin-bottom: 20px; color: #4CAF50; font-size: 24px;">💡 旅行建议</h4>';
            html += '<div class="tips-section">';
            html += '<ul>';
            itinerary.tips.forEach(tip => {
                html += `<li>${tip}</li>`;
            });
            html += '</ul>';
            html += '</div>';
        }

        // 关闭主内容区和容器
        html += '</div>'; // 关闭 itinerary-main
        html += '</div>'; // 关闭 itinerary-container

        content.innerHTML = html;
        resultSection.classList.remove('hidden');

        // 添加平滑滚动到各个部分
        this.setupSmoothNavigation();

        // 在地图上显示行程
        console.log('🗺️ 准备在地图上显示行程:', itinerary);
        mapManager.showItineraryOnMap(itinerary, plan.destination);

        // 滚动到结果
        resultSection.scrollIntoView({ behavior: 'smooth' });
        
        // 显示返回顶部按钮
        this.showBackToTopButton();
    }

    setupSmoothNavigation() {
        // 为侧边栏导航链接添加平滑滚动和高亮效果
        document.querySelectorAll('.sidebar-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const targetId = link.getAttribute('data-target');
                const targetElement = document.getElementById(targetId);
                
                console.log('🔗 点击导航链接:', targetId);
                
                if (targetElement) {
                    console.log('🎯 找到目标元素:', targetElement);
                    console.log('📏 元素的offsetTop:', targetElement.offsetTop);
                    console.log('📄 当前滚动位置:', window.pageYOffset);
                    
                    // 移除所有链接的active类
                    document.querySelectorAll('.sidebar-nav-link').forEach(l => l.classList.remove('active'));
                    // 为当前链接添加active类
                    link.classList.add('active');
                    
                    // 计算目标位置 - 使用offsetTop获取元素相对于文档顶部的位置
                    const navbarHeight = 70;
                    const padding = 20;
                    
                    // 递归获取元素到文档顶部的实际距离
                    let element = targetElement;
                    let offsetTop = 0;
                    while(element) {
                        offsetTop += element.offsetTop;
                        element = element.offsetParent;
                    }
                    
                    const scrollToPosition = offsetTop - navbarHeight - padding;
                    
                    console.log('📍 计算出的滚动位置:', scrollToPosition);
                    
                    window.scrollTo({
                        top: scrollToPosition,
                        behavior: 'smooth'
                    });
                    
                    // 延迟后验证滚动是否成功
                    setTimeout(() => {
                        console.log('✅ 滚动完成，当前位置:', window.pageYOffset);
                    }, 1000);
                } else {
                    console.warn('⚠️ 未找到目标元素:', targetId);
                }
            });
        });
        
        // 监听滚动，自动高亮当前部分
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };
        
        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    const correspondingLink = document.querySelector(`.sidebar-nav-link[data-target="${id}"]`);
                    if (correspondingLink) {
                        document.querySelectorAll('.sidebar-nav-link').forEach(l => l.classList.remove('active'));
                        correspondingLink.classList.add('active');
                    }
                }
            });
        };
        
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        
        // 观察所有有ID的部分
        document.querySelectorAll('[id]').forEach(section => {
            observer.observe(section);
        });
    }

    showBackToTopButton() {
        // 检查是否已经存在返回顶部按钮
        let backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) {
            backToTopBtn = document.createElement('button');
            backToTopBtn.id = 'backToTop';
            backToTopBtn.innerHTML = '↑<br>目录';
            backToTopBtn.className = 'back-to-top';
            backToTopBtn.title = '返回导航目录';
            document.body.appendChild(backToTopBtn);

            // 点击返回导航目录
            backToTopBtn.addEventListener('click', () => {
                const headerElement = document.querySelector('.itinerary-header');
                if (headerElement) {
                    headerElement.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });

            // 滚动时显示/隐藏按钮
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                
                const itineraryResult = document.getElementById('itineraryResult');
                if (itineraryResult && !itineraryResult.classList.contains('hidden')) {
                    const resultTop = itineraryResult.offsetTop;
                    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
                    
                    if (scrollPosition > resultTop + 300) {
                        backToTopBtn.classList.add('visible');
                    } else {
                        backToTopBtn.classList.remove('visible');
                    }
                }
                
                // 滚动时淡出按钮，停止后恢复
                backToTopBtn.style.opacity = '0.5';
                scrollTimeout = setTimeout(() => {
                    backToTopBtn.style.opacity = '1';
                }, 150);
            });
        }
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

