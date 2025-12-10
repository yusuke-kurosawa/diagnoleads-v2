import { abTestsRouter } from '@/lib/features/ab-tests/api/router';
import { aiRouter } from '@/lib/features/ai/api/router';
import { analyticsRouter } from '@/lib/features/analytics/api/router';
import { commentsRouter } from '@/lib/features/comments/api/router';
import { contentRouter } from '@/lib/features/content/api/router';
import { customFieldsRouter } from '@/lib/features/custom-fields/api/router';
import { customReportsRouter } from '@/lib/features/custom-reports/api/router';
import { diagnosticTemplatesRouter } from '@/lib/features/diagnostic-templates/api/router';
import { filtersRouter } from '@/lib/features/filters/api/router';
import { hierarchyRouter } from '@/lib/features/hierarchy/api/router';
import { leadsRouter } from '@/lib/features/leads/api/router';
import { membersRouter } from '@/lib/features/members/api/router';
import { notificationsRouter } from '@/lib/features/notifications/api/router';
import { organizationsRouter } from '@/lib/features/organizations/api/router';
import { reportsRouter } from '@/lib/features/reports/api/router';
import { scoringRulesRouter } from '@/lib/features/scoring-rules/api/router';
import { tagsRouter } from '@/lib/features/tags/api/router';
import { webhooksRouter } from '@/lib/features/webhooks/api/router';
import { workflowsRouter } from '@/lib/features/workflows/api/router';
import { router } from '@/lib/trpc/init';
import { healthRouter } from './health';

/**
 * Main tRPC app router
 * All routers are merged here
 */
export const appRouter = router({
  health: healthRouter,
  leads: leadsRouter,
  organizations: organizationsRouter,
  analytics: analyticsRouter,
  members: membersRouter,
  ai: aiRouter,
  hierarchy: hierarchyRouter, // Phase 2.7: ホールディングス・グループ企業対応
  content: contentRouter, // Phase 4.4: コンテンツ管理UI
  webhooks: webhooksRouter, // Phase 5.1: Webhook基盤
  notifications: notificationsRouter, // Phase 9: 通知機能
  tags: tagsRouter, // Phase 9: リードタグ機能
  comments: commentsRouter, // Phase 9: コメント・メモ機能
  reports: reportsRouter, // Phase 9: スケジュールレポート機能
  workflows: workflowsRouter, // Phase 9 P1: ワークフロー自動化
  customFields: customFieldsRouter, // Phase 9 P1: カスタムフィールド
  filters: filtersRouter, // Phase 9 P2: 高度なフィルタリング
  customReports: customReportsRouter, // Phase 9 P2: カスタムレポートビルダー
  diagnosticTemplates: diagnosticTemplatesRouter, // Phase 9 P3: 診断テンプレート管理
  abTests: abTestsRouter, // Phase 9 P3: A/Bテスト機能
  scoringRules: scoringRulesRouter, // Phase 9 P3: リードスコアリングルール
});

export type AppRouter = typeof appRouter;
