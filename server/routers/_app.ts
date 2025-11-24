import { router } from '@/lib/trpc/init';
import { healthRouter } from './health';
import { leadsRouter } from '@/lib/features/leads/api/router';
import { organizationsRouter } from '@/lib/features/organizations/api/router';
import { analyticsRouter } from '@/lib/features/analytics/api/router';

/**
 * Main tRPC app router
 * All routers are merged here
 */
export const appRouter = router({
  health: healthRouter,
  leads: leadsRouter,
  organizations: organizationsRouter,
  analytics: analyticsRouter,
  // TODO: Add more routers here
  // assessments: assessmentsRouter,
});

export type AppRouter = typeof appRouter;
