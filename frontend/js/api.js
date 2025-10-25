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
                const errorMessage = error.detail || error.message || `请求失败 (${response.status})`;
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

