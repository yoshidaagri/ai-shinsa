// AI審査員システム - メインスクリプト

class AIJudgeApp {
    constructor() {
        this.selectedJudges = new Set();
        this.uploadedFiles = {
            slide: null,
            audio: null
        };
        this.apiKey = getLocalConfig().apiKey || '';
        this.analysisResults = {};
        
        // ユーティリティクラスの初期化
        this.fileHandler = new FileHandler();
        this.uiController = new UIController();
        this.judgeSelector = new JudgeSelector();
        this.voiceController = null; // APIキー設定後に初期化
        this.animationController = new AnimationController();
        this.historyManager = new HistoryManager();
        
        // 録音関連
        this.mediaRecorder = null;
        this.recordingChunks = [];
        this.recordingTimer = null;
        this.recordingStartTime = 0;
        
        // 比較表示関連
        this.isComparisonMode = false;
        
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.loadSavedApiKey();
        this.updateAnalysisButton();
    }

    setupEventListeners() {
        // API Key設定
        document.getElementById('saveApiKey').addEventListener('click', () => {
            this.saveApiKey();
        });

        // 審査員選択のコールバック設定
        this.judgeSelector.setSelectionChangeCallback((selectedJudges) => {
            this.selectedJudges = new Set(selectedJudges);
            this.updateAnalysisButton();
        });

        // ファイルアップロード
        this.setupFileUpload();

        // 分析開始
        document.getElementById('startAnalysis').addEventListener('click', () => {
            this.startAnalysis();
        });

        // 結果操作
        document.getElementById('exportResults').addEventListener('click', () => {
            this.exportResults();
        });

        document.getElementById('reAnalysis').addEventListener('click', () => {
            this.reAnalysis();
        });

        // 録音機能
        document.getElementById('recordBtn').addEventListener('click', () => {
            this.startRecording();
        });

        document.getElementById('stopRecordBtn').addEventListener('click', () => {
            this.stopRecording();
        });

        // 比較表示モード
        document.getElementById('toggleCompareMode').addEventListener('click', () => {
            this.toggleComparisonMode();
        });

        // 履歴表示
        document.getElementById('showHistory').addEventListener('click', () => {
            this.showHistoryDialog();
        });
    }

    loadSavedApiKey() {
        const apiKeyInput = document.getElementById('apiKey');
        if (this.apiKey) {
            apiKeyInput.value = this.apiKey;
            apiKeyInput.type = 'text';
            setTimeout(() => {
                apiKeyInput.type = 'password';
            }, 1000);
            
            // APIキーが設定済みの場合はVoiceControllerを自動初期化
            this.voiceController = new VoiceController(this.apiKey);
            this.uiController.showSuccess('APIキーを読み込みました');
        }
    }

    saveApiKey() {
        const apiKeyInput = document.getElementById('apiKey');
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            alert('APIキーを入力してください');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            alert('有効なOpenAI APIキーを入力してください（sk-で始まる）');
            return;
        }

        this.apiKey = apiKey;
        localStorage.setItem('openai_api_key', apiKey);
        
        // VoiceControllerの初期化
        this.voiceController = new VoiceController(apiKey);
        
        // グローバルアクセス用の設定
        if (window.app) {
            window.app.voiceController = this.voiceController;
        }
        
        // 成功フィードバック
        this.uiController.showSuccess('APIキーが保存されました');
        const button = document.getElementById('saveApiKey');
        this.uiController.updateButtonState(button, 'success', '保存済み ✓');
        
        setTimeout(() => {
            this.uiController.updateButtonState(button, 'normal');
        }, 2000);

        this.updateAnalysisButton();
    }

    toggleJudgeSelection(card) {
        if (!card || !card.dataset) {
            console.warn('無効な審査員カードが渡されました');
            return;
        }
        
        const judgeType = card.dataset.judge;
        
        if (this.selectedJudges.has(judgeType)) {
            this.selectedJudges.delete(judgeType);
            card.classList.remove('selected');
        } else {
            this.selectedJudges.add(judgeType);
            card.classList.add('selected');
        }
        
        this.updateAnalysisButton();
    }

    setupFileUpload() {
        // スライドファイル
        const slideFile = document.getElementById('slideFile');
        const slideUpload = document.getElementById('slideUpload');
        
        slideFile.addEventListener('change', async (e) => {
            if (e.target.files[0]) {
                await this.handleFileUpload(e.target.files[0], 'slide');
            }
        });

        this.fileHandler.setupDragAndDrop(slideUpload, (processedFile) => {
            this.uploadedFiles.slide = processedFile.file || processedFile;
            this.displayFilePreview(processedFile, 'slide');
            this.updateAnalysisButton();
        }, 'slide');

        // 音声ファイル
        const audioFile = document.getElementById('audioFile');
        const audioUpload = document.getElementById('audioUpload');
        
        audioFile.addEventListener('change', async (e) => {
            if (e.target.files[0]) {
                await this.handleFileUpload(e.target.files[0], 'audio');
            }
        });

        this.fileHandler.setupDragAndDrop(audioUpload, (processedFile) => {
            this.uploadedFiles.audio = processedFile.file || processedFile;
            this.displayFilePreview(processedFile, 'audio');
            this.updateAnalysisButton();
        }, 'audio');
    }

    setupDragAndDrop(element, type) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('drag-over');
        });

        element.addEventListener('dragleave', () => {
            element.classList.remove('drag-over');
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0], type);
            }
        });
    }

    async handleFileUpload(file, type) {
        if (!file) return;

        try {
            const processedFile = await this.fileHandler.prepareFileForAPI(file, type);
            this.uploadedFiles[type] = processedFile.file || file;
            this.displayFilePreview(processedFile, type);
            this.updateAnalysisButton();
            this.uiController.showSuccess(`${type === 'slide' ? 'スライド' : 'ピッチ音声'}ファイルがアップロードされました`);
        } catch (error) {
            this.uiController.showError(error.message);
        }
    }

    displayFilePreview(processedFile, type) {
        const previewArea = document.getElementById(`${type}Preview`);
        const previewContent = previewArea.querySelector('.preview-content');
        
        if (!previewContent) {
            previewArea.querySelector('.audio-player');
        }
        
        const html = this.fileHandler.generatePreviewHTML(processedFile);
        if (type === 'audio') {
            const audioPlayer = previewArea.querySelector('.audio-player');
            if (audioPlayer && processedFile.preview) {
                audioPlayer.src = processedFile.preview.src;
                audioPlayer.style.display = 'block';
            }
        } else {
            previewArea.innerHTML = `<h4>プレビュー</h4>${html}`;
        }
        
        previewArea.style.display = 'block';
    }

    updateAnalysisButton() {
        const button = document.getElementById('startAnalysis');
        const hasApiKey = this.apiKey.length > 0;
        const hasJudges = this.judgeSelector.getSelectionCount() > 0;
        const hasSlide = this.uploadedFiles.slide;
        const hasAudio = this.uploadedFiles.audio;
        const hasAnyFile = hasSlide || hasAudio;
        
        button.disabled = !(hasApiKey && hasJudges && hasAnyFile);
        
        if (button.disabled) {
            let message = '分析開始';
            if (!hasApiKey) message += ' (APIキーが必要)';
            else if (!hasJudges) message += ' (審査員を選択)';
            else if (!hasAnyFile) message += ' (スライドまたはピッチ音声をアップロード)';
            button.innerHTML = `<span class="btn-icon">🚀</span>${message}`;
        } else {
            // ファイルの状況に応じてメッセージを調整
            let analysisType = '';
            if (hasSlide && hasAudio) {
                analysisType = '総合分析開始';
            } else if (hasSlide) {
                analysisType = 'スライド分析開始';
            } else if (hasAudio) {
                analysisType = '音声分析開始';
            }
            button.innerHTML = `<span class="btn-icon">🚀</span>${analysisType}`;
        }
    }

    // 総ステップ数を計算
    calculateTotalSteps(selectedJudges) {
        let steps = 1; // 1. 分析開始
        
        // ファイル分析ステップ
        if (this.uploadedFiles.audio) steps++; // 2. 音声解析
        if (this.uploadedFiles.slide) steps++; // 3. スライド解析
        
        // 審査員評価ステップ
        steps += selectedJudges.length; // 各審査員の評価
        
        steps++; // 最後の結果表示
        
        return steps;
    }

    async startAnalysis() {
        console.log('🚀 分析開始:', {
            hasApiKey: !!this.apiKey,
            selectedJudges: Array.from(this.selectedJudges),
            hasSlide: !!this.uploadedFiles.slide,
            hasAudio: !!this.uploadedFiles.audio
        });
        
        // 進捗計算の準備
        const selectedJudges = this.judgeSelector.getSelectedJudges();
        const totalSteps = this.calculateTotalSteps(selectedJudges);
        let currentStep = 0;
        
        this.uiController.showLoadingWithProgress('分析を開始中...', ++currentStep, totalSteps);
        
        try {
            // APIクライアントの初期化
            const apiClient = new OpenAIClient(this.apiKey);
            
            // APIキーの基本的な妥当性チェック
            if (!this.apiKey.startsWith('sk-')) {
                throw new Error('無効なAPIキー形式です。OpenAI APIキーは "sk-" で始まる必要があります。');
            }
            
            console.log('📋 選択された審査員:', selectedJudges);
            
            // 利用可能なファイルのみを分析
            const analysisPromises = [];
            let audioAnalysis = null;
            let slideAnalysis = null;
            
            if (this.uploadedFiles.audio) {
                this.uiController.showLoadingWithProgress('音声ファイルを解析中...', ++currentStep, totalSteps);
                console.log('🎵 音声ファイル分析開始:', this.uploadedFiles.audio.name);
                analysisPromises.push(this.analyzeAudio(apiClient));
            }
            
            if (this.uploadedFiles.slide) {
                this.uiController.showLoadingWithProgress('スライドファイルを解析中...', ++currentStep, totalSteps);
                console.log('📄 スライドファイル分析開始:', this.uploadedFiles.slide.name);
                analysisPromises.push(this.analyzeSlide(apiClient));
            }
            
            const analyses = await Promise.all(analysisPromises);
            console.log('📊 ファイル分析完了:', analyses);
            
            // 結果を適切に割り当て
            let resultIndex = 0;
            if (this.uploadedFiles.audio) {
                audioAnalysis = analyses[resultIndex++];
                console.log('🎵 音声分析結果:', audioAnalysis);
            }
            if (this.uploadedFiles.slide) {
                slideAnalysis = analyses[resultIndex++];
                console.log('📄 スライド分析結果:', slideAnalysis);
            }
            
            // 各審査員による評価生成（進捗付き）
            const judgeResults = [];
            
            for (const [index, judgeType] of selectedJudges.entries()) {
                console.log(`👩‍⚖️ ${judgeType} 評価開始`);
                this.uiController.showLoadingWithProgress(`${JUDGE_PERSONALITIES[judgeType].name}が評価中...`, ++currentStep, totalSteps);
                const result = await this.generateJudgeEvaluation(apiClient, judgeType, audioAnalysis, slideAnalysis);
                
                console.log(`✅ ${judgeType} 評価完了:`, result);
                judgeResults.push(result);
            }
            
            // 結果の保存と表示
            this.uiController.showLoadingWithProgress('結果を表示中...', ++currentStep, totalSteps);
            this.analysisResults = {};
            judgeResults.forEach((result, index) => {
                const judgeType = selectedJudges[index];
                this.analysisResults[judgeType] = result;
            });

            console.log('🎯 全体の分析結果:', this.analysisResults);
            this.displayResults();
            
            // 履歴に保存
            this.saveToHistory();
            
            this.uiController.hideLoading();
            this.uiController.showSuccess('分析が完了しました！');
            
        } catch (error) {
            console.error('❌ 分析エラー:', error);
            console.error('エラースタック:', error.stack);
            
            this.uiController.hideLoading();
            
            let errorMessage = '分析中にエラーが発生しました。';
            
            if (error.message.includes('API key')) {
                errorMessage = 'APIキーに問題があります。正しいOpenAI APIキーを設定してください。';
            } else if (error.message.includes('quota')) {
                errorMessage = 'APIの利用制限に達しています。しばらく待ってから再試行してください。';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
            } else if (error.message.includes('audio') || error.message.includes('transcription')) {
                errorMessage = '音声ファイルの処理に失敗しました。ファイル形式を確認してください。';
            }
            
            this.uiController.showError(`${errorMessage}\n\n詳細: ${error.message}`);
        }
    }

    async analyzeAudio(apiClient) {
        if (!this.uploadedFiles.audio) {
            console.log('❌ 音声ファイルがありません');
            return null;
        }
        
        console.log('🎵 音声分析開始:', {
            fileName: this.uploadedFiles.audio.name,
            fileSize: this.uploadedFiles.audio.size,
            fileType: this.uploadedFiles.audio.type
        });
        
        try {
            console.log('📡 Whisper API呼び出し開始...');
            const transcription = await apiClient.transcribeAudio(this.uploadedFiles.audio);
            
            console.log('✅ Whisper API呼び出し成功:', {
                textLength: transcription.text.length,
                firstChars: transcription.text.substring(0, 100) + '...'
            });
            
            const result = {
                transcription: transcription.text,
                summary: transcription.text.length > 500 ? 
                    transcription.text.substring(0, 500) + '...' : 
                    transcription.text
            };
            
            console.log('🎯 音声分析結果:', result);
            return result;
        } catch (error) {
            console.error('❌ 音声分析エラー:', error);
            console.error('エラー詳細:', {
                message: error.message,
                status: error.status,
                stack: error.stack
            });
            
            // APIエラーの詳細なログ
            if (error.status) {
                console.error(`HTTP ${error.status}エラー:`, error);
            }
            
            return { 
                transcription: '', 
                summary: `音声分析に失敗しました: ${error.message}`,
                error: true
            };
        }
    }

    async analyzeSlide(apiClient) {
        if (!this.uploadedFiles.slide) return null;
        
        try {
            const analysis = await apiClient.analyzeSlide(this.uploadedFiles.slide);
            return analysis;
        } catch (error) {
            console.error('スライド分析エラー:', error);
            return { analysis: 'スライド分析に失敗しました' };
        }
    }

    async generateJudgeEvaluationStreaming(apiClient, judgeType, audioAnalysis, slideAnalysis) {
        const personality = JUDGE_PERSONALITIES[judgeType];
        const prompt = this.createEvaluationPrompt(personality, audioAnalysis, slideAnalysis);
        
        try {
            // ストリーミング結果表示エリアを準備
            this.prepareStreamingDisplay(judgeType);
            
            const evaluation = await apiClient.generateEvaluation(prompt, true, (chunk) => {
                this.updateStreamingDisplay(judgeType, chunk);
            });
            
            return {
                judgeType,
                personality,
                evaluation,
                audioAnalysis,
                slideAnalysis
            };
        } catch (error) {
            console.error(`${judgeType}評価生成エラー:`, error);
            
            let errorDetails = error.message || '不明なエラー';
            if (error.status) {
                errorDetails = `HTTP ${error.status}: ${errorDetails}`;
            }
            
            // ストリーミング表示エリアにエラーを表示
            this.updateStreamingDisplay(judgeType, `\n\n❌ 評価生成エラー\n${errorDetails}\n\n💡 対処方法:\n- APIキーが正しく設定されているか確認\n- しばらく待ってから再試行\n- ネットワーク接続を確認`);
            
            return {
                judgeType,
                personality,
                evaluation: `評価生成に失敗しました。\n\nエラー詳細: ${errorDetails}\n\n※APIキーの確認や、しばらく待ってから再試行してください。`,
                audioAnalysis,
                slideAnalysis
            };
        }
    }

    // シンプルな評価生成（ストリーミングなし）
    async generateJudgeEvaluation(apiClient, judgeType, audioAnalysis, slideAnalysis) {
        const personality = JUDGE_PERSONALITIES[judgeType];
        const prompt = this.createEvaluationPrompt(personality, audioAnalysis, slideAnalysis);
        
        try {
            console.log(`📝 ${judgeType} の評価生成開始`);
            const evaluation = await apiClient.generateEvaluation(prompt, false); // ストリーミングオフ
            console.log(`✅ ${judgeType} の評価生成成功`);
            
            return {
                judgeType,
                personality,
                evaluation,
                audioAnalysis,
                slideAnalysis
            };
        } catch (error) {
            console.error(`❌ ${judgeType}評価生成エラー:`, error);
            
            let errorDetails = error.message || '不明なエラー';
            if (error.status) {
                errorDetails = `HTTP ${error.status}: ${errorDetails}`;
            }
            
            return {
                judgeType,
                personality,
                evaluation: `評価生成に失敗しました。\n\nエラー詳細: ${errorDetails}\n\n※APIキーの確認や、しばらく待ってから再試行してください。`,
                audioAnalysis,
                slideAnalysis,
                error: true
            };
        }
    }

    createEvaluationPrompt(personality, audioAnalysis, slideAnalysis) {
        const template = PROMPTS.evaluation(personality);
        
        // 利用可能なデータに基づいてプロンプトを調整
        let slideInfo = 'スライド情報なし';
        let audioInfo = '音声情報なし';
        let analysisNote = '';
        
        if (slideAnalysis?.analysis) {
            slideInfo = slideAnalysis.analysis;
        }
        
        if (audioAnalysis?.transcription) {
            audioInfo = audioAnalysis.transcription;
        }
        
        // 片方のデータがない場合の注意書きを追加
        if (!slideAnalysis && audioAnalysis) {
            analysisNote = '\n\n【注意】スライド資料が提供されていないため、音声内容のみに基づいて評価を行います。';
        } else if (slideAnalysis && !audioAnalysis) {
            analysisNote = '\n\n【注意】ピッチ音声が提供されていないため、スライド内容のみに基づいて評価を行います。';
        }
        
        return template
            .replace('{slideAnalysis}', slideInfo)
            .replace('{audioAnalysis}', audioInfo) + analysisNote;
    }

    // ストリーミング表示の準備
    prepareStreamingDisplay(judgeType) {
        console.log(`📺 ストリーミング表示準備: ${judgeType}`);
        
        const resultsSection = document.getElementById('results');
        const tabButtons = document.getElementById('tabButtons');
        const tabContent = document.getElementById('tabContent');
        
        if (!resultsSection || !tabButtons || !tabContent) {
            console.error('❌ 必要な要素が見つかりません:', {
                resultsSection: !!resultsSection,
                tabButtons: !!tabButtons,
                tabContent: !!tabContent
            });
            return;
        }
        
        // 結果セクションを表示
        if (resultsSection.style.display === 'none') {
            resultsSection.style.display = 'block';
            this.uiController.scrollToElement(resultsSection, 100);
        }
        
        // 既存のタブボタンとコンテンツをチェック
        let tabButton = document.querySelector(`[data-judge="${judgeType}"]`);
        let tabContentDiv = document.getElementById(`result-${judgeType}`);
        
        if (!tabButton) {
            const personality = JUDGE_PERSONALITIES[judgeType];
            
            // タブボタンを作成
            tabButton = document.createElement('button');
            tabButton.className = 'tab-button streaming';
            tabButton.innerHTML = `${personality.icon} ${personality.name} <span class="streaming-indicator">⏳</span>`;
            tabButton.setAttribute('data-judge', judgeType);
            tabButton.addEventListener('click', () => this.switchTab(judgeType));
            tabButtons.appendChild(tabButton);
            
            // タブコンテンツを作成
            tabContentDiv = document.createElement('div');
            tabContentDiv.className = 'judge-result';
            tabContentDiv.id = `result-${judgeType}`;
            tabContentDiv.innerHTML = `
                <div class="judge-info">
                    <h3>${personality.icon} ${personality.name}</h3>
                    <p class="judge-description">${personality.description}</p>
                </div>
                <div class="result-content streaming-content" id="streaming-${judgeType}">
                    <div class="streaming-cursor">▋</div>
                </div>
                <div id="voice-controls-${judgeType}">
                    <!-- 音声コントロールは評価完了後に追加 -->
                </div>
            `;
            tabContent.appendChild(tabContentDiv);
            
            console.log(`✅ ストリーミング要素作成完了: streaming-${judgeType}`);
        }
        
        // 最初のタブをアクティブにする
        if (tabButtons.children.length === 1) {
            tabButton.classList.add('active');
            tabContentDiv.classList.add('active');
        }
        
        // ストリーミング要素の存在確認
        const streamingElement = document.getElementById(`streaming-${judgeType}`);
        if (!streamingElement) {
            console.error(`❌ ストリーミング要素が作成されませんでした: streaming-${judgeType}`);
        } else {
            console.log(`✅ ストリーミング要素確認済み: streaming-${judgeType}`);
        }
    }
    
    // ストリーミング表示の更新
    updateStreamingDisplay(judgeType, chunk) {
        const streamingElement = document.getElementById(`streaming-${judgeType}`);
        if (!streamingElement) {
            console.warn(`ストリーミング要素が見つかりません: streaming-${judgeType}`);
            return;
        }
        
        try {
            // カーソルを除去
            const cursor = streamingElement.querySelector('.streaming-cursor');
            if (cursor) {
                cursor.remove();
            }
            
            // チャンクを追加（安全にテキストとして）
            const chunkSpan = document.createElement('span');
            chunkSpan.className = 'streaming-chunk';
            chunkSpan.textContent = chunk;
            streamingElement.appendChild(chunkSpan);
            
            // 新しいカーソルを追加
            const newCursor = document.createElement('div');
            newCursor.className = 'streaming-cursor';
            newCursor.textContent = '▋';
            streamingElement.appendChild(newCursor);
            
            // スクロール調整（エラーハンドリング付き）
            try {
                streamingElement.scrollTop = streamingElement.scrollHeight;
            } catch (scrollError) {
                console.warn('スクロール調整エラー:', scrollError);
            }
            
        } catch (error) {
            console.error('ストリーミング表示更新エラー:', error);
            // エラー時はプレーンテキストで追加
            if (streamingElement) {
                streamingElement.textContent += chunk;
            }
        }
    }
    
    // ストリーミング完了処理
    completeStreamingDisplay(judgeType, fullEvaluation) {
        console.log(`🏁 ストリーミング完了処理: ${judgeType}`);
        
        // ストリーミング表示を使わずに直接結果表示
        // 通常の結果表示と同じ方法を使用
        const tabContentDiv = document.getElementById(`result-${judgeType}`);
        const tabButton = document.querySelector(`[data-judge="${judgeType}"]`);
        
        if (tabContentDiv) {
            const personality = JUDGE_PERSONALITIES[judgeType];
            const result = {
                judgeType: judgeType,
                personality: personality,
                evaluation: fullEvaluation
            };
            
            try {
                tabContentDiv.innerHTML = this.createResultHTML(result);
                console.log(`✅ ${judgeType} の結果表示完了`);
            } catch (error) {
                console.error(`❌ ${judgeType} の結果表示エラー:`, error);
                tabContentDiv.innerHTML = `
                    <div class="error-display">
                        <h3>❌ 表示エラー</h3>
                        <p>結果の表示でエラーが発生しました。</p>
                        <details>
                            <summary>詳細</summary>
                            <pre>${error.message}</pre>
                            <h4>評価内容（生データ）:</h4>
                            <pre>${fullEvaluation}</pre>
                        </details>
                    </div>
                `;
            }
        } else {
            console.error(`❌ タブコンテンツが見つかりません: result-${judgeType}`);
        }
        
        if (tabButton) {
            // ストリーミングインジケーターを除去
            const indicator = tabButton.querySelector('.streaming-indicator');
            if (indicator) indicator.remove();
            tabButton.classList.remove('streaming');
            tabButton.classList.add('completed');
        }
        
        // 音声コントロールを追加
        if (this.voiceController) {
            setTimeout(() => {
                try {
                    this.voiceController.createVoiceControls(judgeType, `voice-controls-${judgeType}`);
                    console.log(`🔊 ${judgeType} の音声コントロール追加完了`);
                } catch (error) {
                    console.warn(`⚠️ ${judgeType} の音声コントロール追加失敗:`, error);
                }
            }, 100);
        }
    }

    displayResults() {
        console.log('📊 結果表示開始:', this.analysisResults);
        
        const resultsSection = document.getElementById('results');
        const tabButtons = document.getElementById('tabButtons');
        const tabContent = document.getElementById('tabContent');
        
        if (!resultsSection || !tabButtons || !tabContent) {
            console.error('❌ 必要なDOM要素が見つかりません:', {
                resultsSection: !!resultsSection,
                tabButtons: !!tabButtons,
                tabContent: !!tabContent
            });
            return;
        }
        
        // 既存のコンテンツをクリア
        tabButtons.innerHTML = '';
        tabContent.innerHTML = '';
        
        // タブ要素にも強制表示スタイルを適用
        tabButtons.style.cssText = `
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
            margin-bottom: 20px !important;
            background: #f8f9fa !important;
            padding: 10px !important;
            border-radius: 6px !important;
        `;
        
        tabContent.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            min-height: 200px !important;
            background: white !important;
            border-radius: 6px !important;
        `;
        
        const judgeTypes = Object.keys(this.analysisResults);
        console.log('👩‍⚖️ 表示する審査員:', judgeTypes);
        
        if (judgeTypes.length === 0) {
            console.warn('⚠️ 分析結果がありません');
            tabContent.innerHTML = '<p>分析結果がありません。</p>';
            return;
        }
        
        judgeTypes.forEach((judgeType, index) => {
            const result = this.analysisResults[judgeType];
            const personality = result.personality;
            
            console.log(`🎯 ${judgeType} の結果を表示中:`, result);
            
            // タブボタン作成
            const button = document.createElement('button');
            button.className = `tab-button ${index === 0 ? 'active' : ''}`;
            button.innerHTML = `${personality.icon} ${personality.name}`;
            button.setAttribute('data-judge', judgeType);
            button.addEventListener('click', () => this.switchTab(judgeType));
            
            // ボタンにも強制表示スタイル
            button.style.cssText = `
                display: inline-block !important;
                visibility: visible !important;
                opacity: 1 !important;
                padding: 12px 20px !important;
                background: ${index === 0 ? '#3498db' : '#f8f9fa'} !important;
                color: ${index === 0 ? 'white' : '#333'} !important;
                border: 1px solid #ddd !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-weight: bold !important;
                font-size: 14px !important;
            `;
            
            tabButtons.appendChild(button);
            
            // タブコンテンツ作成
            const content = document.createElement('div');
            content.className = `judge-result ${index === 0 ? 'active' : ''}`;
            content.id = `result-${judgeType}`;
            
            // 強制表示スタイルを追加（最初のタブ）
            if (index === 0) {
                content.style.cssText = `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    position: relative !important;
                    z-index: 100 !important;
                    background: white !important;
                    padding: 15px !important;
                    border: 1px solid #ddd !important;
                    border-radius: 6px !important;
                    margin: 10px 0 !important;
                `;
            }
            
            try {
                const htmlContent = this.createResultHTML(result);
                content.innerHTML = htmlContent;
                console.log(`✅ ${judgeType} のHTML作成成功`, htmlContent.length + '文字');
            } catch (error) {
                console.error(`❌ ${judgeType} のHTML作成エラー:`, error);
                content.innerHTML = `
                    <div class="error-display">
                        <h3>❌ 表示エラー</h3>
                        <p>この審査員の結果表示でエラーが発生しました。</p>
                        <details>
                            <summary>詳細</summary>
                            <pre>${error.message}</pre>
                            <h4>評価内容（生データ）:</h4>
                            <pre>${result.evaluation || 'データなし'}</pre>
                        </details>
                    </div>
                `;
            }
            
            tabContent.appendChild(content);
            
            // 音声コントロールを追加
            if (this.voiceController) {
                setTimeout(() => {
                    try {
                        this.voiceController.createVoiceControls(judgeType, `voice-controls-${judgeType}`);
                        console.log(`🔊 ${judgeType} の音声コントロール追加完了`);
                    } catch (error) {
                        console.warn(`⚠️ ${judgeType} の音声コントロール追加失敗:`, error);
                    }
                }, 100);
            }
            
            console.log(`📋 ${judgeType} タブ追加完了:`, {
                id: content.id,
                className: content.className,
                display: content.style.display,
                innerHTML: content.innerHTML.length + '文字'
            });
        });
        
        // 結果セクションを強制的に表示
        resultsSection.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 1000 !important;
            background: white !important;
            padding: 20px !important;
            margin: 20px 0 !important;
            border: 2px solid #3498db !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
        `;
        
        // CSSの干渉を回避
        resultsSection.classList.add('force-display');
        
        console.log('📺 結果セクション表示状態:', {
            display: resultsSection.style.display,
            visibility: resultsSection.style.visibility,
            opacity: resultsSection.style.opacity,
            classes: resultsSection.className,
            cssText: resultsSection.style.cssText
        });
        
        // 音声コントロールは結果HTMLに組み込み済み
        console.log('🔊 音声コントロールは各結果に組み込み済み');
        
        // スクロール調整
        setTimeout(() => {
            this.uiController.scrollToElement(resultsSection, 100);
        }, 200);
        
        console.log('✅ 結果表示完了');
        
        // 最終確認: DOM要素の状態をログ出力
        setTimeout(() => {
            console.log('🔍 最終DOM確認:', {
                resultsSection: {
                    exists: !!resultsSection,
                    display: resultsSection?.style.display,
                    visibility: resultsSection?.style.visibility,
                    className: resultsSection?.className
                },
                tabButtons: {
                    exists: !!tabButtons,
                    childCount: tabButtons?.children.length,
                    innerHTML: tabButtons?.innerHTML.length + '文字'
                },
                tabContent: {
                    exists: !!tabContent,
                    childCount: tabContent?.children.length,
                    innerHTML: tabContent?.innerHTML.length + '文字'
                }
            });
        }, 500);
    }

    createResultHTML(result) {
        try {
            const formattedEvaluation = this.formatEvaluationText(result.evaluation);
            const questions = this.extractQuestions(result.evaluation);
            
            return `
                <div class="judge-info">
                    <h3>${result.personality.icon} ${result.personality.name}</h3>
                    <p class="judge-description">${result.personality.description}</p>
                </div>
                
                <div class="result-content evaluation-display">
                    ${formattedEvaluation}
                </div>
                
                <div class="voice-controls-container">
                    <h4>🔊 音声コントロール</h4>
                    <div id="voice-controls-${result.judgeType}">
                        <!-- VoiceControllerが新しい音声コントロールを動的に生成 -->
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('結果HTML作成エラー:', error);
            
            // エラー時のフォールバック表示
            return `
                <div class="judge-info">
                    <h3>${result.personality.icon} ${result.personality.name}</h3>
                    <p class="judge-description">${result.personality.description}</p>
                </div>
                
                <div class="result-content error-fallback">
                    <div class="error-message">
                        <h4>⚠️ 表示エラー</h4>
                        <p>評価結果の表示中にエラーが発生しました。</p>
                    </div>
                    <div class="raw-evaluation">
                        <h5>評価内容（プレーンテキスト）:</h5>
                        <pre>${result.evaluation}</pre>
                    </div>
                </div>
                
                <div class="voice-controls-container">
                    <h4>🔊 音声コントロール</h4>
                    <div id="voice-controls-${result.judgeType}">
                        <p>音声機能は利用できません</p>
                    </div>
                </div>
            `;
        }
    }

    formatEvaluationText(text) {
        if (!text || typeof text !== 'string') {
            console.warn('⚠️ 評価テキストが空またはstring型でない:', typeof text);
            return '<p class="error-message">評価テキストがありません</p>';
        }

        console.log('🎨 エクスポート形式でフォーマット開始:', text.length + '文字');

        try {
            // エクスポートのformatEvaluationTextメソッドを直接使用
            return this.convertTextToExportHTML(text);
        } catch (error) {
            console.error('❌ フォーマットエラー:', error);
            // エラー時は元のテキストをpreタグで表示
            return `<div class="format-error">
                <h4>⚠️ フォーマットエラー</h4>
                <p>テキストの表示処理でエラーが発生しました。以下に元のテキストを表示します：</p>
                <pre class="raw-text">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </div>`;
        }
    }

    // エクスポート用のHTMLフォーマット処理（表示にも使用）
    convertTextToExportHTML(text) {
        // マークダウン形式のテキストをHTMLに変換（エクスポート機能と同じロジック）
        let htmlText = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        // 見出しの変換
        htmlText = htmlText
            .replace(/^## (.*$)/gm, '<h2 style="color: #3498db; margin-top: 25px; margin-bottom: 15px;">$1</h2>')
            .replace(/^### (.*$)/gm, '<h3 style="color: #27ae60; margin-top: 20px; margin-bottom: 10px;">$1</h3>')
            .replace(/^#### (.*$)/gm, '<h4 style="color: #8e44ad; margin-top: 15px; margin-bottom: 8px;">$1</h4>');

        // 太字・斜体の変換
        htmlText = htmlText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/【(.*?)】/g, '<strong style="color: #e74c3c;">【$1】</strong>');

        // リストの変換
        htmlText = htmlText.replace(/^- (.+)$/gm, '<li style="margin-bottom: 8px;">$1</li>');
        htmlText = htmlText.replace(/^(\d+)\. (.+)$/gm, '<li style="margin-bottom: 8px;">$2</li>');

        // 段落の処理
        const paragraphs = htmlText.split(/\n\s*\n/);
        let formattedText = '';

        for (let i = 0; i < paragraphs.length; i++) {
            let paragraph = paragraphs[i].trim();
            
            if (!paragraph) continue;

            // 見出しの場合はそのまま
            if (paragraph.match(/^<h[2-4]/)) {
                formattedText += paragraph + '\n';
            }
            // リストの場合
            else if (paragraph.includes('<li')) {
                formattedText += `<ul style="margin: 10px 0; padding-left: 20px;">\n${paragraph}\n</ul>\n`;
            }
            // 通常の段落
            else {
                paragraph = paragraph.replace(/\n/g, '<br>');
                formattedText += `<div style="margin: 15px 0; line-height: 1.6; white-space: pre-wrap;">${paragraph}</div>\n`;
            }
        }

        // セクション別の色分け（インラインスタイルで）
        formattedText = formattedText
            .replace(/<h2 style="[^"]*">📋([^<]+)<\/h2>/g, 
                '<div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #3498db; border-radius: 8px;"><h2 style="color: #3498db; margin: 0 0 15px 0;">📋$1</h2>')
            .replace(/<h2 style="[^"]*">📊([^<]+)<\/h2>/g, 
                '</div><div style="background: #fff5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #e74c3c; border-radius: 8px;"><h2 style="color: #e74c3c; margin: 0 0 15px 0;">📊$1</h2>')
            .replace(/<h2 style="[^"]*">🎯([^<]+)<\/h2>/g, 
                '</div><div style="background: #f0fff4; padding: 15px; margin: 20px 0; border-left: 4px solid #27ae60; border-radius: 8px;"><h2 style="color: #27ae60; margin: 0 0 15px 0;">🎯$1</h2>')
            .replace(/<h2 style="[^"]*">❓([^<]+)<\/h2>/g, 
                '</div><div style="background: #fff8e1; padding: 15px; margin: 20px 0; border-left: 4px solid #f39c12; border-radius: 8px;"><h2 style="color: #f39c12; margin: 0 0 15px 0;">❓$1</h2>')
            .replace(/<h2 style="[^"]*">💡([^<]+)<\/h2>/g, 
                '</div><div style="background: #f3e5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #9b59b6; border-radius: 8px;"><h2 style="color: #9b59b6; margin: 0 0 15px 0;">💡$1</h2>')
            .replace(/<h2 style="[^"]*">📈([^<]+)<\/h2>/g, 
                '</div><div style="background: #e8f4fd; padding: 15px; margin: 20px 0; border-left: 4px solid #3498db; border-radius: 8px;"><h2 style="color: #3498db; margin: 0 0 15px 0;">📈$1</h2>');

        // 最後のセクションを閉じる
        if (formattedText.includes('<div style=')) {
            formattedText += '</div>';
        }

        console.log('✅ エクスポート形式フォーマット完了');
        return formattedText;
    }

    switchTab(judgeType) {
        // タブボタンの切り替え
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // クリックされたタブボタンを探してアクティブにする
        const targetButton = document.querySelector(`[data-judge="${judgeType}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
        // タブコンテンツの切り替え
        document.querySelectorAll('.judge-result').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(`result-${judgeType}`);
        if (targetContent) {
            targetContent.classList.add('active');
            
            // フェードイン効果
            this.uiController.fadeIn(targetContent, 300);
        }
    }

    async playQuestionAudio(judgeType) {
        const result = this.analysisResults[judgeType];
        const statusElement = document.getElementById(`voice-status-${judgeType}`);
        
        try {
            statusElement.textContent = '音声生成中...';
            
            // 質問部分を抽出
            const questions = this.extractQuestions(result.evaluation);
            if (!questions) {
                statusElement.textContent = '質問が見つかりません';
                return;
            }
            
            const voiceController = new VoiceController(this.apiKey);
            await voiceController.playQuestions(questions, result.personality);
            
            statusElement.textContent = '再生中...';
            
        } catch (error) {
            console.error('音声再生エラー:', error);
            statusElement.textContent = '音声再生に失敗しました';
        }
    }

    extractQuestions(evaluationText) {
        console.log('🎯 質問抽出開始');
        
        // より柔軟な質問抽出
        const questionSections = [
            /## ❓ 深掘り質問\s*([\s\S]*?)(?=## |$)/,
            /❓.*質問\s*([\s\S]*?)(?=## |$)/,
            /質問\s*([\s\S]*?)(?=## |$)/
        ];
        
        for (const pattern of questionSections) {
            const match = evaluationText.match(pattern);
            if (match) {
                const questions = match[1]
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => line.replace(/^\d+\.\s*/, '').trim())
                    .filter(question => question && question.length > 10);
                
                if (questions.length > 0) {
                    console.log('✅ 質問抽出成功:', questions.length + '個');
                    return questions.join(' ');
                }
            }
        }
        
        console.log('⚠️ 質問が見つかりませんでした');
        return 'このピッチについてもっと詳しく教えてください。';
    }

    async playQuestionAudio(judgeType) {
        if (!this.apiKey) {
            this.uiController.showError('APIキーが設定されていません');
            return;
        }

        const result = this.analysisResults[judgeType];
        const statusElement = document.getElementById(`voice-status-${judgeType}`);
        
        if (!result) {
            console.error('❌ 分析結果が見つかりません:', judgeType);
            return;
        }
        
        try {
            statusElement.textContent = '音声生成中...';
            
            // 質問部分を抽出
            const questions = this.extractQuestions(result.evaluation);
            console.log('🎵 音声生成開始:', questions);
            
            // OpenAI TTS APIで音声生成
            const apiClient = new OpenAIClient(this.apiKey);
            const personality = result.personality;
            const voiceSettings = personality.voice || { voice: 'alloy', speed: 1.0 };
            
            const audioBlob = await apiClient.generateSpeech(questions, voiceSettings.voice, voiceSettings.speed);
            
            // 音声再生
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.onloadeddata = () => {
                statusElement.textContent = '再生中...';
                audio.play();
                window.currentAudio = audio;
            };
            
            audio.onended = () => {
                statusElement.textContent = '再生完了';
                URL.revokeObjectURL(audioUrl);
                window.currentAudio = null;
            };
            
            audio.onerror = () => {
                statusElement.textContent = '再生エラー';
                URL.revokeObjectURL(audioUrl);
            };
            
        } catch (error) {
            console.error('❌ 音声再生エラー:', error);
            statusElement.textContent = `音声生成に失敗しました: ${error.message}`;
        }
    }

    stopAudio() {
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }
        
        document.querySelectorAll('.voice-status').forEach(status => {
            status.textContent = '';
        });
    }

    setVolume(value) {
        if (window.currentAudio) {
            window.currentAudio.volume = value;
        }
    }

    exportResults() {
        this.showExportDialog();
    }

    showExportDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'export-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <h3>エクスポート形式を選択</h3>
                    <div class="export-options">
                        <button class="export-option" data-format="txt">
                            <span class="export-icon">📄</span>
                            <span>テキストファイル</span>
                            <small>プレーンテキスト形式</small>
                        </button>
                        <button class="export-option" data-format="html">
                            <span class="export-icon">🌐</span>
                            <span>HTMLファイル</span>
                            <small>ブラウザで表示可能</small>
                        </button>
                        <button class="export-option" data-format="json">
                            <span class="export-icon">📊</span>
                            <span>JSONファイル</span>
                            <small>データ形式</small>
                        </button>
                    </div>
                    <div class="dialog-actions">
                        <button class="cancel-btn" onclick="this.closest('.export-dialog').remove()">キャンセル</button>
                    </div>
                </div>
            </div>
        `;
        
        // イベントリスナーを追加
        dialog.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                this.performExport(format);
                dialog.remove();
            });
        });
        
        document.body.appendChild(dialog);
    }

    performExport(format) {
        const results = Object.values(this.analysisResults);
        const timestamp = new Date().toISOString().split('T')[0];
        
        switch (format) {
            case 'txt':
                this.exportAsText(results, timestamp);
                break;
            case 'html':
                this.exportAsHTML(results, timestamp);
                break;
            case 'json':
                this.exportAsJSON(results, timestamp);
                break;
        }
        
        this.uiController.showSuccess(`${format.toUpperCase()}形式でエクスポートしました`);
    }

    exportAsText(results, timestamp) {
        let exportText = 'AI審査員システム - 分析結果\n';
        exportText += '=' .repeat(50) + '\n';
        exportText += `分析日時: ${new Date().toLocaleString('ja-JP')}\n`;
        exportText += `審査員数: ${results.length}名\n\n`;
        
        results.forEach(result => {
            exportText += `${result.personality.icon} ${result.personality.name}\n`;
            exportText += '-'.repeat(30) + '\n';
            exportText += `専門分野: ${result.personality.description}\n\n`;
            exportText += result.evaluation + '\n\n';
        });
        
        this.downloadFile(exportText, `AI審査結果_${timestamp}.txt`, 'text/plain');
    }

    exportAsHTML(results, timestamp) {
        let htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI審査員システム - 分析結果</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; }
        .judge-section { margin-bottom: 40px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .judge-name { color: #2c3e50; font-size: 1.5em; margin-bottom: 10px; }
        .judge-desc { color: #7f8c8d; margin-bottom: 20px; }
        .evaluation { white-space: pre-wrap; }
        h1 { color: #2c3e50; }
        h2 { color: #3498db; margin-top: 25px; margin-bottom: 15px; }
        h3 { color: #27ae60; margin-top: 20px; margin-bottom: 10px; }
        h4 { color: #8e44ad; margin-top: 15px; margin-bottom: 8px; }
        .timestamp { color: #95a5a6; font-size: 0.9em; }
        .summary-section { background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 AI審査員システム - 分析結果</h1>
        <p class="timestamp">分析日時: ${new Date().toLocaleString('ja-JP')}</p>
    </div>
`;
        
        results.forEach(result => {
            htmlContent += `
    <div class="judge-section">
        <div class="judge-name">${result.personality.icon} ${result.personality.name}</div>
        <div class="judge-desc">${result.personality.description}</div>
        <div class="evaluation">${this.convertTextToExportHTML(result.evaluation)}</div>
    </div>
`;
        });
        
        htmlContent += `
</body>
</html>
`;
        
        this.downloadFile(htmlContent, `AI審査結果_${timestamp}.html`, 'text/html');
    }

    exportAsJSON(results, timestamp) {
        const exportData = {
            metadata: {
                title: 'AI審査員システム - 分析結果',
                timestamp: new Date().toISOString(),
                judgeCount: results.length,
                version: '1.0'
            },
            results: results.map(result => ({
                judgeType: result.judgeType,
                judgeName: result.personality.name,
                judgeDescription: result.personality.description,
                evaluation: result.evaluation,
                audioAnalysis: result.audioAnalysis,
                slideAnalysis: result.slideAnalysis
            }))
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        this.downloadFile(jsonString, `AI審査結果_${timestamp}.json`, 'application/json');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    reAnalysis() {
        this.uiController.showConfirmDialog(
            '新しい分析を開始しますか？現在の結果は失われます。',
            () => {
                const results = document.getElementById('results');
                results.style.display = 'none';
                this.analysisResults = {};
                
                // 選択状態をリセット
                this.judgeSelector.deselectAllJudges();
                
                this.updateAnalysisButton();
                this.uiController.scrollToElement(document.body, 0);
            }
        );
    }

    // 録音開始
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            this.recordingChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordingChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.handleRecordingStop();
            };
            
            this.mediaRecorder.start(1000); // 1秒ごとにデータを記録
            
            // UI更新
            this.updateRecordingUI(true);
            this.startRecordingTimer();
            this.startAudioLevelMonitoring(stream);
            
            this.uiController.showSuccess('録音を開始しました');
            
        } catch (error) {
            console.error('録音開始エラー:', error);
            
            let errorMessage = '録音を開始できませんでした。';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'マイクのアクセス許可が必要です。ブラウザの設定を確認してください。';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'マイクが見つかりません。マイクが接続されているか確認してください。';
            }
            
            this.uiController.showError(errorMessage);
        }
    }
    
    // 録音停止
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            
            // マイクストリームを停止
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        this.updateRecordingUI(false);
        this.stopRecordingTimer();
    }
    
    // 録音完了処理
    handleRecordingStop() {
        const blob = new Blob(this.recordingChunks, { type: 'audio/webm' });
        
        // WebMをWAVに変換（簡易版）
        const audioFile = new File([blob], 'recorded_audio.webm', { type: 'audio/webm' });
        
        // ファイルとして処理
        this.uploadedFiles.audio = audioFile;
        this.displayRecordedAudio(audioFile);
        this.updateAnalysisButton();
        
        this.uiController.showSuccess('録音が完了しました');
    }
    
    // 録音音声のプレビュー表示
    displayRecordedAudio(audioFile) {
        const previewArea = document.getElementById('audioPreview');
        const audioPlayer = previewArea.querySelector('.audio-player');
        
        const url = URL.createObjectURL(audioFile);
        audioPlayer.src = url;
        previewArea.style.display = 'block';
        
        // メモリリークを防ぐためのクリーンアップ
        audioPlayer.onload = () => {
            URL.revokeObjectURL(url);
        };
    }
    
    // 録音UI更新
    updateRecordingUI(isRecording) {
        const recordBtn = document.getElementById('recordBtn');
        const recordingArea = document.getElementById('recordingArea');
        
        if (!recordBtn || !recordingArea) {
            console.warn('録音UI要素が見つかりません');
            return;
        }
        
        if (isRecording) {
            recordBtn.textContent = '🎤 録音中...';
            recordBtn.classList.add('recording');
            recordBtn.disabled = true;
            recordingArea.style.display = 'block';
        } else {
            recordBtn.textContent = '🎤 録音開始';
            recordBtn.classList.remove('recording');
            recordBtn.disabled = false;
            recordingArea.style.display = 'none';
        }
    }
    
    // 録音タイマー開始
    startRecordingTimer() {
        this.recordingStartTime = Date.now();
        this.recordingTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            
            const timerElement = document.querySelector('.recording-timer');
            if (timerElement) {
                timerElement.textContent = `${minutes}:${seconds}`;
            }
        }, 1000);
    }
    
    // 録音タイマー停止
    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }
    
    // 音声レベル監視
    startAudioLevelMonitoring(stream) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        const updateLevel = () => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                analyser.getByteFrequencyData(dataArray);
                
                // 音声レベルを計算
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                const level = (average / 255) * 100;
                
                // レベルバーを更新
                const levelBar = document.getElementById('levelBar');
                if (levelBar) {
                    levelBar.style.width = `${level}%`;
                }
                
                requestAnimationFrame(updateLevel);
            }
        };
        
        updateLevel();
    }

    // 比較表示モードの切り替え
    toggleComparisonMode() {
        const resultsSection = document.getElementById('results');
        const toggleButton = document.getElementById('toggleCompareMode');
        
        if (!resultsSection || !toggleButton) {
            console.warn('比較表示UI要素が見つかりません');
            return;
        }
        
        if (!this.analysisResults || Object.keys(this.analysisResults).length < 2) {
            this.uiController.showError('比較表示には2名以上の審査員評価が必要です');
            return;
        }
        
        this.isComparisonMode = !this.isComparisonMode;
        
        if (this.isComparisonMode) {
            this.showComparisonView();
            toggleButton.classList.add('active');
            toggleButton.innerHTML = '<span class="btn-icon">📑</span>個別表示';
        } else {
            this.showTabView();
            toggleButton.classList.remove('active');
            toggleButton.innerHTML = '<span class="btn-icon">📊</span>比較表示';
        }
    }
    
    // 比較表示ビューの表示
    showComparisonView() {
        const resultsSection = document.getElementById('results');
        const tabContent = document.getElementById('tabContent');
        
        if (!resultsSection || !tabContent) {
            console.warn('比較表示UI要素が見つかりません');
            return;
        }
        
        resultsSection.classList.add('comparison-mode');
        
        // 比較サマリーを生成
        const comparisonSummary = this.generateComparisonSummary();
        
        // 各審査員の結果にdata-judge属性を追加
        const judgeResults = tabContent.querySelectorAll('.judge-result');
        judgeResults.forEach((result, index) => {
            const judgeType = result.id.replace('result-', '');
            result.setAttribute('data-judge', judgeType);
            result.style.setProperty('--index', index);
        });
        
        // 比較サマリーを先頭に挿入
        tabContent.insertAdjacentHTML('afterbegin', comparisonSummary);
        
        this.uiController.showSuccess('比較表示モードに切り替えました');
    }
    
    // 通常タブ表示ビューの表示
    showTabView() {
        const resultsSection = document.getElementById('results');
        const tabContent = document.getElementById('tabContent');
        
        if (!resultsSection || !tabContent) {
            console.warn('タブ表示UI要素が見つかりません');
            return;
        }
        
        resultsSection.classList.remove('comparison-mode');
        
        // 比較サマリーを削除
        const summaryElement = tabContent.querySelector('.comparison-summary');
        if (summaryElement) {
            summaryElement.remove();
        }
        
        // 最初のタブを表示
        const judgeTypes = Object.keys(this.analysisResults);
        if (judgeTypes.length > 0) {
            this.switchTab(judgeTypes[0]);
        }
        
        this.uiController.showSuccess('個別表示モードに切り替えました');
    }
    
    // 比較サマリーを生成
    generateComparisonSummary() {
        const results = Object.values(this.analysisResults);
        const scores = this.extractScores(results);
        const averageScore = this.calculateAverageScore(scores);
        const consensus = this.findConsensusPoints(results);
        const differences = this.findKeyDifferences(results);
        
        return `
            <div class="comparison-summary">
                <h3>📊 審査員評価の比較サマリー</h3>
                
                <div class="score-comparison">
                    ${scores.map(score => `
                        <div class="score-item" data-judge="${score.judgeType}">
                            <div class="score-value">${score.score}</div>
                            <div class="judge-name-small">${score.icon} ${score.name}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="summary-stats">
                    <p><strong>平均評価:</strong> ${averageScore}/5</p>
                    <p><strong>参加審査員数:</strong> ${results.length}名</p>
                </div>
                
                <div class="consensus-points">
                    <h4>🤝 共通して評価された点</h4>
                    <ul>
                        ${consensus.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="key-differences">
                    <h4>🔍 審査員による視点の違い</h4>
                    <ul>
                        ${differences.map(diff => `<li>${diff}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
    
    // 評価スコアを抽出
    extractScores(results) {
        return results.map(result => {
            const evaluation = result.evaluation;
            const scoreMatch = evaluation.match(/【評価スコア】:\s*([⭐★✨]*)/);
            const score = scoreMatch ? scoreMatch[1].length : 3; // デフォルト3
            
            return {
                judgeType: result.judgeType,
                name: result.personality.name,
                icon: result.personality.icon,
                score: score
            };
        });
    }
    
    // 平均スコアを計算
    calculateAverageScore(scores) {
        const sum = scores.reduce((acc, score) => acc + score.score, 0);
        return (sum / scores.length).toFixed(1);
    }
    
    // 共通評価ポイントを抽出
    findConsensusPoints(results) {
        // 簡略化された実装
        const commonTerms = ['創意工夫', '実現可能性', '社会的意義', '論理性', '熱意'];
        const consensus = [];
        
        commonTerms.forEach(term => {
            const mentionCount = results.filter(result => 
                result.evaluation.includes(term)
            ).length;
            
            if (mentionCount >= Math.ceil(results.length * 0.6)) {
                consensus.push(`${term}について高く評価`);
            }
        });
        
        return consensus.length > 0 ? consensus : ['提案の独創性', '実現への意欲'];
    }
    
    // 主要な違いを抽出
    findKeyDifferences(results) {
        const differences = [];
        
        // 審査員の専門性による違いを表現
        results.forEach(result => {
            const personality = result.personality;
            switch (result.judgeType) {
                case 'professor':
                    differences.push('🎓 学術的視点: 理論的根拠と先行研究の重要性を指摘');
                    break;
                case 'entrepreneur':
                    differences.push('💼 実業家視点: 市場性と実行可能性を重視した評価');
                    break;
                case 'vc':
                    differences.push('💰 投資家視点: スケーラビリティと成長性に注目');
                    break;
                case 'tech_expert':
                    differences.push('💻 技術視点: 技術的実現性とデジタル化の可能性を分析');
                    break;
            }
        });
        
        return differences;
    }

    // 履歴に保存
    saveToHistory() {
        if (!this.analysisResults || Object.keys(this.analysisResults).length === 0) {
            return;
        }

        const metadata = {
            hasSlide: !!this.uploadedFiles.slide,
            hasAudio: !!this.uploadedFiles.audio,
            title: `ピッチ評価 ${new Date().toLocaleDateString('ja-JP')} ${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`,
            tags: Object.keys(this.analysisResults).map(type => JUDGE_PERSONALITIES[type].name)
        };

        const historyId = this.historyManager.saveEvaluationHistory(this.analysisResults, metadata);
        console.log('評価結果を履歴に保存しました:', historyId);
    }

    // 履歴ダイアログの表示
    showHistoryDialog() {
        const history = this.historyManager.getHistory();
        const stats = this.historyManager.getHistoryStats();

        const dialog = document.createElement('div');
        dialog.className = 'history-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content history-content">
                    <h3>📚 評価履歴</h3>
                    
                    <div class="history-stats">
                        <div class="stat-item">
                            <span class="stat-value">${stats.totalEvaluations}</span>
                            <span class="stat-label">総評価数</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${stats.averageScore}</span>
                            <span class="stat-label">平均スコア</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${stats.mostUsedJudges[0]?.name || '-'}</span>
                            <span class="stat-label">最頻審査員</span>
                        </div>
                    </div>

                    <div class="history-controls">
                        <input type="text" id="historySearch" placeholder="履歴を検索..." class="search-input">
                        <button class="control-btn" onclick="this.closest('.history-dialog').remove()">
                            ❌ 閉じる
                        </button>
                        <button class="control-btn" id="clearHistory">
                            🗑️ 履歴削除
                        </button>
                    </div>

                    <div class="history-list" id="historyList">
                        ${this.generateHistoryList(history)}
                    </div>
                </div>
            </div>
        `;

        // イベントリスナーを追加
        dialog.querySelector('#clearHistory').addEventListener('click', () => {
            if (confirm('全ての履歴を削除しますか？この操作は取り消せません。')) {
                this.historyManager.clearHistory();
                dialog.remove();
                this.uiController.showSuccess('履歴を削除しました');
            }
        });

        dialog.querySelector('#historySearch').addEventListener('input', (e) => {
            const query = e.target.value;
            const filteredHistory = query ? this.historyManager.searchHistory(query) : history;
            dialog.querySelector('#historyList').innerHTML = this.generateHistoryList(filteredHistory);
        });

        document.body.appendChild(dialog);
    }

    // 履歴リストのHTML生成
    generateHistoryList(history) {
        if (history.length === 0) {
            return '<p class="no-history">評価履歴がありません</p>';
        }

        return history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-header">
                    <h4>${item.metadata.title}</h4>
                    <span class="history-date">${new Date(item.timestamp).toLocaleString('ja-JP')}</span>
                </div>
                <div class="history-summary">
                    <span class="judge-count">${item.metadata.judgeCount}名の審査員</span>
                    <span class="average-score">平均: ${item.summary.averageScore}/5</span>
                    <span class="judge-names">${item.summary.judgeNames.join(', ')}</span>
                </div>
                <div class="history-actions">
                    <button class="history-btn load-btn" onclick="window.app.loadHistoryItem('${item.id}')">
                        📂 読み込み
                    </button>
                    <button class="history-btn delete-btn" onclick="window.app.deleteHistoryItem('${item.id}')">
                        🗑️ 削除
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 履歴項目の読み込み
    loadHistoryItem(id) {
        const item = this.historyManager.getHistoryItem(id);
        if (!item) {
            this.uiController.showError('履歴項目が見つかりません');
            return;
        }

        // 結果をロード
        this.analysisResults = item.analysisResults;
        this.displayResults();
        
        // ダイアログを閉じる
        document.querySelector('.history-dialog')?.remove();
        
        this.uiController.showSuccess('履歴を読み込みました');
    }

    // 履歴項目の削除
    deleteHistoryItem(id) {
        if (confirm('この履歴項目を削除しますか？')) {
            this.historyManager.deleteHistoryItem(id);
            
            // 履歴リストを更新
            const historyList = document.querySelector('#historyList');
            if (historyList) {
                const history = this.historyManager.getHistory();
                historyList.innerHTML = this.generateHistoryList(history);
            }
            
            this.uiController.showSuccess('履歴項目を削除しました');
        }
    }

    // デバッグ機能（開発用）
    runDebugTests() {
        console.log('🔧 デバッグテスト開始');
        
        // 1. 基本的な初期化状態をチェック
        console.log('📋 初期化状態:', {
            apiKey: this.apiKey ? 'あり' : 'なし',
            fileHandler: !!this.fileHandler,
            uiController: !!this.uiController,
            judgeSelector: !!this.judgeSelector,
            voiceController: !!this.voiceController
        });
        
        // 2. DOM要素の存在確認
        const requiredElements = [
            'startAnalysis',
            'loading',
            'results',
            'tabButtons',
            'tabContent'
        ];
        
        console.log('🏗️ DOM要素確認:');
        requiredElements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`- ${id}: ${element ? '✅ 存在' : '❌ 不在'}`);
        });
        
        // 3. アップロードされたファイルの確認
        console.log('📁 ファイル状態:', {
            slide: this.uploadedFiles.slide ? {
                name: this.uploadedFiles.slide.name,
                size: this.uploadedFiles.slide.size,
                type: this.uploadedFiles.slide.type
            } : 'なし',
            audio: this.uploadedFiles.audio ? {
                name: this.uploadedFiles.audio.name,
                size: this.uploadedFiles.audio.size,
                type: this.uploadedFiles.audio.type
            } : 'なし'
        });
        
        // 4. 審査員選択状態の確認
        console.log('👩‍⚖️ 審査員選択状態:', {
            selectedJudges: Array.from(this.selectedJudges),
            judgeCount: this.judgeSelector.getSelectionCount()
        });
        
        // 5. ボタン状態の確認
        const analysisButton = document.getElementById('startAnalysis');
        console.log('🔘 分析ボタン状態:', {
            disabled: analysisButton.disabled,
            text: analysisButton.textContent
        });
        
        console.log('🔧 デバッグテスト完了');
    }
    
    // 音声分析のテスト機能
    async testAudioAnalysis() {
        if (!this.uploadedFiles.audio) {
            console.warn('❌ 音声ファイルがアップロードされていません');
            return;
        }
        
        console.log('🧪 音声分析テスト開始');
        
        try {
            const apiClient = new OpenAIClient(this.apiKey);
            const result = await this.analyzeAudio(apiClient);
            console.log('✅ 音声分析テスト成功:', result);
            return result;
        } catch (error) {
            console.error('❌ 音声分析テスト失敗:', error);
            return null;
        }
    }

}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 AI審査員システム初期化開始');
        const app = new AIJudgeApp();
        
        // デバッグ用にグローバルアクセス可能にする
        window.app = app;
        window.debugApp = () => app.runDebugTests();
        window.testAudio = () => app.testAudioAnalysis();
        
        console.log('✅ AI審査員システム初期化完了');
        console.log('💡 デバッグコマンド: debugApp() または testAudio()');
    } catch (error) {
        console.error('❌ 初期化エラー:', error);
    }
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('アプリケーションエラー:', event.error);
    alert('予期しないエラーが発生しました。ページを再読み込みしてください。');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise拒否エラー:', event.reason);
    alert('処理中にエラーが発生しました。しばらく待ってから再試行してください。');
});