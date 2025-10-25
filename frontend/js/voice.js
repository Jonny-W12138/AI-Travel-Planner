/**
 * 语音识别模块
 */

class VoiceRecognizer {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordingContext = 'travel'; // 'travel' 或 'expense'，表示录音上下文
    }

    async startRecording() {
        try {
            // 检查浏览器是否支持 getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const protocol = window.location.protocol;
                const hostname = window.location.hostname;
                
                console.error('❌ 浏览器不支持 getUserMedia API');
                console.error('   当前协议:', protocol);
                console.error('   当前域名:', hostname);
                
                let errorMsg = '您的浏览器不支持语音录音功能。';
                
                if (protocol === 'http:' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
                    errorMsg = '⚠️ 语音功能需要 HTTPS 或 localhost 访问！\n' +
                              '当前使用的是 HTTP，请使用以下方式访问：\n' +
                              '• http://localhost:8000\n' +
                              '• http://127.0.0.1:8000\n' +
                              '或配置 HTTPS 证书';
                } else {
                    errorMsg = '您的浏览器版本可能过旧，请更新到最新版本。';
                }
                
                showMessage('error', errorMsg);
                return;
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // 检测浏览器和支持的格式
            console.log('🌐 浏览器信息:', navigator.userAgent);
            console.log('🎤 检测音频格式支持:');
            console.log('   webm/opus:', MediaRecorder.isTypeSupported('audio/webm;codecs=opus'));
            console.log('   webm:', MediaRecorder.isTypeSupported('audio/webm'));
            console.log('   ogg/opus:', MediaRecorder.isTypeSupported('audio/ogg;codecs=opus'));
            
            // 选择阿里云支持的音频格式
            // 阿里云更好地支持 ogg/opus 格式，优先使用
            let options;
            if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                options = { mimeType: 'audio/ogg;codecs=opus' };
                console.log('✅ 使用 ogg/opus 格式（阿里云推荐）');
            } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = { mimeType: 'audio/webm;codecs=opus' };
                console.log('✅ 使用 webm/opus 格式');
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/webm' };
                console.log('✅ 使用 webm 格式');
            } else {
                // Safari 或不支持的浏览器
                console.warn('⚠️ 浏览器不支持 opus 编码格式');
                showMessage('warning', '您的浏览器可能不完全支持语音识别，建议使用 Chrome、Edge 或 Firefox 浏览器');
                options = {};
            }
            
            this.mediaRecorder = new MediaRecorder(stream, options);
            this.audioChunks = [];
            
            console.log('🎤 实际录音格式:', this.mediaRecorder.mimeType);
            
            // 如果实际格式不是 webm 或 ogg，给出警告
            if (!this.mediaRecorder.mimeType.includes('webm') && 
                !this.mediaRecorder.mimeType.includes('ogg')) {
                console.error('❌ 警告：录音格式不兼容，语音识别可能失败');
                console.error('   当前格式:', this.mediaRecorder.mimeType);
                console.error('   需要格式: webm 或 ogg');
                showMessage('error', '您的浏览器不支持所需的音频格式，请使用 Chrome、Edge 或 Firefox 浏览器');
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            
            // 检查格式兼容性
            if (this.mediaRecorder.mimeType.includes('webm')) {
                console.warn('⚠️ 检测到 webm 格式');
                console.log('   后端将自动转换为阿里云兼容的 ogg/opus 格式');
            } else if (this.mediaRecorder.mimeType.includes('ogg')) {
                console.log('✅ 使用 OGG 格式，与阿里云原生兼容');
            }
            
            console.log('💡 后端支持自动格式转换，所有主流浏览器均可使用');

            this.mediaRecorder.addEventListener('dataavailable', (event) => {
                this.audioChunks.push(event.data);
            });

            this.mediaRecorder.addEventListener('stop', async () => {
                // 使用实际的录音格式
                const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
                await this.processAudio(audioBlob);
            });

            this.mediaRecorder.start();
            this.isRecording = true;
            this.updateUI(true);
            
            // 提示用户
            showMessage('info', '📢 开始录音，请清晰说话（建议录音3-5秒）');
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
            
            // 提示用户正在处理
            showMessage('info', '⏹️ 录音已停止，正在识别...');
        }
    }

    updateUI(isRecording) {
        const startBtn = document.getElementById('startRecording');
        const stopBtn = document.getElementById('stopRecording');
        const status = document.getElementById('voiceStatus');
        const voiceExpenseBtn = document.getElementById('voiceExpenseBtn');

        if (isRecording) {
            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            status.textContent = '🎤 正在录音...';
            status.className = 'voice-status recording';
            
            // 更新费用记录按钮
            if (voiceExpenseBtn) {
                voiceExpenseBtn.textContent = '⏹️ 停止录音';
                voiceExpenseBtn.classList.add('recording');
            }
        } else {
            startBtn.classList.remove('hidden');
            stopBtn.classList.add('hidden');
            status.textContent = '';
            status.className = 'voice-status';
            
            // 恢复费用记录按钮
            if (voiceExpenseBtn) {
                voiceExpenseBtn.textContent = '🎤 语音记录开销';
                voiceExpenseBtn.classList.remove('recording');
            }
        }
    }

    async processAudio(audioBlob) {
        try {
            showLoading('正在识别语音...');
            
            console.log('🎤 开始处理音频，大小:', audioBlob.size, '字节');
            console.log('🎤 音频类型:', audioBlob.type);
            
            // 创建文件对象 - 使用原始的 Blob 类型
            // 文件名根据类型自动设置
            let fileName = 'recording.webm';
            if (audioBlob.type.includes('ogg')) {
                fileName = 'recording.ogg';
            } else if (audioBlob.type.includes('wav')) {
                fileName = 'recording.wav';
            }
            
            const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });
            console.log('📤 准备上传音频文件，格式:', audioFile.type);
            
            // 调用语音识别 API
            const result = await api.recognizeVoice(audioFile);
            console.log('✅ 语音识别API返回:', result);
            
            if (result && result.text) {
                // this.displayRecognizedText(result.text);
                
                // 使用 AI 解析语音内容
                await this.parseQuery(result.text);
            } else {
                showMessage('error', '语音识别失败，请重试');
            }
        } catch (error) {
            console.error('❌ 语音识别错误:', error);
            showMessage('error', error.message || '语音识别失败');
        } finally {
            hideLoading();
        }
    }

    // displayRecognizedText(text) {
    //     const recognizedText = document.getElementById('recognizedText');
    //     recognizedText.textContent = `识别结果：${text}`;
    // }

    async parseQuery(text) {
        try {
            console.log('🔍 开始解析语音查询:', text);
            console.log('📌 当前录音上下文:', this.recordingContext);
            
            const result = await api.parseVoiceQuery(text);
            console.log('✅ 语音查询解析结果:', result);
            
            // 根据录音上下文决定如何处理
            if (this.recordingContext === 'expense') {
                // 费用记录模式：直接填充费用表单
                this.fillExpenseForm(result);
            } else if (this.recordingContext === 'travel') {
                // 旅行规划模式：根据 AI 判断的类型填充
                if (result.query_type === 'expense') {
                    this.fillExpenseForm(result);
                } else {
                    this.fillTravelForm(result);
                }
            } else {
                // 默认情况
                if (result.query_type === 'travel_plan') {
                    this.fillTravelForm(result);
                } else if (result.query_type === 'expense') {
                    this.fillExpenseForm(result);
                } else {
                    showMessage('info', '语音识别成功，请手动填写表单');
                }
            }
            
            // 重置上下文为默认值
            this.recordingContext = 'travel';
        } catch (error) {
            console.error('❌ 解析语音查询错误:', error);
            showMessage('warning', '语音识别成功，但自动填充失败，请手动填写表单');
            // 重置上下文
            this.recordingContext = 'travel';
        }
    }

    fillTravelForm(data) {
        console.log('📝 填充旅行表单，数据:', data);
        
        let filled = false;
        
        if (data.destination) {
            document.getElementById('destination').value = data.destination;
            console.log('✅ 已填充目的地:', data.destination);
            filled = true;
        }
        
        if (data.start_date) {
            document.getElementById('startDate').value = data.start_date;
            console.log('✅ 已填充出发日期:', data.start_date);
            filled = true;
        }
        
        if (data.end_date) {
            document.getElementById('endDate').value = data.end_date;
            console.log('✅ 已填充结束日期:', data.end_date);
            filled = true;
        }
        
        if (data.budget) {
            document.getElementById('budget').value = data.budget;
            console.log('✅ 已填充预算:', data.budget);
            filled = true;
        }
        
        if (data.travelers_count) {
            document.getElementById('travelersCount').value = data.travelers_count;
            console.log('✅ 已填充人数:', data.travelers_count);
            filled = true;
        }
        
        if (data.preferences) {
            document.getElementById('preferences').value = data.preferences;
            console.log('✅ 已填充偏好:', data.preferences);
            filled = true;
        }
        
        if (filled) {
            // 构建识别结果摘要
            let summary = '✅ 语音识别成功！\n\n识别结果：\n';
            if (data.destination) summary += `• 目的地：${data.destination}\n`;
            if (data.start_date) summary += `• 出发日期：${data.start_date}\n`;
            if (data.end_date) summary += `• 结束日期：${data.end_date}\n`;
            if (data.budget) summary += `• 预算：¥${data.budget}\n`;
            if (data.travelers_count) summary += `• 人数：${data.travelers_count}人\n`;
            if (data.preferences) summary += `• 偏好：${data.preferences}\n`;
            summary += '\n请确认并补充完整信息后点击"生成计划"';
            
            console.log('✅ 表单填充完成');
            showMessage('success', summary);
            
            // 滚动到"生成计划"按钮位置
            const generateButton = document.querySelector('#createPlanForm button[type="submit"]');
            if (generateButton) {
                setTimeout(() => {
                    generateButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // 添加高亮效果
                    generateButton.style.animation = 'pulse 2s ease-in-out 3';
                }, 200);
            }
        } else {
            showMessage('warning', '语音识别成功，但未能提取到旅行信息，请手动填写');
        }
    }

    fillExpenseForm(data) {
        console.log('💰 填充费用表单，数据:', data);
        
        // 检查当前是否在费用管理页面
        const expensesSection = document.getElementById('expenses');
        const isOnExpensePage = expensesSection && !expensesSection.classList.contains('hidden');
        
        if (!isOnExpensePage) {
            console.log('📄 切换到费用管理页面');
            showSection('expenses');
        }
        
        // 使用 setTimeout 确保页面切换完成后再填充（即使在当前页面也延迟一下，确保 DOM 就绪）
        setTimeout(() => {
            let filled = false;
            
            if (data.category) {
                const categorySelect = document.getElementById('expenseCategory');
                if (categorySelect) {
                    // 尝试匹配类别
                    const categories = ['交通', '住宿', '餐饮', '景点', '购物', '其他'];
                    const matchedCategory = categories.find(cat => 
                        data.category.includes(cat) || cat.includes(data.category)
                    );
                    categorySelect.value = matchedCategory || '其他';
                    console.log('✅ 已填充类别:', categorySelect.value);
                    filled = true;
                } else {
                    console.error('❌ 找不到类别选择框');
                }
            }
            
            if (data.amount) {
                const amountInput = document.getElementById('expenseAmount');
                if (amountInput) {
                    amountInput.value = data.amount;
                    console.log('✅ 已填充金额:', data.amount);
                    filled = true;
                } else {
                    console.error('❌ 找不到金额输入框');
                }
            }
            
            if (data.description) {
                const descInput = document.getElementById('expenseDescription');
                if (descInput) {
                    descInput.value = data.description;
                    console.log('✅ 已填充描述:', data.description);
                    filled = true;
                } else {
                    console.error('❌ 找不到描述输入框');
                }
            }
            
            if (filled) {
                // 构建识别结果摘要
                let summary = '✅ 语音识别成功！\n\n识别结果：\n';
                if (data.category) summary += `• 类别：${data.category}\n`;
                if (data.amount) summary += `• 金额：¥${data.amount}\n`;
                if (data.description) summary += `• 描述：${data.description}\n`;
                summary += '\n请确认信息无误后点击"添加开销"按钮';
                
                console.log('✅ 表单填充完成');
                showMessage('success', summary);
                
                // 滚动到"添加开销"按钮位置
                const addButton = document.querySelector('#expenses button[type="submit"]');
                if (addButton) {
                    setTimeout(() => {
                        addButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // 添加高亮效果
                        addButton.style.animation = 'pulse 2s ease-in-out 3';
                    }, 200);
                }
            } else {
                console.warn('⚠️ 没有可填充的字段');
                showMessage('warning', '语音识别成功，但未能提取到费用信息，请手动填写');
            }
        }, 100);
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

            // 如果正在录音，停止录音
            if (voiceRecognizer.isRecording) {
                console.log('⏹️ 停止费用记录的语音识别');
                voiceRecognizer.stopRecording();
                return;
            }

            // 设置录音上下文为费用记录
            voiceRecognizer.recordingContext = 'expense';
            console.log('💰 开始费用记录模式的语音识别');
            
            // 直接开始录音
            await voiceRecognizer.startRecording();
            
            // 提示用户
            showMessage('info', '请说出费用信息，例如："交通费200元"或"今天吃饭花了50"');
        });
    }
});

