// AI審査員システム - OpenAI API クライアント

class OpenAIClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = OPENAI_CONFIG.baseURL;
        this.models = OPENAI_CONFIG.models;
        this.maxRetries = OPENAI_CONFIG.maxRetries;
        this.timeout = OPENAI_CONFIG.timeout;
    }

    // APIキーの検証
    validateApiKey() {
        if (!this.apiKey) {
            throw new Error('APIキーが設定されていません');
        }
        if (!this.apiKey.startsWith('sk-')) {
            throw new Error('無効なAPIキーです');
        }
        return true;
    }

    // API呼び出しの基本メソッド
    async makeAPICall(endpoint, options = {}) {
        this.validateApiKey();

        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: this.timeout,
            ...options
        };

        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await this.fetchWithTimeout(url, defaultOptions);
                
                if (!response.ok) {
                    let errorData = {};
                    try {
                        errorData = await response.json();
                    } catch (e) {
                        console.warn('Error response is not JSON:', e);
                    }
                    
                    const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
                    console.error('API Error:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorData: errorData,
                        url: url
                    });
                    
                    throw new APIError(errorMessage, response.status, errorData);
                }

                return response;
            } catch (error) {
                lastError = error;
                
                if (attempt === this.maxRetries) {
                    throw error;
                }

                // リトライ前の待機時間（指数バックオフ）
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        throw lastError;
    }

    // タイムアウト付きfetch
    async fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('リクエストがタイムアウトしました');
            }
            throw error;
        }
    }

    // 音声文字起こし
    async transcribeAudio(audioFile) {
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', this.models.audio);
        formData.append('language', 'ja');
        formData.append('response_format', 'json');

        const response = await this.makeAPICall('/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                // Content-Typeはブラウザが自動設定
            },
            body: formData
        });

        const result = await response.json();
        return result;
    }

    // スライド分析（PDF・PowerPoint）
    async analyzeSlide(slideFile) {
        const fileHandler = new FileHandler();
        
        try {
            let analysisText = '';
            
            if (fileHandler.isPDFFile(slideFile)) {
                // PDFテキスト抽出
                const pdfProcessor = new PDFProcessor();
                const pdfResult = await pdfProcessor.extractTextFromPDF(slideFile);
                analysisText = pdfResult.text;
                
            } else if (fileHandler.isPowerPointFile(slideFile)) {
                // PowerPointテキスト抽出
                const pptProcessor = new PowerPointProcessor();
                const pptResult = await pptProcessor.extractTextFromPowerPoint(slideFile);
                analysisText = pptResult.text;
                
            } else {
                throw new Error('サポートされていないファイル形式です');
            }
            
            // 抽出したテキストをGPTで分析
            const analysisPrompt = `
${PROMPTS.slideAnalysis}

【抽出されたテキスト内容】
${analysisText}

上記のスライド内容を分析し、構造化された形式で要約してください。
            `;
            
            const messages = [
                {
                    role: 'user',
                    content: analysisPrompt
                }
            ];

            const response = await this.makeAPICall('/chat/completions', {
                method: 'POST',
                body: JSON.stringify({
                    model: this.models.text,
                    messages: messages,
                    max_completion_tokens: 3000
                })
            });

            const result = await response.json();
            return {
                analysis: result.choices[0].message.content,
                extractedText: analysisText,
                usage: result.usage
            };
            
        } catch (error) {
            console.error('スライド分析エラー:', error);
            throw new Error(`スライド分析に失敗しました: ${error.message}`);
        }
    }

    // 評価生成（ストリーミング対応）
    async generateEvaluation(prompt, streaming = false, onStreamChunk = null) {
        console.log('評価生成開始:', {
            model: this.models.text,
            streaming: streaming,
            promptLength: prompt.length
        });
        
        const messages = [
            {
                role: 'system',
                content: '学生のピッチ評価を行うAI審査員です。ポジティブで建設的なフィードバックを心がけてください。'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const requestBody = {
            model: this.models.text,
            messages: messages,
            max_completion_tokens: 4000,
            stream: streaming
        };

        if (streaming) {
            return this.generateEvaluationStreaming(requestBody, onStreamChunk);
        } else {
            const response = await this.makeAPICall('/chat/completions', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();
            return result.choices[0].message.content;
        }
    }

    // ストリーミング評価生成
    async generateEvaluationStreaming(requestBody, onStreamChunk = null) {
        const response = await this.makeAPICall('/chat/completions', {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            return fullContent;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content || '';
                            if (content) {
                                fullContent += content;
                                
                                // ストリーミングコールバックを呼び出し
                                if (onStreamChunk) {
                                    onStreamChunk(content);
                                }
                            }
                        } catch (e) {
                            // JSON解析エラーは無視
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        return fullContent;
    }

    // 音声合成（TTS）
    async generateSpeech(text, voice = 'alloy', speed = 1.0) {
        const response = await this.makeAPICall('/audio/speech', {
            method: 'POST',
            body: JSON.stringify({
                model: this.models.tts,
                input: text,
                voice: voice,
                speed: speed
            })
        });

        const audioBlob = await response.blob();
        return audioBlob;
    }

    // 審査員別音声生成
    async generateJudgeVoice(text, judgeType) {
        const voiceSettings = getVoiceSettings(judgeType);
        
        return await this.generateSpeech(
            text,
            voiceSettings.voice,
            voiceSettings.speed
        );
    }

    // API使用量チェック
    async checkUsage() {
        try {
            const response = await this.makeAPICall('/usage', {
                method: 'GET'
            });
            return await response.json();
        } catch (error) {
            console.warn('使用量チェックに失敗しました:', error);
            return null;
        }
    }

    // 接続テスト
    async testConnection() {
        try {
            const response = await this.makeAPICall('/models', {
                method: 'GET'
            });
            
            const models = await response.json();
            return {
                success: true,
                models: models.data.map(m => m.id)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// APIエラークラス
class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }

    // エラーメッセージを日本語に変換
    getLocalizedMessage() {
        const errorMessages = {
            'invalid_api_key': 'APIキーが無効です',
            'insufficient_quota': 'API使用量の上限に達しました',
            'rate_limit_exceeded': 'リクエスト頻度が上限を超えています',
            'model_not_found': 'モデルが見つかりません',
            'context_length_exceeded': '入力が長すぎます',
            'content_filter': 'コンテンツが安全基準に適合しません'
        };

        const errorType = this.data?.error?.type || this.data?.error?.code;
        return errorMessages[errorType] || this.message;
    }
}

// ヘルパー関数
function createOpenAIClient(apiKey) {
    return new OpenAIClient(apiKey);
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OpenAIClient, APIError, createOpenAIClient };
}