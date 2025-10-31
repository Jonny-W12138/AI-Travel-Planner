/**
 * 认证模块
 */

class Auth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // 检查是否已登录
        const token = localStorage.getItem('token');
        if (token) {
            try {
                this.currentUser = await api.getCurrentUser();
                this.updateUI(true);
            } catch (error) {
                console.error('获取用户信息失败:', error);
                this.logout();
            }
        }
    }

    updateUI(isLoggedIn) {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const username = document.getElementById('username');

        if (isLoggedIn && this.currentUser) {
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            username.classList.remove('hidden');
            username.textContent = ` ${this.currentUser.username}`;
        } else {
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            username.classList.add('hidden');
        }
    }

    showAuthModal(isLogin = true) {
        const modal = document.getElementById('authModal');
        const authTitle = document.getElementById('authTitle');
        const emailGroup = document.getElementById('emailGroup');
        const emailInput = document.getElementById('email');
        const authSwitchText = document.getElementById('authSwitchText');
        const authSwitchLink = document.getElementById('authSwitchLink');

        if (isLogin) {
            authTitle.textContent = '登录';
            emailGroup.style.display = 'none';
            // 登录模式下移除 email 的 required 属性
            emailInput.removeAttribute('required');
            authSwitchText.textContent = '还没有账号？';
            authSwitchLink.textContent = '立即注册';
        } else {
            authTitle.textContent = '注册';
            emailGroup.style.display = 'block';
            // 注册模式下添加 email 的 required 属性
            emailInput.setAttribute('required', 'required');
            authSwitchText.textContent = '已有账号？';
            authSwitchLink.textContent = '立即登录';
        }

        modal.classList.remove('hidden');
    }

    hideAuthModal() {
        const modal = document.getElementById('authModal');
        modal.classList.add('hidden');
        document.getElementById('authForm').reset();
    }

    async handleAuth(formData, isLogin) {
        try {
            showLoading(isLogin ? '登录中...' : '注册中...');

            if (isLogin) {
                await api.login(formData.username, formData.password);
                this.currentUser = await api.getCurrentUser();
            } else {
                await api.register(formData.username, formData.email, formData.password);
                await api.login(formData.username, formData.password);
                this.currentUser = await api.getCurrentUser();
            }

            this.updateUI(true);
            this.hideAuthModal();
            showMessage('success', isLogin ? '登录成功！' : '注册成功！');
        } catch (error) {
            showMessage('error', error.message || (isLogin ? '登录失败' : '注册失败'));
        } finally {
            hideLoading();
        }
    }

    logout() {
        api.clearToken();
        this.currentUser = null;
        this.updateUI(false);
        showMessage('success', '已退出登录');
        
        // 清空页面数据
        document.getElementById('plansList').innerHTML = '';
        document.getElementById('expensesList').innerHTML = '';
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    requireAuth(callback) {
        if (!this.isLoggedIn()) {
            showMessage('warning', '请先登录');
            this.showAuthModal(true);
            return false;
        }
        callback();
        return true;
    }
}

// 创建全局认证实例
const auth = new Auth();

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 登录按钮
    document.getElementById('loginBtn').addEventListener('click', () => {
        auth.showAuthModal(true);
    });

    // 退出按钮
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.logout();
    });

    // 关闭模态框
    document.querySelector('.close').addEventListener('click', () => {
        auth.hideAuthModal();
    });

    // 切换登录/注册
    document.getElementById('authSwitchLink').addEventListener('click', (e) => {
        e.preventDefault();
        const isLoginMode = document.getElementById('authTitle').textContent === '登录';
        auth.showAuthModal(!isLoginMode);
    });

    // 表单提交
    document.getElementById('authForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const isLogin = document.getElementById('authTitle').textContent === '登录';
        const formData = {
            username: document.getElementById('usernameInput').value,
            password: document.getElementById('password').value,
        };

        if (!isLogin) {
            formData.email = document.getElementById('email').value;
        }

        auth.handleAuth(formData, isLogin);
    });
});

