# DiagnoLeads 管理者ガイド

このガイドは、DiagnoLeadsシステムの管理者向けドキュメントです。

## 目次

1. [システム概要](#システム概要)
2. [インストールとセットアップ](#インストールとセットアップ)
3. [環境設定](#環境設定)
4. [データベース管理](#データベース管理)
5. [API設定](#api設定)
6. [Webhook設定](#webhook設定)
7. [セキュリティ](#セキュリティ)
8. [監視とログ](#監視とログ)
9. [トラブルシューティング](#トラブルシューティング)

---

## システム概要

### 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript 5.9 |
| データベース | PostgreSQL + Drizzle ORM |
| 認証 | Better Auth |
| API | tRPC + REST API v2 |
| CMS | Payload CMS |
| スタイリング | Tailwind CSS v4 |
| 状態管理 | TanStack Query |

### アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                      クライアント                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  ダッシュボード  │  │  リード管理  │  │  アナリティクス │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Next.js App                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   tRPC Router                     │  │
│  │  leads | organizations | analytics | webhooks    │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │                  REST API v2                      │  │
│  │  /api/v2/leads | /api/v2/webhooks | /api/v2/...  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  leads  │  │  users  │  │webhooks │  │  tags   │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## インストールとセットアップ

### 前提条件

- Node.js 20以上
- Bun 1.0以上
- PostgreSQL 15以上
- mise（バージョン管理）

### インストール手順

```bash
# リポジトリのクローン
git clone https://github.com/your-org/diagnoleads-v2.git
cd diagnoleads-v2

# 依存関係のインストール
bun install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集

# データベースのマイグレーション
bun run db:migrate

# シードデータの投入（開発環境のみ）
bun run db:seed

# 開発サーバーの起動
bun run dev
```

### 本番ビルド

```bash
# ビルド
bun run build

# 本番サーバーの起動
bun run start
```

---

## 環境設定

### 必須環境変数

```bash
# データベース
DATABASE_URL=postgresql://user:password@localhost:5432/diagnoleads

# 認証
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# AI (Anthropic)
ANTHROPIC_API_KEY=your-api-key

# アプリケーション
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DiagnoLeads
```

### オプション環境変数

```bash
# メール送信 (Resend)
RESEND_API_KEY=your-resend-key

# OpenAI（オプション）
OPENAI_API_KEY=your-openai-key

# Slack連携
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Zapier連携
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/...
```

---

## データベース管理

### マイグレーション

```bash
# マイグレーションの生成
bun run db:generate

# マイグレーションの実行
bun run db:migrate

# データベースのリセット（開発環境のみ）
bun run db:reset

# Drizzle Studioの起動
bun run db:studio
```

### 主要テーブル

| テーブル | 説明 |
|---------|------|
| users | ユーザー情報 |
| organizations | 組織情報 |
| organization_members | 組織メンバーシップ |
| leads | リード情報 |
| tags | タグ定義 |
| lead_tags | リード-タグ関連 |
| webhooks | Webhook設定 |
| webhook_deliveries | Webhook配信履歴 |
| diagnostic_templates | 診断テンプレート |
| diagnostic_ab_tests | A/Bテスト設定 |
| lead_scoring_rulesets | スコアリングルール |
| workflows | ワークフロー定義 |
| workflow_executions | ワークフロー実行履歴 |
| custom_fields | カスタムフィールド定義 |

### Row-Level Security (RLS)

DiagnoLeadsはRLSを使用してマルチテナント分離を実現：

```sql
-- 例: leadsテーブルのRLSポリシー
CREATE POLICY leads_policy ON leads
  USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

---

## API設定

### tRPC API

内部API用のtRPCルーター：

```typescript
// 利用可能なルーター
appRouter.leads       // リード管理
appRouter.organizations // 組織管理
appRouter.members     // メンバー管理
appRouter.analytics   // アナリティクス
appRouter.webhooks    // Webhook管理
appRouter.tags        // タグ管理
appRouter.workflows   // ワークフロー
appRouter.customFields // カスタムフィールド
appRouter.diagnosticTemplates // 診断テンプレート
appRouter.abTests     // A/Bテスト
appRouter.scoringRules // スコアリングルール
```

### REST API v2

外部連携用のREST API：

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/v2/leads` | GET | リード一覧取得 |
| `/api/v2/leads` | POST | リード作成 |
| `/api/v2/leads/:id` | GET | リード詳細取得 |
| `/api/v2/leads/:id` | PATCH | リード更新 |
| `/api/v2/leads/:id` | DELETE | リード削除 |
| `/api/v2/analytics` | GET | アナリティクス取得 |
| `/api/v2/webhooks` | GET | Webhook一覧取得 |
| `/api/v2/webhooks` | POST | Webhook作成 |
| `/api/v2/webhooks/:id` | GET | Webhook詳細取得 |
| `/api/v2/webhooks/:id` | PATCH | Webhook更新 |
| `/api/v2/webhooks/:id` | DELETE | Webhook削除 |

### 認証

REST API v2はBearer Token認証を使用：

```bash
curl -H "Authorization: Bearer org_YOUR_ORGANIZATION_TOKEN" \
     https://your-domain.com/api/v2/leads
```

---

## Webhook設定

### 利用可能なイベント

| イベント | 説明 |
|---------|------|
| `lead.created` | リード作成時 |
| `lead.updated` | リード更新時 |
| `lead.deleted` | リード削除時 |
| `lead.status_changed` | ステータス変更時 |
| `lead.scored` | スコア更新時 |
| `diagnostic.submitted` | 診断送信時 |
| `diagnostic.completed` | 診断完了時 |
| `organization.member_added` | メンバー追加時 |
| `organization.member_removed` | メンバー削除時 |
| `blog.published` | ブログ公開時 |
| `faq.published` | FAQ公開時 |

### Webhookペイロード形式

```json
{
  "id": "delivery-uuid",
  "event": "lead.created",
  "timestamp": "2025-12-05T12:00:00Z",
  "data": {
    "lead": {
      "id": "lead-uuid",
      "email": "example@company.com",
      "name": "田中太郎",
      "company": "株式会社ABC",
      "status": "new",
      "score": 75
    }
  }
}
```

### 署名検証

Webhookリクエストには`X-Webhook-Signature`ヘッダーが含まれます：

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### リトライ設定

失敗したWebhookは自動的にリトライされます：

- 最大リトライ回数: 3回（設定可能）
- リトライ間隔: 5秒（設定可能）

---

## セキュリティ

### 認証・認可

- **認証**: Better Authによるセッションベース認証
- **認可**: CASLによるロールベースアクセス制御（RBAC）

### パーミッションマトリクス

| 操作 | オーナー | 管理者 | メンバー |
|------|---------|--------|---------|
| リード閲覧 | ✓ | ✓ | ✓ |
| リード作成 | ✓ | ✓ | ✓ |
| リード編集 | ✓ | ✓ | ✓ |
| リード削除 | ✓ | ✓ | ✗ |
| 設定変更 | ✓ | ✓ | ✗ |
| メンバー管理 | ✓ | ✓ | ✗ |
| 組織削除 | ✓ | ✗ | ✗ |

### セキュリティヘッダー

Next.jsのmiddlewareでセキュリティヘッダーを設定：

```typescript
// 設定されるヘッダー
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### レート制限

APIリクエストはレート制限されています：
- 通常リクエスト: 100リクエスト/分
- 認証リクエスト: 10リクエスト/分

---

## 監視とログ

### アプリケーションログ

```bash
# 開発環境
bun run dev # ターミナルに出力

# 本番環境
# PM2やシステムログで管理
pm2 logs diagnoleads
```

### ヘルスチェック

```bash
# アプリケーションヘルスチェック
curl http://localhost:3000/api/health

# データベース接続確認
curl http://localhost:3000/api/health/db
```

### メトリクス

以下のメトリクスを監視することを推奨：
- リクエスト数/秒
- レスポンスタイム
- エラー率
- データベース接続数
- メモリ使用量

---

## トラブルシューティング

### よくある問題

#### データベース接続エラー

```
Error: Connection refused
```

**解決策:**
1. PostgreSQLが起動しているか確認
2. `DATABASE_URL`が正しいか確認
3. ファイアウォール設定を確認

#### 認証エラー

```
Error: Invalid session
```

**解決策:**
1. `BETTER_AUTH_SECRET`が設定されているか確認
2. Cookieの設定を確認
3. セッションの有効期限を確認

#### ビルドエラー

```
Error: Module not found
```

**解決策:**
1. `bun install`を再実行
2. `node_modules`を削除して再インストール
3. TypeScriptエラーを確認

### ログの確認

```bash
# エラーログの確認
cat /var/log/diagnoleads/error.log

# アクセスログの確認
cat /var/log/diagnoleads/access.log
```

### サポート

問題が解決しない場合は、以下の情報を添えてサポートに連絡：
- エラーメッセージ
- 再現手順
- 環境情報（OS、Node.jsバージョン等）
- 関連するログ

---

## 付録

### コマンドリファレンス

| コマンド | 説明 |
|---------|------|
| `bun run dev` | 開発サーバー起動 |
| `bun run build` | 本番ビルド |
| `bun run start` | 本番サーバー起動 |
| `bun run lint` | コードチェック |
| `bun run format` | コードフォーマット |
| `bun run test` | テスト実行 |
| `bun run test:coverage` | カバレッジレポート |
| `bun run db:generate` | マイグレーション生成 |
| `bun run db:migrate` | マイグレーション実行 |
| `bun run db:seed` | シードデータ投入 |
| `bun run db:studio` | Drizzle Studio起動 |
| `bun run openapi:generate` | OpenAPI仕様生成 |

### 参考リンク

- [Next.js ドキュメント](https://nextjs.org/docs)
- [tRPC ドキュメント](https://trpc.io/docs)
- [Drizzle ORM ドキュメント](https://orm.drizzle.team/docs)
- [Better Auth ドキュメント](https://better-auth.com/docs)
- [Payload CMS ドキュメント](https://payloadcms.com/docs)

---

© 2025 DiagnoLeads. All rights reserved.
