# DiagnoLeads v2 デプロイメントチェックリスト

## 本番環境セットアップ

### 1. Vercel環境変数設定

#### 必須 (Required)

| 変数名 | 説明 | 設定場所 | 確認 |
|--------|------|----------|------|
| `DATABASE_URL` | PostgreSQL接続文字列 | Vercel > Settings > Environment Variables | ☐ |
| `BETTER_AUTH_SECRET` | 認証シークレット (32文字以上) | Vercel > Settings > Environment Variables | ☐ |
| `BETTER_AUTH_URL` | 認証コールバックURL | Vercel > Settings > Environment Variables | ☐ |
| `NEXT_PUBLIC_APP_URL` | アプリケーションURL | Vercel > Settings > Environment Variables | ☐ |
| `NODE_ENV` | `production` | Vercel自動設定 | ☐ |

#### 推奨 (Recommended)

| 変数名 | 説明 | 設定場所 | 確認 |
|--------|------|----------|------|
| `RESEND_API_KEY` | メール送信API | Vercel > Settings > Environment Variables | ☐ |
| `EMAIL_FROM` | 送信元メールアドレス | Vercel > Settings > Environment Variables | ☐ |
| `SENTRY_DSN` | エラー監視 | Vercel > Settings > Environment Variables | ☐ |
| `ANTHROPIC_API_KEY` | AIスコアリング | Vercel > Settings > Environment Variables | ☐ |
| `OPENAI_API_KEY` | 埋め込みベクトル | Vercel > Settings > Environment Variables | ☐ |

#### オプション (Optional)

| 変数名 | 説明 | 設定場所 | 確認 |
|--------|------|----------|------|
| `PAYLOAD_SECRET` | CMS シークレット | Vercel > Settings > Environment Variables | ☐ |
| `UPSTASH_REDIS_REST_URL` | レート制限用Redis | Vercel > Settings > Environment Variables | ☐ |
| `UPSTASH_REDIS_REST_TOKEN` | Redis認証トークン | Vercel > Settings > Environment Variables | ☐ |
| `NEXT_PUBLIC_GA_ID` | Google Analytics | Vercel > Settings > Environment Variables | ☐ |

---

### 2. シークレット生成コマンド

```bash
# BETTER_AUTH_SECRET生成
openssl rand -base64 32

# PAYLOAD_SECRET生成
openssl rand -base64 32
```

---

### 3. データベース設定

#### Neon (推奨)
1. [Neon Console](https://console.neon.tech/) でプロジェクト作成
2. Connection string をコピー
3. `DATABASE_URL` に設定

#### Supabase
1. [Supabase Dashboard](https://supabase.com/dashboard) でプロジェクト作成
2. Settings > Database > Connection string (URI) をコピー
3. `DATABASE_URL` に設定

---

### 4. 外部サービス設定

#### Resend (メール送信)
1. [Resend Dashboard](https://resend.com/api-keys) でAPIキー作成
2. ドメイン認証設定
3. `RESEND_API_KEY` に設定

#### Sentry (エラー監視)
1. [Sentry](https://sentry.io/) でプロジェクト作成
2. DSN をコピー
3. `SENTRY_DSN` に設定

#### Anthropic (AIスコアリング)
1. [Anthropic Console](https://console.anthropic.com/) でAPIキー作成
2. `ANTHROPIC_API_KEY` に設定

#### OpenAI (埋め込みベクトル)
1. [OpenAI Platform](https://platform.openai.com/api-keys) でAPIキー作成
2. `OPENAI_API_KEY` に設定

---

### 5. デプロイ手順

```bash
# 1. mainブランチに変更をpush
git push origin main

# 2. Vercelが自動でビルド・デプロイ

# 3. ヘルスチェック確認
curl https://your-app.vercel.app/api/health
```

---

### 6. デプロイ後確認

| 項目 | 確認方法 | 確認 |
|------|----------|------|
| ヘルスチェック | `GET /api/health` が200を返す | ☐ |
| ログイン機能 | サインイン/サインアップができる | ☐ |
| ダッシュボード | ダッシュボードが表示される | ☐ |
| 診断フォーム | 診断フォームが送信できる | ☐ |
| メール送信 | 診断結果メールが届く | ☐ |
| エラー監視 | Sentryにエラーが記録される | ☐ |

---

### 7. ロールバック手順

```bash
# Vercel CLIでロールバック
vercel rollback

# または Vercel Dashboard から
# Deployments > 以前のデプロイを選択 > Promote to Production
```

---

### 8. 本番監視

#### Vercel Analytics
- 自動有効化（Proプラン）
- ダッシュボード: https://vercel.com/[team]/[project]/analytics

#### Sentry
- エラー監視: https://sentry.io/
- アラート設定推奨

#### Cron Jobs
- Webhook配信ログ削除: 毎日3:00 UTC
- 確認: Vercel Dashboard > Deployments > Functions > Cron

---

## トラブルシューティング

### ビルドエラー
```bash
# ローカルでビルド確認
bun run build
```

### データベース接続エラー
- `DATABASE_URL` の形式確認
- SSL設定 (`?sslmode=require`) 確認
- IP許可リスト確認 (Neon/Supabase)

### 認証エラー
- `BETTER_AUTH_SECRET` が32文字以上か確認
- `BETTER_AUTH_URL` がデプロイURLと一致するか確認

---

*最終更新: 2026-01-31*
