import { aiRouter } from '@/lib/features/ai/api/router';
import { analyticsRouter } from '@/lib/features/analytics/api/router';
import { contentRouter } from '@/lib/features/content/api/router';
import { hierarchyRouter } from '@/lib/features/hierarchy/api/router';
import { leadsRouter } from '@/lib/features/leads/api/router';
import { membersRouter } from '@/lib/features/members/api/router';
import { notificationsRouter } from '@/lib/features/notifications/api/router';
import { organizationsRouter } from '@/lib/features/organizations/api/router';
import { tagsRouter } from '@/lib/features/tags/api/router';
import { webhooksRouter } from '@/lib/features/webhooks/api/router';
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
});

export type AppRouter = typeof appRouter;
