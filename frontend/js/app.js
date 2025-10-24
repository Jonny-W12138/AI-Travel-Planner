/**
 * 主应用模块
 * 依赖: utils.js (工具函数), api.js, auth.js 等
 */

function showSection(sectionId) {
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

// 应用初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('AI 旅行规划师应用已启动');

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

