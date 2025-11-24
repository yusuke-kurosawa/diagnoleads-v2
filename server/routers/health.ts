import { z } from 'zod';
import { router, publicProcedure } from '@/lib/trpc/init';

/**
 * Health check router
 * Provides basic health check and status endpoints
 */
export const healthRouter = router({
  /**
   * Simple health check
   */
  check: publicProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Echo endpoint for testing
   */
  echo: publicProcedure
    .input(z.object({ message: z.string() }))
    .query(({ input }) => {
      return {
        message: input.message,
        timestamp: new Date().toISOString(),
      };
    }),
});
