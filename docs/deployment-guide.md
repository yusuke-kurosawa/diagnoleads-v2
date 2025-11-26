# Deployment Guide

DiagnoLeads 本番環境デプロイメントガイド

## 目次

1. [前提条件](#前提条件)
2. [環境構築](#環境構築)
3. [Vercelデプロイ](#vercelデプロイ)
4. [データベースセットアップ](#データベースセットアップ)
5. [環境変数設定](#環境変数設定)
6. [デプロイ後の確認](#デプロイ後の確認)
7. [トラブルシューティング](#トラブルシューティング)

## 前提条件

### 必要なアカウント

- [Vercel](https://vercel.com) - ホスティング
- [Neon](https://neon.tech) または [Supabase](https://supabase.com) - PostgreSQLデータベース
- [Sentry](https://sentry.io) - エラー監視（オプション）
- [Resend](https://resend.com) - メール送信（オプション）

### 必要なツール

```bash
# Node.js 20+
node --version  # v20.x.x

# Bun
bun --version  # 1.x.x

# Vercel CLI
npm install -g vercel
vercel --version

# Git
git --version
```

## 環境構築

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-org/diagnoleads-v2.git
cd diagnoleads-v2
```

### 2. 依存関係のインストール

```bash
bun install
```

### 3. ローカル環境変数の設定

```bash
cp .env.example .env.local
# .env.localを編集して必要な値を設定
```

### 4. ローカルでのビルド確認

```bash
bun run build
```

## Vercelデプロイ

### 初回セットアップ

```bash
# Vercelにログイン
vercel login

# プロジェクトをVercelにリンク
vercel link

# 本番デプロイ
vercel --prod
```

### GitHubとの連携

1. [Vercelダッシュボード](https://vercel.com/dashboard)にアクセス
2. 「Import Project」をクリック
3. GitHubリポジトリを選択
4. 以下の設定を確認:
   - Framework Preset: Next.js
   - Build Command: `bun run build`
   - Output Directory: `.next`
   - Install Command: `bun install`

### 自動デプロイ設定

GitHub連携により以下が自動化されます：

- `main`ブランチへのプッシュ → 本番デプロイ
- プルリクエスト → プレビューデプロイ

## データベースセットアップ

### Neon Database（推奨）

1. [Neon Console](https://console.neon.tech)でプロジェクト作成
2. 接続文字列を取得
3. Vercelの環境変数に設定

```bash
# 接続文字列の例
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/diagnoleads?sslmode=require
```

### データベースマイグレーション

```bash
# マイグレーション実行
bun run db:push

# マイグレーション状態確認
bun run db:studio
```

### 初期データ投入（オプション）

```bash
# シードデータ投入
bun run db:seed
```

## 環境変数設定

### 必須環境変数

Vercelダッシュボード → Settings → Environment Variables で設定：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | PostgreSQL接続文字列 | `postgresql://...` |
| `BETTER_AUTH_SECRET` | 認証シークレット（32文字以上） | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | 認証URL | `https://app.diagnoleads.com` |
| `NEXT_PUBLIC_APP_URL` | アプリケーションURL | `https://app.diagnoleads.com` |

### オプション環境変数

| 変数名 | 説明 |
|--------|------|
| `SENTRY_DSN` | Sentry DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | クライアント用Sentry DSN |
| `RESEND_API_KEY` | Resend APIキー |
| `EMAIL_FROM` | 送信元メールアドレス |
| `OPENAI_API_KEY` | OpenAI APIキー |

### シークレットの生成

```bash
# BETTER_AUTH_SECRET の生成
openssl rand -base64 32

# または
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## デプロイ後の確認

### ヘルスチェック

```bash
# APIヘルスチェック
curl https://app.diagnoleads.com/api/health

# 期待されるレスポンス
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### 機能確認チェックリスト

- [ ] ホームページが表示される
- [ ] ログイン/サインアップが動作する
- [ ] ダッシュボードにアクセスできる
- [ ] リードの作成/編集/削除が動作する
- [ ] Webhook設定が保存される
- [ ] 分析ダッシュボードが表示される

### ログ確認

```bash
# Vercel CLI でログを確認
vercel logs --prod

# リアルタイムログ
vercel logs --prod --follow
```

## カスタムドメイン設定

### Vercelでのドメイン設定

1. Vercelダッシュボード → Settings → Domains
2. 「Add」をクリックしてドメインを追加
3. DNSレコードを設定：

```
# Aレコード
@ → 76.76.21.21

# CNAMEレコード
www → cname.vercel-dns.com
```

### SSL証明書

Vercelが自動的にLet's Encrypt証明書を発行・更新します。

## Cronジョブ

`vercel.json`で定義されたCronジョブ：

| パス | スケジュール | 説明 |
|------|------------|------|
| `/api/cron/cleanup-webhook-deliveries` | 毎日 3:00 UTC | 古いWebhook配信ログの削除 |
| `/api/cron/process-webhook-retries` | 5分毎 | Webhookリトライ処理 |

### Cronジョブの確認

Vercelダッシュボード → Settings → Crons で実行履歴を確認できます。

## トラブルシューティング

### ビルドエラー

```bash
# ローカルでビルドを確認
bun run build

# 型エラーの確認
bun run typecheck

# リントエラーの確認
bun run lint
```

### データベース接続エラー

```bash
# 接続テスト
psql $DATABASE_URL -c "SELECT 1"

# SSL設定の確認
# 接続文字列に ?sslmode=require を追加
```

### 認証エラー

1. `BETTER_AUTH_SECRET`が正しく設定されているか確認
2. `BETTER_AUTH_URL`がデプロイURLと一致しているか確認
3. Cookieドメイン設定を確認

### メモリ/タイムアウトエラー

`vercel.json`で関数の設定を調整：

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## ロールバック

### Vercelでのロールバック

1. Vercelダッシュボード → Deployments
2. 正常に動作していたデプロイメントを選択
3. 「...」→「Promote to Production」をクリック

### データベースロールバック

```bash
# バックアップからリストア
./scripts/restore-database.sh backups/diagnoleads_YYYYMMDD_HHMMSS.sql.gz
```

## セキュリティチェックリスト

- [ ] すべての環境変数が設定されている
- [ ] シークレットが十分な強度を持っている
- [ ] HTTPSが有効になっている
- [ ] セキュリティヘッダーが設定されている（vercel.jsonで設定済み）
- [ ] CORS設定が適切である
- [ ] レート制限が設定されている

## 監視設定

### Sentry

1. [Sentry](https://sentry.io)でプロジェクト作成
2. DSNを取得
3. 環境変数に設定：
   - `SENTRY_DSN`（サーバーサイド）
   - `NEXT_PUBLIC_SENTRY_DSN`（クライアントサイド）

### Vercel Analytics

Vercelダッシュボード → Analytics で有効化できます。

## 関連ドキュメント

- [バックアップ戦略](./backup-strategy.md)
- [アーキテクチャ概要](./architecture.md)
- [API ドキュメント](./api-documentation.md)
