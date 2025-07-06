// AI審査員システム - 音声制御ユーティリティ

class VoiceController {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.openAIClient = new OpenAIClient(apiKey);
        this.currentAudio = null;
        this.volume = 0.8;
        this.isPlaying = false;
        this.playbackSpeed = 1.0;
        this.audioCache = new Map();
        
        this.initializeVoiceSettings();
    }

    // 音声設定の初期化
    initializeVoiceSettings() {
        const savedVolume = localStorage.getItem('voice_volume');
        if (savedVolume) {
            this.volume = parseFloat(savedVolume);
        }
        
        const savedSpeed = localStorage.getItem('voice_speed');
        if (savedSpeed) {
            this.playbackSpeed = parseFloat(savedSpeed);
        }
    }

    // 質問音声の再生
    async playQuestions(questions, personality) {
        try {
            this.stopCurrentAudio();
            
            // 音声生成またはキャッシュから取得
            const audioBlob = await this.getOrGenerateAudio(questions, personality);
            
            // 音声再生
            await this.playAudioBlob(audioBlob);
            
        } catch (error) {
            console.error('音声再生エラー:', error);
            throw new Error(`音声再生に失敗しました: ${error.message}`);
        }
    }

    // 音声生成またはキャッシュ取得
    async getOrGenerateAudio(text, personality) {
        const cacheKey = this.generateCacheKey(text, personality);
        
        // キャッシュチェック
        if (this.audioCache.has(cacheKey)) {
            return this.audioCache.get(cacheKey);
        }
        
        // 新規生成
        const audioBlob = await this.generateAudio(text, personality);
        
        // キャッシュに保存（最大10件）
        if (this.audioCache.size >= 10) {
            const firstKey = this.audioCache.keys().next().value;
            this.audioCache.delete(firstKey);
        }
        this.audioCache.set(cacheKey, audioBlob);
        
        return audioBlob;
    }

    // 音声生成
    async generateAudio(text, personality) {
        const voiceSettings = personality.voice || { voice: 'alloy', speed: 1.0 };
        
        // 審査員の個性に応じたテキスト調整
        const adjustedText = this.adjustTextForPersonality(text, personality);
        
        console.log(`${personality.name}の音声生成:`, {
            voice: voiceSettings.voice,
            speed: voiceSettings.speed,
            playbackSpeed: this.playbackSpeed,
            finalSpeed: voiceSettings.speed * this.playbackSpeed,
            textLength: adjustedText.length,
            originalLength: text.length
        });
        
        return await this.openAIClient.generateSpeech(
            adjustedText,
            voiceSettings.voice,
            voiceSettings.speed * this.playbackSpeed
        );
    }

    // 審査員の個性に応じたテキスト調整
    adjustTextForPersonality(text, personality) {
        // 各審査員の話し方に応じてテキストを調整
        const adjustments = {
            professor: (text) => {
                // 大学教員らしい丁寧な語調に調整
                return text.replace(/です。/g, 'でございます。')
                          .replace(/ます。/g, 'ますね。')
                          .replace(/\?/g, 'でしょうか？');
            },
            entrepreneur: (text) => {
                // 実業家らしい率直な語調に調整
                return text.replace(/どうでしょうか\?/g, 'どうですか？')
                          .replace(/考えられます/g, '思います')
                          .replace(/検討してください/g, '検討してみてください');
            },
            vc: (text) => {
                // VCらしい分析的な語調に調整
                return text.replace(/について/g, 'に関して')
                          .replace(/どのような/g, 'どの様な')
                          .replace(/\?/g, 'でしょうか？');
            },
            tech_expert: (text) => {
                // IT専門家らしい正確な語調に調整
                return text.replace(/どうですか\?/g, 'いかがでしょうか？')
                          .replace(/について/g, 'に関して')
                          .replace(/方法/g, '手法');
            }
        };

        const adjustmentFunction = adjustments[personality.name] || adjustments.professor;
        return adjustmentFunction ? adjustmentFunction(text) : text;
    }

    // キャッシュキー生成
    generateCacheKey(text, personality) {
        const textHash = this.simpleHash(text);
        const voiceSettings = personality.voice || { voice: 'alloy', speed: 1.0 };
        return `${personality.name}_${voiceSettings.voice}_${voiceSettings.speed}_${textHash}_${this.playbackSpeed}`;
    }

    // 簡単なハッシュ関数
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    // 音声Blobの再生
    async playAudioBlob(audioBlob) {
        return new Promise((resolve, reject) => {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.volume = this.volume;
            this.currentAudio = audio;
            
            audio.onloadeddata = () => {
                this.isPlaying = true;
                audio.play().catch(reject);
            };
            
            audio.onended = () => {
                this.isPlaying = false;
                this.currentAudio = null;
                URL.revokeObjectURL(audioUrl);
                resolve();
            };
            
            audio.onerror = () => {
                this.isPlaying = false;
                this.currentAudio = null;
                URL.revokeObjectURL(audioUrl);
                reject(new Error('音声再生エラー'));
            };
        });
    }

    // 音声停止
    stopCurrentAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
            this.isPlaying = false;
        }
    }

    // 音量設定
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('voice_volume', this.volume.toString());
        
        if (this.currentAudio) {
            this.currentAudio.volume = this.volume;
        }
    }

    // 再生速度設定
    setPlaybackSpeed(speed) {
        this.playbackSpeed = Math.max(0.25, Math.min(4.0, speed));
        localStorage.setItem('voice_speed', this.playbackSpeed.toString());
        
        if (this.currentAudio) {
            this.currentAudio.playbackRate = this.playbackSpeed;
        }
    }

    // 音声コントロールUI生成
    createVoiceControls(judgeType, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const controlsHTML = `
            <div class="voice-controls" id="voice-controls-${judgeType}">
                <button class="voice-btn play-btn" onclick="window.app.voiceController?.playJudgeQuestions('${judgeType}')">
                    🔊 質問を聞く
                </button>
                <button class="voice-btn stop-btn" onclick="window.app.voiceController?.stopCurrentAudio()">
                    ⏸️ 停止
                </button>
                <button class="voice-btn replay-btn" onclick="window.app.voiceController?.replayLastAudio()">
                    🔄 再生
                </button>
                
                <div class="volume-control">
                    <label>🔊</label>
                    <input type="range" min="0" max="1" step="0.1" value="${this.volume}" 
                           onchange="window.app.voiceController?.setVolume(this.value)" class="volume-slider">
                    <span class="volume-value">${Math.round(this.volume * 100)}%</span>
                </div>
                
                <div class="speed-control">
                    <label>⚡</label>
                    <select onchange="window.app.voiceController?.setPlaybackSpeed(this.value)" class="speed-selector">
                        <option value="0.5" ${this.playbackSpeed === 0.5 ? 'selected' : ''}>0.5x</option>
                        <option value="0.75" ${this.playbackSpeed === 0.75 ? 'selected' : ''}>0.75x</option>
                        <option value="1.0" ${this.playbackSpeed === 1.0 ? 'selected' : ''}>1.0x</option>
                        <option value="1.25" ${this.playbackSpeed === 1.25 ? 'selected' : ''}>1.25x</option>
                        <option value="1.5" ${this.playbackSpeed === 1.5 ? 'selected' : ''}>1.5x</option>
                        <option value="2.0" ${this.playbackSpeed === 2.0 ? 'selected' : ''}>2.0x</option>
                    </select>
                    <span class="speed-value">${this.playbackSpeed}x</span>
                </div>
                
                <div class="voice-status" id="voice-status-${judgeType}">
                    準備完了
                </div>
            </div>
        `;
        
        container.innerHTML = controlsHTML;
    }

    // 審査員別質問音声再生
    async playJudgeQuestions(judgeType) {
        const personality = JUDGE_PERSONALITIES[judgeType];
        const statusElement = document.getElementById(`voice-status-${judgeType}`);
        
        try {
            this.updateStatus(statusElement, 'generating', `${personality.name}の音声生成中...`);
            
            // 質問テキストを取得（実際の評価結果から抽出）
            const questions = this.extractQuestionsFromResult(judgeType);
            if (!questions) {
                throw new Error('質問が見つかりません');
            }
            
            // 審査員の個性を反映した音声メッセージを追加
            const introduction = this.getJudgeIntroduction(judgeType);
            const fullText = introduction + questions;
            
            this.updateStatus(statusElement, 'playing', `${personality.name}からの質問を再生中...`);
            await this.playQuestions(fullText, personality);
            this.updateStatus(statusElement, 'completed', '再生完了');
            
        } catch (error) {
            console.error('音声再生エラー:', error);
            this.updateStatus(statusElement, 'error', 'エラー: ' + error.message);
        }
    }

    // 審査員の導入メッセージを取得
    getJudgeIntroduction(judgeType) {
        const personality = JUDGE_PERSONALITIES[judgeType];
        const introductions = {
            professor: `${personality.name}として、学術的な観点から質問させていただきます。`,
            entrepreneur: `${personality.name}として、実践的な視点から質問させていただきます。`,
            vc: `${personality.name}として、投資家の観点から質問させていただきます。`,
            tech_expert: `${personality.name}として、技術的な観点から質問させていただきます。`
        };
        return introductions[judgeType] || `${personality.name}から質問です。`;
    }

    // 評価結果から質問を抽出
    extractQuestionsFromResult(judgeType) {
        // アプリの結果データから質問を抽出
        if (window.app && window.app.analysisResults && window.app.analysisResults[judgeType]) {
            const evaluation = window.app.analysisResults[judgeType].evaluation;
            console.log(`${judgeType}の評価結果から質問抽出:`, evaluation.substring(0, 200) + '...');
            
            const questionMatch = evaluation.match(/## ❓ 深掘り質問\s*([\s\S]*?)(?=## |$)/);
            
            if (questionMatch) {
                const questions = questionMatch[1]
                    .split('\n')
                    .filter(line => line.trim() && /^\d+\./.test(line.trim()))
                    .map(line => line.replace(/^\d+\.\s*/, '').trim())
                    .filter(question => question && question.length > 0)
                    .slice(0, 3); // 3つまでに制限
                    
                console.log(`${judgeType}の抽出された質問:`, questions);
                
                if (questions.length > 0) {
                    return questions.join('。 ');  // 句点で区切って自然な音声に
                }
            }
        }
        
        // フォールバック: サンプル質問を使用
        const personality = JUDGE_PERSONALITIES[judgeType];
        const fallbackQuestions = personality.sampleQuestions.slice(0, 3);
        console.log(`${judgeType}のフォールバック質問使用:`, fallbackQuestions);
        return fallbackQuestions.join('。 ');
    }

    // ステータス更新
    updateStatus(statusElement, status, message) {
        if (!statusElement) return;
        
        const statusText = statusElement.querySelector('.status-text');
        const progressIndicator = statusElement.querySelector('.progress-indicator');
        
        if (statusText) {
            statusText.textContent = message;
        }
        
        statusElement.className = `voice-status status-${status}`;
        
        if (status === 'generating' || status === 'playing') {
            if (progressIndicator) {
                progressIndicator.style.display = 'block';
            }
        } else {
            if (progressIndicator) {
                progressIndicator.style.display = 'none';
            }
        }
    }

    // 最後の音声を再生
    replayLastAudio() {
        // 実装は具体的な要件に応じて
        console.log('再生機能は今後実装予定です');
    }

    // 一括音声再生
    async playAllJudgesQuestions(selectedJudges) {
        try {
            for (const judgeType of selectedJudges) {
                await this.playJudgeQuestions(judgeType);
                // 次の審査員との間に少し間隔を空ける
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error('一括再生エラー:', error);
            throw error;
        }
    }

    // 音声ガイダンス再生
    async playGuidance(message, voice = 'alloy') {
        try {
            const audioBlob = await this.openAIClient.generateSpeech(message, voice, 1.0);
            await this.playAudioBlob(audioBlob);
        } catch (error) {
            console.error('ガイダンス再生エラー:', error);
        }
    }

    // ブラウザの音声サポートチェック
    checkAudioSupport() {
        return {
            audioSupport: !!window.Audio,
            webAudioAPI: !!window.AudioContext || !!window.webkitAudioContext,
            mediaRecorder: !!window.MediaRecorder,
            speechSynthesis: !!window.speechSynthesis
        };
    }

    // 音声設定のエクスポート
    exportSettings() {
        return {
            volume: this.volume,
            playbackSpeed: this.playbackSpeed,
            cacheSize: this.audioCache.size
        };
    }

    // 音声設定のインポート
    importSettings(settings) {
        if (settings.volume !== undefined) {
            this.setVolume(settings.volume);
        }
        if (settings.playbackSpeed !== undefined) {
            this.setPlaybackSpeed(settings.playbackSpeed);
        }
    }

    // キャッシュクリア
    clearCache() {
        this.audioCache.clear();
    }

    // リソース解放
    dispose() {
        this.stopCurrentAudio();
        this.clearCache();
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceController;
}