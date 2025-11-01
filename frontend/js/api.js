/**
 * API 调用模块
 */

const API_BASE_URL = window.location.origin;

class API {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    // 设置 token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // 清除 token
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // 获取请求头
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // 通用请求方法
    async request(url, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers: this.getHeaders(options.auth !== false),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const errorMessage = this.parseErrorMessage(error, response.status);
                throw new Error(errorMessage);
            }

            // 处理 204 No Content
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('API 请求错误:', error);
            throw error;
        }
    }

    // 解析错误消息
    parseErrorMessage(error, status) {
        // 如果 detail 是字符串，直接返回
        if (typeof error.detail === 'string') {
            return error.detail;
        }
        
        // 如果 detail 是数组（FastAPI 验证错误）
        if (Array.isArray(error.detail)) {
            const messages = error.detail.map(err => {
                // 获取字段名并转换为友好的中文名称
                const fieldName = this.getFieldDisplayName(err.loc);
                const message = this.getErrorMessage(err.msg, err.type);
                return `${fieldName}${message}`;
            });
            return messages.join('\n');
        }
        
        // 如果 detail 是对象
        if (error.detail && typeof error.detail === 'object') {
            return JSON.stringify(error.detail);
        }
        
        // 使用 message 字段
        if (error.message) {
            return error.message;
        }
        
        // 默认错误消息
        return `请求失败 (${status})`;
    }

    // 获取字段的显示名称
    getFieldDisplayName(loc) {
        if (!loc || loc.length === 0) return '';
        
        const fieldMap = {
            'username': '用户名',
            'email': '邮箱',
            'password': '密码',
            'destination': '目的地',
            'start_date': '开始日期',
            'end_date': '结束日期',
            'budget': '预算',
            'travelers_count': '人数',
            'category': '类别',
            'amount': '金额',
            'description': '描述'
        };
        
        // 获取最后一个字段名（通常是实际的字段）
        const field = loc[loc.length - 1];
        return fieldMap[field] || field;
    }

    // 获取友好的错误消息
    getErrorMessage(msg, type) {
        // 常见的验证错误类型
        if (type === 'string_too_short' || msg.includes('at least')) {
            const match = msg.match(/at least (\d+)/);
            if (match) {
                return `长度不能少于 ${match[1]} 个字符`;
            }
            return '长度不足';
        }
        
        if (type === 'string_too_long' || msg.includes('at most')) {
            const match = msg.match(/at most (\d+)/);
            if (match) {
                return `长度不能超过 ${match[1]} 个字符`;
            }
            return '长度过长';
        }
        
        if (type === 'value_error.email' || msg.includes('valid email')) {
            return '格式不正确';
        }
        
        if (type === 'type_error.integer' || msg.includes('integer')) {
            return '必须是整数';
        }
        
        if (type === 'type_error.float' || msg.includes('float')) {
            return '必须是数字';
        }
        
        if (msg.includes('field required') || msg.includes('missing')) {
            return '不能为空';
        }
        
        // 默认返回原始消息
        return `: ${msg}`;
    }

    // GET 请求
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    }

    // POST 请求
    async post(url, data = {}, options = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options,
        });
    }

    // PUT 请求
    async put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // DELETE 请求
    async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }

    // 上传文件
    async upload(url, formData) {
        try {
            const headers = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(`${API_BASE_URL}${url}`, {
                method: 'POST',
                headers: headers,
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '上传失败');
            }

            return await response.json();
        } catch (error) {
            console.error('上传错误:', error);
            throw error;
        }
    }

    // 认证相关
    async register(username, email, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
            auth: false,
        });
    }

    async login(username, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            auth: false,
        });
        
        if (response.access_token) {
            this.setToken(response.access_token);
        }
        
        return response;
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    // 旅行计划相关
    async createTravelPlan(planData) {
        return this.post('/travel/plan', planData);
    }

    async getTravelPlans() {
        return this.get('/travel/plans');
    }

    async getTravelPlan(planId) {
        return this.get(`/travel/plans/${planId}`);
    }

    async deleteTravelPlan(planId) {
        return this.delete(`/travel/plans/${planId}`);
    }

    // 费用相关
    async createExpense(expenseData) {
        return this.post('/expenses/', expenseData);
    }

    async getExpenses(travelPlanId = null) {
        const params = travelPlanId ? { travel_plan_id: travelPlanId } : {};
        return this.get('/expenses/', params);
    }

    async getExpenseSummary(travelPlanId = null) {
        const params = travelPlanId ? { travel_plan_id: travelPlanId } : {};
        return this.get('/expenses/summary', params);
    }

    async deleteExpense(expenseId) {
        return this.delete(`/expenses/${expenseId}`);
    }

    async updateExpense(expenseId, expenseData) {
        return this.put(`/expenses/${expenseId}`, expenseData);
    }

    // 语音识别相关
    async recognizeVoice(audioFile) {
        const formData = new FormData();
        formData.append('audio', audioFile);
        return this.upload('/voice/recognize', formData);
    }

    async recognizeVoiceBase64(audioData, format = 'wav') {
        return this.post('/voice/recognize-base64', { audio_data: audioData, format });
    }

    async parseVoiceQuery(text) {
        return this.post('/voice/parse-query', { text });
    }

    // 地图相关
    async geocode(address) {
        return this.get('/map/geocode', { address });
    }

    async searchPOI(query, city = null, types = null) {
        const params = { query };
        if (city) params.city = city;
        if (types) params.types = types;
        return this.get('/map/poi', params);
    }

    async getRoute(origin, destination, mode = 'driving') {
        return this.get('/map/route', { origin, destination, mode });
    }

    async getWeather(city) {
        return this.get('/map/weather', { city });
    }
}

// 创建全局 API 实例
const api = new API();

