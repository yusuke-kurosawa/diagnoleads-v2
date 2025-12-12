import type { AppRouter } from '@/server/routers/_app';
import { createTRPCReact } from '@trpc/react-query';
import type { inferRouterOutputs } from '@trpc/server';

/**
 * tRPC React client
 * Use this in React components to call tRPC procedures
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Type helper for inferring tRPC router outputs
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
