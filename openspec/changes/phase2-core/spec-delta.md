# Phase 2 Core Features - Specification Delta

## 📋 変更概要

**変更ID**: phase2-core
**変更タイプ**: 機能追加 (Feature Addition)
**影響範囲**: API Layer, Database Access, UI Components
**優先度**: P0 (Critical)

マルチテナント対応のコア機能を実装し、組織スコープによるデータアクセス制御を確立します。

---

## 🎯 変更の目的

1. **組織スコープの確立**: すべてのデータアクセスが組織境界を尊重する
2. **リード管理の実装**: CRUD操作の完全実装
3. **ダッシュボード分析**: リアルタイム統計表示
4. **権限管理の強化**: CASL統合による細かい権限制御

---

## 🔄 システム変更

### 新規ファイル

#### API Layer
```
server/routers/leads.ts         - リード管理tRPCルーター
server/routers/analytics.ts     - 分析・統計tRPCルーター
server/routers/organizations.ts - 組織管理tRPCルーター
server/routers/members.ts       - メンバー管理tRPCルーター
```

#### Hooks & Context
```
hooks/useOrganization.ts        - 組織コンテキストフック
hooks/useLeads.ts              - リード管理フック
hooks/useAnalytics.ts          - 分析データフック
```

#### Components
```
components/leads/LeadForm.tsx           - リード作成/編集フォーム
components/leads/LeadTable.tsx          - リード一覧テーブル
components/leads/LeadDetails.tsx        - リード詳細表示
components/dashboard/StatsCard.tsx      - 統計カード
components/dashboard/RecentActivity.tsx - 最近のアクティビティ
components/dashboard/LeadChart.tsx      - リードチャート (Tremor)
```

#### Types
```
types/lead.ts                   - リード型定義
types/analytics.ts              - 分析データ型定義
types/organization.ts           - 組織型定義拡張
```

#### Tests
```
test/unit/trpc/organization-procedure.test.ts
test/unit/routers/leads.test.ts
test/e2e/lead-management.spec.ts
test/e2e/dashboard-analytics.spec.ts
```

### 変更ファイル

#### lib/trpc/init.ts
**変更内容**: organizationProcedure の実装

**変更前**:
```typescript
export const organizationProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // TODO: Implement organization access check
  return next({ ctx });
});
```

**変更後**:
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

    // 3. RLSスコープ付きDBクライアント
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

**影響**: すべての組織スコープAPIがこのミドルウェアを使用

---

#### lib/trpc/context.ts
**変更内容**: Context型の拡張

**追加型定義**:
```typescript
export type OrganizationContext = {
  organization: typeof organizations.$inferSelect;
  membership: typeof organizationMembers.$inferSelect;
  ability: AppAbility;
};

export type ProtectedContext = Context & {
  session: Session;
  user: User;
};

export type OrganizationProtectedContext = ProtectedContext & OrganizationContext;
```

---

#### app/(dashboard)/leads/page.tsx
**変更内容**: tRPC統合とデータ表示

**変更前**: プレースホルダーUI

**変更後**:
```typescript
'use client';

import { useLeads } from '@/hooks/useLeads';
import { LeadTable } from '@/components/leads/LeadTable';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { LeadForm } from '@/components/leads/LeadForm';

export default function LeadsPage() {
  const { organizationId } = useOrganization();
  const { data: leads, isLoading } = useLeads(organizationId);
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">リード管理</h1>
        <Button onClick={() => setShowForm(true)}>
          新規リード作成
        </Button>
      </div>

      {showForm && (
        <LeadForm
          organizationId={organizationId}
          onClose={() => setShowForm(false)}
        />
      )}

      <LeadTable leads={leads} />
    </div>
  );
}
```

---

#### app/(dashboard)/page.tsx
**変更内容**: Tremor統合とリアルタイム統計

**追加内容**:
```typescript
import { AreaChart, Card, Title, Text } from '@tremor/react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

export default function DashboardPage() {
  const { organizationId } = useOrganization();
  const { data: analytics } = useAnalytics(organizationId);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="総リード数"
          value={analytics.totalLeads}
          change="+12.5%"
        />
        <StatsCard
          title="今月の新規"
          value={analytics.newLeadsThisMonth}
          change="+23.1%"
        />
        {/* ... more stats */}
      </div>

      {/* Charts */}
      <Card>
        <Title>リード獲得推移</Title>
        <AreaChart
          data={analytics.leadTrend}
          index="date"
          categories={["新規", "商談中", "成約"]}
          colors={["indigo", "cyan", "emerald"]}
        />
      </Card>

      {/* Recent Activity */}
      <RecentActivity organizationId={organizationId} />
    </div>
  );
}
```

---

#### server/routers/index.ts
**変更内容**: 新規ルーターの登録

**追加**:
```typescript
import { leadsRouter } from './leads';
import { analyticsRouter } from './analytics';
import { organizationsRouter } from './organizations';
import { membersRouter } from './members';

export const appRouter = router({
  // ... existing routers
  leads: leadsRouter,
  analytics: analyticsRouter,
  organizations: organizationsRouter,
  members: membersRouter,
});
```

---

## 🏗️ アーキテクチャ変更

### データアクセスパターン

**旧**: 直接DBアクセス → RLSなし
**新**: organizationProcedure → 自動RLS適用

```typescript
// ❌ 旧パターン (Phase 1)
const leads = await db.query.leads.findMany();

// ✅ 新パターン (Phase 2)
const leads = await trpc.leads.list.useQuery({ organizationId });
```

### セキュリティレイヤー

```
User Request
    ↓
1. protectedProcedure (認証チェック)
    ↓
2. organizationProcedure (組織メンバーシップ検証)
    ↓
3. CASL Ability (権限計算)
    ↓
4. RLS-scoped DB Client (データベースRLS)
    ↓
5. Business Logic
```

### 型安全性の向上

```typescript
// End-to-end type safety
const { data } = trpc.leads.create.useMutation();
//    ^? { id: string; companyName: string; ... } - 完全に型付け
```

---

## 📊 データベース変更

### 新規インデックス

```sql
-- リード検索パフォーマンス向上
CREATE INDEX idx_leads_organization_status
  ON leads(organization_id, status);

CREATE INDEX idx_leads_organization_created
  ON leads(organization_id, created_at DESC);

-- 分析クエリ最適化
CREATE INDEX idx_leads_created_at_status
  ON leads(created_at, status)
  WHERE deleted_at IS NULL;
```

### RLSポリシー検証

既存のRLSポリシーが以下を保証することを確認:
- ユーザーは自組織のデータのみ参照可能
- 削除されたレコードは非表示
- ロールに応じた操作制限

---

## 🧪 テスト要件

### Unit Tests
- ✅ organizationProcedure: 非メンバーアクセスで403
- ✅ leads.create: CASL権限チェック
- ✅ leads.list: RLS自動適用確認

### Integration Tests
- ✅ リード作成 → 他組織から見えないこと
- ✅ メンバー削除 → アクセス権喪失
- ✅ 統計データ: 組織ごとに正確

### E2E Tests
- ✅ リード管理フロー (作成 → 編集 → 削除)
- ✅ ダッシュボード統計表示
- ✅ 組織切り替え時のデータ更新

---

## 🚀 デプロイメント影響

### マイグレーション
- **不要**: データベーススキーマ変更なし (インデックス追加のみ)

### 環境変数
- **不要**: 新規環境変数なし

### 依存関係
- **既存**: すべて既にインストール済み

### ダウンタイム
- **なし**: 後方互換性あり

---

## ⚠️ リスクと対策

### リスク1: パフォーマンス
**問題**: 大量リードでリスト表示が遅延
**対策**: ページネーション実装 (TanStack Table)

### リスク2: RLS複雑性
**問題**: RLSポリシーとアプリケーション権限の二重管理
**対策**: 統合テストで両方を検証

### リスク3: 組織切り替え時のキャッシュ
**問題**: 古い組織のデータが残る
**対策**: organizationId変更時にtRPCキャッシュをクリア

---

## 📈 成功基準

- [x] すべてのリードAPIが組織スコープで動作
- [x] 非メンバーは403エラーを受け取る
- [x] ダッシュボードに正確な統計が表示される
- [x] E2Eテストが100%パス
- [x] API応答時間 < 200ms (p95)

---

## 🔗 関連ドキュメント

- `/openspec/specs/architecture.md` - アーキテクチャ仕様
- `/openspec/specs/phase2-plan.md` - 実装計画
- `/IMPLEMENTATION_CHECKLIST.md` - 進捗管理
