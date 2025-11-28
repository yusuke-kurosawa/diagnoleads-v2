import { publicProcedure, router } from '@/lib/trpc/init';
import { z } from 'zod';

/**
 * Health check router
 * Provides basic health check and status endpoints
 */
export const healthRouter = router({
  /**
   * Simple health check
   * @openapi /health/check
   */
  check: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/health/check',
        tags: ['health'],
        summary: 'Health check endpoint',
        description: 'Check if the API is running and healthy',
      },
    })
    .input(z.void())
    .output(
      z.object({
        status: z.literal('ok'),
        timestamp: z.string().datetime(),
      })
    )
    .query(() => {
      return {
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Echo endpoint for testing
   * @openapi /health/echo
   */
  echo: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/health/echo',
        tags: ['health'],
        summary: 'Echo test endpoint',
        description: 'Echo back the provided message with a timestamp',
      },
    })
    .input(
      z.object({
        message: z.string().describe('Message to echo back'),
      })
    )
    .output(
      z.object({
        message: z.string(),
        timestamp: z.string().datetime(),
      })
    )
    .query(({ input }) => {
      return {
        message: input.message,
        timestamp: new Date().toISOString(),
      };
    }),
});
