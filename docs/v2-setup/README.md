# DiagnoLeads v2 Setup Resources

このディレクトリには、DiagnoLeads v2プロジェクトのセットアップに必要なすべてのリソースが含まれています。

---

## 📁 ファイル一覧

### 1. **QUICK_START.md** ⭐ 初心者向け
- **所要時間**: 15分
- **対象者**: 初めてセットアップする開発者
- **内容**: 最速セットアップ手順、トラブルシューティング、よく使うコマンド

👉 **まずはこちらから始めてください**

### 2. **SETUP_GUIDE.md** 📖 完全版
- **所要時間**: 30-45分
- **対象者**: 詳細な手順を知りたい開発者
- **内容**: 14ステップの詳細なセットアップガイド、設定ファイルの説明

### 3. **setup.sh** 🤖 自動化スクリプト
- **所要時間**: 10-15分（自動実行）
- **対象者**: すべての開発者
- **内容**: 完全自動セットアップスクリプト

```bash
# 使い方
chmod +x setup.sh
./setup.sh
```

---

## 🚀 どのファイルを使うべきか？

### 🎯 推奨フロー

```
┌─────────────────────────────────────────┐
│ 1. QUICK_START.md を読む               │
│    ↓                                    │
│ 2. setup.sh を実行（自動セットアップ） │
│    ↓                                    │
│ 3. トラブルがあればSETUP_GUIDE.md参照  │
└─────────────────────────────────────────┘
```

### 📊 ファイル選択ガイド

| 状況 | 使用するファイル | 理由 |
|------|-----------------|------|
| **初めてのセットアップ** | `QUICK_START.md` → `setup.sh` | 最速で始められる |
| **自動化したい** | `setup.sh` | すべて自動で完了 |
| **手動で細かく設定したい** | `SETUP_GUIDE.md` | 各ステップを理解しながら進める |
| **エラーが発生した** | `QUICK_START.md`のトラブルシューティング | 一般的な問題の解決策 |
| **詳細な設定理由を知りたい** | `SETUP_GUIDE.md` | 各設定の背景と詳細説明 |

---

## ⚡ 最速セットアップ（3分）

```bash
# 1. セットアップスクリプト実行
cd /path/to/parent-directory
bash setup.sh

# 2. 環境変数設定（APIキー追加）
cd diagnoleads-v2
vim .env.local

# 3. 開発サーバー起動
bun run dev

# 完了！http://localhost:3000 を開く
```

---

## 📋 セットアップ前チェックリスト

以下が揃っているか確認してください：

- [ ] **Git** インストール済み (`git --version`)
- [ ] **Docker Desktop** インストール済み＆起動中
- [ ] **GitHub アカウント** あり
- [ ] **インターネット接続** あり（パッケージダウンロード用）
- [ ] **ディスク空き容量** 5GB以上

---

## 🎯 セットアップ後の確認

### ✅ 成功の確認

すべて✅なら成功です：

```bash
# 1. サーバーが起動する
bun run dev
# → ✅ http://localhost:3000 にアクセスできる

# 2. Dockerサービスが動作
docker-compose ps
# → ✅ 3つのコンテナがUP状態

# 3. ビルドが通る
bun run build
# → ✅ エラーなしで完了

# 4. テストが通る
bun test
# → ✅ エラーなし（初期状態ではスキップされる）

# 5. 型チェックが通る
bun run typecheck
# → ✅ エラーなし

# 6. Linterが通る
bun run lint
# → ✅ No errors found
```

### 📍 アクセスURL

| サービス | URL | 認証情報 |
|---------|-----|---------|
| **Next.jsアプリ** | http://localhost:3000 | - |
| **PgAdmin** | http://localhost:5050 | admin@diagnoleads.local / admin |
| **Mailhog** | http://localhost:8025 | - |
| **Drizzle Studio** | http://localhost:4983 | `bun run db:studio`で起動 |

---

## 🔧 セットアップ内容

`setup.sh`スクリプトは以下を自動で行います：

### インストールされるツール

1. **mise** - バージョンマネージャ
2. **Bun 1.1.38** - パッケージマネージャ＆ランタイム
3. **Node.js 20.11.0** - Vercel本番環境用
4. **lefthook 1.10.1** - Gitフック管理

### 作成されるファイル

- `.mise.toml` - miseバージョン設定
- `tsconfig.json` - TypeScript設定
- `biome.json` - Linter/Formatter設定
- `next.config.ts` - Next.js設定
- `tailwind.config.ts` - Tailwind CSS設定
- `.lefthook.yml` - Gitフック設定
- `commitlint.config.js` - コミットメッセージ検証
- `docker-compose.yml` - 開発環境サービス
- `.env.example` & `.env.local` - 環境変数
- `README.md` - プロジェクトREADME

### インストールされる依存関係

**Production (20+ packages)**:
- Next.js 15.1.5 + React 19
- tRPC 11+ (型安全API)
- Drizzle ORM 0.38+ (データベース)
- Zod 3.24+ (バリデーション)
- Zustand 5.0+ (状態管理)
- nuqs 2.8+ (URL状態管理)
- Tailwind CSS 4.0 (スタイリング)
- shadcn/ui コンポーネント

**Development (15+ packages)**:
- TypeScript 5.7+
- Biome 1.9+ (Linter/Formatter)
- Vitest 4.0+ (テスト)
- Playwright 1.51+ (E2Eテスト)
- Drizzle Kit (マイグレーション)
- commitlint (コミット検証)

---

## 📚 次のステップ

セットアップ完了後、以下のドキュメントを読んでください：

1. **アーキテクチャ理解**: `../DIAGNOLEADS_V2_ARCHITECTURE.md`
   - システム全体の設計思想
   - 技術選定の理由
   - 10個のADR（アーキテクチャ決定記録）

2. **技術スタック詳細**: `../DIAGNOLEADS_V2_TECH_STACK_SUMMARY.md`
   - 使用技術の一覧と選定理由
   - コスト分析
   - 移行タイムライン

3. **開発開始**:
   - Drizzleスキーマ定義: `lib/db/schema.ts`
   - BetterAuth設定: `lib/auth/config.ts`
   - tRPCルーター作成: `server/routers/`
   - UIコンポーネント追加: `bunx shadcn@latest add <component>`

---

## 🐛 トラブルシューティング

### よくある問題と解決策

#### 1. `mise: command not found`

```bash
# シェル設定を再読み込み
source ~/.bashrc  # or ~/.zshrc

# PATHを確認
echo $PATH | grep .local/bin

# 見つからない場合、mise再インストール
curl https://mise.run | sh
```

#### 2. `docker-compose up` がエラー

```bash
# Docker Desktopが起動しているか確認
docker --version
docker ps

# Docker Desktop再起動後、再試行
docker-compose down
docker-compose up -d
```

#### 3. ポート3000が既に使用中

```bash
# ポート確認
lsof -i :3000

# プロセス終了
kill -9 <PID>

# または別ポートで起動
PORT=3001 bun run dev
```

#### 4. Bunインストールが遅い

```bash
# キャッシュクリア
bun pm cache rm

# 再インストール
bun install
```

#### 5. lefthookフックが動作しない

```bash
# フック再インストール
lefthook install

# 権限確認
ls -la .git/hooks/

# 手動テスト
lefthook run pre-commit
```

詳細は `QUICK_START.md` のトラブルシューティングセクションを参照してください。

---

## 📞 サポート

問題が解決しない場合：

1. **ドキュメント検索**: `docs/`ディレクトリ内を検索
2. **GitHub Issue**: https://github.com/your-org/diagnoleads-v2/issues
3. **ログ確認**:
   ```bash
   docker-compose logs -f
   bun run dev --verbose
   ```

---

## 🎉 セットアップ完了！

すべて完了したら、開発を開始しましょう！

```bash
# 開発サーバー起動
bun run dev

# 別のターミナルでDrizzle Studio起動（データベースGUI）
bun run db:studio

# コードを書いてコミット（lefthookが自動チェック）
git add .
git commit -m "feat(auth): add user authentication"

# テスト実行
bun test --watch
```

Happy coding! 🚀

---

**README Version**: 1.0
**Last Updated**: 2025-11-23
**Maintained by**: DiagnoLeads Architecture Team
