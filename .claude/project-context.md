# DiagnoLeads v2 - Project Context for AI Assistants

> このファイルは、Claude CodeなどのAIアシスタントがプロジェクトを正確に理解し、高品質なコードを生成するためのコンテキスト情報です。

## 🎯 プロジェクトの本質

### コアコンピタンス（最重要）

**DiagnoLeads v2は、ホールディングス・グループ企業・会社合併に対応する、階層的マルチテナントSaaSプラットフォームです。**

これは単なる機能ではなく、プロダクトの差別化要素であり、全ての設計判断の基準となります。

### 差別化要素

```
一般的なマルチテナントSaaS:
- 組織A | 組織B | 組織C （フラット）

DiagnoLeads v2:
- ホールディングス
  ├─ 事業会社A
  │  ├─ 子会社A1
  │  └─ 子会社A2
  └─ 事業会社B
     └─ 子会社B1
```

**実装時の注意点**:
1. 組織には必ず`parent_organization_id`フィールドを考慮
2. 権限チェックは組織階層を考慮（親会社は子会社データを閲覧可能）
3. グループ横断レポート機能を念頭に置く
4. M&A・組織再編に対応できる柔軟な設計

---

## 📐 アーキテクチャ原則

### 1. 型安全性 (Type Safety First)

```typescript
// ✅ 良い例: 完全な型安全性
import type { Lead } from '@/lib/db/schema';
import { createLeadSchema } from '@/lib/features/leads/types';

export function createLead(input: z.infer<typeof createLeadSchema>): Promise<Lead> {
  // Zod validation → tRPC → Drizzle ORM → TypeScript type
}

// ❌ 悪い例: any型の使用
export function createLead(input: any): Promise<any> {
  // 型安全性が失われる
}
```

### 2. Feature-based Organization

```
lib/features/{feature}/
├── api/
│   └── router.ts       # tRPC router
├── types/
│   ├── schemas.ts      # Zod schemas
│   └── index.ts        # Type exports
└── hooks/              # React hooks (optional)
```

**原則**:
- 機能ごとにコロケーション（関連コードを近くに配置）
- API、型定義、ビジネスロジックを一箇所に
- テストも同じfeatureディレクトリに

### 3. Multi-tenant Isolation

```typescript
// すべてのビジネスエンティティは organizationId を持つ
export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  // 🆕 将来: グループ横断機能のため
  groupId: uuid('group_id'),
  // ... other fields
});
```

**重要**:
- `organizationProcedure`を必ず使用
- RLSが自動適用されることを確認
- CASL権限チェックを忘れずに

### 4. OpenSpec-driven Development

```
openspec/
├── specs/              # Source of Truth（仕様の真実）
│   └── architecture.md # 全体アーキテクチャ
└── changes/            # 変更提案
    └── {feature}/
        ├── spec-delta.md  # 何が変わるか
        └── tasks.md       # 何をするか
```

**原則**:
- 実装前に仕様を作成
- 仕様と実装を常に同期
- AI実装の精度向上

---

## 🏗️ ディレクトリ構造ガイド

### コアディレクトリ

```
lib/
├── multi-tenant/          # マルチテナント専用ロジック
│   ├── middleware/
│   │   └── organization.ts    # organizationProcedure
│   ├── helpers/
│   │   └── membership.ts      # メンバーシップ検証
│   └── types.ts               # 共通型定義
│
├── features/              # Feature-based modules
│   └── leads/
│       ├── api/
│       │   └── router.ts      # tRPC router (CRUD)
│       └── types/
│           └── schemas.ts     # Zod schemas
│
├── db/
│   ├── schema.ts              # Drizzle schema
│   ├── client.ts              # Database client
│   └── rls.ts                 # Row-Level Security
│
├── auth/
│   ├── config.ts              # BetterAuth設定
│   └── permissions.ts         # CASL権限定義
│
└── trpc/
    ├── init.ts                # tRPC初期化 + procedures
    └── context.ts             # Context定義
```

### ファイル作成時の判断基準

```
新しい機能を追加する時:
1. lib/features/{feature}/ を作成 ✅
2. 従来のserver/routers/{feature}.ts は避ける ⚠️

新しいユーティリティ:
1. lib/utils/ に追加 ✅
2. 複数箇所で使う場合のみ ✅

マルチテナント関連:
1. lib/multi-tenant/ に追加 ✅
2. 組織・権限・グループ関連すべて ✅
```

---

## 🔧 コーディング規約

### tRPC Procedure パターン

```typescript
// ✅ 推奨パターン
export const leadsRouter = router({
  create: organizationProcedure
    .input(createLeadSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Permission check
      if (!ctx.ability.can('create', 'Lead')) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'リードを作成する権限がありません' });
      }

      // 2. Business logic
      const [lead] = await ctx.db
        .insert(leads)
        .values({ ...input })
        .returning();

      // 3. Return typed result
      return lead;
    }),
});
```

### React Hooks パターン

```typescript
// ✅ 推奨パターン
export function useCreateLead() {
  const utils = trpc.useContext();

  return trpc.leads.create.useMutation({
    onSuccess: () => {
      // キャッシュ無効化
      utils.leads.list.invalidate();
    },
  });
}

// Composite hook
export function useLeads(organizationId: string) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  return {
    create: (input: Omit<CreateLeadInput, 'organizationId'>) =>
      createLead.mutate({ ...input, organizationId }),
    update: (input: Omit<UpdateLeadInput, 'organizationId'>) =>
      updateLead.mutate({ ...input, organizationId }),
  };
}
```

### Component パターン

```typescript
// ✅ 推奨パターン: Server Component
export default async function LeadsPage({
  params,
}: {
  params: { organizationId: string };
}) {
  // Server-side data fetching
  const leads = await api.leads.list.query({ organizationId: params.organizationId });

  return <LeadList leads={leads} />;
}

// ✅ 推奨パターン: Client Component
'use client';

export function LeadList({ leads }: { leads: Lead[] }) {
  const { organizationId } = useRequiredOrganizationId();
  const { create } = useLeads(organizationId);

  // ...
}
```

---

## 🧪 テスト規約

### ユニットテスト

```typescript
// ✅ 推奨パターン
describe('Leads Router', () => {
  const TEST_ORG_ID = '660e8400-e29b-41d4-a716-446655440000';

  it('should create a new lead successfully', async () => {
    // Arrange
    mockDb.returning.mockResolvedValue([mockLead]);

    // Act
    const result = await caller.leads.create({
      organizationId: TEST_ORG_ID,
      email: 'test@example.com',
    });

    // Assert
    expect(result).toEqual(mockLead);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('should enforce organization isolation', async () => {
    // 他組織のデータが見えないことをテスト
    await expect(
      caller.leads.get({
        organizationId: OTHER_ORG_ID,
        id: LEAD_ID,
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});
```

**テストカバレッジ目標**:
- ユニットテスト: 70%以上
- 重要な機能: 90%以上
- マルチテナント分離: 100%

---

## 🚨 よくある間違いと対策

### ❌ 間違い 1: organizationId を忘れる

```typescript
// ❌ 悪い例
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  // organizationId がない！
});

// ✅ 正しい例
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey(),
  organizationId: uuid('organization_id').notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
});
```

### ❌ 間違い 2: protectedProcedure を使う

```typescript
// ❌ 悪い例: 組織スコープが適用されない
export const leadsRouter = router({
  list: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // 手動でメンバーシップ確認が必要！
    }),
});

// ✅ 正しい例: 自動的に組織スコープ適用
export const leadsRouter = router({
  list: organizationProcedure
    .input(listLeadsSchema)
    .query(async ({ ctx, input }) => {
      // ctx.organization, ctx.membership, ctx.ability が自動設定
    }),
});
```

### ❌ 間違い 3: 権限チェックを忘れる

```typescript
// ❌ 悪い例
delete: organizationProcedure
  .input(deleteLeadSchema)
  .mutation(async ({ ctx, input }) => {
    // 権限チェックなし！
    await ctx.db.delete(leads).where(eq(leads.id, input.id));
  }),

// ✅ 正しい例
delete: organizationProcedure
  .input(deleteLeadSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('delete', 'Lead')) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'リードを削除する権限がありません' });
    }
    await ctx.db.delete(leads).where(eq(leads.id, input.id));
  }),
```

---

## 📚 重要ドキュメント

### 必読ドキュメント

1. **[MULTI_TENANT_STRATEGY.md](../docs/MULTI_TENANT_STRATEGY.md)** ⭐⭐⭐
   - ホールディングス・グループ企業対応戦略
   - 最も重要な差別化要素

2. **[IMPLEMENTATION_CHECKLIST.md](../IMPLEMENTATION_CHECKLIST.md)** ⭐⭐⭐
   - 実装進捗管理
   - タスク優先順位

3. **[openspec/specs/architecture.md](../openspec/specs/architecture.md)** ⭐⭐
   - アーキテクチャ全体像
   - 技術スタック詳細

4. **[DIRECTORY_IMPROVEMENT_PLAN.md](../docs/DIRECTORY_IMPROVEMENT_PLAN.md)** ⭐
   - ディレクトリ構造改善計画
   - Feature-based organization

### ドキュメント更新ルール

```
新機能実装時:
1. openspec/changes/{feature}/spec-delta.md を作成
2. 実装完了後、openspec/specs/architecture.md を更新
3. IMPLEMENTATION_CHECKLIST.md の進捗を更新

アーキテクチャ変更時:
1. MULTI_TENANT_STRATEGY.md を確認（影響ある？）
2. openspec/specs/architecture.md を更新
3. README.md のプロジェクト構造を更新
```

---

## 🎨 UI/UX ガイドライン

### コンポーネント設計

```typescript
// ✅ 推奨: 小さく、再利用可能なコンポーネント
export function LeadCard({ lead }: { lead: Lead }) {
  // Single responsibility
}

export function LeadList({ leads }: { leads: Lead[] }) {
  return leads.map(lead => <LeadCard key={lead.id} lead={lead} />);
}

// ❌ 避ける: 巨大なコンポーネント
export function LeadsPage() {
  // データ取得 + UI + ビジネスロジック全部
  // 500行のコード...
}
```

### スタイリング

```tsx
// ✅ 推奨: Tailwind CSS utility classes
<div className="flex items-center gap-2 p-4 rounded-lg border">

// ❌ 避ける: インラインスタイル
<div style={{ display: 'flex', gap: '8px' }}>
```

---

## 🔐 セキュリティ原則

### 多層防御モデル

```
User Request
  ↓
1. protectedProcedure (認証チェック) ← BetterAuth
  ↓
2. organizationProcedure (組織検証) ← Membership確認
  ↓
3. CASL Ability (権限計算) ← Role-based
  ↓
4. RLS-scoped DB (データ分離) ← PostgreSQL
  ↓
5. Business Logic
```

**重要**: すべての層が機能して初めて安全

---

## 🚀 パフォーマンス最適化

### データベースクエリ

```typescript
// ✅ 推奨: Drizzle ORM with RLS
const leads = await ctx.db.query.leads.findMany({
  where: eq(leads.organizationId, input.organizationId),
  limit: input.limit,
  offset: input.offset,
  orderBy: desc(leads.createdAt),
});

// ✅ さらに良い: インデックス確認
// CREATE INDEX idx_leads_org_created ON leads(organization_id, created_at DESC);
```

### React Query キャッシング

```typescript
// ✅ 推奨: 適切なキャッシュ戦略
trpc.leads.list.useQuery(
  { organizationId },
  {
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    cacheTime: 10 * 60 * 1000, // 10分間保持
  }
);
```

---

## 📝 コミットメッセージ規約

```bash
# Format
<type>(<scope>): <description>

# Types
feat     # 新機能
fix      # バグ修正
docs     # ドキュメント
refactor # リファクタリング
test     # テスト
chore    # ビルド・設定

# Scopes
multi-tenant  # マルチテナント関連 ⭐ 新規追加
leads         # リード管理
auth          # 認証
db            # データベース

# Examples
feat(multi-tenant): add hierarchical organization support
feat(leads): implement CRUD router with organizationProcedure
docs(multi-tenant): add holdings strategy document
refactor(multi-tenant): extract middleware to dedicated module
```

---

## 🎓 学習リソース

### プロジェクト固有

1. BetterAuth Organization Plugin
   - https://www.better-auth.com/docs/plugins/organization

2. CASL Permissions
   - https://casl.js.org/v6/en/guide/intro

3. tRPC 11+ Procedures
   - https://trpc.io/docs/server/procedures

4. Drizzle ORM Queries
   - https://orm.drizzle.team/docs/rqb

### 階層データモデリング

1. PostgreSQL ltree Extension
   - https://www.postgresql.org/docs/current/ltree.html

2. Closure Table Pattern
   - 階層データの効率的な管理

---

## 📦 CMS統合 (PayloadCMS 3.0)

### バージョン情報

```yaml
PayloadCMS: 3.0.x
Database: PostgreSQL (shared with Drizzle, separate schema: "payload")
Rich Text: Lexical Editor
Localization: ja, en (fallback: true)
```

### Context7 MCP使用ガイド

Context7 MCPサーバーを使用してPayloadCMSドキュメントを参照する際は、以下のバージョン指定を使用：

```
# PayloadCMS 3.0のドキュメントを取得
PayloadCMS v3.0 schema
PayloadCMS 3.0 configuration
PayloadCMS 3.0 collections
PayloadCMS 3.0 Local API
```

**重要**: PayloadCMS 2.xとは大きく異なるため、必ず3.0のドキュメントを参照すること。

### CMS抽象化パターン

```typescript
// ✅ 推奨: Adapterパターンを使用
import { getCMSAdapter } from '@/lib/cms/adapters/factory';

const adapter = getCMSAdapter();
const posts = await adapter.find('blog', {
  where: { status: 'published' },
  locale: 'ja',
});

// ❌ 避ける: PayloadCMS直接使用
import { getPayload } from 'payload';
const payload = await getPayload({ config });
await payload.find({ collection: 'blog-posts' });
```

### コレクション一覧

```
lib/cms/collections/
├── FAQs.ts              # よくある質問
├── BlogPosts.ts         # ブログ記事
├── AssessmentTemplates.ts # 診断テンプレート
├── Media.ts             # メディアファイル
├── Authors.ts           # 著者
└── Categories.ts        # カテゴリ
```

---

**更新日**: 2025-11-26
**対象**: Claude Code, Cursor, その他AIアシスタント
**優先度**: 🔥 最高 - すべてのAI生成コードはこのコンテキストに従うこと
