/**
 * 工具函数模块 - 必须最先加载
 */

// 显示加载提示
function showLoading(message = '加载中...') {
    const loading = document.getElementById('loading');
    if (!loading) {
        console.error('Loading element not found');
        return;
    }
    const loadingText = loading.querySelector('p');
    if (loadingText) {
        loadingText.textContent = message;
    }
    loading.classList.remove('hidden');
}

// 隐藏加载提示
function hideLoading() {
    const loading = document.getElementById('loading');
    if (!loading) {
        console.error('Loading element not found');
        return;
    }
    loading.classList.add('hidden');
}

// 显示消息提示
function showMessage(type, message) {
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                document.body.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .over-budget {
        background: linear-gradient(135deg, #f44336 0%, #e91e63 100%) !important;
    }
    
    .empty-message {
        text-align: center;
        padding: 40px;
        color: #999;
        font-size: 16px;
    }
    
    .plan-actions {
        margin-top: 15px;
        display: flex;
        gap: 10px;
    }
    
    .btn-sm {
        padding: 8px 16px;
        font-size: 13px;
    }
`;
document.head.appendChild(style);

