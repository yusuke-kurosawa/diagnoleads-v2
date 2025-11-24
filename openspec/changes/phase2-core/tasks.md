# Phase 2 Core Features - Implementation Tasks

## 📋 タスク概要

**変更ID**: phase2-core
**総工数見積**: 32時間
**完了予定**: Day 1-6 (6営業日)

---

## 🎯 Priority 0: Blockers (Must Complete First)

### Task 1: 組織スコープミドルウェア実装
**ファイル**: `lib/trpc/init.ts`
**工数**: 4時間
**担当**: Backend
**ブロッカー**: なし

#### サブタスク
- [ ] organizationProcedure 実装
  - メンバーシップ検証ロジック
  - CASL ability 計算
  - RLS-scoped DB client 生成
- [ ] エラーハンドリング追加
  - 組織が見つからない場合
  - メンバーシップがない場合
  - 権限不足の場合
- [ ] 型定義更新 (`lib/trpc/context.ts`)
  - OrganizationContext 型
  - OrganizationProtectedContext 型

#### 完了基準
```typescript
// ✅ このコードが動作する
const result = await caller.leads.list({ organizationId: 'valid-org-id' });
// ✅ 非メンバーは 403 を受け取る
await expect(
  caller.leads.list({ organizationId: 'other-org-id' })
).rejects.toThrow('FORBIDDEN');
```

#### 依存ファイル
- `lib/auth/permissions.ts` (既存)
- `lib/db/rls.ts` (既存)
- `db/schema/organizations.ts` (既存)

---

### Task 2: リード管理tRPCルーター実装
**ファイル**: `server/routers/leads.ts`
**工数**: 8時間
**担当**: Backend + Frontend
**ブロッカー**: Task 1

#### サブタスク
- [ ] CRUD Procedures 実装
  - `list` - ページネーション対応
  - `getById` - 詳細取得
  - `create` - Zod validation
  - `update` - 部分更新対応
  - `delete` - ソフトデリート
- [ ] Zod Schema 定義 (`types/lead.ts`)
  ```typescript
  export const createLeadSchema = z.object({
    organizationId: z.string().uuid(),
    companyName: z.string().min(1).max(255),
    industry: z.enum(INDUSTRIES),
    employeeCount: z.enum(EMPLOYEE_RANGES),
    contactName: z.string().min(1).max(255),
    contactEmail: z.string().email(),
    contactPhone: z.string().optional(),
    sourceChannel: z.enum(SOURCE_CHANNELS),
    notes: z.string().optional(),
  });
  ```
- [ ] CASL 権限チェック統合
  - `create`: `ability.can('create', 'Lead')`
  - `update`: `ability.can('update', subject('Lead', lead))`
  - `delete`: `ability.can('delete', subject('Lead', lead))`
- [ ] エラーハンドリング
  - リードが見つからない → 404
  - 権限不足 → 403
  - バリデーションエラー → 400

#### 完了基準
```typescript
// ✅ リード作成が成功する
const lead = await trpc.leads.create.mutate({
  organizationId,
  companyName: 'Test Corp',
  industry: 'technology',
  // ...
});

// ✅ 他組織のリードは取得できない
const otherLead = await trpc.leads.getById.query({
  organizationId: 'other-org',
  id: lead.id,
});
expect(otherLead).toBeNull();
```

#### 依存ファイル
- `lib/trpc/init.ts` (Task 1)
- `db/schema/leads.ts` (既存)

---

### Task 3: 組織コンテキストフック実装
**ファイル**: `hooks/useOrganization.ts`
**工数**: 2時間
**担当**: Frontend
**ブロッカー**: なし

#### サブタスク
- [ ] Context Provider 作成
  ```typescript
  export const OrganizationProvider: React.FC<{
    children: React.ReactNode;
  }> = ({ children }) => {
    const [organizationId, setOrganizationId] = useState<string>();
    // localStorage から復元
    // セッション変更時にクリア
    return (
      <OrganizationContext.Provider value={{ organizationId, setOrganizationId }}>
        {children}
      </OrganizationContext.Provider>
    );
  };
  ```
- [ ] useOrganization フック実装
  ```typescript
  export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (!context) {
      throw new Error('useOrganization must be used within OrganizationProvider');
    }
    return context;
  }
  ```
- [ ] RootLayout に Provider 追加 (`app/layout.tsx`)

#### 完了基準
```typescript
// ✅ どのコンポーネントからも使用可能
const { organizationId, setOrganizationId } = useOrganization();
```

---

## 📊 Priority 1: High Value Features

### Task 4: ダッシュボード統計API実装
**ファイル**: `server/routers/analytics.ts`
**工数**: 6時間
**担当**: Backend
**ブロッカー**: Task 1

#### サブタスク
- [ ] 統計Procedures 実装
  - `getOverview` - 総リード数、成約率、今月の新規など
  - `getLeadTrend` - 日別/月別リード推移
  - `getSourceBreakdown` - 流入経路別内訳
  - `getIndustryBreakdown` - 業界別内訳
- [ ] SQL最適化
  - インデックス活用
  - 集計クエリのキャッシュ検討
- [ ] Zod Schema 定義 (`types/analytics.ts`)

#### 完了基準
```typescript
const analytics = await trpc.analytics.getOverview.query({ organizationId });
expect(analytics).toMatchObject({
  totalLeads: expect.any(Number),
  newLeadsThisMonth: expect.any(Number),
  conversionRate: expect.any(Number),
  averageScore: expect.any(Number),
});
```

---

### Task 5: リード一覧ページUI実装
**ファイル**: `app/(dashboard)/leads/page.tsx`
**工数**: 6時間
**担当**: Frontend
**ブロッカー**: Task 2, Task 3

#### サブタスク
- [ ] LeadTable コンポーネント作成 (`components/leads/LeadTable.tsx`)
  - TanStack Table 統合
  - ソート/フィルタ/ページネーション
  - 列カスタマイズ
- [ ] LeadForm コンポーネント作成 (`components/leads/LeadForm.tsx`)
  - React Hook Form + Zod
  - 作成/編集モード対応
- [ ] LeadDetails コンポーネント作成 (`components/leads/LeadDetails.tsx`)
  - 詳細情報表示
  - 編集/削除アクション
- [ ] tRPC 統合
  - useLeads フック作成 (`hooks/useLeads.ts`)
  - Optimistic updates
  - エラーハンドリング

#### 完了基準
- ✅ リード一覧が表示される
- ✅ 新規作成フォームが動作する
- ✅ 編集/削除が成功する
- ✅ ページネーションが機能する

---

### Task 6: ダッシュボードUI実装
**ファイル**: `app/(dashboard)/page.tsx`
**工数**: 6時間
**担当**: Frontend
**ブロッカー**: Task 4

#### サブタスク
- [ ] StatsCard コンポーネント作成 (`components/dashboard/StatsCard.tsx`)
  - 数値表示
  - 変化率バッジ
  - アイコン統合
- [ ] LeadChart コンポーネント作成 (`components/dashboard/LeadChart.tsx`)
  - Tremor AreaChart 統合
  - 日付範囲選択
  - データ整形
- [ ] RecentActivity コンポーネント作成 (`components/dashboard/RecentActivity.tsx`)
  - アクティビティフィード
  - リアルタイム更新 (polling or WebSocket)
- [ ] tRPC 統合
  - useAnalytics フック作成 (`hooks/useAnalytics.ts`)

#### 完了基準
- ✅ 統計カードに正確な数値が表示される
- ✅ チャートが正しくレンダリングされる
- ✅ 最近のアクティビティが表示される

---

## 🚀 Priority 2: Enhancements

### Task 7: 組織管理機能実装
**ファイル**: `server/routers/organizations.ts`
**工数**: 4時間
**担当**: Backend + Frontend
**ブロッカー**: Task 1

#### サブタスク
- [ ] Procedures 実装
  - `list` - ユーザーが所属する組織一覧
  - `getById` - 組織詳細
  - `update` - 組織情報更新 (owner のみ)
  - `updateSettings` - 設定変更
- [ ] 組織切り替え UI (`components/dashboard/OrganizationSwitcher.tsx`)
  - ドロップダウンメニュー
  - 組織作成リンク
- [ ] tRPC キャッシュ管理
  - 組織切り替え時に全キャッシュクリア

#### 完了基準
- ✅ 組織一覧が取得できる
- ✅ 組織切り替えで正しいデータが表示される
- ✅ Owner が組織情報を編集できる

---

### Task 8: メンバー招待機能実装
**ファイル**: `server/routers/members.ts`
**工数**: 4時間
**担当**: Backend + Frontend
**ブロッカー**: Task 1

#### サブタスク
- [ ] Procedures 実装
  - `list` - 組織メンバー一覧
  - `invite` - メール招待送信
  - `updateRole` - ロール変更 (admin/owner のみ)
  - `remove` - メンバー削除 (admin/owner のみ)
- [ ] 招待メールテンプレート (`emails/member-invite.tsx`)
- [ ] 招待受諾フロー (`app/(auth)/accept-invite/page.tsx`)
- [ ] メンバー管理UI (`app/(dashboard)/settings/members/page.tsx`)

#### 完了基準
- ✅ メンバー招待メールが送信される
- ✅ 招待受諾でメンバーが追加される
- ✅ Admin がロールを変更できる

---

### Task 9: E2Eテスト実装
**ファイル**: `test/e2e/`
**工数**: 4時間
**担当**: QA / Backend
**ブロッカー**: Task 2, Task 5

#### サブタスク
- [ ] リード管理フロー (`lead-management.spec.ts`)
  ```typescript
  test('リード作成から削除まで', async ({ page }) => {
    // 1. ログイン
    await page.goto('/login');
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');

    // 2. リード作成
    await page.goto('/leads');
    await page.click('text=新規リード作成');
    await page.fill('[name=companyName]', 'Test Corp');
    // ... fill form
    await page.click('button[type=submit]');

    // 3. リストに表示確認
    await expect(page.locator('text=Test Corp')).toBeVisible();

    // 4. 編集
    await page.click('text=Test Corp');
    await page.click('text=編集');
    await page.fill('[name=companyName]', 'Test Corp Updated');
    await page.click('button[type=submit]');

    // 5. 削除
    await page.click('text=削除');
    await page.click('text=確認');
    await expect(page.locator('text=Test Corp Updated')).not.toBeVisible();
  });
  ```
- [ ] ダッシュボード統計 (`dashboard-analytics.spec.ts`)
- [ ] 組織切り替え (`organization-switching.spec.ts`)

#### 完了基準
- ✅ すべてのE2Eテストがパスする
- ✅ CI/CDパイプラインに統合される

---

### Task 10: パフォーマンス最適化
**ファイル**: 各種
**工数**: 4時間
**担当**: Backend
**ブロッカー**: All above

#### サブタスク
- [ ] データベースインデックス追加
  ```sql
  CREATE INDEX idx_leads_organization_status
    ON leads(organization_id, status);

  CREATE INDEX idx_leads_organization_created
    ON leads(organization_id, created_at DESC);

  CREATE INDEX idx_leads_created_at_status
    ON leads(created_at, status)
    WHERE deleted_at IS NULL;
  ```
- [ ] tRPC クエリキャッシュ設定
  ```typescript
  trpc.leads.list.useQuery({ organizationId }, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });
  ```
- [ ] 統計クエリの最適化
  - 集計結果のメモ化
  - 不要な JOIN 削除
- [ ] パフォーマンス測定
  - Lighthouse スコア 90+ 目標
  - API 応答時間 < 200ms (p95)

#### 完了基準
- ✅ すべてのページロード < 2秒
- ✅ API 応答時間 < 200ms (p95)
- ✅ Lighthouse Performance スコア 90+

---

## 📅 実装スケジュール

### Day 1-2: Core Foundation (12h)
- ✅ Task 1: organizationProcedure (4h)
- ✅ Task 2: リード管理API (8h)

### Day 3: Context & Analytics (8h)
- ✅ Task 3: useOrganization (2h)
- ✅ Task 4: 統計API (6h)

### Day 4-5: UI Implementation (12h)
- ✅ Task 5: リード一覧UI (6h)
- ✅ Task 6: ダッシュボードUI (6h)

### Day 6: Enhancements (8h)
- ✅ Task 7: 組織管理 (4h)
- ✅ Task 8: メンバー招待 (4h)

### Day 7: Testing & Optimization (8h)
- ✅ Task 9: E2Eテスト (4h)
- ✅ Task 10: パフォーマンス最適化 (4h)

**総工数**: 48時間 (6営業日 @ 8h/day)

---

## 🧪 テスト戦略

### Unit Tests (各機能ごと)
```bash
npm run test:unit -- server/routers/leads.test.ts
npm run test:unit -- lib/trpc/organization-procedure.test.ts
```

### Integration Tests
```bash
npm run test:integration -- test/integration/lead-crud.test.ts
```

### E2E Tests
```bash
npm run test:e2e -- test/e2e/lead-management.spec.ts
```

### Test Coverage Target
- Unit: 80%+
- Integration: 70%+
- E2E: Critical paths 100%

---

## 📊 進捗トラッキング

### チェックリスト更新
各タスク完了後、`IMPLEMENTATION_CHECKLIST.md` を更新:

```markdown
- [x] Task 1: organizationProcedure 実装 (4h) - Day 1
- [x] Task 2: リード管理API実装 (8h) - Day 1-2
- [ ] Task 3: useOrganization フック (2h)
- [ ] Task 4: 統計API実装 (6h)
...
```

### Git Commit メッセージ規約
```bash
feat(api): implement organizationProcedure middleware
feat(leads): add CRUD tRPC router
feat(hooks): create useOrganization context hook
feat(dashboard): integrate Tremor charts
test(e2e): add lead management flow tests
perf(db): add indexes for lead queries
```

---

## ✅ 完了基準

### Phase 2 Core Features が完了したと判断される条件

1. **機能要件**
   - [x] リード CRUD が完全に動作する
   - [x] ダッシュボードに統計が表示される
   - [x] 組織スコープが正しく機能する
   - [x] メンバー招待が動作する

2. **セキュリティ要件**
   - [x] 非メンバーはデータにアクセスできない
   - [x] RLS が自動適用される
   - [x] CASL 権限チェックが動作する

3. **品質要件**
   - [x] すべての Unit Tests がパスする (80%+ coverage)
   - [x] すべての E2E Tests がパスする
   - [x] Lighthouse Performance 90+
   - [x] API 応答時間 < 200ms (p95)

4. **ドキュメント**
   - [x] IMPLEMENTATION_CHECKLIST.md が更新されている
   - [x] API ドキュメントが生成されている (OpenAPI)
   - [x] README に使用方法が記載されている

---

## 🔗 関連リソース

- **Spec Delta**: `/openspec/changes/phase2-core/spec-delta.md`
- **Architecture**: `/openspec/specs/architecture.md`
- **Phase 2 Plan**: `/openspec/specs/phase2-plan.md`
- **Progress Tracking**: `/IMPLEMENTATION_CHECKLIST.md`

---

**最終更新**: 2025-11-24
**ステータス**: 準備完了 - 実装開始可能 🚀
