# Leads API 仕様書

> **Source of Truth**: DiagnoLeads v2 リード管理API仕様
>
> **最終更新**: 2025-11-28
> **ステータス**: Phase 2 実装完了

---

## 概要

リード管理APIは、マルチテナント対応のCRUD操作を提供します。
すべてのエンドポイントは`organizationProcedure`を使用し、組織スコープの自動適用とRLSによるデータ分離を実現します。

---

## ベースパス

```
tRPC: trpc.leads.*
```

---

## 認証・認可

| レイヤー | 内容 |
|---------|------|
| 認証 | `protectedProcedure` - BetterAuth セッション必須 |
| 組織スコープ | `organizationProcedure` - 組織メンバーシップ検証 |
| 権限管理 | CASL - ロールベースアクセス制御 |
| データ分離 | PostgreSQL RLS - 自動フィルタリング |

### ロール権限マトリクス

| 操作 | owner | admin | member |
|------|-------|-------|--------|
| list | ✅ | ✅ | ✅ |
| get | ✅ | ✅ | ✅ |
| create | ✅ | ✅ | ✅ |
| update | ✅ | ✅ | ✅ |
| delete | ✅ | ✅ | ❌ |

---

## エンドポイント

### leads.list

組織のリード一覧を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  // ページネーション
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  // フィルタリング
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  industry: z.string().optional(),
  sourceChannel: z.string().optional(),
  // 検索
  search: z.string().optional(),
  // ソート
  sortBy: z.enum(['createdAt', 'updatedAt', 'company', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
```

**出力スキーマ**:
```typescript
{
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**例**:
```typescript
const { data } = trpc.leads.list.useQuery({
  organizationId: 'org-uuid',
  page: 1,
  limit: 20,
  status: 'new',
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
```

---

### leads.get

リードの詳細を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
})
```

**出力スキーマ**:
```typescript
Lead | null
```

**エラー**:
| コード | 条件 |
|--------|------|
| NOT_FOUND | リードが存在しない |
| FORBIDDEN | 組織に所属していない |

---

### leads.create

新しいリードを作成します。

**Type**: Mutation

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().min(1).max(255),
  industry: z.string().optional(),
  position: z.string().optional(),
  sourceChannel: z.enum([
    'website', 'referral', 'social', 'email',
    'cold_call', 'event', 'advertising', 'other'
  ]).default('website'),
  status: z.enum([
    'new', 'contacted', 'qualified', 'proposal',
    'negotiation', 'won', 'lost'
  ]).default('new'),
  notes: z.string().optional(),
})
```

**出力スキーマ**:
```typescript
Lead
```

**副作用**:
- 作成時に埋め込みベクトル生成（非同期）
- アクティビティログ記録

---

### leads.update

リードを更新します。

**Type**: Mutation

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  // 部分更新対応
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().min(1).max(255).optional(),
  industry: z.string().optional(),
  position: z.string().optional(),
  sourceChannel: z.enum([...]).optional(),
  status: z.enum([...]).optional(),
  notes: z.string().optional(),
})
```

**出力スキーマ**:
```typescript
Lead
```

**副作用**:
- 更新時刻自動設定
- アクティビティログ記録

---

### leads.delete

リードをソフトデリートします。

**Type**: Mutation

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
})
```

**出力スキーマ**:
```typescript
{ success: boolean }
```

**動作**:
- 物理削除ではなく`deletedAt`を設定
- RLSにより以降のクエリから除外

---

## データモデル

### Lead

```typescript
interface Lead {
  id: string;                    // UUID
  organizationId: string;        // UUID (外部キー)
  name: string;                  // 担当者名
  email: string | null;          // メールアドレス
  phone: string | null;          // 電話番号
  company: string;               // 会社名
  industry: string | null;       // 業界
  position: string | null;       // 役職
  sourceChannel: SourceChannel;  // 流入経路
  status: LeadStatus;            // ステータス
  notes: string | null;          // 備考
  embedding: number[] | null;    // 埋め込みベクトル (1536次元)
  searchVector: string | null;   // 全文検索ベクトル
  aiScore: number | null;        // AIスコア (0-100)
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
  deletedAt: Date | null;        // 削除日時 (ソフトデリート)
}
```

### LeadStatus

```typescript
type LeadStatus =
  | 'new'          // 新規
  | 'contacted'    // コンタクト済み
  | 'qualified'    // 見込み確定
  | 'proposal'     // 提案中
  | 'negotiation'  // 交渉中
  | 'won'          // 成約
  | 'lost';        // 失注
```

### SourceChannel

```typescript
type SourceChannel =
  | 'website'      // Webサイト
  | 'referral'     // 紹介
  | 'social'       // SNS
  | 'email'        // メール
  | 'cold_call'    // コールドコール
  | 'event'        // イベント
  | 'advertising'  // 広告
  | 'other';       // その他
```

---

## Reactフック

### useLeads

組織のリード操作を統合したフック。

```typescript
function useLeads(organizationId: string): {
  // Mutations
  createLead: UseMutationResult;
  updateLead: UseMutationResult;
  deleteLead: UseMutationResult;
  // Helper functions
  create: (input: Omit<CreateLeadInput, 'organizationId'>) => void;
  update: (input: Omit<UpdateLeadInput, 'organizationId'>) => void;
  delete: (id: string) => void;
}
```

### useListLeads

リード一覧取得フック。

```typescript
function useListLeads(input: ListLeadsInput): UseQueryResult<{
  leads: Lead[];
  pagination: Pagination;
}>
```

### useGetLead

単一リード取得フック。

```typescript
function useGetLead(input: GetLeadInput): UseQueryResult<Lead | null>
```

---

## キャッシュ戦略

| 操作 | キャッシュ動作 |
|------|---------------|
| list | staleTime: 2分 |
| get | staleTime: 5分 |
| create | リスト自動無効化 |
| update | リスト + 詳細無効化 |
| delete | リスト自動無効化 |

---

## エラーハンドリング

### エラーコード

| コード | HTTP相当 | 説明 |
|--------|---------|------|
| BAD_REQUEST | 400 | 入力バリデーションエラー |
| UNAUTHORIZED | 401 | 認証が必要 |
| FORBIDDEN | 403 | 権限不足 |
| NOT_FOUND | 404 | リードが見つからない |
| INTERNAL_SERVER_ERROR | 500 | サーバーエラー |

### バリデーションエラー

```typescript
{
  code: 'BAD_REQUEST',
  message: 'Validation error',
  issues: [
    { path: ['name'], message: '名前は必須です' },
    { path: ['email'], message: '有効なメールアドレスを入力してください' }
  ]
}
```

---

## インデックス

```sql
-- 組織ごとのリード検索
CREATE INDEX idx_leads_organization_id ON leads(organization_id);

-- ステータスフィルタリング
CREATE INDEX idx_leads_organization_status
  ON leads(organization_id, status);

-- 作成日順ソート
CREATE INDEX idx_leads_organization_created
  ON leads(organization_id, created_at DESC);

-- 全文検索
CREATE INDEX idx_leads_search_vector
  ON leads USING gin(search_vector);

-- ベクトル検索
CREATE INDEX idx_leads_embedding
  ON leads USING hnsw(embedding vector_cosine_ops);
```

---

## RLSポリシー

```sql
-- SELECT: 組織メンバーのみ
CREATE POLICY leads_select ON leads
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.user_id()
    )
    AND deleted_at IS NULL
  );

-- INSERT: 組織メンバーのみ
CREATE POLICY leads_insert ON leads
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.user_id()
    )
  );

-- UPDATE: 組織メンバーのみ
CREATE POLICY leads_update ON leads
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.user_id()
    )
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

---

## 実装ファイル

| ファイル | 役割 |
|---------|------|
| `server/routers/leads.ts` | tRPCルーター |
| `lib/db/schema/leads.ts` | Drizzleスキーマ |
| `hooks/use-leads.ts` | Reactフック |
| `types/lead.ts` | 型定義 |
| `components/leads/` | UIコンポーネント |

---

## 関連ドキュメント

- [アーキテクチャ仕様](/openspec/specs/architecture.md)
- [マルチテナント仕様](/openspec/specs/features/multi-tenant.md)
- [AI API仕様](/openspec/specs/api/ai.md)
