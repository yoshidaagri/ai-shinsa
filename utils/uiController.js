// AI審査員システム - UI制御ユーティリティ

class UIController {
    constructor() {
        this.loadingMessages = UI_CONFIG.loading.messages;
        this.currentMessageIndex = 0;
        this.messageInterval = null;
        this.isLoading = false;
    }

    // ローディング表示
    showLoading(customMessage = null) {
        const loadingElement = document.getElementById('loading');
        const textElement = loadingElement.querySelector('.loading-text');
        
        if (customMessage) {
            textElement.textContent = customMessage;
        } else {
            this.startLoadingMessages();
        }
        
        loadingElement.style.display = 'flex';
        this.isLoading = true;
        
        // プログレスバーアニメーション
        this.animateProgressBar();
    }

    // 進捗付きローディング表示
    showLoadingWithProgress(message, currentStep, totalSteps) {
        const loadingElement = document.getElementById('loading');
        const textElement = loadingElement.querySelector('.loading-text');
        
        // メッセージに進捗情報を追加
        const progressText = `${message} (${currentStep}/${totalSteps})`;
        textElement.textContent = progressText;
        
        loadingElement.style.display = 'flex';
        this.isLoading = true;
        
        // プログレスバーを段階的に更新
        this.updateProgressBar(currentStep, totalSteps);
    }

    // プログレスバーの段階的更新
    updateProgressBar(currentStep, totalSteps) {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            const percentage = (currentStep / totalSteps) * 100;
            progressBar.style.width = `${percentage}%`;
            progressBar.style.transition = 'width 0.5s ease-in-out';
        }
    }

    // ローディング非表示
    hideLoading() {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = 'none';
        this.isLoading = false;
        
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
            this.messageInterval = null;
        }
    }

    // ローディングメッセージの循環表示
    startLoadingMessages() {
        const textElement = document.querySelector('.loading-text');
        this.currentMessageIndex = 0;
        
        textElement.textContent = this.loadingMessages[this.currentMessageIndex];
        
        this.messageInterval = setInterval(() => {
            this.currentMessageIndex = (this.currentMessageIndex + 1) % this.loadingMessages.length;
            textElement.textContent = this.loadingMessages[this.currentMessageIndex];
        }, 3000);
    }

    // プログレスバーアニメーション
    animateProgressBar() {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.animation = 'progress 2s ease-in-out infinite';
        }
    }

    // 成功メッセージ表示
    showSuccess(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    }

    // エラーメッセージ表示
    showError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }

    // 警告メッセージ表示
    showWarning(message, duration = 4000) {
        this.showNotification(message, 'warning', duration);
    }

    // 通知メッセージ表示
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = this.getNotificationIcon(type);
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // スタイル設定
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '9999',
            padding: '15px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            maxWidth: '400px',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            ...this.getNotificationStyles(type)
        });
        
        document.body.appendChild(notification);
        
        // アニメーション表示
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自動削除
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.parentElement.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // 通知タイプ別アイコン
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // 通知タイプ別スタイル
    getNotificationStyles(type) {
        const styles = {
            success: {
                backgroundColor: '#d4edda',
                color: '#155724',
                border: '1px solid #c3e6cb'
            },
            error: {
                backgroundColor: '#f8d7da',
                color: '#721c24',
                border: '1px solid #f5c6cb'
            },
            warning: {
                backgroundColor: '#fff3cd',
                color: '#856404',
                border: '1px solid #ffeaa7'
            },
            info: {
                backgroundColor: '#d1ecf1',
                color: '#0c5460',
                border: '1px solid #bee5eb'
            }
        };
        return styles[type] || styles.info;
    }

    // ストリーミングテキスト表示
    async displayStreamingText(element, text, speed = 50) {
        element.textContent = '';
        
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    }

    // タイプライター効果
    async typeWriter(element, text, speed = 30) {
        element.innerHTML = '';
        
        for (let i = 0; i < text.length; i++) {
            element.innerHTML += text[i];
            if (text[i] === '\n') {
                element.innerHTML += '<br>';
            }
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    }

    // フェードイン効果
    fadeIn(element, duration = 500) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let opacity = 0;
        const increment = 1 / (duration / 16);
        
        const fade = () => {
            opacity += increment;
            element.style.opacity = opacity;
            
            if (opacity < 1) {
                requestAnimationFrame(fade);
            }
        };
        
        fade();
    }

    // フェードアウト効果
    fadeOut(element, duration = 500) {
        let opacity = 1;
        const decrement = 1 / (duration / 16);
        
        const fade = () => {
            opacity -= decrement;
            element.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(fade);
            } else {
                element.style.display = 'none';
            }
        };
        
        fade();
    }

    // スムーズスクロール
    scrollToElement(element, offset = 0) {
        const elementTop = element.offsetTop - offset;
        window.scrollTo({
            top: elementTop,
            behavior: 'smooth'
        });
    }

    // 要素の表示/非表示切り替え
    toggleElement(element, show = null) {
        if (show === null) {
            show = element.style.display === 'none';
        }
        
        if (show) {
            this.fadeIn(element);
        } else {
            this.fadeOut(element);
        }
    }

    // 要素の有効/無効切り替え
    toggleElementEnabled(element, enabled = null) {
        if (!element) {
            console.warn('toggleElementEnabled: 要素がnullです');
            return;
        }
        
        if (enabled === null) {
            enabled = element.disabled;
        }
        
        element.disabled = !enabled;
        
        if (enabled) {
            element.classList.remove('disabled');
        } else {
            element.classList.add('disabled');
        }
    }

    // ボタンの状態更新
    updateButtonState(button, state, text = null) {
        if (!button) {
            console.warn('updateButtonState: ボタン要素がnullです');
            return;
        }
        
        const states = {
            loading: {
                disabled: true,
                class: 'loading',
                text: text || '処理中...'
            },
            success: {
                disabled: false,
                class: 'success',
                text: text || '完了'
            },
            error: {
                disabled: false,
                class: 'error',
                text: text || 'エラー'
            },
            normal: {
                disabled: false,
                class: '',
                text: text || button.dataset.originalText || button.textContent
            }
        };
        
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }
        
        const config = states[state];
        button.disabled = config.disabled;
        button.className = button.className.replace(/(loading|success|error)/g, '');
        if (config.class) {
            button.classList.add(config.class);
        }
        button.textContent = config.text;
    }

    // 動的コンテンツ生成
    createElement(tag, className = '', content = '', attributes = {}) {
        const element = document.createElement(tag);
        
        if (className) {
            element.className = className;
        }
        
        if (content) {
            element.innerHTML = content;
        }
        
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        
        return element;
    }

    // 確認ダイアログ
    showConfirmDialog(message, onConfirm, onCancel = null) {
        const overlay = this.createElement('div', 'dialog-overlay');
        const dialog = this.createElement('div', 'confirm-dialog');
        
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>確認</h3>
                <p>${message}</p>
                <div class="dialog-buttons">
                    <button class="btn-confirm">OK</button>
                    <button class="btn-cancel">キャンセル</button>
                </div>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // イベントリスナー
        dialog.querySelector('.btn-confirm').onclick = () => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        };
        
        dialog.querySelector('.btn-cancel').onclick = () => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        };
        
        // オーバーレイクリックで閉じる
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                if (onCancel) onCancel();
            }
        };
        
        // スタイル設定
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '10000'
        });
        
        Object.assign(dialog.style, {
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            maxWidth: '400px',
            width: '90%'
        });
    }

    // プログレス表示
    showProgress(label, current, total) {
        let progressElement = document.getElementById('progress-indicator');
        
        if (!progressElement) {
            progressElement = this.createElement('div', 'progress-indicator');
            progressElement.id = 'progress-indicator';
            progressElement.innerHTML = `
                <div class="progress-label"></div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill"></div>
                </div>
                <div class="progress-text"></div>
            `;
            document.body.appendChild(progressElement);
        }
        
        const labelElement = progressElement.querySelector('.progress-label');
        const fillElement = progressElement.querySelector('.progress-bar-fill');
        const textElement = progressElement.querySelector('.progress-text');
        
        labelElement.textContent = label;
        textElement.textContent = `${current} / ${total}`;
        
        const percentage = (current / total) * 100;
        fillElement.style.width = `${percentage}%`;
        
        progressElement.style.display = 'block';
        
        if (current >= total) {
            setTimeout(() => {
                progressElement.style.display = 'none';
            }, 1000);
        }
    }

    // デバッグ情報表示
    showDebugInfo(info) {
        if (!getLocalConfig().debugMode) return;
        
        console.log('Debug Info:', info);
        
        const debugElement = document.getElementById('debug-info');
        if (debugElement) {
            debugElement.innerHTML = `
                <pre>${JSON.stringify(info, null, 2)}</pre>
            `;
        }
    }

    // 審査員詳細情報表示
    showJudgeDetails(judgeType, containerId) {
        const judge = getJudgeDetails(judgeType);
        const container = document.getElementById(containerId);
        
        if (!container || !judge) {
            console.warn('審査員詳細表示: コンテナまたは審査員情報が見つかりません');
            return;
        }

        const detailsHTML = `
            <div class="judge-details" id="judge-details-${judgeType}">
                <div class="judge-header">
                    <span class="judge-icon">${judge.icon}</span>
                    <h3 class="judge-name">${judge.name}</h3>
                    <p class="judge-description">${judge.description}</p>
                </div>
                
                <div class="judge-specialties">
                    <h4>専門分野</h4>
                    <div class="specialty-tags">
                        ${judge.specialties?.map(specialty => 
                            `<span class="specialty-tag">${specialty}</span>`
                        ).join('') || ''}
                    </div>
                </div>
                
                <div class="judge-evaluation-style">
                    <h4>評価スタイル</h4>
                    <div class="evaluation-style-grid">
                        <div class="style-item">
                            <strong>トーン:</strong> ${judge.evaluationStyle?.tone || '標準'}
                        </div>
                        <div class="style-item">
                            <strong>重視点:</strong> ${judge.evaluationStyle?.focus || '総合評価'}
                        </div>
                        <div class="style-item">
                            <strong>強み:</strong> ${judge.evaluationStyle?.strengths || '総合判断'}
                        </div>
                        <div class="style-item">
                            <strong>質問スタイル:</strong> ${judge.evaluationStyle?.questions || '一般的な質問'}
                        </div>
                    </div>
                </div>

                <div class="judge-sample-questions">
                    <h4>想定される質問例</h4>
                    <ul class="sample-questions-list">
                        ${judge.sampleQuestions?.slice(0, 3).map(question => 
                            `<li class="sample-question">${question}</li>`
                        ).join('') || ''}
                    </ul>
                </div>
            </div>
        `;
        
        container.innerHTML = detailsHTML;
        this.fadeIn(container);
    }

    // 審査員比較表示
    showJudgeComparison(selectedJudges, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const judges = selectedJudges.map(judgeType => getJudgeDetails(judgeType));
        
        const comparisonHTML = `
            <div class="judge-comparison">
                <h3>選択された審査員の比較</h3>
                <div class="comparison-grid">
                    ${judges.map(judge => `
                        <div class="judge-comparison-card">
                            <div class="judge-header">
                                <span class="judge-icon">${judge.icon}</span>
                                <h4>${judge.name}</h4>
                            </div>
                            
                            <div class="comparison-section">
                                <strong>専門分野:</strong>
                                <div class="mini-tags">
                                    ${judge.specialties?.slice(0, 2).map(s => 
                                        `<span class="mini-tag">${s}</span>`
                                    ).join('') || ''}
                                </div>
                            </div>
                            
                            <div class="comparison-section">
                                <strong>評価の特徴:</strong>
                                <p class="evaluation-feature">${judge.evaluationStyle?.focus || '総合評価'}</p>
                            </div>
                            
                            <div class="comparison-section">
                                <strong>音声設定:</strong>
                                <p class="voice-info">🔊 ${judge.voice?.voice || 'alloy'} (${judge.voice?.speed || 1.0}x)</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = comparisonHTML;
        this.fadeIn(container);
    }

    // 審査員選択UI強化
    enhanceJudgeSelectionUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const judges = getAllJudges();
        
        const enhancedHTML = `
            <div class="enhanced-judge-selection">
                <h3>AI審査員を選択してください</h3>
                <p class="selection-help">複数の審査員を選択すると、それぞれの専門観点から評価を受けることができます。</p>
                
                <div class="judge-selection-grid">
                    ${judges.map(judge => `
                        <div class="judge-selection-card" data-judge-type="${judge.type}">
                            <input type="checkbox" id="judge-${judge.type}" class="judge-checkbox" 
                                   onchange="window.app?.updateJudgeSelection?.('${judge.type}', this.checked)">
                            <label for="judge-${judge.type}" class="judge-card-label">
                                <div class="judge-card-header">
                                    <span class="judge-icon-large">${judge.icon}</span>
                                    <h4 class="judge-title">${judge.name}</h4>
                                </div>
                                
                                <p class="judge-description">${judge.description}</p>
                                
                                <div class="judge-specialties-preview">
                                    ${judge.specialties?.slice(0, 2).map(specialty => 
                                        `<span class="specialty-preview-tag">${specialty}</span>`
                                    ).join('') || ''}
                                    ${judge.specialties?.length > 2 ? '<span class="more-specialties">+他</span>' : ''}
                                </div>
                                
                                <div class="judge-evaluation-preview">
                                    <strong>評価の特徴:</strong> ${judge.evaluationStyle?.tone || '標準的'}
                                </div>
                                
                                <button type="button" class="judge-details-btn" 
                                        onclick="window.uiController?.showJudgeDetailsModal?.('${judge.type}')">
                                    詳細を見る
                                </button>
                            </label>
                        </div>
                    `).join('')}
                </div>
                
                <div class="selection-summary" id="judge-selection-summary" style="display: none;">
                    <h4>選択中の審査員:</h4>
                    <div class="selected-judges-list" id="selected-judges-list"></div>
                </div>
            </div>
        `;
        
        container.innerHTML = enhancedHTML;
    }

    // 審査員詳細モーダル表示
    showJudgeDetailsModal(judgeType) {
        const judge = getJudgeDetails(judgeType);
        if (!judge) return;

        const modal = this.createElement('div', 'judge-modal-overlay');
        const modalContent = this.createElement('div', 'judge-modal-content');
        
        modalContent.innerHTML = `
            <div class="judge-modal-header">
                <div class="judge-modal-title">
                    <span class="judge-icon-modal">${judge.icon}</span>
                    <h2>${judge.name}</h2>
                </div>
                <button class="modal-close-btn" onclick="this.closest('.judge-modal-overlay').remove()">×</button>
            </div>
            
            <div class="judge-modal-body">
                <div class="judge-description-full">
                    <p>${judge.description}</p>
                </div>
                
                <div class="judge-detailed-info">
                    <div class="info-section">
                        <h3>🎯 専門分野</h3>
                        <div class="specialties-detailed">
                            ${judge.specialties?.map(specialty => 
                                `<span class="specialty-detailed-tag">${specialty}</span>`
                            ).join('') || ''}
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3>📝 評価スタイル</h3>
                        <div class="evaluation-style-detailed">
                            <div class="style-detail-item">
                                <strong>評価のトーン:</strong> ${judge.evaluationStyle?.tone || '標準'}
                            </div>
                            <div class="style-detail-item">
                                <strong>重視する観点:</strong> ${judge.evaluationStyle?.focus || '総合評価'}
                            </div>
                            <div class="style-detail-item">
                                <strong>質問のアプローチ:</strong> ${judge.evaluationStyle?.questions || '一般的な質問'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3>❓ 想定される質問例</h3>
                        <div class="sample-questions-detailed">
                            ${judge.sampleQuestions?.map((question, index) => 
                                `<div class="sample-question-item">
                                    <span class="question-number">${index + 1}.</span>
                                    <span class="question-text">${question}</span>
                                </div>`
                            ).join('') || ''}
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3>🔊 音声設定</h3>
                        <div class="voice-settings-info">
                            <div class="voice-detail">
                                <strong>音声タイプ:</strong> ${judge.voice?.voice || 'alloy'}
                            </div>
                            <div class="voice-detail">
                                <strong>話速:</strong> ${judge.voice?.speed || 1.0}x
                            </div>
                            <div class="voice-detail">
                                <strong>特徴:</strong> ${this.getVoiceDescription(judge.voice?.voice)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="judge-modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.judge-modal-overlay').remove()">
                    閉じる
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // モーダルスタイル設定
        Object.assign(modal.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '10000',
            overflow: 'auto'
        });
        
        Object.assign(modalContent.style, {
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90%',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        });
        
        // オーバーレイクリックで閉じる
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }

    // 音声タイプの説明を取得
    getVoiceDescription(voiceType) {
        const descriptions = {
            'alloy': 'バランスの取れた標準的な音声',
            'echo': 'クリアで明瞭な音声',
            'fable': '落ち着いた知的な音声',
            'onyx': '力強く自信に満ちた音声',
            'nova': '洗練された分析的な音声',
            'shimmer': '明るく親しみやすい音声'
        };
        return descriptions[voiceType] || '標準的な音声';
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}