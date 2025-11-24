import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/routers/_app';

/**
 * tRPC React client
 * Use this in React components to call tRPC procedures
 */
export const trpc = createTRPCReact<AppRouter>();
