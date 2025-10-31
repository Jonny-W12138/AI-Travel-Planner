/**
 * 主应用模块
 * 依赖: utils.js (工具函数), api.js, auth.js 等
 */

function showSection(sectionId) {
    // 清除所有消息提示（避免切换页面时遗留消息）
    clearAllMessages();
    
    // 隐藏所有 section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // 显示目标 section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // 更新导航高亮
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });

    // 根据 section 加载数据
    if (auth.isLoggedIn()) {
        if (sectionId === 'plans') {
            travelPlanner.loadMyPlans();
        } else if (sectionId === 'expenses') {
            expenseManager.loadExpenses();
        }
    }
}

// 浏览器兼容性检测
function detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        return 'chrome';
    } else if (userAgent.includes('edg')) {
        return 'edge';
    } else if (userAgent.includes('firefox')) {
        return 'firefox';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        return 'safari';
    } else {
        return 'other';
    }
}

// 初始化浏览器兼容性提示
function initBrowserNotice() {
    const browser = detectBrowser();
    const notice = document.getElementById('browserNotice');
    const closeBtn = document.getElementById('closeBrowserNotice');
    
    if (!notice) return;
    
    // 检查是否已经关闭过提示
    const noticeClosed = localStorage.getItem('browserNoticeClosed');
    
    // 根据浏览器类型决定是否显示提示
    if (browser === 'safari') {
        // Safari 用户始终显示提示（语音功能可能不可用）
        notice.classList.remove('hidden');
        document.body.classList.add('browser-notice-visible');
        console.log('🌐 检测到 Safari 浏览器，显示兼容性提示');
    } else if (browser === 'chrome' || browser === 'edge') {
        // Chrome/Edge 用户只在首次访问时显示
        if (!noticeClosed) {
            notice.classList.remove('hidden');
            document.body.classList.add('browser-notice-visible');
            console.log('🌐 检测到推荐浏览器，显示使用提示');
        } else {
            notice.classList.add('hidden');
            document.body.classList.remove('browser-notice-visible');
        }
    } else if (browser === 'firefox') {
        // Firefox 用户显示提示（语音功能支持良好）
        if (!noticeClosed) {
            notice.classList.remove('hidden');
            document.body.classList.add('browser-notice-visible');
            console.log('🌐 检测到 Firefox 浏览器，显示兼容性提示');
        } else {
            notice.classList.add('hidden');
            document.body.classList.remove('browser-notice-visible');
        }
    } else {
        // 其他浏览器显示提示
        notice.classList.remove('hidden');
        document.body.classList.add('browser-notice-visible');
        console.log('🌐 检测到未知浏览器，显示兼容性提示');
    }
    
    // 关闭按钮事件
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notice.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => {
                notice.classList.add('hidden');
                document.body.classList.remove('browser-notice-visible');
                localStorage.setItem('browserNoticeClosed', 'true');
            }, 300);
        });
    }
}

// 应用初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('AI 旅行规划师应用已启动');
    
    // 初始化浏览器兼容性提示
    initBrowserNotice();

    // 导航链接点击事件
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            const sectionId = href.substring(1);
            showSection(sectionId);
        });
    });

    // 点击模态框外部关闭
    document.getElementById('authModal').addEventListener('click', (e) => {
        if (e.target.id === 'authModal') {
            auth.hideAuthModal();
        }
    });

    // 设置默认日期（明天和后天）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 6);

    document.getElementById('startDate').valueAsDate = tomorrow;
    document.getElementById('endDate').valueAsDate = dayAfter;

    // 检查是否配置了高德地图 API
    if (!window.AMap) {
        console.warn('高德地图 API 未配置，请在 index.html 中配置您的 API Key');
        showMessage('warning', '地图功能未配置，请联系管理员');
    }

    // 欢迎消息
    setTimeout(() => {
        if (!auth.isLoggedIn()) {
            showMessage('info', '欢迎使用 AI 旅行规划师！请先登录以使用完整功能');
        }
    }, 1000);
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    // 停止录音
    if (voiceRecognizer && voiceRecognizer.isRecording) {
        voiceRecognizer.stopRecording();
    }
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('全局错误:', e);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的 Promise 拒绝:', e);
});

