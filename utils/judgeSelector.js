// AI審査員システム - 審査員選択機能

class JudgeSelector {
    constructor() {
        this.selectedJudges = new Set();
        this.maxSelections = 4; // 最大選択数
        this.minSelections = 1; // 最小選択数
        this.onSelectionChange = null;
        this.judgeCards = [];
        
        this.initialize();
    }

    // 初期化
    initialize() {
        this.judgeCards = document.querySelectorAll('.judge-card');
        this.setupEventListeners();
        this.loadSavedSelections();
    }

    // イベントリスナーの設定
    setupEventListeners() {
        this.judgeCards.forEach(card => {
            card.addEventListener('click', (e) => {
                this.toggleJudgeSelection(card);
            });
            
            // ホバー効果
            card.addEventListener('mouseenter', () => {
                this.showJudgeDetails(card);
            });
            
            card.addEventListener('mouseleave', () => {
                this.hideJudgeDetails();
            });
        });
    }

    // 審査員の選択/解除
    toggleJudgeSelection(card) {
        const judgeType = card.dataset.judge;
        const wasSelected = this.selectedJudges.has(judgeType);
        
        if (wasSelected) {
            this.deselectJudge(judgeType);
        } else {
            this.selectJudge(judgeType);
        }
        
        this.updateUI();
        
        // アニメーション効果を追加
        if (window.app && window.app.animationController) {
            if (!wasSelected) {
                window.app.animationController.animateJudgeSelection(card, true);
            } else {
                window.app.animationController.animateElement(card, 'fade-in-up');
            }
        }
        
        this.saveSelections();
        this.triggerSelectionChange();
    }

    // 審査員を選択
    selectJudge(judgeType) {
        if (this.selectedJudges.size >= this.maxSelections) {
            this.showWarning(`最大${this.maxSelections}名まで選択可能です`);
            return false;
        }
        
        this.selectedJudges.add(judgeType);
        return true;
    }

    // 審査員の選択を解除
    deselectJudge(judgeType) {
        this.selectedJudges.delete(judgeType);
        return true;
    }

    // 全ての審査員を選択
    selectAllJudges() {
        const allJudges = Array.from(this.judgeCards).map(card => card.dataset.judge);
        allJudges.forEach(judgeType => {
            this.selectedJudges.add(judgeType);
        });
        
        this.updateUI();
        this.saveSelections();
        this.triggerSelectionChange();
    }

    // 全ての選択を解除
    deselectAllJudges() {
        this.selectedJudges.clear();
        this.updateUI();
        this.saveSelections();
        this.triggerSelectionChange();
    }

    // UI更新
    updateUI() {
        this.judgeCards.forEach(card => {
            if (!card || !card.dataset) {
                console.warn('無効な審査員カードをスキップしました');
                return;
            }
            
            const judgeType = card.dataset.judge;
            const isSelected = this.selectedJudges.has(judgeType);
            
            if (isSelected) {
                card.classList.add('selected');
                card.setAttribute('aria-selected', 'true');
            } else {
                card.classList.remove('selected');
                card.setAttribute('aria-selected', 'false');
            }
        });
        
        this.updateSelectionSummary();
    }

    // 選択サマリー更新
    updateSelectionSummary() {
        let summaryElement = document.getElementById('judge-selection-summary');
        
        if (!summaryElement) {
            summaryElement = document.createElement('div');
            summaryElement.id = 'judge-selection-summary';
            summaryElement.className = 'judge-selection-summary';
            
            const judgeSection = document.querySelector('.judge-selection');
            judgeSection.appendChild(summaryElement);
        }
        
        const count = this.selectedJudges.size;
        const selectedNames = Array.from(this.selectedJudges).map(type => {
            const personality = JUDGE_PERSONALITIES[type];
            return `${personality.icon} ${personality.name}`;
        });
        
        if (count === 0) {
            summaryElement.innerHTML = `
                <div class="summary-message">
                    <span class="summary-icon">👆</span>
                    <span>審査員を選択してください</span>
                </div>
            `;
        } else {
            summaryElement.innerHTML = `
                <div class="summary-message">
                    <span class="summary-icon">✨</span>
                    <span>選択中 (${count}/${this.maxSelections}): ${selectedNames.join(', ')}</span>
                </div>
                <div class="summary-actions">
                    <button class="btn-small" onclick="judgeSelector.selectAllJudges()">全選択</button>
                    <button class="btn-small" onclick="judgeSelector.deselectAllJudges()">選択解除</button>
                </div>
            `;
        }
    }

    // 審査員詳細表示
    showJudgeDetails(card) {
        const judgeType = card.dataset.judge;
        const personality = JUDGE_PERSONALITIES[judgeType];
        
        let tooltip = document.getElementById('judge-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'judge-tooltip';
            tooltip.className = 'judge-tooltip';
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <span class="tooltip-icon">${personality.icon}</span>
                <span class="tooltip-title">${personality.name}</span>
            </div>
            <div class="tooltip-description">
                ${personality.description}
            </div>
            <div class="tooltip-sample-questions">
                <h4>サンプル質問:</h4>
                <ul>
                    ${personality.sampleQuestions.slice(0, 3).map(q => `<li>${q}</li>`).join('')}
                </ul>
            </div>
        `;
        
        // 位置調整
        const rect = card.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;
        tooltip.style.display = 'block';
        
        // 画面端での位置調整
        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            tooltip.style.left = `${rect.left - tooltipRect.width - 10}px`;
        }
        if (tooltipRect.bottom > window.innerHeight) {
            tooltip.style.top = `${rect.bottom - tooltipRect.height}px`;
        }
    }

    // 審査員詳細非表示
    hideJudgeDetails() {
        const tooltip = document.getElementById('judge-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    // 選択状態の保存
    saveSelections() {
        const selections = Array.from(this.selectedJudges);
        localStorage.setItem('selected_judges', JSON.stringify(selections));
    }

    // 保存された選択状態の読み込み
    loadSavedSelections() {
        const saved = localStorage.getItem('selected_judges');
        if (saved) {
            try {
                const selections = JSON.parse(saved);
                selections.forEach(judgeType => {
                    if (JUDGE_PERSONALITIES[judgeType]) {
                        this.selectedJudges.add(judgeType);
                    }
                });
                this.updateUI();
            } catch (error) {
                console.warn('保存された審査員選択の読み込みに失敗しました:', error);
            }
        }
    }

    // 選択変更時のコールバック設定
    setSelectionChangeCallback(callback) {
        this.onSelectionChange = callback;
    }

    // 選択変更の通知
    triggerSelectionChange() {
        if (this.onSelectionChange) {
            this.onSelectionChange(this.getSelectedJudges());
        }
    }

    // 選択された審査員の取得
    getSelectedJudges() {
        return Array.from(this.selectedJudges);
    }

    // 選択状態の確認
    isJudgeSelected(judgeType) {
        return this.selectedJudges.has(judgeType);
    }

    // 選択数の取得
    getSelectionCount() {
        return this.selectedJudges.size;
    }

    // 選択の妥当性確認
    isSelectionValid() {
        const count = this.selectedJudges.size;
        return count >= this.minSelections && count <= this.maxSelections;
    }

    // 選択エラーメッセージの取得
    getSelectionError() {
        const count = this.selectedJudges.size;
        
        if (count < this.minSelections) {
            return `最低${this.minSelections}名の審査員を選択してください`;
        }
        
        if (count > this.maxSelections) {
            return `最大${this.maxSelections}名まで選択可能です`;
        }
        
        return null;
    }

    // 推奨組み合わせの提案
    suggestJudgeCombinations() {
        const combinations = [
            {
                name: '総合評価',
                judges: ['professor', 'entrepreneur', 'vc', 'tech_expert'],
                description: '全ての観点から総合的に評価'
            },
            {
                name: 'ビジネス重視',
                judges: ['entrepreneur', 'vc', 'tech_expert'],
                description: '実践的なビジネス観点を重視'
            },
            {
                name: '学術重視',
                judges: ['professor', 'tech_expert'],
                description: '学術的・技術的観点を重視'
            },
            {
                name: '投資検討',
                judges: ['vc', 'entrepreneur'],
                description: '投資価値と市場性を重視'
            }
        ];
        
        return combinations;
    }

    // 推奨組み合わせの表示
    showCombinationSuggestions() {
        const suggestions = this.suggestJudgeCombinations();
        
        let suggestionElement = document.getElementById('judge-suggestions');
        if (!suggestionElement) {
            suggestionElement = document.createElement('div');
            suggestionElement.id = 'judge-suggestions';
            suggestionElement.className = 'judge-suggestions';
            
            const judgeSection = document.querySelector('.judge-selection');
            judgeSection.appendChild(suggestionElement);
        }
        
        suggestionElement.innerHTML = `
            <h3>推奨組み合わせ</h3>
            <div class="suggestions-grid">
                ${suggestions.map(combo => `
                    <div class="suggestion-card" onclick="judgeSelector.applyCombination('${combo.judges.join(',')}')">
                        <h4>${combo.name}</h4>
                        <p>${combo.description}</p>
                        <div class="suggestion-judges">
                            ${combo.judges.map(type => {
                                const personality = JUDGE_PERSONALITIES[type];
                                return `<span class="suggestion-judge">${personality.icon} ${personality.name}</span>`;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 組み合わせの適用
    applyCombination(judgeString) {
        const judges = judgeString.split(',');
        this.selectedJudges.clear();
        
        judges.forEach(judgeType => {
            if (JUDGE_PERSONALITIES[judgeType]) {
                this.selectedJudges.add(judgeType);
            }
        });
        
        this.updateUI();
        this.saveSelections();
        this.triggerSelectionChange();
    }

    // 警告メッセージ表示
    showWarning(message) {
        const uiController = new UIController();
        uiController.showWarning(message);
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JudgeSelector;
}