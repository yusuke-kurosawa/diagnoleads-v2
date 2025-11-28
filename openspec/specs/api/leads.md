# Leads API 仕様書

> **Source of Truth**: DiagnoLeads v2 リード管理API仕様
>
> **最終更新**: 2025-11-28
> **ステータス**: Phase 2 実装完了

---

## 概要

リード管理APIは、マルチテナント対応のCRUD操作を提供します。
すべてのエンドポイントは`organizationProcedure`を使用し、組織スコープの自動適用とCASL権限チェックを実現します。

---

## ベースパス

```
tRPC: trpc.leads.*
```

---

## 実装ファイル

```
lib/features/leads/
├── api/
│   └── router.ts          # tRPCルーター
├── types/
│   ├── index.ts           # 型エクスポート
│   └── schemas.ts         # Zodスキーマ
hooks/
└── use-leads.ts           # Reactフック
```

---

## 認証・認可

| レイヤー | 内容 |
|---------|------|
| 認証 | `protectedProcedure` - BetterAuth セッション必須 |
| 組織スコープ | `organizationProcedure` - 組織メンバーシップ検証 |
| 権限管理 | CASL - ロールベースアクセス制御 |

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
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  // フィルタリング
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).optional(),
  source: z.enum(['website', 'embed', 'api']).optional(),
  // 検索（name, email, companyで検索）
  search: z.string().optional(),
})
```

**出力スキーマ**:
```typescript
{
  items: Lead[];
  total: number;
  limit: number;
  offset: number;
}
```

**例**:
```typescript
const { data } = trpc.leads.list.useQuery({
  organizationId: 'org-uuid',
  limit: 20,
  offset: 0,
  status: 'new',
});
// data.items, data.total, data.limit, data.offset
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
Lead
```

**エラー**:
| コード | 条件 |
|--------|------|
| NOT_FOUND | リードが存在しない |
| FORBIDDEN | Lead読み取り権限がない |

---

### leads.create

新しいリードを作成します。

**Type**: Mutation

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  email: z.string().email('有効なメールアドレスを入力してください'),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).default('new'),
  score: z.number().int().min(0).max(100).optional(),
  source: z.enum(['website', 'embed', 'api']).optional(),
  responses: z.record(z.unknown()).default({}),
})
```

**出力スキーマ**:
```typescript
Lead
```

---

### leads.update

リードを更新します。

**Type**: Mutation

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  // 部分更新対応（すべてオプション）
  email: z.string().email().optional(),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).optional(),
  score: z.number().int().min(0).max(100).optional(),
  source: z.enum(['website', 'embed', 'api']).optional(),
  responses: z.record(z.unknown()).optional(),
})
```

**出力スキーマ**:
```typescript
Lead
```

**副作用**:
- `updatedAt`を現在時刻に更新

---

### leads.delete

リードを削除します。

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
- **物理削除**（ソフトデリートではない）
- 削除後はデータベースから完全に消去

---

## データモデル

### Lead

```typescript
interface Lead {
  id: string;                    // UUID
  organizationId: string;        // UUID (外部キー)

  // 連絡先情報
  email: string;                 // メールアドレス（必須）
  name: string | null;           // 担当者名
  company: string | null;        // 会社名
  phone: string | null;          // 電話番号

  // リードメタデータ
  status: LeadStatus;            // ステータス
  score: number | null;          // スコア (0-100)
  source: LeadSource | null;     // 流入経路

  // 診断データ
  responses: Record<string, unknown>; // 診断回答（JSONオブジェクト）

  // AI機能（Phase 3）
  embedding: number[] | null;    // 埋め込みベクトル (1536次元)
  searchVector: string | null;   // 全文検索ベクトル (tsvector)

  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
}
```

### LeadStatus

```typescript
type LeadStatus =
  | 'new'          // 新規
  | 'contacted'    // コンタクト済み
  | 'qualified'    // 見込み確定
  | 'converted';   // 成約
```

### LeadSource

```typescript
type LeadSource =
  | 'website'      // Webサイト
  | 'embed'        // 埋め込みフォーム
  | 'api';         // API経由
```

---

## Reactフック

### useLeads

組織のリード操作を統合したフック。

```typescript
function useLeads(organizationId: string): {
  createLead: UseMutationResult;
  updateLead: UseMutationResult;
  deleteLead: UseMutationResult;
  create: (input: Omit<CreateLeadInput, 'organizationId'>) => void;
  update: (input: Omit<UpdateLeadInput, 'organizationId'>) => void;
  delete: (id: string) => void;
}
```

### useListLeads

リード一覧取得フック。

```typescript
function useListLeads(input: ListLeadsInput): UseQueryResult<{
  items: Lead[];
  total: number;
  limit: number;
  offset: number;
}>
```

### useGetLead

単一リード取得フック。

```typescript
function useGetLead(input: GetLeadInput): UseQueryResult<Lead>
```

### useCreateLead / useUpdateLead / useDeleteLead

個別のミューテーションフック。トースト通知付き。

```typescript
// トースト通知例
// 成功: 'リードを作成しました' / 'リードを更新しました' / 'リードを削除しました'
// エラー: 'エラー: {error.message}'
```

---

## キャッシュ戦略

| 操作 | キャッシュ動作 |
|------|---------------|
| list | 自動キャッシュ |
| get | 自動キャッシュ |
| create | `leads.list` を無効化 |
| update | `leads.list` + `leads.get` を無効化 |
| delete | `leads.list` を無効化 |

---

## エラーハンドリング

### エラーコード

| コード | HTTP相当 | 説明 |
|--------|---------|------|
| BAD_REQUEST | 400 | 入力バリデーションエラー |
| UNAUTHORIZED | 401 | 認証が必要 |
| FORBIDDEN | 403 | CASL権限不足 |
| NOT_FOUND | 404 | リードが見つからない |

### 日本語エラーメッセージ

```typescript
// FORBIDDEN
'リードを作成する権限がありません'
'リードを閲覧する権限がありません'
'リードを更新する権限がありません'
'リードを削除する権限がありません'

// NOT_FOUND
'リードが見つかりません'

// Validation
'有効なメールアドレスを入力してください'
```

---

## データベーススキーマ

```typescript
// lib/db/schema.ts
export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  email: text('email').notNull(),
  name: text('name'),
  company: text('company'),
  phone: text('phone'),

  status: text('status').notNull().default('new'),
  score: integer('score'),
  source: text('source'),

  responses: jsonb('responses').$type<Record<string, unknown>>().default({}),

  // AI features (Phase 3)
  embedding: vector('embedding'),        // 1536次元ベクトル
  searchVector: tsvector('search_vector'), // 全文検索

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## 関連ドキュメント

- [アーキテクチャ仕様](/openspec/specs/architecture.md)
- [マルチテナント仕様](/openspec/specs/features/multi-tenant.md)
- [AI API仕様](/openspec/specs/api/ai.md)
