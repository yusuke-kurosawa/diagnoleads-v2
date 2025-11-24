import { router } from '@/lib/trpc/init';
import { healthRouter } from './health';

/**
 * Main tRPC app router
 * All routers are merged here
 */
export const appRouter = router({
  health: healthRouter,
  // TODO: Add more routers here
  // leads: leadsRouter,
  // organizations: organizationsRouter,
  // assessments: assessmentsRouter,
});

export type AppRouter = typeof appRouter;
