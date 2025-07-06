// AI審査員システム - 評価履歴管理ユーティリティ

class HistoryManager {
    constructor() {
        this.storageKey = 'ai_judge_history';
        this.maxHistoryItems = 50;
        this.currentSession = null;
        
        this.initializeStorage();
    }

    // ストレージの初期化
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    // 評価結果を履歴に保存
    saveEvaluationHistory(analysisResults, metadata = {}) {
        const historyItem = {
            id: this.generateUniqueId(),
            timestamp: new Date().toISOString(),
            analysisResults: this.sanitizeResults(analysisResults),
            metadata: {
                judgeCount: Object.keys(analysisResults).length,
                hasSlide: metadata.hasSlide || false,
                hasAudio: metadata.hasAudio || false,
                title: metadata.title || `評価結果 ${new Date().toLocaleDateString('ja-JP')}`,
                tags: metadata.tags || [],
                ...metadata
            },
            summary: this.generateSummary(analysisResults)
        };

        const history = this.getHistory();
        history.unshift(historyItem); // 最新を先頭に

        // 最大保存数を制限
        if (history.length > this.maxHistoryItems) {
            history.splice(this.maxHistoryItems);
        }

        localStorage.setItem(this.storageKey, JSON.stringify(history));
        
        console.log('評価履歴を保存しました:', historyItem.id);
        return historyItem.id;
    }

    // 結果データのサニタイズ（サイズ削減）
    sanitizeResults(results) {
        const sanitized = {};
        
        Object.keys(results).forEach(judgeType => {
            const result = results[judgeType];
            sanitized[judgeType] = {
                judgeType: result.judgeType,
                personality: {
                    name: result.personality.name,
                    icon: result.personality.icon,
                    description: result.personality.description
                },
                evaluation: result.evaluation,
                // 大きなデータは除外
                audioAnalysis: result.audioAnalysis ? {
                    summary: result.audioAnalysis.summary || result.audioAnalysis.transcription?.substring(0, 200) + '...'
                } : null,
                slideAnalysis: result.slideAnalysis ? {
                    analysis: result.slideAnalysis.analysis?.substring(0, 500) + '...'
                } : null
            };
        });
        
        return sanitized;
    }

    // サマリー生成
    generateSummary(results) {
        const judgeNames = Object.values(results).map(r => r.personality.name);
        const averageScore = this.calculateAverageScore(results);
        
        return {
            judgeNames,
            averageScore,
            totalJudges: Object.keys(results).length,
            evaluationDate: new Date().toLocaleDateString('ja-JP')
        };
    }

    // 平均スコア計算
    calculateAverageScore(results) {
        const scores = Object.values(results).map(result => {
            const scoreMatch = result.evaluation.match(/【評価スコア】:\s*([⭐★✨]*)/);
            return scoreMatch ? scoreMatch[1].length : 3;
        });
        
        const sum = scores.reduce((acc, score) => acc + score, 0);
        return (sum / scores.length).toFixed(1);
    }

    // 履歴の取得
    getHistory() {
        try {
            const history = localStorage.getItem(this.storageKey);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('履歴の読み込みエラー:', error);
            return [];
        }
    }

    // 特定の履歴項目を取得
    getHistoryItem(id) {
        const history = this.getHistory();
        return history.find(item => item.id === id);
    }

    // 履歴の削除
    deleteHistoryItem(id) {
        const history = this.getHistory();
        const filteredHistory = history.filter(item => item.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filteredHistory));
        
        console.log('履歴項目を削除しました:', id);
        return true;
    }

    // 履歴の全削除
    clearHistory() {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
        console.log('全履歴を削除しました');
        return true;
    }

    // 履歴の検索
    searchHistory(query) {
        const history = this.getHistory();
        const lowerQuery = query.toLowerCase();
        
        return history.filter(item => {
            return item.metadata.title.toLowerCase().includes(lowerQuery) ||
                   item.summary.judgeNames.some(name => name.toLowerCase().includes(lowerQuery)) ||
                   item.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        });
    }

    // 履歴のフィルタリング
    filterHistory(filters = {}) {
        const history = this.getHistory();
        
        return history.filter(item => {
            // 日付フィルター
            if (filters.dateFrom) {
                const itemDate = new Date(item.timestamp);
                const fromDate = new Date(filters.dateFrom);
                if (itemDate < fromDate) return false;
            }
            
            if (filters.dateTo) {
                const itemDate = new Date(item.timestamp);
                const toDate = new Date(filters.dateTo);
                if (itemDate > toDate) return false;
            }
            
            // 審査員数フィルター
            if (filters.judgeCount) {
                if (item.metadata.judgeCount !== filters.judgeCount) return false;
            }
            
            // ファイルタイプフィルター
            if (filters.hasSlide !== undefined && item.metadata.hasSlide !== filters.hasSlide) {
                return false;
            }
            
            if (filters.hasAudio !== undefined && item.metadata.hasAudio !== filters.hasAudio) {
                return false;
            }
            
            return true;
        });
    }

    // 履歴の統計情報
    getHistoryStats() {
        const history = this.getHistory();
        
        if (history.length === 0) {
            return {
                totalEvaluations: 0,
                averageScore: 0,
                mostUsedJudges: [],
                evaluationTrend: []
            };
        }
        
        const totalEvaluations = history.length;
        const allScores = history.map(item => parseFloat(item.summary.averageScore));
        const averageScore = (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1);
        
        // 最も使用された審査員
        const judgeUsage = {};
        history.forEach(item => {
            item.summary.judgeNames.forEach(name => {
                judgeUsage[name] = (judgeUsage[name] || 0) + 1;
            });
        });
        
        const mostUsedJudges = Object.entries(judgeUsage)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([name, count]) => ({ name, count }));
        
        return {
            totalEvaluations,
            averageScore,
            mostUsedJudges,
            evaluationTrend: this.calculateTrend(history)
        };
    }

    // 傾向の計算
    calculateTrend(history) {
        // 直近10件の平均スコアの変化
        const recent = history.slice(0, 10);
        if (recent.length < 2) return 'insufficient_data';
        
        const firstHalf = recent.slice(5, 10);
        const secondHalf = recent.slice(0, 5);
        
        const firstAvg = firstHalf.reduce((sum, item) => sum + parseFloat(item.summary.averageScore), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, item) => sum + parseFloat(item.summary.averageScore), 0) / secondHalf.length;
        
        const difference = secondAvg - firstAvg;
        
        if (difference > 0.3) return 'improving';
        if (difference < -0.3) return 'declining';
        return 'stable';
    }

    // ユニークID生成
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 履歴のエクスポート
    exportHistory(format = 'json') {
        const history = this.getHistory();
        
        switch (format) {
            case 'json':
                return JSON.stringify(history, null, 2);
            case 'csv':
                return this.exportAsCSV(history);
            default:
                return JSON.stringify(history, null, 2);
        }
    }

    // CSV形式でエクスポート
    exportAsCSV(history) {
        const headers = ['ID', '日時', 'タイトル', '審査員数', '平均スコア', '審査員'];
        const rows = history.map(item => [
            item.id,
            new Date(item.timestamp).toLocaleString('ja-JP'),
            item.metadata.title,
            item.metadata.judgeCount,
            item.summary.averageScore,
            item.summary.judgeNames.join(', ')
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // 履歴のインポート
    importHistory(data) {
        try {
            const importedHistory = JSON.parse(data);
            const currentHistory = this.getHistory();
            
            // 重複チェック
            const newItems = importedHistory.filter(imported => 
                !currentHistory.some(current => current.id === imported.id)
            );
            
            const mergedHistory = [...currentHistory, ...newItems];
            
            // ソートして制限適用
            mergedHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const limitedHistory = mergedHistory.slice(0, this.maxHistoryItems);
            
            localStorage.setItem(this.storageKey, JSON.stringify(limitedHistory));
            
            console.log(`${newItems.length}件の履歴をインポートしました`);
            return newItems.length;
        } catch (error) {
            console.error('インポートエラー:', error);
            throw new Error('無効なデータ形式です');
        }
    }

    // ストレージ使用量の確認
    getStorageUsage() {
        const data = localStorage.getItem(this.storageKey);
        const sizeInBytes = new Blob([data]).size;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);
        
        return {
            items: this.getHistory().length,
            sizeKB: sizeInKB,
            maxItems: this.maxHistoryItems
        };
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
}