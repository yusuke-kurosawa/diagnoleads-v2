# マルチテナント機能仕様書

> **Source of Truth**: DiagnoLeads v2 マルチテナントアーキテクチャ仕様
>
> **最終更新**: 2025-11-28
> **ステータス**: Phase 1-2 実装完了

---

## 概要

DiagnoLeads v2は、ホールディングス・グループ企業・会社合併に柔軟に対応できる、
エンタープライズグレードのマルチテナントプラットフォームです。

### 差別化ポイント

| 機能 | 標準SaaS | DiagnoLeads v2 |
|------|---------|----------------|
| 組織構造 | フラット | 階層的（親-子-孫） |
| データ共有 | 固定 | 柔軟なポリシー |
| レポート | 組織単位 | グループ横断 |
| M&A対応 | なし | 統合ウィザード |
| 権限管理 | シンプル | CASL+RLS二重防御 |

---

## アーキテクチャ

### テナント分離モデル

```
┌─────────────────────────────────────────┐
│           Application Layer             │
├─────────────────────────────────────────┤
│ tRPC organizationProcedure              │
│ ├── メンバーシップ検証                    │
│ ├── CASL権限計算                         │
│ └── RLSスコープ適用                      │
├─────────────────────────────────────────┤
│           Database Layer (RLS)          │
│ ├── organization_id フィルタリング       │
│ └── ロールベースポリシー                 │
└─────────────────────────────────────────┘
```

### データフロー

```
User Request
    ↓
┌─────────────────────────────┐
│ 1. protectedProcedure       │  認証チェック
│    (BetterAuth Session)     │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 2. organizationProcedure    │  組織スコープ
│    - メンバーシップ検証      │
│    - CASL Ability計算       │
│    - RLS Context設定        │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 3. Business Logic           │  ビジネスロジック
│    - CASL権限チェック        │
│    - データ操作              │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 4. Database (RLS Applied)   │  自動フィルタリング
└─────────────────────────────┘
```

---

## organizationProcedure

### 概要

すべての組織スコープAPIの基盤となるtRPCミドルウェア。

### 実装

```typescript
export const organizationProcedure = protectedProcedure
  .input(z.object({ organizationId: z.string().uuid() }).passthrough())
  .use(async ({ ctx, input, next }) => {
    // 1. メンバーシップ検証
    const membership = await ctx.db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, ctx.user.id),
        eq(organizationMembers.organizationId, input.organizationId)
      ),
      with: { organization: true },
    });

    if (!membership) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'この組織にアクセスする権限がありません'
      });
    }

    // 2. CASL権限計算
    const ability = defineAbilitiesFor(ctx.user, membership);

    // 3. RLSスコープ適用
    const scopedDb = await withRLS(ctx.db, ctx.user.id);

    return next({
      ctx: {
        ...ctx,
        organization: membership.organization,
        membership,
        ability,
        db: scopedDb,
      },
    });
  });
```

### Context拡張

```typescript
type OrganizationContext = {
  organization: Organization;
  membership: OrganizationMember;
  ability: AppAbility;
};

type OrganizationProtectedContext = ProtectedContext & OrganizationContext;
```

---

## CASL権限管理

### ロール定義

```typescript
type Role = 'owner' | 'admin' | 'member';

const roleHierarchy = {
  owner: ['admin', 'member'],
  admin: ['member'],
  member: [],
};
```

### 権限定義

```typescript
export function defineAbilitiesFor(
  user: User,
  membership: OrganizationMember
): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createMongoAbility
  );

  switch (membership.role) {
    case 'owner':
      // すべての操作を許可
      can('manage', 'all');
      break;

    case 'admin':
      // 組織削除以外を許可
      can('manage', 'all');
      cannot('delete', 'Organization');
      break;

    case 'member':
      // リード操作と読み取りを許可
      can('read', 'all');
      can('create', 'Lead');
      can('update', 'Lead');
      cannot('delete', 'Lead');
      cannot('manage', 'Organization');
      cannot('manage', 'Member');
      break;
  }

  return build();
}
```

### Subject定義

```typescript
type Subjects =
  | 'Organization'
  | 'Lead'
  | 'Member'
  | 'Analytics'
  | 'all';

type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';
```

### 使用例

```typescript
// ルーターでの使用
.mutation(async ({ ctx, input }) => {
  const { ability } = ctx;

  // 権限チェック
  if (!ability.can('delete', 'Lead')) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  // 操作実行
  await ctx.db.delete(leads).where(eq(leads.id, input.id));
});
```

---

## Row-Level Security (RLS)

### 概要

PostgreSQLのRLS機能を使用し、データベースレベルでテナント分離を実現。

### ヘルパー関数

```sql
-- 現在のユーザーID取得
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS uuid AS $$
  SELECT current_setting('app.user_id', true)::uuid;
$$ LANGUAGE sql STABLE;

-- ユーザーの所属組織ID一覧取得
CREATE OR REPLACE FUNCTION auth.user_organization_ids()
RETURNS SETOF uuid AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.user_id();
$$ LANGUAGE sql STABLE;
```

### リードテーブルのRLSポリシー

```sql
-- RLS有効化
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- SELECT: 所属組織のみ
CREATE POLICY leads_select ON leads
  FOR SELECT
  USING (
    organization_id IN (SELECT auth.user_organization_ids())
  );

-- INSERT: 所属組織のみ
CREATE POLICY leads_insert ON leads
  FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT auth.user_organization_ids())
  );

-- UPDATE: 所属組織のみ
CREATE POLICY leads_update ON leads
  FOR UPDATE
  USING (
    organization_id IN (SELECT auth.user_organization_ids())
  );

-- DELETE: owner/adminのみ
CREATE POLICY leads_delete ON leads
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.user_id()
        AND role IN ('owner', 'admin')
    )
  );
```

### RLSコンテキスト設定

```typescript
export async function withRLS(db: Database, userId: string) {
  // セッション変数設定
  await db.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`);
  return db;
}
```

---

## データベーススキーマ

### 組織テーブル

```typescript
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
  // parentId: uuid('parent_id').references(() => organizations.id), // 階層構造（Phase 2.5予定）
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### メンバーテーブル

```typescript
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 })
    .notNull()
    .$type<'owner' | 'admin' | 'member'>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // 複合ユニーク制約
  unique: unique().on(table.organizationId, table.userId),
}));
```

### リードテーブル

```typescript
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  email: text('email').notNull(),
  name: text('name'),
  company: text('company'),
  phone: text('phone'),

  status: text('status').notNull().default('new'), // 'new', 'contacted', 'qualified', 'converted'
  score: integer('score'),
  source: text('source'), // 'website', 'embed', 'api'
  responses: jsonb('responses').$type<Record<string, unknown>>().default({}),

  // AI features (Phase 3)
  embedding: vector('embedding'), // 1536次元
  searchVector: tsvector('search_vector'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // Note: 物理削除を使用（ソフトデリートではない）
});
```

---

## 組織コンテキスト管理

### OrganizationProvider

```typescript
const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);

  // URLからorganizationIdを取得
  const params = useParams();

  useEffect(() => {
    if (params.organizationId) {
      setOrganizationId(params.organizationId as string);
    }
  }, [params.organizationId]);

  // LocalStorageに永続化
  useEffect(() => {
    if (organizationId) {
      localStorage.setItem('lastOrganizationId', organizationId);
    }
  }, [organizationId]);

  return (
    <OrganizationContext.Provider value={{
      organizationId,
      organization,
      setOrganization,
      clearOrganization: () => {
        setOrganizationId(null);
        setOrganization(null);
      },
      isLoading: !organizationId,
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}
```

### 組織切り替え時の処理

```typescript
function switchOrganization(newOrgId: string) {
  // 1. コンテキスト更新
  setOrganizationId(newOrgId);

  // 2. tRPCキャッシュクリア
  queryClient.invalidateQueries();

  // 3. URL更新
  router.push(`/${newOrgId}/dashboard`);
}
```

---

## セキュリティ多層防御

### レイヤー構成

```
┌─────────────────────────────────────┐
│ Layer 1: Next.js Middleware        │
│ ├── CSP Headers                    │
│ ├── Rate Limiting (100/min)        │
│ └── 認証リダイレクト               │
├─────────────────────────────────────┤
│ Layer 2: tRPC Middleware           │
│ ├── protectedProcedure (認証)      │
│ ├── organizationProcedure (組織)   │
│ └── CASL権限チェック               │
├─────────────────────────────────────┤
│ Layer 3: Database RLS              │
│ ├── organization_id フィルタ       │
│ └── ロールベースポリシー           │
└─────────────────────────────────────┘
```

### 攻撃シナリオと防御

| 攻撃 | Layer 1 | Layer 2 | Layer 3 |
|------|---------|---------|---------|
| 未認証アクセス | ✅ リダイレクト | ✅ 401エラー | - |
| 他組織アクセス | - | ✅ 403エラー | ✅ 空結果 |
| 権限外操作 | - | ✅ CASL拒否 | ✅ RLS拒否 |
| SQLインジェクション | ✅ CSP | - | ✅ ORM + RLS |

---

## 階層的組織構造（将来拡張）

### コンセプト

```
ホールディングス（親組織）
├── 子会社A
│   ├── 孫会社A-1
│   └── 孫会社A-2
└── 子会社B
    └── 孫会社B-1
```

### データ共有モード

| モード | 説明 |
|--------|------|
| isolated | 完全分離（デフォルト） |
| read_up | 子が親を読み取り可能 |
| read_down | 親が子を読み取り可能 |
| full_access | 双方向アクセス |

### グループ横断クエリ（予定）

```typescript
// Phase 5以降で実装予定
const groupStats = await trpc.analytics.getGroupOverview.query({
  rootOrganizationId: 'holding-company-id',
  includeChildren: true,
  depth: 2, // 孫会社まで
});
```

---

## パフォーマンス考慮

### インデックス戦略

```sql
-- 組織ごとのクエリ最適化
CREATE INDEX idx_leads_organization ON leads(organization_id);
CREATE INDEX idx_leads_organization_status ON leads(organization_id, status);
CREATE INDEX idx_leads_organization_created ON leads(organization_id, created_at DESC);

-- メンバーシップ検索最適化
CREATE INDEX idx_members_user ON organization_members(user_id);
CREATE INDEX idx_members_organization ON organization_members(organization_id);
```

### クエリ最適化

- メンバーシップ検証結果をコンテキストにキャッシュ
- RLS関数をSTABLEとして定義
- 組織切り替え時のみ全キャッシュクリア

---

## 実装ファイル

| ファイル | 役割 |
|---------|------|
| `lib/trpc/init.ts` | organizationProcedure |
| `lib/auth/permissions.ts` | CASL権限定義 |
| `lib/db/rls.ts` | RLSコンテキスト管理 |
| `drizzle/migrations/` | RLSマイグレーション |
| `providers/organization-provider.tsx` | React Context |
| `hooks/use-organization.ts` | 組織フック |

---

## 関連ドキュメント

- [アーキテクチャ仕様](/openspec/specs/architecture.md)
- [Organizations API](/openspec/specs/api/organizations.md)
- [Leads API](/openspec/specs/api/leads.md)
- [マルチテナント戦略](/docs/MULTI_TENANT_STRATEGY.md)
