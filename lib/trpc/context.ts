import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import type { OrganizationContext } from '@/lib/multi-tenant/types';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

/**
 * Session type from BetterAuth
 */
type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Create tRPC context
 * This context is available in all tRPC procedures
 */
export async function createContext(opts?: FetchCreateContextFnOptions) {
  // Get session from request headers
  const session = opts?.req ? await auth.api.getSession({ headers: opts.req.headers }) : null;

  return {
    db,
    session,
    user: session?.user ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * User type from BetterAuth session
 */
export type AuthUser = NonNullable<NonNullable<BetterAuthSession>['user']>;

/**
 * Protected context - available after protectedProcedure middleware
 * session is the full BetterAuth session object { session: {...}, user: {...} }
 */
export type ProtectedContext = Context & {
  session: NonNullable<BetterAuthSession>;
  user: AuthUser;
};

/**
 * Re-export OrganizationContext from multi-tenant module
 */
export type { OrganizationContext } from '@/lib/multi-tenant/types';

/**
 * Organization-protected context - combines both protectedProcedure and organizationProcedure
 */
export type OrganizationProtectedContext = ProtectedContext & OrganizationContext;
