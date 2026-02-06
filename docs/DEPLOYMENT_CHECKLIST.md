# DiagnoLeads v2 本番デプロイメントチェックリスト

> 本番環境へのデプロイ前に確認すべき項目と設定手順

---

## 目次

1. [必須環境変数](#1-必須環境変数)
2. [推奨環境変数](#2-推奨環境変数)
3. [オプション環境変数](#3-オプション環境変数)
4. [Vercel設定手順](#4-vercel設定手順)
5. [データベース設定](#5-データベース設定)
6. [セキュリティチェックリスト](#6-セキュリティチェックリスト)
7. [監視設定](#7-監視設定)
8. [デプロイ後確認](#8-デプロイ後確認)

---

## 1. 必須環境変数

以下の環境変数は**必ず設定**が必要です。

### データベース

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | PostgreSQL接続URL | `postgresql://user:pass@host:5432/db?sslmode=require` |

**推奨プロバイダー:**
- Vercel Postgres
- Supabase
- Neon
- PlanetScale (要Drizzle設定変更)

### 認証

| 変数名 | 説明 | 生成方法 |
|--------|------|----------|
| `BETTER_AUTH_SECRET` | 認証シークレット (32文字以上) | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | 認証URL | `https://app.diagnoleads.com` |

### アプリケーション

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NODE_ENV` | 環境 | `production` |
| `NEXT_PUBLIC_APP_URL` | 公開URL | `https://app.diagnoleads.com` |
| `NEXT_PUBLIC_APP_NAME` | アプリ名 | `DiagnoLeads` |

---

## 2. 推奨環境変数

本番運用に**強く推奨**される設定です。

### メール (Resend)

| 変数名 | 説明 | 取得先 |
|--------|------|--------|
| `RESEND_API_KEY` | Resend APIキー | [Resend Dashboard](https://resend.com/api-keys) |
| `EMAIL_FROM` | 送信元アドレス | `DiagnoLeads <noreply@diagnoleads.com>` |

**設定手順:**
1. [Resend](https://resend.com)でアカウント作成
2. ドメイン認証（DNS TXTレコード追加）
3. APIキー発行

### 監視 (Sentry)

| 変数名 | 説明 | 取得先 |
|--------|------|--------|
| `SENTRY_DSN` | Sentry DSN | Sentry Project Settings |
| `SENTRY_AUTH_TOKEN` | 認証トークン | Sentry Auth Tokens |
| `SENTRY_ORG` | 組織名 | Sentry Settings |
| `SENTRY_PROJECT` | プロジェクト名 | Sentry Project |

**設定手順:**
1. [Sentry](https://sentry.io)でプロジェクト作成
2. DSNをコピー
3. Auth Tokenを発行

### CMS (PayloadCMS)

| 変数名 | 説明 | 生成方法 |
|--------|------|----------|
| `PAYLOAD_SECRET` | Payloadシークレット | `openssl rand -base64 32` |
| `CMS_PROVIDER` | CMSプロバイダー | `payload` |

---

## 3. オプション環境変数

機能に応じて設定します。

### AI機能

| 変数名 | 説明 | 必要な機能 |
|--------|------|-----------|
| `ANTHROPIC_API_KEY` | Anthropic APIキー | AIスコアリング、チャット |
| `OPENAI_API_KEY` | OpenAI APIキー | 埋め込み検索 |

**取得先:**
- Anthropic: [Console](https://console.anthropic.com)
- OpenAI: [Platform](https://platform.openai.com/api-keys)

### バックグラウンドジョブ

| 変数名 | 説明 | 取得先 |
|--------|------|--------|
| `TRIGGER_API_KEY` | Trigger.dev APIキー | [Trigger.dev](https://trigger.dev) |
| `TRIGGER_API_URL` | API URL | `https://api.trigger.dev` |

### レート制限 (Upstash Redis)

| 変数名 | 説明 | 取得先 |
|--------|------|--------|
| `UPSTASH_REDIS_REST_URL` | Redis REST URL | [Upstash](https://upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis Token | Upstash Console |

### 外部連携

| 変数名 | 説明 |
|--------|------|
| `ZAPIER_API_KEY` | Zapier連携用 |
| `CMS_SLACK_WEBHOOK_URL` | CMS変更通知用Slack Webhook |

### アナリティクス

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID |

---

## 4. Vercel設定手順

### 4.1 プロジェクト作成

```bash
# Vercel CLIでプロジェクトをリンク
vercel link

# または Vercel Dashboard からインポート
```

### 4.2 環境変数設定

1. Vercel Dashboard → Project → Settings → Environment Variables
2. 各環境変数を追加
3. Environment: `Production` を選択

**重要:** `NEXT_PUBLIC_*` 変数はビルド時に埋め込まれます。

### 4.3 ビルド設定

```
Build Command: bun run build
Output Directory: .next
Install Command: bun install
```

### 4.4 ドメイン設定

1. Settings → Domains
2. カスタムドメインを追加
3. DNS設定（CNAME or A レコード）

---

## 5. データベース設定

### 5.1 スキーマ適用

```bash
# 本番DBにスキーマを適用
DATABASE_URL="本番DB URL" bun run db:push
```

### 5.2 マイグレーション

```bash
# マイグレーションファイル生成
bun run db:generate

# マイグレーション適用
DATABASE_URL="本番DB URL" bun run db:migrate
```

### 5.3 初期データ

必要に応じてシードデータを投入:

```bash
DATABASE_URL="本番DB URL" bun run db:seed
```

---

## 6. セキュリティチェックリスト

デプロイ前に確認:

### 必須
- [ ] `BETTER_AUTH_SECRET` は32文字以上のランダム文字列
- [ ] `DATABASE_URL` にSSL接続 (`?sslmode=require`)
- [ ] 環境変数に秘密情報が直接コミットされていない
- [ ] `.env.local` が `.gitignore` に含まれている

### 推奨
- [ ] Sentryエラー監視を設定
- [ ] Rate Limitingを有効化（Upstash Redis）
- [ ] CSRFトークンが機能している
- [ ] HTTPS強制（Vercelは自動）

### 確認コマンド

```bash
# 依存関係の脆弱性チェック
bun audit

# 秘密情報のスキャン
git secrets --scan-history
```

---

## 7. 監視設定

### 7.1 Sentry

```javascript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 本番は低めに
});
```

### 7.2 Vercel Analytics

自動的に有効。追加設定不要。

### 7.3 アラート設定

- **エラー率**: 1%を超えたら通知
- **レスポンス時間**: P95 > 3秒で通知
- **デプロイ失敗**: 即時通知

---

## 8. デプロイ後確認

### 8.1 機能チェック

- [ ] トップページが表示される
- [ ] ログイン/サインアップが機能する
- [ ] 組織作成ができる
- [ ] リード登録ができる
- [ ] 診断フォームが動作する

### 8.2 パフォーマンス

```bash
# Lighthouse スコア確認
npx lighthouse https://app.diagnoleads.com --output=json
```

目標:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### 8.3 セキュリティスキャン

```bash
# OWASP ZAP でスキャン（オプション）
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://app.diagnoleads.com
```

---

## クイックスタート

最小限の設定で本番デプロイ:

```bash
# 1. 必須環境変数をVercelに設定
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
BETTER_AUTH_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"

# 2. デプロイ
vercel --prod

# 3. データベースセットアップ
DATABASE_URL="..." bun run db:push
```

---

## トラブルシューティング

### ビルドエラー

```
Error: Missing environment variable
```
→ 環境変数が設定されているか確認

### データベース接続エラー

```
Error: Connection refused
```
→ `DATABASE_URL` の形式とSSL設定を確認

### 認証エラー

```
Error: Invalid session
```
→ `BETTER_AUTH_SECRET` が本番と一致しているか確認

---

*最終更新: 2026-02-06*
