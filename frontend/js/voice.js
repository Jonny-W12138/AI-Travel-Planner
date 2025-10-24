/**
 * 语音识别模块
 */

class VoiceRecognizer {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.addEventListener('dataavailable', (event) => {
                this.audioChunks.push(event.data);
            });

            this.mediaRecorder.addEventListener('stop', async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                await this.processAudio(audioBlob);
            });

            this.mediaRecorder.start();
            this.isRecording = true;
            this.updateUI(true);
        } catch (error) {
            console.error('无法访问麦克风:', error);
            showMessage('error', '无法访问麦克风，请检查权限设置');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.updateUI(false);
            
            // 停止所有音频轨道
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    updateUI(isRecording) {
        const startBtn = document.getElementById('startRecording');
        const stopBtn = document.getElementById('stopRecording');
        const status = document.getElementById('voiceStatus');

        if (isRecording) {
            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            status.textContent = '🎤 正在录音...';
            status.className = 'voice-status recording';
        } else {
            startBtn.classList.remove('hidden');
            stopBtn.classList.add('hidden');
            status.textContent = '';
            status.className = 'voice-status';
        }
    }

    async processAudio(audioBlob) {
        try {
            showLoading('正在识别语音...');
            
            // 创建文件对象
            const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
            
            // 调用语音识别 API
            const result = await api.recognizeVoice(audioFile);
            
            if (result && result.text) {
                this.displayRecognizedText(result.text);
                
                // 使用 AI 解析语音内容
                await this.parseQuery(result.text);
            } else {
                showMessage('error', '语音识别失败，请重试');
            }
        } catch (error) {
            console.error('语音识别错误:', error);
            showMessage('error', error.message || '语音识别失败');
        } finally {
            hideLoading();
        }
    }

    displayRecognizedText(text) {
        const recognizedText = document.getElementById('recognizedText');
        recognizedText.textContent = `识别结果：${text}`;
    }

    async parseQuery(text) {
        try {
            const result = await api.parseVoiceQuery(text);
            
            if (result.query_type === 'travel_plan') {
                // 自动填充旅行规划表单
                this.fillTravelForm(result);
            } else if (result.query_type === 'expense') {
                // 自动填充费用表单
                this.fillExpenseForm(result);
            } else {
                // 只显示识别结果
                showMessage('info', '语音识别成功，请手动填写表单');
            }
        } catch (error) {
            console.error('解析语音查询错误:', error);
        }
    }

    fillTravelForm(data) {
        if (data.destination) {
            document.getElementById('destination').value = data.destination;
        }
        if (data.budget) {
            document.getElementById('budget').value = data.budget;
        }
        if (data.travelers_count) {
            document.getElementById('travelersCount').value = data.travelers_count;
        }
        if (data.preferences) {
            document.getElementById('preferences').value = data.preferences;
        }
        
        showMessage('success', '已自动填充表单，请补充完整信息');
    }

    fillExpenseForm(data) {
        // 切换到费用管理页面
        showSection('expenses');
        
        if (data.category) {
            document.getElementById('expenseCategory').value = data.category;
        }
        if (data.amount) {
            document.getElementById('expenseAmount').value = data.amount;
        }
        if (data.description) {
            document.getElementById('expenseDescription').value = data.description;
        }
        
        showMessage('success', '已自动填充费用表单');
    }
}

// 创建全局语音识别实例
const voiceRecognizer = new VoiceRecognizer();

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 开始录音
    document.getElementById('startRecording').addEventListener('click', () => {
        if (auth.requireAuth(() => voiceRecognizer.startRecording())) {
            // 认证通过，录音已开始
        }
    });

    // 停止录音
    document.getElementById('stopRecording').addEventListener('click', () => {
        voiceRecognizer.stopRecording();
    });

    // 语音记录费用
    const voiceExpenseBtn = document.getElementById('voiceExpenseBtn');
    if (voiceExpenseBtn) {
        voiceExpenseBtn.addEventListener('click', async () => {
            if (!auth.isLoggedIn()) {
                showMessage('warning', '请先登录');
                auth.showAuthModal(true);
                return;
            }

            // 简化版：直接提示用户
            showMessage('info', '请点击页面顶部的录音按钮，说出费用信息');
        });
    }
});

