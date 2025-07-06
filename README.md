# AI審査員システム

学生のピッチ資料（スライド・音声）をAI審査員が多角的に評価するWebアプリケーションです。

## 機能

- 📊 **スライド分析**: PowerPoint/PDFファイルの内容を分析
- 🎵 **音声分析**: ピッチ音声の内容を文字起こし・分析
- 👩‍⚖️ **多角的評価**: 大学教員、実業家、VC、IT専門家による異なる視点での評価
- 🔊 **音声フィードバック**: 評価結果を音声で確認可能
- 📄 **レポート出力**: 分析結果のPDF/Word形式での出力

## セットアップ方法

### 1. プロジェクトのクローン

```bash
git clone [repository-url]
cd ai_sinsa
```

### 2. 設定ファイルの準備

```bash
# 設定ファイルのテンプレートをコピー
cp config.example.js config.js
```

### 3. OpenAI APIキーの設定

以下のいずれかの方法でAPIキーを設定してください：

#### 方法1: Webブラウザで設定（推奨）
1. `index.html`をブラウザで開く
2. 上部の「OpenAI APIキー」フィールドに有効なAPIキーを入力
3. 「保存」ボタンをクリック（localStorageに保存されます）

#### 方法2: 環境変数で設定
```bash
# Windows
set OPENAI_API_KEY=your_api_key_here

# macOS/Linux
export OPENAI_API_KEY=your_api_key_here
```

### 4. アプリケーションの起動

```bash
# 簡単な方法: HTMLファイルを直接開く
open index.html

# または、ローカルサーバーで実行（推奨）
python -m http.server 8000
# http://localhost:8000 にアクセス
```

## 使用方法

### 1. 審査員の選択
- 大学教員：学術的・教育的観点
- 実業家：実践的・市場性重視
- VC：投資価値・スケーラビリティ
- IT専門家：技術的実現性・デジタル化

### 2. ファイルのアップロード
- **スライド資料**: PowerPoint (.pptx, .ppt) またはPDF (.pdf)
- **ピッチ音声**: MP3, WAV, M4A形式（最大25MB）

### 3. 分析の実行
- ファイルアップロード後、「分析開始」ボタンをクリック
- AI審査員が順次評価を実行
- 結果がタブ形式で表示

### 4. 結果の確認
- 各審査員の評価をタブで切り替え
- 音声ボタンで評価を音声で確認
- エクスポート機能で結果を保存

## 技術仕様

### 対応ファイル形式
- **スライド**: PDF, PowerPoint (.pptx, .ppt)
- **音声**: MP3, WAV, M4A, MP4音声

### 使用API
- OpenAI GPT-4o-mini（テキスト生成）
- OpenAI Whisper-1（音声認識）
- OpenAI TTS-1（音声合成）

### ブラウザ対応
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## ファイル構成

```
ai_sinsa/
├── index.html              # メインHTMLファイル
├── script.js               # メインJavaScriptファイル
├── styles.css              # スタイルシート
├── config.js               # 設定ファイル（要作成）
├── config.example.js       # 設定ファイルテンプレート
├── judges/
│   └── personalities.js    # 審査員の性格設定
├── utils/
│   ├── apiClient.js        # OpenAI API クライアント
│   ├── fileHandler.js      # ファイル処理
│   ├── uiController.js     # UI制御
│   ├── voiceController.js  # 音声制御
│   └── その他のユーティリティ
└── README.md               # このファイル
```

## 開発者向け情報

### デバッグ機能
ブラウザのコンソール（F12）で以下のコマンドが使用可能：

```javascript
// システム全体の状態確認
debugApp()

// 音声分析のテスト実行
testAudio()
```

### 機密情報の管理
- `config.js`はGitで管理されません（.gitignoreに含まれています）
- APIキーはローカルストレージまたは環境変数で管理
- 本番環境では適切な環境変数管理ツールを使用してください

## トラブルシューティング

### よくある問題

1. **APIキーエラー**
   - 有効なOpenAI APIキーを設定してください
   - APIキーは`sk-`で始まる必要があります

2. **ファイルアップロードエラー**
   - ファイルサイズが25MB以下であることを確認
   - 対応ファイル形式を確認

3. **音声分析が動かない**
   - ブラウザのコンソールを確認
   - `debugApp()`コマンドでシステム状態を確認

### サポート

問題が発生した場合は、以下の情報を収集してください：

1. ブラウザのコンソールエラー（F12で確認）
2. 使用したファイル形式とサイズ
3. エラーが発生したステップ

## ライセンス

このプロジェクトは学術・教育目的での使用を想定しています。 