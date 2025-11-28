# Organizations & Members API 仕様書

> **Source of Truth**: DiagnoLeads v2 組織・メンバー管理API仕様
>
> **最終更新**: 2025-11-28
> **ステータス**: Phase 2 実装完了

---

## 概要

組織管理APIとメンバー管理APIは、マルチテナントSaaSの核となる組織機能を提供します。
BetterAuthの組織機能と連携し、ロールベースの権限管理を実現します。

---

## ベースパス

```
tRPC: trpc.organizations.*
tRPC: trpc.members.*
```

---

## 実装ファイル

```
lib/features/organizations/
├── api/
│   └── router.ts          # 組織tRPCルーター
└── types/
    └── schemas.ts         # Zodスキーマ

lib/features/members/
├── api/
│   └── router.ts          # メンバーtRPCルーター
└── types/
    └── schemas.ts         # Zodスキーマ

hooks/
├── use-organization.ts    # 組織フック
└── use-members.ts         # メンバーフック
```

---

## 認証・認可

### ロール定義

| ロール | 説明 | 権限レベル |
|--------|------|-----------|
| owner | 組織オーナー | すべての操作 |
| admin | 管理者 | 組織削除以外のすべて |
| member | メンバー | 読み取り + リード操作 |

### 権限マトリクス

#### Organizations

| 操作 | owner | admin | member |
|------|-------|-------|--------|
| list (所属組織) | ✅ | ✅ | ✅ |
| getById | ✅ | ✅ | ✅ |
| create | ✅ (誰でも新規作成可) | ✅ | ✅ |
| update | ✅ | ❌ | ❌ |

#### Members

| 操作 | owner | admin | member |
|------|-------|-------|--------|
| list | ✅ | ✅ | ✅ |
| invite | ✅ | ✅ | ❌ |
| updateRole | ✅ | ✅ | ❌ |
| remove | ✅ | ✅ | ❌ |

---

## Organizations API

**注意**: `protectedProcedure`を使用（複数組織にまたがる操作のため）

### organizations.list

ユーザーが所属する組織一覧を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
})
```

**出力スキーマ**:
```typescript
{
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    settings: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    role: 'owner' | 'admin' | 'member';
    membershipId: string;
  }>;
  total: number;
}
```

---

### organizations.getById

組織の詳細情報を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  id: z.string().uuid(),
})
```

**出力スキーマ**:
```typescript
{
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  role: 'owner' | 'admin' | 'member';
  membershipId: string;
}
```

**エラー**:
| コード | 条件 |
|--------|------|
| NOT_FOUND | 組織が見つからないか、アクセス権限がない |

---

### organizations.create

新しい組織を作成します。作成者は自動的にownerになります。

**Type**: Mutation

**入力スキーマ**:
```typescript
z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  settings: z.record(z.unknown()).optional(),
})
```

**出力スキーマ**:
```typescript
{
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

**副作用**:
- 作成者をownerとして自動追加

**エラー**:
| コード | 条件 |
|--------|------|
| CONFLICT | スラッグが既に使用されている |

---

### organizations.update

組織情報を更新します。

**Type**: Mutation

**権限**: owner のみ

**入力スキーマ**:
```typescript
z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  settings: z.record(z.unknown()).optional(),
})
```

**出力スキーマ**:
```typescript
{
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  updatedAt: Date;
}
```

**エラー**:
| コード | 条件 |
|--------|------|
| NOT_FOUND | 組織が見つからない |
| FORBIDDEN | ownerではない |

---

## Members API

**注意**: `organizationProcedure`を使用（組織スコープで自動フィルタリング）

### members.list

組織のメンバー一覧を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})
```

**出力スキーマ**:
```typescript
{
  members: Array<{
    id: string;
    userId: string;
    organizationId: string;
    role: 'owner' | 'admin' | 'member';
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      createdAt: Date;
    };
  }>;
  total: number;
}
```

---

### members.invite

新しいメンバーを招待します。

**Type**: Mutation

**権限**: owner, admin

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
})
```

**出力スキーマ**:
```typescript
{
  success: boolean;
  invitationId: string;
  message: string;
}
```

**副作用**:
- BetterAuth経由で招待作成
- 招待メール送信（Phase 5で実装予定）

**エラー**:
| コード | 条件 |
|--------|------|
| FORBIDDEN | 権限不足 |
| CONFLICT | 既にメンバー |

---

### members.updateRole

メンバーのロールを変更します。

**Type**: Mutation

**権限**: owner, admin

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  membershipId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member']),
})
```

**出力スキーマ**:
```typescript
{
  id: string;
  role: 'owner' | 'admin' | 'member';
  updatedAt: Date;
}
```

**制約**:
- ownerのロールは変更不可
- adminはownerに昇格不可
- ownerのみがownerに昇格可能

**エラーメッセージ**:
```typescript
'オーナーのロールは変更できません'
'オーナーへの昇格は現在のオーナーのみ可能です'
```

---

### members.remove

メンバーを組織から削除します。

**Type**: Mutation

**権限**: owner, admin

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  membershipId: z.string().uuid(),
})
```

**出力スキーマ**:
```typescript
{
  success: boolean;
  message: string;
}
```

**制約**:
- 自分自身は削除不可
- ownerは削除不可

**エラーメッセージ**:
```typescript
'オーナーは削除できません'
'自分自身を削除することはできません'
```

---

## データモデル

### Organization

```typescript
interface Organization {
  id: string;                          // UUID
  name: string;                        // 組織名
  slug: string;                        // URLスラッグ（一意）
  settings: Record<string, unknown>;   // 設定（JSONオブジェクト）
  createdAt: Date;
  updatedAt: Date;
}
```

### OrganizationMember

```typescript
interface OrganizationMember {
  id: string;                          // UUID
  organizationId: string;              // 組織ID
  userId: string;                      // ユーザーID
  role: 'owner' | 'admin' | 'member';  // ロール
  createdAt: Date;
  updatedAt: Date;
}
```

---

## データベーススキーマ

```typescript
// lib/db/schema.ts
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## Reactフック

### useOrganization

現在の組織コンテキストを管理するフック。

```typescript
function useOrganization(): {
  organizationId: string | null;
  organization: Organization | null;
  setOrganization: (org: Organization) => void;
  clearOrganization: () => void;
  isLoading: boolean;
}
```

### useCurrentOrganization

現在の組織データを取得するフック。

```typescript
function useCurrentOrganization(): {
  organization: Organization | null;
  isLoading: boolean;
}
```

### useMembers

メンバー管理の統合フック。

```typescript
function useMembers(organizationId: string): {
  members: Member[];
  total: number;
  isLoading: boolean;
  invite: UseMutationResult;
  updateRole: UseMutationResult;
  remove: UseMutationResult;
}
```

---

## 日本語エラーメッセージ

```typescript
// Organizations
'組織が見つからないか、アクセス権限がありません'
'組織が見つかりません'
'組織の更新は オーナーのみ可能です'
'このスラッグは既に使用されています'

// Members
'メンバーの招待は管理者またはオーナーのみ可能です'
'このメールアドレスは既にメンバーです'
'招待の作成に失敗しました'
'ロールの変更は管理者またはオーナーのみ可能です'
'メンバーが見つかりません'
'オーナーのロールは変更できません'
'オーナーへの昇格は現在のオーナーのみ可能です'
'メンバーの削除は管理者またはオーナーのみ可能です'
'オーナーは削除できません'
'自分自身を削除することはできません'
'メンバーを削除しました'
```

---

## 関連ドキュメント

- [マルチテナント仕様](/openspec/specs/features/multi-tenant.md)
- [アーキテクチャ仕様](/openspec/specs/architecture.md)
- [Leads API仕様](/openspec/specs/api/leads.md)
