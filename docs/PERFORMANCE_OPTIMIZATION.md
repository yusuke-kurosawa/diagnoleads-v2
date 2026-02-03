# DiagnoLeads v2 パフォーマンス最適化レポート

## 概要

本ドキュメントは、DiagnoLeads v2のパフォーマンス分析結果と最適化提案をまとめたものである。

---

## 1. バンドルサイズ分析

### 1.1 ビルド結果サマリー

| メトリクス | 値 | 評価 |
|-----------|-----|------|
| First Load JS (共通) | 103 kB | ✅ 良好 |
| Middleware | 46.1 kB | ✅ 良好 |
| 最大ページサイズ | 759 kB (PayloadCMS Admin) | ⚠️ 許容範囲 |
| ユーザー向け最大ページ | 348 kB (/leads) | ⚠️ 改善余地あり |

### 1.2 大きなチャンク (上位10)

| チャンク | サイズ | 推定内容 |
|---------|--------|----------|
| 5203-*.js | 764 KB | PayloadCMS Admin |
| 5f45121c-*.js | 760 KB | PayloadCMS Core |
| 477d4af2-*.js | 564 KB | PayloadCMS Collections |
| 4728c4b9-*.js | 336 KB | Rich Text Editor |
| 164f4fb6-*.js | 324 KB | Form Libraries |
| 2170a4aa-*.js | 312 KB | UI Components |
| framework-*.js | 188 KB | React Framework |
| 4bd1b696-*.js | 172 KB | Shared Components |
| 1255-*.js | 172 KB | Shared Utilities |
| main-*.js | 128 KB | Main Bundle |

### 1.3 ページ別バンドルサイズ

| ページ | サイズ | 評価 |
|--------|--------|------|
| /admin/* | 759 kB | ⚠️ PayloadCMS（最適化困難） |
| /leads | 348 kB | ⚠️ 改善余地あり |
| /settings/embed | 203 kB | ✅ 許容範囲 |
| /settings/qr-campaigns | 195 kB | ✅ 許容範囲 |
| /login | 176 kB | ✅ 良好 |
| /dashboard | 172 kB | ✅ 良好 |
| /faq | 112 kB | ✅ 良好 |
| /landing | 107 kB | ✅ 良好 |

---

## 2. 既存の最適化

### 2.1 Next.js設定 (next.config.ts)

```typescript
// ✅ 実装済み
- removeConsole (本番環境)
- 画像最適化 (AVIF, WebP)
- SVG最適化 (@svgr/webpack)
- 圧縮有効
- ソースマップ無効 (本番)
```

### 2.2 コード分割

```typescript
// ✅ 実装済み - Dynamic Import
const LeadTable = dynamic(() => import('@/components/features/leads/lead-table'), {
  loading: () => <Skeleton />,
  ssr: false,
});

const ConversionFunnel = dynamic(() => import('@/components/analytics/conversion-funnel'));
const ScoreDistributionChart = dynamic(() => import('@/components/analytics/score-distribution-chart'));
const ResponseTimeChart = dynamic(() => import('@/components/analytics/response-time-chart'));
```

### 2.3 データベース最適化

```typescript
// ✅ 実装済み
- Drizzle ORMによる型安全なクエリ
- RLS (Row-Level Security)
- インデックス付きカラム
- ページネーション対応
```

---

## 3. 追加最適化提案

### 3.1 高優先度

#### A. 追加のDynamic Import対象

```typescript
// 提案: 以下のコンポーネントをdynamic importに変更

// 1. リードダイアログ (348KB → 推定280KB)
const LeadDialog = dynamic(() => import('@/components/features/leads/lead-dialog'), {
  ssr: false,
});

// 2. インポートダイアログ
const ImportDialog = dynamic(() => import('@/components/features/leads/import-dialog'), {
  ssr: false,
});

// 3. PDF/レポート生成
const PDFExport = dynamic(() => import('@/components/features/reports/pdf-export'), {
  ssr: false,
});
```

#### B. ライブラリの最適化

```typescript
// package.json - 軽量代替の検討
// 現在: date-fns (全機能) → 提案: date-fns/esm (tree-shaking)
// 現在: lodash → 提案: lodash-es または個別インポート

// 実装例
import { format, parseISO } from 'date-fns/esm';
import debounce from 'lodash/debounce';
```

### 3.2 中優先度

#### C. 画像最適化強化

```typescript
// next.config.ts に追加
images: {
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30日キャッシュ
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
}
```

#### D. Prefetchの最適化

```tsx
// 重要なページへのprefetch
import Link from 'next/link';

<Link href="/leads" prefetch={true}>リード管理</Link>
<Link href="/analytics" prefetch={false}>分析</Link> // 低優先度
```

### 3.3 低優先度

#### E. Service Worker (PWA)

```typescript
// next.config.ts
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [/* キャッシュ戦略 */],
});
```

#### F. HTTP/2 Push

```typescript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Link", "value": "</fonts/inter.woff2>; rel=preload; as=font" }
      ]
    }
  ]
}
```

---

## 4. データベースクエリ最適化

### 4.1 現状評価

| 項目 | 状態 | 備考 |
|------|------|------|
| N+1問題 | ✅ 対応済み | Drizzle ORMのリレーション |
| インデックス | ✅ 設定済み | 主要カラム |
| ページネーション | ✅ 実装済み | limit/offset |
| RLS | ✅ 有効 | マルチテナント分離 |

### 4.2 追加提案

#### A. 接続プーリング

```typescript
// lib/db/client.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // 最大接続数
  idleTimeoutMillis: 30000,   // アイドルタイムアウト
  connectionTimeoutMillis: 2000, // 接続タイムアウト
});
```

#### B. クエリキャッシング (Redis)

```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function getCachedLeads(orgId: string): Promise<Lead[] | null> {
  const cached = await redis.get(`leads:${orgId}`);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedLeads(orgId: string, leads: Lead[]): Promise<void> {
  await redis.set(`leads:${orgId}`, JSON.stringify(leads), { ex: 300 }); // 5分
}
```

#### C. 複雑なクエリの最適化

```sql
-- インデックス追加提案
CREATE INDEX CONCURRENTLY idx_leads_org_status ON leads(organization_id, status);
CREATE INDEX CONCURRENTLY idx_leads_org_created ON leads(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_leads_org_score ON leads(organization_id, score DESC);
```

---

## 5. レンダリングパフォーマンス

### 5.1 React最適化

```typescript
// ✅ 推奨パターン

// 1. useMemoによる計算結果のキャッシュ
const stats = useMemo(() => ({
  total: leads.length,
  converted: leads.filter(l => l.status === 'converted').length,
  averageScore: leads.reduce((a, l) => a + (l.score || 0), 0) / leads.length,
}), [leads]);

// 2. useCallbackによる関数の安定化
const handleLeadClick = useCallback((lead: Lead) => {
  setSelectedLead(lead);
  setDetailsSheetOpen(true);
}, []);

// 3. React.memoによるコンポーネントのメモ化
const LeadCard = React.memo(({ lead }: { lead: Lead }) => (
  // ...
));
```

### 5.2 仮想化 (大量データ)

```typescript
// @tanstack/react-virtualを使用した仮想リスト
import { useVirtualizer } from '@tanstack/react-virtual';

function LeadList({ leads }: { leads: Lead[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <LeadRow key={leads[item.index].id} lead={leads[item.index]} />
        ))}
      </div>
    </div>
  );
}
```

---

## 6. 監視と計測

### 6.1 Web Vitals

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
```

### 6.2 目標値

| メトリクス | 目標 | 現状推定 |
|-----------|------|----------|
| LCP (Largest Contentful Paint) | < 2.5s | ~2.0s ✅ |
| FID (First Input Delay) | < 100ms | ~50ms ✅ |
| CLS (Cumulative Layout Shift) | < 0.1 | ~0.05 ✅ |
| TTFB (Time to First Byte) | < 600ms | ~300ms ✅ |
| TTI (Time to Interactive) | < 3.8s | ~3.0s ✅ |

---

## 7. 実装優先度マトリクス

| 項目 | 効果 | 工数 | 優先度 |
|------|------|------|--------|
| 追加Dynamic Import | 高 | 低 | ⭐⭐⭐⭐⭐ |
| ライブラリ最適化 | 中 | 中 | ⭐⭐⭐⭐ |
| Redisキャッシュ | 高 | 中 | ⭐⭐⭐⭐ |
| DBインデックス追加 | 高 | 低 | ⭐⭐⭐⭐⭐ |
| 仮想化リスト | 中 | 中 | ⭐⭐⭐ |
| Service Worker | 低 | 高 | ⭐⭐ |

---

## 8. 結論

DiagnoLeads v2は**すでに良好なパフォーマンス基盤**を持っている。

### 現状の強み
- ✅ Next.js 15の最新最適化機能を活用
- ✅ 重いコンポーネントのDynamic Import
- ✅ 画像最適化（AVIF/WebP）
- ✅ Drizzle ORMによる効率的なDBクエリ
- ✅ RLSによるセキュアなデータ分離

### 推奨アクション
1. **即座に実施**: 追加Dynamic Import、DBインデックス追加
2. **短期**: ライブラリ最適化、Redisキャッシュ導入
3. **中長期**: 仮想化リスト、PWA対応

### パフォーマンス評価
**⭐⭐⭐⭐☆ 良好** - 商用運用に十分なパフォーマンス、継続的な改善余地あり

---

*分析日: 2026-02-04*
*分析者: Factory Droid*
