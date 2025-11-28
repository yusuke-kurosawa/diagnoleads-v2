# Organizations & Members API 仕様書

> **Source of Truth**: DiagnoLeads v2 組織・メンバー管理API仕様
>
> **最終更新**: 2025-11-28
> **ステータス**: Phase 2 実装完了

---

## 概要

組織管理APIとメンバー管理APIは、マルチテナントSaaSの核となる組織機能を提供します。
BetterAuthの組織機能と連携し、CASL権限管理によるきめ細かいアクセス制御を実現します。

---

## ベースパス

```
tRPC: trpc.organizations.*
tRPC: trpc.members.*
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
| get | ✅ | ✅ | ✅ |
| create | ✅ (新規) | - | - |
| update | ✅ | ✅ | ❌ |
| delete | ✅ | ❌ | ❌ |

#### Members

| 操作 | owner | admin | member |
|------|-------|-------|--------|
| list | ✅ | ✅ | ✅ |
| invite | ✅ | ✅ | ❌ |
| updateRole | ✅ | ✅ | ❌ |
| remove | ✅ | ✅ | ❌ |

---

## Organizations API

### organizations.list

ユーザーが所属する組織一覧を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.void() // 引数なし（セッションから取得）
```

**出力スキーマ**:
```typescript
Array<{
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: 'owner' | 'admin' | 'member';
  createdAt: Date;
}>
```

---

### organizations.getById

組織の詳細情報を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
})
```

**出力スキーマ**:
```typescript
{
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
} | null
```

---

### organizations.update

組織情報を更新します。

**Type**: Mutation

**権限**: owner, admin

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  logo: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
})
```

**出力スキーマ**:
```typescript
{
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata: Record<string, unknown> | null;
  updatedAt: Date;
}
```

---

## Members API

### members.list

組織のメンバー一覧を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
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
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
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
  invitation: {
    id: string;
    email: string;
    role: 'admin' | 'member';
    expiresAt: Date;
    status: 'pending';
  };
}
```

**副作用**:
- 招待メール送信
- 招待レコード作成（7日間有効）

---

### members.updateRole

メンバーのロールを変更します。

**Type**: Mutation

**権限**: owner, admin

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  memberId: z.string().uuid(),
  role: z.enum(['admin', 'member']),
})
```

**出力スキーマ**:
```typescript
{
  member: {
    id: string;
    role: 'admin' | 'member';
  };
}
```

**制約**:
- ownerロールへの変更は不可（別途オーナー譲渡フロー）
- 自分自身のロール変更は不可
- 最後のownerの降格は不可

---

### members.remove

メンバーを組織から削除します。

**Type**: Mutation

**権限**: owner, admin

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  memberId: z.string().uuid(),
})
```

**出力スキーマ**:
```typescript
{
  success: boolean;
}
```

**制約**:
- 自分自身の削除は不可（別途脱退フロー）
- 最後のownerの削除は不可
- adminはownerを削除不可

---

## データモデル

### Organization

```typescript
interface Organization {
  id: string;                          // UUID
  name: string;                        // 組織名
  slug: string;                        // URLスラッグ（一意）
  logo: string | null;                 // ロゴURL
  metadata: Record<string, unknown> | null; // カスタムメタデータ
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
}
```

### Invitation

```typescript
interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: 'admin' | 'member';
  inviterId: string;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
}
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

## UIコンポーネント

### OrganizationSwitcher

組織切り替えドロップダウン。

```typescript
interface OrganizationSwitcherProps {
  onSwitch?: (organizationId: string) => void;
}
```

**機能**:
- 所属組織一覧表示
- 現在の組織ハイライト
- 組織作成リンク

### MembersList

メンバー一覧テーブル。

```typescript
interface MembersListProps {
  organizationId: string;
}
```

**機能**:
- メンバー一覧表示
- ロール変更
- メンバー削除
- 招待ボタン

### InviteMemberDialog

メンバー招待ダイアログ。

```typescript
interface InviteMemberDialogProps {
  organizationId: string;
  onSuccess?: () => void;
}
```

---

## キャッシュ戦略

| 操作 | キャッシュ動作 |
|------|---------------|
| organizations.list | staleTime: 5分 |
| organizations.getById | staleTime: 5分 |
| members.list | staleTime: 2分 |
| 変更操作 | 関連キャッシュ無効化 |

### 組織切り替え時

```typescript
// 全キャッシュをクリアして再取得
queryClient.invalidateQueries();
```

---

## 招待フロー

### 1. 招待送信

```
Admin/Owner → members.invite → 招待メール送信
```

### 2. 招待受諾

```
招待リンククリック → /accept-invite?token=xxx → 認証確認 → メンバー追加
```

### 3. 招待メール

```typescript
// emails/member-invite.tsx
interface InviteEmailProps {
  organizationName: string;
  inviterName: string;
  role: 'admin' | 'member';
  inviteLink: string;
  expiresAt: Date;
}
```

---

## エラーハンドリング

### エラーコード

| コード | 説明 |
|--------|------|
| FORBIDDEN | ロールが不足 |
| CONFLICT | スラッグ重複 / 既存メンバー招待 |
| NOT_FOUND | 組織/メンバーが存在しない |
| BAD_REQUEST | 最後のowner削除など |

---

## RLSポリシー

```sql
-- 組織メンバーのみアクセス可能
CREATE POLICY org_members_select ON organization_members
  FOR SELECT
  USING (
    user_id = auth.user_id()
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.user_id()
    )
  );
```

---

## 実装ファイル

| ファイル | 役割 |
|---------|------|
| `server/routers/organizations.ts` | 組織tRPCルーター |
| `server/routers/members.ts` | メンバーtRPCルーター |
| `hooks/use-organization.ts` | 組織フック |
| `hooks/use-members.ts` | メンバーフック |
| `components/organization/` | UIコンポーネント |
| `emails/member-invite.tsx` | 招待メールテンプレート |

---

## 関連ドキュメント

- [マルチテナント仕様](/openspec/specs/features/multi-tenant.md)
- [アーキテクチャ仕様](/openspec/specs/architecture.md)
- [Leads API仕様](/openspec/specs/api/leads.md)
