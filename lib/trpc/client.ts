import type { AppRouter } from '@/server/routers/_app';
import { createTRPCReact } from '@trpc/react-query';

/**
 * tRPC React client
 * Use this in React components to call tRPC procedures
 */
export const trpc = createTRPCReact<AppRouter>();
