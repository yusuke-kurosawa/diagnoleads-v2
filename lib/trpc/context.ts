import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import type { User, Session } from '@/lib/db/schema';
import type { OrganizationContext } from '@/lib/multi-tenant/types';

/**
 * Create tRPC context
 * This context is available in all tRPC procedures
 */
export async function createContext(opts?: FetchCreateContextFnOptions) {
  // Get session from request headers
  const session = opts?.req
    ? await auth.api.getSession({ headers: opts.req.headers })
    : null;

  return {
    db,
    session,
    user: session?.user ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Protected context - available after protectedProcedure middleware
 */
export type ProtectedContext = Context & {
  session: Session;
  user: User;
};

/**
 * Re-export OrganizationContext from multi-tenant module
 */
export type { OrganizationContext } from '@/lib/multi-tenant/types';

/**
 * Organization-protected context - combines both protectedProcedure and organizationProcedure
 */
export type OrganizationProtectedContext = ProtectedContext & OrganizationContext;
