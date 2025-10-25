/**
 * 费用管理模块
 */

class ExpenseManager {
    constructor() {
        this.expenses = [];
        this.summary = null;
        this.categoryChart = null; // 存储图表实例
        this.editingExpenseId = null; // 正在编辑的费用ID
    }

    async addExpense(formData) {
        // 如果是编辑模式，调用更新方法
        if (this.editingExpenseId) {
            await this.updateExpense(this.editingExpenseId, formData);
            return;
        }

        try {
            showLoading('添加中...');

            const expenseData = {
                category: formData.category,
                amount: parseFloat(formData.amount),
                description: formData.description || '',
                travel_plan_id: travelPlanner.currentPlan ? travelPlanner.currentPlan.travel_plan_id : null
            };

            await api.createExpense(expenseData);
            showMessage('success', '费用记录添加成功');
            
            // 刷新列表
            await this.loadExpenses();
            
            // 清空表单
            document.getElementById('expenseForm').reset();
        } catch (error) {
            console.error('添加费用错误:', error);
            showMessage('error', error.message || '添加失败');
        } finally {
            hideLoading();
        }
    }

    async loadExpenses() {
        try {
            showLoading('加载中...');
            
            const travelPlanId = travelPlanner.currentPlan ? travelPlanner.currentPlan.travel_plan_id : null;
            
            // 加载费用列表
            this.expenses = await api.getExpenses(travelPlanId);
            
            // 加载费用汇总
            this.summary = await api.getExpenseSummary(travelPlanId);
            
            this.displayExpenses();
            this.displaySummary();
        } catch (error) {
            console.error('加载费用错误:', error);
            showMessage('error', '加载失败');
        } finally {
            hideLoading();
        }
    }

    displayExpenses() {
        const expensesList = document.getElementById('expensesList');

        if (this.expenses.length === 0) {
            expensesList.innerHTML = '<p class="empty-message">暂无费用记录</p>';
            return;
        }

        let html = '';
        this.expenses.forEach(expense => {
            const date = new Date(expense.expense_date).toLocaleDateString('zh-CN');
            
            html += `
                <div class="expense-item">
                    <div class="expense-info">
                        <h5>${this.getCategoryIcon(expense.category)} ${expense.category}</h5>
                        <div class="meta">${expense.description || '无描述'}</div>
                        <div class="meta">📅 ${date}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="expense-amount">¥${expense.amount.toFixed(2)}</div>
                        <div class="expense-actions">
                            <button class="btn-icon btn-edit" onclick="expenseManager.editExpense(${expense.id})" title="编辑">
                                ✏️
                            </button>
                            <button class="btn-icon btn-delete" onclick="expenseManager.deleteExpense(${expense.id})" title="删除">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        expensesList.innerHTML = html;
    }

    displaySummary() {
        const summaryContainer = document.getElementById('expenseSummary');
        const aiAnalysisContainer = document.getElementById('aiAnalysis');

        if (!this.summary) {
            summaryContainer.innerHTML = '<p>暂无费用数据</p>';
            return;
        }

        let html = '<div class="summary-cards">';

        // 总费用卡片
        html += `
            <div class="summary-card total">
                <h4>总支出</h4>
                <div class="amount">¥${this.summary.total.toFixed(2)}</div>
            </div>
        `;

        // 预算相关信息
        if (this.summary.budget) {
            html += `
                <div class="summary-card">
                    <h4>总预算</h4>
                    <div class="amount">¥${this.summary.budget.toFixed(2)}</div>
                </div>
                <div class="summary-card ${this.summary.remaining >= 0 ? '' : 'over-budget'}">
                    <h4>${this.summary.remaining >= 0 ? '剩余预算' : '超支'}</h4>
                    <div class="amount">¥${Math.abs(this.summary.remaining).toFixed(2)}</div>
                </div>
                <div class="summary-card">
                    <h4>预算使用率</h4>
                    <div class="amount">${this.summary.usage_percentage.toFixed(1)}%</div>
                </div>
            `;
        }

        html += '</div>'; // 关闭 summary-cards
        summaryContainer.innerHTML = html;

        // 按类别统计 - 使用饼图显示
        if (this.summary.by_category && Object.keys(this.summary.by_category).length > 0) {
            this.drawCategoryChart(this.summary.by_category);
        } else {
            // 隐藏图表容器
            document.getElementById('categoryChartContainer').style.display = 'none';
        }
        
    }

    getCategoryIcon(category) {
        const icons = {
            '交通': '🚗',
            '住宿': '🏨',
            '餐饮': '🍽️',
            '景点': '🎫',
            '购物': '🛍️',
            '其他': '📦'
        };
        return icons[category] || '💰';
    }

    /**
     * 绘制分类统计饼图
     */
    drawCategoryChart(categoryData) {
        const container = document.getElementById('categoryChartContainer');
        const canvas = document.getElementById('categoryChart');
        
        // 显示容器
        container.style.display = 'block';
        
        // 销毁旧图表
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }
        
        // 准备数据
        const labels = Object.keys(categoryData).map(cat => `${this.getCategoryIcon(cat)} ${cat}`);
        const data = Object.values(categoryData);
        const colors = [
            '#FF6384', // 粉红
            '#36A2EB', // 蓝色
            '#FFCE56', // 黄色
            '#4BC0C0', // 青色
            '#9966FF', // 紫色
            '#FF9F40'  // 橙色
        ];
        
        // 创建图表
        const ctx = canvas.getContext('2d');
        this.categoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 14
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ¥${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 删除费用记录
     */
    async deleteExpense(expenseId) {
        if (!confirm('确定要删除这条费用记录吗？')) {
            return;
        }

        try {
            showLoading('删除中...');
            await api.deleteExpense(expenseId);
            showMessage('success', '删除成功');
            await this.loadExpenses();
        } catch (error) {
            console.error('删除费用错误:', error);
            showMessage('error', error.message || '删除失败');
        } finally {
            hideLoading();
        }
    }

    /**
     * 编辑费用记录
     */
    editExpense(expenseId) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (!expense) {
            showMessage('error', '未找到该费用记录');
            return;
        }

        // 填充表单
        document.getElementById('expenseCategory').value = expense.category;
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expenseDescription').value = expense.description || '';
        
        // 设置编辑状态
        this.editingExpenseId = expenseId;
        
        // 修改按钮文本
        const submitBtn = document.querySelector('#expenseForm button[type="submit"]');
        submitBtn.textContent = '更新费用记录';
        submitBtn.classList.add('btn-secondary');
        
        // 添加取消按钮
        if (!document.getElementById('cancelEditBtn')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'cancelEditBtn';
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.textContent = '取消编辑';
            cancelBtn.style.marginLeft = '10px';
            cancelBtn.onclick = () => this.cancelEdit();
            submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
        }
        
        // 滚动到表单
        document.querySelector('.expense-add-section').scrollIntoView({ behavior: 'smooth' });
        showMessage('info', '正在编辑费用记录');
    }

    /**
     * 取消编辑
     */
    cancelEdit() {
        this.editingExpenseId = null;
        
        // 清空表单
        document.getElementById('expenseForm').reset();
        
        // 恢复按钮
        const submitBtn = document.querySelector('#expenseForm button[type="submit"]');
        submitBtn.textContent = '添加费用记录';
        submitBtn.classList.remove('btn-secondary');
        
        // 移除取消按钮
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) {
            cancelBtn.remove();
        }
    }

    /**
     * 更新费用记录
     */
    async updateExpense(expenseId, formData) {
        try {
            showLoading('更新中...');

            const expenseData = {
                category: formData.category,
                amount: parseFloat(formData.amount),
                description: formData.description || ''
            };

            await api.updateExpense(expenseId, expenseData);
            showMessage('success', '费用记录更新成功');
            
            // 取消编辑状态
            this.cancelEdit();
            
            // 刷新列表
            await this.loadExpenses();
        } catch (error) {
            console.error('更新费用错误:', error);
            showMessage('error', error.message || '更新失败');
        } finally {
            hideLoading();
        }
    }
}

// 创建全局费用管理实例
const expenseManager = new ExpenseManager();

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 费用表单提交
    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!auth.isLoggedIn()) {
            showMessage('warning', '请先登录');
            auth.showAuthModal(true);
            return;
        }

        const formData = {
            category: document.getElementById('expenseCategory').value,
            amount: document.getElementById('expenseAmount').value,
            description: document.getElementById('expenseDescription').value
        };

        expenseManager.addExpense(formData);
    });
});

