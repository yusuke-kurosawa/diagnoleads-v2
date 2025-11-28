# DiagnoLeads v2 アーキテクチャ仕様

> **Source of Truth**: DiagnoLeads v2 のアーキテクチャ全体を定義する仕様書
>
> **最終更新**: 2025-11-28
> **ステータス**: Phase 1-2.6完了、Phase 3進行中（実装完了率: 79%）

---

## 概要

DiagnoLeads v2 は、AI駆動のB2B診断プラットフォームをマルチテナントSaaSとして再構築したものです。

### 🏢 コアコンピタンス

**DiagnoLeads v2は、ホールディングス・グループ企業・会社合併に柔軟に対応できる、エンタープライズグレードのマルチテナントプラットフォームです。**

標準的なマルチテナントSaaSとは異なり、以下の差別化要素を持ちます：

- 🏗️ **階層的組織構造** - 親会社-子会社-孫会社の無制限階層
- 📊 **グループ統合レポート** - グループ全体の横断分析
- 🔄 **M&A対応** - 組織再編・データ統合ウィザード
- 🔐 **柔軟なデータ共有** - 組織間の細かいアクセス制御
- 👥 **階層的権限管理** - グループオーナー、親会社閲覧者など

👉 **詳細**: [マルチテナント戦略文書](../../docs/MULTI_TENANT_STRATEGY.md)

### コアコンセプト

1. **階層的マルチテナント** - 組織ごとの完全なデータ分離 + グループ横断機能
2. **AI駆動開発** - OpenSpecベースの仕様駆動開発
3. **型安全性** - TypeScript + tRPC + Drizzle ORMによるE2E型安全性
4. **拡張性** - プラグインアーキテクチャによる機能拡張
5. **セキュリティファースト** - CSP、レート制限、RLS、CASL権限管理
6. **エンタープライズ対応** - ホールディングス・グループ企業・M&A

---

## 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 15.1.5 | App Router、Server Components |
| React | 19.0.0 | UIフレームワーク |
| TypeScript | 5.7+ | 型安全性 |
| Tailwind CSS | 4.0 | スタイリング |
| shadcn/ui | v2 | UIコンポーネント |
| TanStack Query | 5.90+ | データフェッチ・キャッシング |
| React Hook Form | 7.54+ | フォーム管理 |
| Zod | 3.24+ | バリデーション |

### バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| tRPC | 11.0+ | 型安全なAPI |
| Drizzle ORM | 0.38+ | データベースORM |
| PostgreSQL | 16+ | メインデータベース |
| BetterAuth | 1.4+ | 認証・認可（組織機能） |
| CASL | 6.7+ | 権限管理 |

### AI & アナリティクス

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Vercel AI SDK | 5.0+ | AI統合 |
| Anthropic Claude | 3.5 Sonnet | LLM |
| Tremor | 3.18+ | ダッシュボードチャート |

### 開発ツール

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Biome | 1.9+ | リンター・フォーマッター |
| Vitest | 4.0+ | ユニットテスト |
| Playwright | 1.51+ | E2Eテスト |
| Turbopack | - | 開発サーバー |

---

## マルチテナントアーキテクチャ

### データベーススキーマ

```typescript
// コアテーブル
organizations         // テナント（組織）
users                // ユーザー
organization_members // 組織メンバーシップ（ロール付き）
sessions            // 認証セッション

// ビジネスエンティティ
leads               // リード（organizationId外部キー）
  └─ organizationId // マルチテナント分離キー

// すべてのビジネステーブルにorganizationIdが必須
```

### Row-Level Security (RLS)

```sql
-- PostgreSQL RLS ポリシー
CREATE POLICY "leads_select" ON "leads"
  FOR SELECT
  USING (organization_id IN (SELECT auth.user_organization_ids()));

-- ヘルパー関数
CREATE FUNCTION auth.user_id() RETURNS uuid;
CREATE FUNCTION auth.user_organization_ids() RETURNS SETOF uuid;
```

### 権限管理（CASL）

```typescript
// ロールベースアクセス制御
type Role = 'owner' | 'admin' | 'member';

// owner: すべての操作
// admin: 組織削除以外のすべて
// member: リード読み取り・作成・更新
```

---

## API設計

### Layer 1: tRPC（内部API）

```typescript
// 型安全な内部API
const appRouter = router({
  leads: leadsRouter,
  organizations: organizationsRouter,
  analytics: analyticsRouter,
});

// organizationProcedure = 自動的に組織スコープ適用
export const organizationProcedure = protectedProcedure
  .input(z.object({ organizationId: z.string().uuid() }))
  .use(/* メンバーシップ検証 + RLS適用 */);
```

### Layer 2: OpenAPI（外部API）

```typescript
// tRPC → OpenAPI変換
// 外部統合用REST APIとして公開
// Zapier、Make、カスタムCRM連携等
```

### Layer 3: WebSocket（リアルタイム）

```typescript
// 将来実装予定
// AsyncAPI仕様で定義
// リアルタイム通知、協働編集
```

---

## セキュリティアーキテクチャ

### 多層防御

```
Layer 1: Next.js Middleware
├─ CSP Headers（開発/本番で異なるポリシー）
├─ レート制限（API: 100/min、Auth: 5/min）
└─ 認証チェック（BetterAuth）

Layer 2: tRPC Middleware
├─ organizationProcedure（メンバーシップ検証）
└─ CASL権限チェック

Layer 3: Database RLS
├─ PostgreSQL Row-Level Security
└─ 自動的にorganization_id条件追加
```

### セキュリティ機能

- ✅ Content Security Policy（nonce-based）
- ✅ レート制限（IP-based、メモリストア）
- ✅ Row-Level Security（PostgreSQL）
- ✅ CSRF保護（BetterAuth）
- ✅ XSS防止（React、Server Components）
- ✅ SQL Injection防止（Drizzle ORM）

---

## ディレクトリ構造

```
diagnoleads-v2/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証ページ（layout共有）
│   ├── (dashboard)/       # ダッシュボード（layout共有）
│   └── api/               # API routes
├── components/            # Reactコンポーネント
│   ├── ui/               # shadcn/ui基本コンポーネント
│   ├── auth/             # 認証フォーム
│   ├── dashboard/        # ダッシュボード専用
│   └── common/           # 共通コンポーネント
├── lib/                   # ユーティリティ
│   ├── db/               # データベース（Drizzle）
│   ├── auth/             # 認証・権限
│   ├── trpc/             # tRPC設定
│   └── middleware/       # ミドルウェア（レート制限等）
├── server/                # サーバー専用コード
│   └── routers/          # tRPCルーター
├── emails/                # React Emailテンプレート
├── openspec/              # OpenSpec仕様（NEW）
│   ├── specs/            # 現在の仕様
│   └── changes/          # 提案された変更
├── test/                  # テスト
│   ├── unit/             # ユニットテスト
│   └── e2e/              # E2Eテスト
└── drizzle/               # マイグレーション
```

---

## 開発ワークフロー

### OpenSpec仕様駆動開発

```
1. Draft    → openspec/changes/に変更提案作成
2. Review   → 仕様レビュー・合意
3. Implement → AI支援で実装
4. Complete → 実装完了
5. Archive  → openspec/specs/にマージ
```

### Git ワークフロー

```bash
# ブランチ戦略
main                    # 本番環境
claude/feature-xxx      # AI開発ブランチ

# コミット規約
feat: 新機能
fix: バグ修正
docs: ドキュメント
test: テスト
refactor: リファクタリング
```

---

## テスト戦略

### ユニットテスト（Vitest）

```typescript
// ターゲット: ユーティリティ、ビジネスロジック
// カバレッジ目標: 70%以上
// 実行: npm run test
```

### E2Eテスト（Playwright）

```typescript
// ターゲット: 主要ユーザーフロー
// - ログイン → ダッシュボード表示
// - リード作成 → 一覧表示
// - 組織切り替え → データ分離確認
```

---

## デプロイメント

### ローカル開発

```bash
docker-compose up -d     # PostgreSQL、Redis、Mailhog起動
npm run db:migrate       # マイグレーション実行
npm run db:seed          # テストデータ投入
npm run dev              # 開発サーバー起動
```

### 本番環境（フェーズ7）

```
Vercel Pro               # Next.jsホスティング
Supabase Pro            # PostgreSQL
Resend                  # トランザクションメール
Trigger.dev             # バックグラウンドジョブ
```

---

## フェーズ計画

### Phase 1: 基盤セットアップ ✅ 完了

- コアフレームワーク
- 認証基盤（BetterAuth）
- データベース（Drizzle + RLS）
- セキュリティ（CSP、レート制限）
- テストインフラ

### Phase 2: コア機能実装 ✅ 完了

- 組織スコープミドルウェア（[詳細](/openspec/specs/features/multi-tenant.md)）
- リード管理CRUD（[API仕様](/openspec/specs/api/leads.md)）
- ダッシュボード統計（[API仕様](/openspec/specs/api/analytics.md)）
- 組織管理・メンバー招待（[API仕様](/openspec/specs/api/organizations.md)）

### Phase 2.5-2.6: i18n基盤 ✅ 完了

- next-intl 3.27+ 統合
- 306翻訳キー（日英100%一致）
- 全ページi18n対応

### Phase 3: AI機能 🚧 進行中 (90%)

- AIリードスコアリング ✅（[詳細](/openspec/specs/features/ai-scoring.md)）
- セマンティック検索 ✅（[API仕様](/openspec/specs/api/ai.md)）
- 類似リード検索 ✅
- AI要約生成 ✅
- チャットボット ⏸️（オプション）

### Phase 4-7: 拡張機能

- 公開ページ・SEO
- 外部統合・Webhook
- アナリティクス高度化
- 本番カットオーバー

---

## パフォーマンス目標

| 指標 | 目標値 |
|------|--------|
| Initial Load | < 1.5s |
| Time to Interactive | < 2.5s |
| API Response | < 200ms (p95) |
| Database Query | < 50ms (p95) |

---

## 拡張性設計

### プラグインアーキテクチャ（計画中）

```typescript
interface DiagnoLeadsPlugin {
  name: string;
  version: string;
  extendSchema?: (schema: Schema) => Schema;
  extendRouter?: (router: Router) => Router;
  components?: Record<string, Component>;
  hooks?: PluginHooks;
}
```

### 機能フラグ（計画中）

```typescript
interface FeatureFlags {
  aiDrivenScoring: boolean;
  embedWidget: boolean;
  apiAccess: boolean;
  advancedAnalytics: boolean;
}
```

### テーマカスタマイズ（計画中）

```typescript
interface OrganizationTheme {
  primaryColor: string;
  logo: string;
  customDomain?: string;
}
```

---

## 参考資料

### 詳細仕様書

**API仕様**:
- [Leads API](/openspec/specs/api/leads.md) - リード管理CRUD
- [Organizations API](/openspec/specs/api/organizations.md) - 組織・メンバー管理
- [Analytics API](/openspec/specs/api/analytics.md) - 統計・分析
- [AI API](/openspec/specs/api/ai.md) - AI機能

**機能仕様**:
- [マルチテナント](/openspec/specs/features/multi-tenant.md) - RLS、CASL、組織スコープ
- [AI機能](/openspec/specs/features/ai-scoring.md) - スコアリング、検索、要約

### 外部ドキュメント

- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [BetterAuth](https://www.better-auth.com)
- [shadcn/ui](https://ui.shadcn.com)
- [OpenSpec](https://github.com/Fission-AI/OpenSpec)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [pgvector](https://github.com/pgvector/pgvector)
