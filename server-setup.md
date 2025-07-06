# サーバーサイドでの.env使用方法

もしNode.jsサーバーでアプリケーションを運用する場合、.envファイルを使用できます。

## 1. 必要な依存関係をインストール

```bash
npm init -y
npm install express dotenv
```

## 2. .envファイルの作成

```bash
# .env
OPENAI_API_KEY=your_api_key_here
PORT=3000
```

## 3. サーバーファイルの作成

```javascript
// server.js
const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイルを提供
app.use(express.static('.'));

// APIエンドポイント（APIキーを安全に提供）
app.get('/api/config', (req, res) => {
    res.json({
        apiKey: process.env.OPENAI_API_KEY || ''
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
```

## 4. フロントエンドでの取得

```javascript
// APIキーをサーバーから取得
async function getApiKeyFromServer() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        return config.apiKey;
    } catch (error) {
        console.error('サーバーからAPIキーの取得に失敗:', error);
        return '';
    }
}
```

## 5. 実行方法

```bash
node server.js
```

## 注意点

- .envファイルは.gitignoreに含める
- 本番環境では適切な環境変数管理ツールを使用
- APIキーは絶対にフロントエンドに露出させない（上記の方法は開発用のみ） 