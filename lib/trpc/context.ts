import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';

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
