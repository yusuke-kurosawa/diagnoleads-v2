# DiagnoLeads v2 - Quick Start

**所要時間**: 15分
**難易度**: 初級

---

## 🚀 最速セットアップ（3ステップ）

### オプションA: 自動セットアップスクリプト使用（推奨）

```bash
# 1. セットアップスクリプトをダウンロード
curl -O https://raw.githubusercontent.com/your-org/diagnoleads-v2/main/setup.sh

# 2. 実行権限を付与
chmod +x setup.sh

# 3. スクリプトを実行
./setup.sh

# 完了！ブラウザで http://localhost:3000 を開く
```

### オプションB: 手動セットアップ

```bash
# 1. リポジトリ作成とクローン
gh repo create diagnoleads-v2 --private
gh repo clone your-org/diagnoleads-v2
cd diagnoleads-v2

# 2. mise（バージョンマネージャ）インストール
curl https://mise.run | sh
echo 'eval "$(mise activate bash)"' >> ~/.bashrc
source ~/.bashrc

# 3. プロジェクト設定
cat > .mise.toml << 'EOF'
[tools]
bun = "1.1.38"
node = "20.11.0"
lefthook = "1.10.1"
EOF

mise install

# 4. Next.jsプロジェクト初期化
bunx create-next-app@latest . --typescript --tailwind --app --turbopack --use-bun

# 5. 依存関係インストール
bun add next@15.1.5 react@19 react-dom@19 drizzle-orm@0.38 zod@3.24
bun add -D @biomejs/biome@1.9 vitest@4 @playwright/test@1.51 typescript@5.7

# 6. Docker起動
docker-compose up -d

# 7. 開発サーバー起動
bun run dev
```

---

## 📋 前提条件チェックリスト

セットアップ前に以下を確認してください：

- [ ] **Git** インストール済み (`git --version`)
- [ ] **Docker Desktop** インストール済み＆起動中
- [ ] **GitHub アカウント** でリポジトリ作成権限あり
- [ ] **GitHub CLI** インストール済み（推奨）: `gh --version`

---

## 🔧 セットアップ後の確認

### すべてのサービスが起動しているか確認

```bash
# Dockerコンテナ確認
docker-compose ps

# 期待される出力:
# diagnoleads-postgres    (5432)
# diagnoleads-pgadmin     (5050)
# diagnoleads-mailhog     (8025)

# 開発サーバー起動
bun run dev

# ブラウザで確認
# http://localhost:3000      → Next.jsアプリ
# http://localhost:5050      → PgAdmin (admin@diagnoleads.local / admin)
# http://localhost:8025      → Mailhog (メールプレビュー)
```

### 開発ツール動作確認

```bash
# mise確認
mise list
# 期待される出力: bun 1.1.38, node 20.11.0, lefthook 1.10.1

# Bun確認
bun --version
# 期待される出力: 1.1.38

# TypeScript確認
bun run typecheck
# 期待される出力: エラーなし

# Linter確認
bun run lint
# 期待される出力: No errors found

# テスト実行（初期状態ではスキップされる）
bun test
```

---

## 📝 よく使うコマンド

### 開発

| コマンド | 説明 |
|---------|------|
| `bun run dev` | 開発サーバー起動（Turbopack） |
| `bun run build` | 本番ビルド |
| `bun run start` | 本番サーバー起動 |
| `bun run typecheck` | TypeScript型チェック |
| `bun run lint` | Biomeリント |
| `bun run format` | Biomeフォーマット |

### テスト

| コマンド | 説明 |
|---------|------|
| `bun test` | ユニットテスト（Vitest） |
| `bun test --watch` | Watchモード |
| `bun test --coverage` | カバレッジ付き |
| `bun test:e2e` | E2Eテスト（Playwright） |
| `bun test:e2e --ui` | PlaywrightUIモード |

### データベース

| コマンド | 説明 |
|---------|------|
| `bun run db:generate` | マイグレーション生成 |
| `bun run db:migrate` | マイグレーション実行 |
| `bun run db:studio` | Drizzle Studio起動 |
| `bun run db:push` | スキーマ直接プッシュ |

### Docker

| コマンド | 説明 |
|---------|------|
| `docker-compose up -d` | サービス起動（バックグラウンド） |
| `docker-compose down` | サービス停止 |
| `docker-compose ps` | サービス状態確認 |
| `docker-compose logs -f` | ログ監視 |
| `docker-compose restart` | サービス再起動 |

---

## 🎯 初回開発タスク

セットアップが完了したら、以下の順番で進めてください：

### 1. 環境変数設定

```bash
# .env.localを編集
vim .env.local

# 必須: BETTER_AUTH_SECRET（自動生成済み）
# 任意: APIキー追加
# - ANTHROPIC_API_KEY=sk-ant-xxx
# - RESEND_API_KEY=re_xxx
# - TRIGGER_API_KEY=tr_xxx
```

### 2. データベーススキーマ作成

```bash
# Drizzleスキーマ定義
vim lib/db/schema.ts

# マイグレーション生成
bun run db:generate

# マイグレーション実行
bun run db:migrate

# Drizzle Studioで確認
bun run db:studio
# → http://localhost:4983
```

### 3. 認証設定（BetterAuth）

```bash
# BetterAuth設定ファイル作成
mkdir -p lib/auth
vim lib/auth/config.ts

# ドキュメント参照: https://www.better-auth.com/docs
```

### 4. tRPCルーター作成

```bash
# tRPCセットアップ
mkdir -p server/routers
vim server/trpc.ts
vim server/index.ts
vim server/routers/example.ts

# ドキュメント参照: https://trpc.io/docs
```

### 5. UIコンポーネント追加（shadcn/ui）

```bash
# shadcn/ui初期化
bunx shadcn@latest init

# コンポーネント追加例
bunx shadcn@latest add button
bunx shadcn@latest add input
bunx shadcn@latest add dialog
bunx shadcn@latest add table

# ドキュメント参照: https://ui.shadcn.com/
```

---

## 🔄 Git ワークフロー

### Conventional Commits

すべてのコミットは以下の形式に従ってください：

```bash
<type>(<scope>): <subject>

# 例:
feat(auth): add email/password login
fix(leads): resolve score calculation bug
docs(api): update tRPC endpoint documentation
chore(deps): upgrade Next.js to 15.1.5
```

**Type（必須）**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードスタイル
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: ビルド、ツール設定

**Scope（任意）**:
`auth`, `leads`, `assessments`, `analytics`, `ai`, `db`, `api`, `ui`, `embed`, `integrations`, `email`, `jobs`, `i18n`, `seo`, `ci`, `deps`, `config`, `docs`, `test`

### Gitフック

lefthookが自動的に以下をチェックします：

**pre-commit**:
- ✅ Biomeでコード整形
- ✅ TypeScript型チェック
- ✅ 変更ファイルのテスト実行

**commit-msg**:
- ✅ Conventional Commits準拠チェック

**pre-push**:
- ✅ すべてのテスト実行
- ✅ ビルド確認

### ブランチ戦略

```bash
# 機能開発
git checkout -b feat/lead-scoring
git commit -m "feat(leads): add lead scoring algorithm"
git push origin feat/lead-scoring

# バグ修正
git checkout -b fix/auth-session
git commit -m "fix(auth): resolve session expiry issue"
git push origin fix/auth-session

# リリース
git checkout -b release/v1.0.0
git commit -m "chore(release): prepare v1.0.0"
git push origin release/v1.0.0
```

---

## 🐛 トラブルシューティング

### ポートが既に使用されている

```bash
# ポート3000を使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>

# または、Next.jsを別ポートで起動
PORT=3001 bun run dev
```

### Dockerサービスが起動しない

```bash
# Docker Desktopが起動しているか確認
docker --version
docker ps

# Docker Desktopを再起動後、再度試行
docker-compose down
docker-compose up -d

# ログ確認
docker-compose logs -f postgres
```

### データベース接続エラー

```bash
# PostgreSQLが起動しているか確認
docker-compose ps postgres

# 接続テスト
docker-compose exec postgres psql -U postgres -d diagnoleads_dev -c "SELECT 1"

# DATABASE_URL確認
cat .env.local | grep DATABASE_URL
```

### Bunインストールエラー

```bash
# Bunを手動インストール
curl -fsSL https://bun.sh/install | bash

# または、miseを使用
mise use bun@1.1.38
```

### miseが見つからない

```bash
# PATHを確認
echo $PATH | grep .local/bin

# シェル設定を再読み込み
source ~/.bashrc  # or ~/.zshrc

# mise再インストール
curl https://mise.run | sh
```

### lefthookフックが動作しない

```bash
# フックを再インストール
lefthook install

# 手動でフックをテスト
lefthook run pre-commit

# .git/hooks/ディレクトリ確認
ls -la .git/hooks/
```

---

## 📚 次に読むべきドキュメント

1. **アーキテクチャ全体像**: `docs/DIAGNOLEADS_V2_ARCHITECTURE.md`
2. **技術スタックサマリー**: `docs/DIAGNOLEADS_V2_TECH_STACK_SUMMARY.md`
3. **詳細セットアップガイド**: `docs/v2-setup/SETUP_GUIDE.md`
4. **Spec駆動開発**: セクション「Spec-Driven Development Workflow」

---

## 🆘 サポート

問題が発生した場合：

1. **ドキュメント確認**: `docs/`ディレクトリ
2. **GitHub Issue作成**: https://github.com/your-org/diagnoleads-v2/issues
3. **ログ確認**:
   ```bash
   docker-compose logs -f
   bun run dev --verbose
   ```

---

## ✅ チェックリスト

セットアップが完了したら、以下を確認してください：

- [ ] `bun run dev`でサーバーが起動する
- [ ] `http://localhost:3000`にアクセスできる
- [ ] `docker-compose ps`で3つのサービスが起動している
- [ ] `bun test`でエラーが出ない
- [ ] `bun run lint`でエラーが出ない
- [ ] `bun run typecheck`でエラーが出ない
- [ ] Gitコミットでlefthookが動作する
- [ ] `.env.local`にAPIキーを設定した

すべてチェックできたら開発準備完了です！🎉

---

**Quick Start Version**: 1.0
**Last Updated**: 2025-11-23
**Estimated Time**: 15 minutes
