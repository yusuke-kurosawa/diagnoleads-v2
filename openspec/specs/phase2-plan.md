# フェーズ2実装計画書

> **前提**: アーキテクチャ分析完了、基盤実装済み（45%完了）
>
> **目標**: マルチテナントSaaSコア機能実装（完了率 45% → 65%）

---

## 📊 実装優先順位マトリクス

| 機能 | ビジネス価値 | 技術的依存 | 優先度 | 工数 |
|------|------------|----------|--------|------|
| 組織スコープミドルウェア | 最高 | すべての機能が依存 | **P0** | 4h |
| リード管理CRUD | 最高 | ミドルウェア完了後 | **P0** | 8h |
| ダッシュボード統計表示 | 高 | リードデータ必要 | **P1** | 6h |
| 組織管理・メンバー招待 | 高 | ミドルウェア完了後 | **P1** | 10h |
| リード一覧（TanStack Table） | 中 | リードCRUD完了後 | **P2** | 6h |
| AIスコアリング基盤 | 中 | リードCRUD完了後 | **P2** | 12h |

---

## 🎯 Step 1: 組織スコープミドルウェア完成（P0）

### 目的
すべてのtRPCクエリで自動的に組織スコープを適用し、マルチテナント分離を保証

### 実装ファイル

#### 1. `lib/trpc/init.ts` - organizationProcedure 完成

```typescript
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { organizationMembers } from '@/lib/db/schema';
import { defineAbilitiesFor } from '@/lib/auth/permissions';
import { withRLS } from '@/lib/db/rls';

/**
 * Organization-scoped procedure
 * すべてのリクエストで組織メンバーシップを検証し、コンテキストに注入
 */
export const organizationProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string().uuid('有効な組織IDを指定してください'),
    }).passthrough()  // 他のinputフィールドも許容
  )
  .use(async ({ ctx, input, next }) => {
    // 1. ユーザーが組織のメンバーか検証
    const membership = await ctx.db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, ctx.user.id),
        eq(organizationMembers.organizationId, input.organizationId)
      ),
      with: {
        organization: true,
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'この組織にアクセスする権限がありません',
      });
    }

    // 2. CASL権限を計算
    const ability = defineAbilitiesFor(ctx.user, membership);

    // 3. RLS適用済みDBクライアントを作成
    const scopedDb = await withRLS(ctx.db, ctx.user.id);

    return next({
      ctx: {
        ...ctx,
        organization: membership.organization,
        membership,
        ability,
        db: scopedDb,  // RLSでスコープ済み
      },
    });
  });
```

#### 2. `lib/trpc/context.ts` - コンテキスト型定義更新

```typescript
import type { Organization, OrganizationMember } from '@/lib/db/schema';
import type { AppAbility } from '@/lib/auth/permissions';

export async function createContext(opts: CreateContextOptions) {
  // 既存のコンテキスト作成
  return { session, user, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

// 拡張コンテキスト（organizationProcedure用）
export type OrganizationContext = Context & {
  organization: Organization;
  membership: OrganizationMember;
  ability: AppAbility;
};
```

### テスト

```typescript
// test/unit/trpc/organization-procedure.test.ts
import { describe, it, expect } from 'vitest';
import { createCaller } from '@/server/trpc';

describe('organizationProcedure', () => {
  it('should allow access for organization members', async () => {
    const caller = await createCaller({
      user: testUser,
      session: testSession,
      db: testDb,
    });

    const result = await caller.leads.list({
      organizationId: testOrganization.id,
    });

    expect(result).toBeDefined();
  });

  it('should deny access for non-members', async () => {
    const caller = await createCaller({
      user: otherUser,
      session: otherSession,
      db: testDb,
    });

    await expect(
      caller.leads.list({ organizationId: testOrganization.id })
    ).rejects.toThrow('この組織にアクセスする権限がありません');
  });
});
```

### 完了条件
- ✅ organizationProcedure が型安全に動作
- ✅ 非メンバーアクセス時に403エラー
- ✅ RLSが自動適用される
- ✅ ユニットテスト合格

---

## 🎯 Step 2: リード管理CRUD実装（P0）

### 目的
マルチテナント対応のリード管理機能（作成・取得・更新・削除）

### 実装ファイル

#### 1. `server/routers/leads.ts` - リードルーター作成

```typescript
import { z } from 'zod';
import { router, organizationProcedure } from '@/lib/trpc/init';
import { leads } from '@/lib/db/schema';
import { eq, desc, and, like } from 'drizzle-orm';

// バリデーションスキーマ
const createLeadSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email('有効なメールアドレスを入力してください'),
  name: z.string().min(1, '名前を入力してください').optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  source: z.enum(['website', 'embed', 'api']).default('website'),
  responses: z.record(z.unknown()).default({}),
});

const updateLeadSchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).optional(),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
});

const listLeadsSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const leadsRouter = router({
  // リード作成
  create: organizationProcedure
    .input(createLeadSchema)
    .mutation(async ({ ctx, input }) => {
      // CASL権限チェック
      if (!ctx.ability.can('create', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードを作成する権限がありません',
        });
      }

      const [lead] = await ctx.db
        .insert(leads)
        .values({
          organizationId: input.organizationId,
          email: input.email,
          name: input.name,
          company: input.company,
          phone: input.phone,
          source: input.source,
          responses: input.responses,
          status: 'new',
        })
        .returning();

      return lead;
    }),

  // リード一覧取得
  list: organizationProcedure
    .input(listLeadsSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.ability.can('read', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードを閲覧する権限がありません',
        });
      }

      const conditions = [eq(leads.organizationId, input.organizationId)];

      if (input.status) {
        conditions.push(eq(leads.status, input.status));
      }

      if (input.search) {
        conditions.push(
          or(
            like(leads.name, `%${input.search}%`),
            like(leads.email, `%${input.search}%`),
            like(leads.company, `%${input.search}%`)
          )
        );
      }

      const results = await ctx.db.query.leads.findMany({
        where: and(...conditions),
        orderBy: [desc(leads.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      // 総件数も取得（ページネーション用）
      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(and(...conditions));

      return {
        leads: results,
        total: count,
        hasMore: input.offset + input.limit < count,
      };
    }),

  // リード詳細取得
  getById: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        leadId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.ability.can('read', 'Lead')) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const lead = await ctx.db.query.leads.findFirst({
        where: and(
          eq(leads.id, input.leadId),
          eq(leads.organizationId, input.organizationId)
        ),
      });

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'リードが見つかりません',
        });
      }

      return lead;
    }),

  // リード更新
  update: organizationProcedure
    .input(updateLeadSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can('update', 'Lead')) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const { leadId, organizationId, ...updateData } = input;

      const [updated] = await ctx.db
        .update(leads)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(
          and(eq(leads.id, leadId), eq(leads.organizationId, organizationId))
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return updated;
    }),

  // リード削除
  delete: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        leadId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can('delete', 'Lead')) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const deleted = await ctx.db
        .delete(leads)
        .where(
          and(
            eq(leads.id, input.leadId),
            eq(leads.organizationId, input.organizationId)
          )
        )
        .returning();

      if (deleted.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return { success: true };
    }),
});
```

#### 2. `server/routers/index.ts` - ルーター統合

```typescript
import { router } from '@/lib/trpc/init';
import { healthRouter } from './health';
import { leadsRouter } from './leads';

export const appRouter = router({
  health: healthRouter,
  leads: leadsRouter,
});

export type AppRouter = typeof appRouter;
```

### フロントエンド実装

#### 3. `app/(dashboard)/leads/page.tsx` - リード一覧ページ更新

```typescript
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrganization } from '@/hooks/useOrganization';

export default function LeadsPage() {
  const { organization } = useOrganization();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();

  const { data, isLoading, error } = trpc.leads.list.useQuery({
    organizationId: organization.id,
    search,
    status,
  });

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">リード管理</h1>
        <Button>新規リード追加</Button>
      </div>

      {/* 検索・フィルター */}
      <div className="mb-6 flex gap-4">
        <Input
          placeholder="検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={status || ''}
          onChange={(e) => setStatus(e.target.value || undefined)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">すべてのステータス</option>
          <option value="new">新規</option>
          <option value="contacted">コンタクト済み</option>
          <option value="qualified">商談中</option>
          <option value="converted">成約</option>
        </select>
      </div>

      {/* リード一覧テーブル */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                名前
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                メール
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                会社
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                作成日
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {lead.name || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lead.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lead.company || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lead.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(lead.createdAt).toLocaleDateString('ja-JP')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data?.leads.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            リードがまだありません
          </div>
        )}
      </div>

      {/* ページネーション（後で実装） */}
      <div className="mt-4 text-sm text-gray-500">
        {data?.total}件のリード
      </div>
    </div>
  );
}
```

#### 4. `hooks/useOrganization.ts` - 組織フック作成

```typescript
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Organization } from '@/lib/db/schema';

interface OrganizationStore {
  organization: Organization | null;
  setOrganization: (org: Organization) => void;
}

export const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set) => ({
      organization: null,
      setOrganization: (org) => set({ organization: org }),
    }),
    {
      name: 'organization-storage',
    }
  )
);

export function useOrganization() {
  const { organization, setOrganization } = useOrganizationStore();

  if (!organization) {
    throw new Error('組織が選択されていません');
  }

  return { organization, setOrganization };
}
```

### 完了条件
- ✅ リードCRUD操作がすべて動作
- ✅ 組織スコープが自動適用される
- ✅ 権限チェックが正しく機能
- ✅ フロントエンドでリスト表示される

---

## 🎯 Step 3: ダッシュボード統計表示（P1）

### 実装ファイル

#### 1. `server/routers/analytics.ts` - 統計ルーター

```typescript
import { z } from 'zod';
import { router, organizationProcedure } from '@/lib/trpc/init';
import { leads } from '@/lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export const analyticsRouter = router({
  // ダッシュボード統計
  getDashboardStats: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        period: z.enum(['7d', '30d', '90d']).default('30d'),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.ability.can('read', 'Analytics')) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const periodDays = parseInt(input.period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // リード総数
      const [{ totalLeads }] = await ctx.db
        .select({ totalLeads: sql<number>`count(*)` })
        .from(leads)
        .where(eq(leads.organizationId, input.organizationId));

      // 期間内の新規リード数
      const [{ newLeads }] = await ctx.db
        .select({ newLeads: sql<number>`count(*)` })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, input.organizationId),
            gte(leads.createdAt, startDate)
          )
        );

      // ステータス別集計
      const statusCounts = await ctx.db
        .select({
          status: leads.status,
          count: sql<number>`count(*)`,
        })
        .from(leads)
        .where(eq(leads.organizationId, input.organizationId))
        .groupBy(leads.status);

      // コンバージョン率計算
      const convertedCount =
        statusCounts.find((s) => s.status === 'converted')?.count || 0;
      const conversionRate =
        totalLeads > 0 ? (convertedCount / totalLeads) * 100 : 0;

      return {
        totalLeads,
        newLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        statusBreakdown: statusCounts,
      };
    }),

  // 時系列データ（チャート用）
  getLeadsTrend: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        days: z.number().int().min(7).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const trend = await ctx.db
        .select({
          date: sql<string>`DATE(${leads.createdAt})`,
          count: sql<number>`count(*)`,
        })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, input.organizationId),
            gte(leads.createdAt, startDate)
          )
        )
        .groupBy(sql`DATE(${leads.createdAt})`)
        .orderBy(sql`DATE(${leads.createdAt})`);

      return trend;
    }),
});
```

#### 2. `app/(dashboard)/page.tsx` - ダッシュボード更新

```typescript
'use client';

import { trpc } from '@/lib/trpc/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart } from '@tremor/react';

export default function DashboardPage() {
  const { organization } = useOrganization();

  const { data: stats, isLoading } = trpc.analytics.getDashboardStats.useQuery({
    organizationId: organization.id,
    period: '30d',
  });

  const { data: trend } = trpc.analytics.getLeadsTrend.useQuery({
    organizationId: organization.id,
    days: 30,
  });

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              総リード数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalLeads || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              新規リード（30日）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.newLeads || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              コンバージョン率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.conversionRate || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* リードトレンドチャート */}
      <Card>
        <CardHeader>
          <CardTitle>リードトレンド（過去30日）</CardTitle>
        </CardHeader>
        <CardContent>
          {trend && trend.length > 0 ? (
            <AreaChart
              data={trend}
              index="date"
              categories={['count']}
              colors={['blue']}
              valueFormatter={(value) => `${value}件`}
              yAxisWidth={40}
              showLegend={false}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              データがありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 完了条件
- ✅ 統計データが正しく集計される
- ✅ Tremorチャートが表示される
- ✅ 期間フィルターが機能する

---

## 🎯 Step 4: 組織管理・メンバー招待（P1）

（詳細省略 - 同様のパターン）

---

## 📦 実装順序まとめ

```bash
Day 1-2: 組織スコープミドルウェア完成
├─ lib/trpc/init.ts - organizationProcedure
├─ lib/trpc/context.ts - 型定義
└─ test/unit/ - ユニットテスト

Day 3-5: リード管理CRUD
├─ server/routers/leads.ts - ルーター
├─ hooks/useOrganization.ts - 組織フック
├─ app/(dashboard)/leads/page.tsx - リスト表示
└─ test/e2e/ - E2Eテスト

Day 6-7: ダッシュボード統計
├─ server/routers/analytics.ts - 統計ルーター
├─ app/(dashboard)/page.tsx - チャート表示
└─ components/dashboard/StatsCard.tsx - 統計カード

Day 8-10: 組織管理
├─ server/routers/organizations.ts - 組織ルーター
├─ app/(dashboard)/organizations/page.tsx - 組織管理
└─ lib/email/send.ts - 招待メール送信

Day 11-12: リファインメント
├─ TanStack Table統合
├─ ローディング状態改善
├─ エラーハンドリング
└─ E2Eテスト完成
```

---

## ✅ 完了条件（フェーズ2）

### 機能要件
- [ ] リードの作成・取得・更新・削除が動作
- [ ] ダッシュボードに統計とチャートが表示される
- [ ] 組織メンバーの招待と権限管理が可能
- [ ] すべての操作が組織スコープで分離される

### 技術要件
- [ ] organizationProcedure が完全に実装される
- [ ] RLSが自動適用される
- [ ] CASL権限チェックが機能する
- [ ] エラーハンドリングが適切

### 品質要件
- [ ] ユニットテストカバレッジ 70%以上
- [ ] E2Eテストで主要フロー検証
- [ ] TypeScript厳密モードエラーなし
- [ ] Biomeリンターエラーなし

---

## 📚 参考資料

- [tRPC Middleware Documentation](https://trpc.io/docs/server/middlewares)
- [CASL Authorization](https://casl.js.org/v6/en/guide/intro)
- [Drizzle ORM Queries](https://orm.drizzle.team/docs/select)
- [Tremor Charts](https://www.tremor.so/docs/visualizations/area-chart)
