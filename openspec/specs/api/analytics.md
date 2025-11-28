# Analytics API 仕様書

> **Source of Truth**: DiagnoLeads v2 分析・統計API仕様
>
> **最終更新**: 2025-11-28
> **ステータス**: Phase 2 実装完了

---

## 概要

Analytics APIは、組織のリードデータに基づく統計情報とトレンド分析を提供します。
ダッシュボードの可視化コンポーネント（Tremor）と連携し、リアルタイムのビジネスインサイトを実現します。

---

## ベースパス

```
tRPC: trpc.analytics.*
```

---

## 認証・認可

| レイヤー | 内容 |
|---------|------|
| 認証 | `protectedProcedure` - BetterAuth セッション必須 |
| 組織スコープ | `organizationProcedure` - 組織メンバーシップ検証 |
| データ分離 | PostgreSQL RLS - 自動フィルタリング |

---

## エンドポイント

### analytics.getOverview

組織の概要統計を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  dateRange: z.enum(['7d', '30d', '90d', '365d', 'all']).default('30d'),
})
```

**出力スキーマ**:
```typescript
{
  totalLeads: number;
  newLeadsThisMonth: number;
  newLeadsLastMonth: number;
  conversionRate: number;        // 成約率 (0-100)
  averageScore: number | null;   // 平均AIスコア
  leadsByStatus: Record<LeadStatus, number>;
  growthRate: number;            // 前月比成長率
}
```

---

### analytics.getLeadTrend

リード数の時系列推移を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  dateRange: z.enum(['7d', '30d', '90d', '365d']).default('30d'),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
})
```

**出力スキーマ**:
```typescript
Array<{
  date: string;      // ISO日付
  new: number;       // 新規リード数
  contacted: number; // コンタクト済み
  qualified: number; // 見込み確定
  won: number;       // 成約
  lost: number;      // 失注
}>
```

**用途**: Tremorの AreaChart / LineChart

---

### analytics.getSourceBreakdown

流入経路別のリード内訳を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  dateRange: z.enum(['7d', '30d', '90d', '365d', 'all']).default('30d'),
})
```

**出力スキーマ**:
```typescript
Array<{
  source: SourceChannel;
  count: number;
  percentage: number;       // 全体に占める割合
  conversionRate: number;   // この経路の成約率
}>
```

**用途**: Tremorの DonutChart / BarList

---

### analytics.getStatusBreakdown

ステータス別のリード内訳を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  dateRange: z.enum(['7d', '30d', '90d', '365d', 'all']).default('30d'),
})
```

**出力スキーマ**:
```typescript
Array<{
  status: LeadStatus;
  count: number;
  percentage: number;
}>
```

**用途**: Tremorの DonutChart / ProgressBar

---

### analytics.getIndustryBreakdown

業界別のリード内訳を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  dateRange: z.enum(['7d', '30d', '90d', '365d', 'all']).default('30d'),
  limit: z.number().int().min(1).max(20).default(10),
})
```

**出力スキーマ**:
```typescript
Array<{
  industry: string;
  count: number;
  percentage: number;
  averageScore: number | null;
}>
```

---

### analytics.getRecentActivity

最近のアクティビティ一覧を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  limit: z.number().int().min(1).max(50).default(10),
})
```

**出力スキーマ**:
```typescript
Array<{
  id: string;
  type: 'lead_created' | 'lead_updated' | 'status_changed' | 'score_updated';
  leadId: string;
  leadName: string;
  leadCompany: string;
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
}>
```

---

## データ型

### DateRange

```typescript
type DateRange = '7d' | '30d' | '90d' | '365d' | 'all';
```

### TrendGranularity

```typescript
type TrendGranularity = 'daily' | 'weekly' | 'monthly';
```

---

## Reactフック

### useOverview

```typescript
function useOverview(
  organizationId: string,
  dateRange?: DateRange
): UseQueryResult<OverviewData>
```

### useLeadTrend

```typescript
function useLeadTrend(
  organizationId: string,
  dateRange?: DateRange,
  granularity?: TrendGranularity
): UseQueryResult<TrendData[]>
```

### useSourceBreakdown

```typescript
function useSourceBreakdown(
  organizationId: string,
  dateRange?: DateRange
): UseQueryResult<SourceBreakdownData[]>
```

### useStatusBreakdown

```typescript
function useStatusBreakdown(
  organizationId: string,
  dateRange?: DateRange
): UseQueryResult<StatusBreakdownData[]>
```

### useAnalytics（統合フック）

```typescript
function useAnalytics(
  organizationId: string,
  dateRange?: DateRange
): {
  overview: UseQueryResult<OverviewData>;
  leadTrend: UseQueryResult<TrendData[]>;
  sourceBreakdown: UseQueryResult<SourceBreakdownData[]>;
  statusBreakdown: UseQueryResult<StatusBreakdownData[]>;
  isLoading: boolean;
  isError: boolean;
}
```

---

## UIコンポーネント

### StatsCard

統計カード。

```typescript
interface StatsCardProps {
  title: string;
  value: number | string;
  change?: number;        // 前期比変化率
  changeLabel?: string;   // "vs last month"
  icon?: ReactNode;
}
```

### LeadChart

リード推移チャート（Tremor AreaChart）。

```typescript
interface LeadChartProps {
  organizationId: string;
  dateRange?: DateRange;
  granularity?: TrendGranularity;
}
```

### SourceBreakdownChart

流入経路チャート（Tremor DonutChart）。

```typescript
interface SourceBreakdownChartProps {
  organizationId: string;
  dateRange?: DateRange;
}
```

### RecentActivity

最近のアクティビティフィード。

```typescript
interface RecentActivityProps {
  organizationId: string;
  limit?: number;
}
```

---

## キャッシュ戦略

| 操作 | キャッシュ動作 |
|------|---------------|
| overview | staleTime: 5分 |
| leadTrend | staleTime: 10分 |
| breakdowns | staleTime: 10分 |
| recentActivity | staleTime: 1分 |

### 無効化トリガー

- リード作成/更新/削除
- ステータス変更
- AIスコア更新

---

## SQLクエリ最適化

### 概要統計

```sql
SELECT
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now())) as new_this_month,
  COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now() - interval '1 month')
                     AND created_at < date_trunc('month', now())) as new_last_month,
  AVG(ai_score) as average_score,
  COUNT(*) FILTER (WHERE status = 'won')::float /
    NULLIF(COUNT(*) FILTER (WHERE status IN ('won', 'lost')), 0) * 100 as conversion_rate
FROM leads
WHERE organization_id = $1
  AND deleted_at IS NULL;
```

### トレンド集計

```sql
SELECT
  date_trunc($2, created_at) as date,
  COUNT(*) FILTER (WHERE status = 'new') as new,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
  COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
  COUNT(*) FILTER (WHERE status = 'won') as won,
  COUNT(*) FILTER (WHERE status = 'lost') as lost
FROM leads
WHERE organization_id = $1
  AND created_at >= $3
  AND deleted_at IS NULL
GROUP BY date_trunc($2, created_at)
ORDER BY date;
```

### インデックス

```sql
-- 日付範囲クエリ最適化
CREATE INDEX idx_leads_organization_created
  ON leads(organization_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ステータス集計最適化
CREATE INDEX idx_leads_organization_status
  ON leads(organization_id, status)
  WHERE deleted_at IS NULL;

-- 流入経路集計最適化
CREATE INDEX idx_leads_organization_source
  ON leads(organization_id, source_channel)
  WHERE deleted_at IS NULL;
```

---

## パフォーマンス目標

| エンドポイント | 目標レスポンス時間 |
|---------------|-------------------|
| getOverview | < 200ms |
| getLeadTrend | < 300ms |
| getSourceBreakdown | < 200ms |
| getStatusBreakdown | < 200ms |
| getRecentActivity | < 100ms |

---

## 将来の拡張（Phase 6）

### 高度な分析

- コンバージョンファネル分析
- コホート分析
- 予測分析（AIスコア活用）

### エクスポート機能

- CSV/Excel出力
- 定期レポートメール
- カスタムダッシュボード

---

## 実装ファイル

| ファイル | 役割 |
|---------|------|
| `server/routers/analytics.ts` | tRPCルーター |
| `hooks/use-analytics.ts` | Reactフック |
| `components/dashboard/` | ダッシュボードUI |
| `types/analytics.ts` | 型定義 |

---

## 関連ドキュメント

- [アーキテクチャ仕様](/openspec/specs/architecture.md)
- [Leads API仕様](/openspec/specs/api/leads.md)
- [AI機能仕様](/openspec/specs/features/ai-scoring.md)
