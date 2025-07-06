// AI審査員システム - 設定ファイル（テンプレート）
// このファイルをconfig.jsにコピーして使用してください

const OPENAI_CONFIG = {
    baseURL: 'https://api.openai.com/v1',
    models: {
        vision: 'gpt-4o-mini',
        audio: 'whisper-1',
        text: 'o3-mini',  // テキストモデルはo3-miniに変更
        tts: 'tts-1'
    },
    maxRetries: 3,
    timeout: 60000,  // タイムアウトを60秒に調整
    maxFileSize: 25 * 1024 * 1024, // 25MB
    supportedFormats: {
        slide: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a']
    }
};

const VOICE_CONFIG = {
    baseURL: 'https://api.openai.com/v1/audio/speech',
    supportedVoices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    responseFormat: 'mp3',
    speedRange: [0.25, 4.0],
    defaultSettings: {
        volume: 0.8,
        autoplay: false,
        showControls: true
    }
};

const UI_CONFIG = {
    animation: {
        fadeInDuration: 500,
        typingSpeed: 50,
        scrollBehavior: 'smooth'
    },
    loading: {
        messages: [
            'AI審査員が分析中...',
            'スライドを読み込み中...',
            '音声を解析中...',
            '評価を生成中...',
            'もう少しお待ちください...'
        ]
    },
    colors: {
        primary: '#3498db',
        secondary: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c',
        success: '#27ae60'
    }
};

const ERROR_MESSAGES = {
    API_KEY_MISSING: 'APIキーが設定されていません',
    API_KEY_INVALID: '無効なAPIキーです',
    FILE_SIZE_EXCEEDED: 'ファイルサイズが25MBを超えています',
    UNSUPPORTED_FORMAT: '対応していないファイル形式です',
    NETWORK_ERROR: 'ネットワークエラーが発生しました',
    ANALYSIS_FAILED: '分析に失敗しました',
    AUDIO_GENERATION_FAILED: '音声生成に失敗しました',
    UNKNOWN_ERROR: '予期しないエラーが発生しました'
};

const SUCCESS_MESSAGES = {
    API_KEY_SAVED: 'APIキーが保存されました',
    FILE_UPLOADED: 'ファイルがアップロードされました',
    ANALYSIS_COMPLETE: '分析が完了しました',
    EXPORT_COMPLETE: '結果をエクスポートしました'
};

// 設定の検証（簡略化）
function validateConfig() {
    if (!OPENAI_CONFIG.baseURL || !OPENAI_CONFIG.models) {
        throw new Error('OpenAI設定エラー');
    }
    return true;
}

// ローカル環境設定
function getLocalConfig() {
    return {
        // APIキーは環境変数やlocalStorageから取得
        // 開発時は手動でAPIキーを設定してください
        apiKey: localStorage.getItem('openai_api_key') || process.env.OPENAI_API_KEY || '',
        debugMode: localStorage.getItem('debug_mode') === 'true'
    };
}

// 設定の初期化
try {
    validateConfig();
    console.log('設定の検証が完了しました');
} catch (error) {
    console.error('設定エラー:', error.message);
} 