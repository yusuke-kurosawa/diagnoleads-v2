import { router } from '@/lib/trpc/init';
import { healthRouter } from './health';
import { leadsRouter } from '@/lib/features/leads/api/router';

/**
 * Main tRPC app router
 * All routers are merged here
 */
export const appRouter = router({
  health: healthRouter,
  leads: leadsRouter,
  // TODO: Add more routers here
  // organizations: organizationsRouter,
  // assessments: assessmentsRouter,
});

export type AppRouter = typeof appRouter;
