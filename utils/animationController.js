// AI審査員システム - アニメーション制御ユーティリティ

class AnimationController {
    constructor() {
        this.animationQueue = [];
        this.isAnimating = false;
        this.intersectionObserver = null;
        
        this.initializeObserver();
    }

    // インターセクションオブザーバーの初期化
    initializeObserver() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.triggerAnimation(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
        }
    }

    // 要素にアニメーションを適用
    animateElement(element, animationType, delay = 0) {
        if (!element) return;

        setTimeout(() => {
            element.classList.add(`animate-${animationType}`);
            
            // アニメーション完了後にクラスを削除
            element.addEventListener('animationend', () => {
                element.classList.remove(`animate-${animationType}`);
            }, { once: true });
        }, delay);
    }

    // 複数要素の連続アニメーション
    animateSequence(elements, animationType, interval = 100) {
        elements.forEach((element, index) => {
            this.animateElement(element, animationType, index * interval);
        });
    }

    // 審査員カード選択のアニメーション
    animateJudgeSelection(card, selected) {
        if (selected) {
            card.classList.add('animate-bounce-in');
            this.createSuccessParticles(card);
        } else {
            card.classList.add('animate-fade-in-up');
        }
    }

    // 成功パーティクルエフェクト
    createSuccessParticles(element) {
        element.classList.add('success-particles');
        
        setTimeout(() => {
            element.classList.remove('success-particles');
        }, 1000);
    }

    // ストリーミングテキストのアニメーション
    animateStreamingText(element, text, speed = 50) {
        if (!element) return;

        element.textContent = '';
        let index = 0;

        const typeInterval = setInterval(() => {
            if (index < text.length) {
                element.textContent += text[index];
                index++;
            } else {
                clearInterval(typeInterval);
            }
        }, speed);

        return typeInterval;
    }

    // ローディングアニメーションの強化
    enhanceLoadingAnimation(loadingElement) {
        const spinner = loadingElement.querySelector('.loading-spinner');
        const text = loadingElement.querySelector('.loading-text');
        
        if (spinner) {
            spinner.style.animation = 'spin 1s linear infinite, colorShift 3s ease-in-out infinite';
        }
        
        if (text) {
            this.animateLoadingText(text);
        }
    }

    // ローディングテキストのアニメーション
    animateLoadingText(textElement) {
        const texts = [
            'AI審査員が分析中...',
            '深い洞察を生成中...',
            'もう少しお待ちください...',
            '評価を最終化中...'
        ];
        
        let currentIndex = 0;
        
        const textInterval = setInterval(() => {
            textElement.style.opacity = '0';
            
            setTimeout(() => {
                textElement.textContent = texts[currentIndex % texts.length];
                textElement.style.opacity = '1';
                currentIndex++;
            }, 300);
        }, 2000);
        
        return textInterval;
    }

    // スコア表示のカウントアップアニメーション
    animateScoreCountUp(element, targetScore, duration = 1000) {
        if (!element) return;

        let currentScore = 0;
        const increment = targetScore / (duration / 16); // 60fps
        
        const countInterval = setInterval(() => {
            currentScore += increment;
            
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(countInterval);
                
                // 最終アニメーション
                element.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 200);
            }
            
            element.textContent = '⭐'.repeat(Math.floor(currentScore));
        }, 16);
    }

    // タブ切り替えのアニメーション
    animateTabSwitch(fromTab, toTab) {
        if (fromTab) {
            fromTab.style.transform = 'translateX(-100%)';
            fromTab.style.opacity = '0';
        }
        
        if (toTab) {
            toTab.style.transform = 'translateX(100%)';
            toTab.style.opacity = '0';
            
            setTimeout(() => {
                toTab.style.transition = 'all 0.4s ease-out';
                toTab.style.transform = 'translateX(0)';
                toTab.style.opacity = '1';
            }, 100);
        }
    }

    // 比較表示への切り替えアニメーション
    animateComparisonModeSwitch(judgeResults) {
        judgeResults.forEach((result, index) => {
            result.style.opacity = '0';
            result.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                result.style.transition = 'all 0.5s ease-out';
                result.style.opacity = '1';
                result.style.transform = 'scale(1)';
            }, index * 100);
        });
    }

    // ボタンのクリックアニメーション
    animateButtonClick(button) {
        button.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    // 要素の監視開始
    observeElement(element) {
        if (this.intersectionObserver) {
            this.intersectionObserver.observe(element);
        }
    }

    // 監視解除
    unobserveElement(element) {
        if (this.intersectionObserver) {
            this.intersectionObserver.unobserve(element);
        }
    }

    // アニメーション実行
    triggerAnimation(element) {
        const animationType = element.dataset.animation;
        if (animationType) {
            this.animateElement(element, animationType);
        }
    }

    // パフォーマンス考慮のアニメーション制御
    requestAnimationFrame(callback) {
        if (window.requestAnimationFrame) {
            return window.requestAnimationFrame(callback);
        } else {
            return setTimeout(callback, 16); // fallback
        }
    }

    // アニメーション設定の保存と読み込み
    saveAnimationSettings(settings) {
        localStorage.setItem('animation_settings', JSON.stringify(settings));
    }

    loadAnimationSettings() {
        const saved = localStorage.getItem('animation_settings');
        return saved ? JSON.parse(saved) : {
            enabled: true,
            speed: 'normal',
            effects: 'full'
        };
    }

    // アニメーション無効化（アクセシビリティ対応）
    disableAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
    }

    // アニメーション有効化
    enableAnimations() {
        const disableStyles = document.querySelectorAll('style[data-disable-animations]');
        disableStyles.forEach(style => style.remove());
    }

    // リソース解放
    dispose() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        this.animationQueue = [];
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationController;
}