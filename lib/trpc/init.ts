import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import type { Context } from './context';
import { organizationMembers } from '@/lib/db/schema';
import { defineAbilitiesFor } from '@/lib/auth/permissions';
import { setCurrentUser } from '@/lib/db/rls';

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
          error.cause instanceof Error && error.cause.name === 'ZodError'
            ? error.cause
            : null,
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
 * 4. Creates RLS-scoped database client
 */
export const organizationProcedure = protectedProcedure
  .input(z.object({ organizationId: z.string().uuid() }).passthrough())
  .use(async ({ ctx, input, next }) => {
    // 1. Verify organization membership
    const membership = await ctx.db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, ctx.user.id),
        eq(organizationMembers.organizationId, input.organizationId)
      ),
      with: {
        organization: true,
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'この組織にアクセスする権限がありません',
      });
    }

    // 2. Calculate CASL permissions
    const ability = defineAbilitiesFor(ctx.user as any, membership);

    // 3. Set current user for RLS
    // All subsequent database queries will automatically respect RLS policies
    await setCurrentUser(ctx.db, ctx.user.id);

    return next({
      ctx: {
        ...ctx,
        organization: membership.organization,
        membership,
        ability,
      },
    });
  });
