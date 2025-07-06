# GitHubプッシュ前の確認事項

## 🔒 セキュリティ設定の確認

### 1. .gitignoreの確認
```bash
# config.jsが除外されているか確認
cat .gitignore | grep config.js
```

### 2. APIキーの設定方法
```javascript
// config.js の configApiKey 変数に直接記述
const configApiKey = 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

### 3. GitHubにプッシュする前の確認
```bash
# プッシュされるファイルの一覧を確認
git add .
git status

# config.jsが含まれていないことを確認
# "modified: config.js" や "new file: config.js" が表示されていないかチェック
```

## 🚀 Gitコマンドの使用方法

### 初回プッシュ
```bash
# 初期化（まだの場合）
git init

# ファイルを追加
git add .

# 状態確認（config.jsが含まれていないことを確認）
git status

# コミット
git commit -m "Initial commit: AI審査員システム"

# リモートリポジトリに接続
git remote add origin https://github.com/yourusername/ai_sinsa.git

# プッシュ
git push -u origin main
```

### 通常のプッシュ
```bash
# 変更を追加
git add .

# 状態確認
git status

# コミット
git commit -m "機能追加: xxxxx"

# プッシュ
git push
```

## ✅ 安全性のチェック

### プッシュ前にこれらを確認してください：

1. **config.jsが除外されている**
   ```bash
   git ls-files | grep config.js
   # 何も表示されなければOK
   ```

2. **APIキーが含まれていない**
   ```bash
   git show --name-only
   # config.jsが含まれていなければOK
   ```

3. **リモートリポジトリの確認**
   ```bash
   git remote -v
   # 正しいリポジトリURLが表示されることを確認
   ```

## 🔧 トラブルシューティング

### config.jsが間違ってプッシュされそうな場合
```bash
# config.jsをgitから削除（ローカルファイルは残す）
git rm --cached config.js

# .gitignoreを再確認
echo "config.js" >> .gitignore

# コミット
git commit -m "config.jsを除外"
```

### APIキーが間違ってプッシュされた場合
```bash
# 履歴からファイルを完全に削除（慎重に！）
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch config.js' --prune-empty --tag-name-filter cat -- --all

# 強制プッシュ（危険な操作）
git push --force-with-lease
```

## 📝 注意点

- **config.jsは各環境で個別に設定**
- **APIキーは絶対にGitにプッシュしない**
- **他の開発者はconfig.example.jsをコピーして使用**
- **本番環境では適切な秘密管理ツールを使用** 