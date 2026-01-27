import {
  createOrganizationContext,
  organizationInputSchema,
} from '@/lib/multi-tenant/middleware/organization';
import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

/**
 * Initialize tRPC with context
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && error.cause.name === 'ZodError' ? error.cause : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure builders
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});

/**
 * Organization procedure - requires authentication and organization membership
 *
 * This middleware:
 * 1. Validates organizationId in input
 * 2. Verifies user is a member of the organization
 * 3. Calculates CASL permissions based on role
 * 4. Sets current user for RLS (creates RLS-scoped database client)
 */
export const organizationProcedure = protectedProcedure
  .input(organizationInputSchema)
  .use(async ({ ctx, input, next }) => {
    const orgContext = await createOrganizationContext(ctx, input);

    return next({
      ctx: {
        ...ctx,
        ...orgContext,
      },
    });
  });
