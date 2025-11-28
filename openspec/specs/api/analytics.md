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

## 実装ファイル

```
lib/features/analytics/
├── api/
│   └── router.ts          # tRPCルーター
└── types/
    └── schemas.ts         # Zodスキーマ・型定義

hooks/
└── use-analytics.ts       # Reactフック
```

---

## 認証・認可

| レイヤー | 内容 |
|---------|------|
| 認証 | `protectedProcedure` - BetterAuth セッション必須 |
| 組織スコープ | `organizationProcedure` - 組織メンバーシップ検証 |

---

## エンドポイント

### analytics.getOverview

組織の概要統計を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  dateRange: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
})
```

**出力スキーマ**:
```typescript
interface OverviewStats {
  totalLeads: number;
  newLeadsThisMonth: number;
  conversionRate: number;        // 成約率 (0-100, 小数点2桁)
  averageScore: number;          // 平均スコア（整数、nullスコア除外）
  leadsByStatus: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
  };
}
```

**計算ロジック**:
- `conversionRate` = (converted / totalLeads) * 100
- `averageScore` = AVG(score) WHERE score IS NOT NULL

---

### analytics.getLeadTrend

リード数の時系列推移を取得します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  dateRange: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
  granularity: z.enum(['daily', 'monthly']).default('daily'),
})
```

**出力スキーマ**:
```typescript
type TrendDataPoint = {
  date: string;      // ISO日付文字列
  count: number;     // 作成されたリード数
  converted: number; // その日のconvertedリード数
};

TrendDataPoint[]
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
  dateRange: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
})
```

**出力スキーマ**:
```typescript
type SourceBreakdown = {
  source: string;      // 'website' | 'embed' | 'api' | 'unknown'
  count: number;
  percentage: number;  // 0-100, 小数点2桁
};

SourceBreakdown[]
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
  dateRange: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
})
```

**出力スキーマ**:
```typescript
type StatusBreakdown = {
  status: string;      // 'new' | 'contacted' | 'qualified' | 'converted'
  count: number;
  percentage: number;  // 0-100, 小数点2桁
};

StatusBreakdown[]
```

**用途**: Tremorの DonutChart / ProgressBar

---

## データ型

### DateRange

```typescript
type DateRange = '7d' | '30d' | '90d' | 'all';
```

### TrendGranularity

```typescript
type TrendGranularity = 'daily' | 'monthly';
```

---

## Reactフック

### useOverview

```typescript
function useOverview(
  organizationId: string,
  dateRange?: DateRange
): UseQueryResult<OverviewStats>
```

### useLeadTrend

```typescript
function useLeadTrend(
  organizationId: string,
  dateRange?: DateRange,
  granularity?: TrendGranularity
): UseQueryResult<TrendDataPoint[]>
```

### useSourceBreakdown

```typescript
function useSourceBreakdown(
  organizationId: string,
  dateRange?: DateRange
): UseQueryResult<SourceBreakdown[]>
```

### useStatusBreakdown

```typescript
function useStatusBreakdown(
  organizationId: string,
  dateRange?: DateRange
): UseQueryResult<StatusBreakdown[]>
```

### useAnalytics（統合フック）

```typescript
function useAnalytics(
  organizationId: string,
  dateRange?: DateRange
): {
  overview: UseQueryResult<OverviewStats>;
  leadTrend: UseQueryResult<TrendDataPoint[]>;
  sourceBreakdown: UseQueryResult<SourceBreakdown[]>;
  statusBreakdown: UseQueryResult<StatusBreakdown[]>;
  isLoading: boolean;
  isError: boolean;
}
```

---

## ヘルパー関数

### getDateThreshold

日付範囲から閾値を計算。

```typescript
function getDateThreshold(dateRange: DateRange): Date {
  const now = new Date();
  switch (dateRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all':
      return new Date(0); // Beginning of time
  }
}
```

---

## SQLクエリ例

### 概要統計

```sql
-- 総リード数
SELECT COUNT(*) as total_leads FROM leads
WHERE organization_id = $1;

-- 今月の新規リード
SELECT COUNT(*) as new_this_month FROM leads
WHERE organization_id = $1
  AND created_at >= date_trunc('month', now());

-- 成約率
SELECT
  COUNT(*) FILTER (WHERE status = 'converted')::float /
  NULLIF(COUNT(*), 0) * 100 as conversion_rate
FROM leads WHERE organization_id = $1;

-- 平均スコア
SELECT COALESCE(AVG(score), 0) as average_score
FROM leads WHERE organization_id = $1 AND score IS NOT NULL;
```

### トレンド集計

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as count,
  SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
FROM leads
WHERE organization_id = $1
  AND created_at >= $2
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## パフォーマンス目標

| エンドポイント | 目標レスポンス時間 |
|---------------|-------------------|
| getOverview | < 200ms |
| getLeadTrend | < 300ms |
| getSourceBreakdown | < 200ms |
| getStatusBreakdown | < 200ms |

---

## 将来の拡張（Phase 6）

### 追加予定エンドポイント

- `getIndustryBreakdown` - 業界別分析
- `getRecentActivity` - 最近のアクティビティ
- `getConversionFunnel` - ファネル分析

### エクスポート機能

- CSV/Excel出力
- 定期レポートメール

---

## 関連ドキュメント

- [アーキテクチャ仕様](/openspec/specs/architecture.md)
- [Leads API仕様](/openspec/specs/api/leads.md)
- [AI機能仕様](/openspec/specs/features/ai-scoring.md)
