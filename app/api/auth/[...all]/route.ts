import { auth } from '@/lib/auth/config';
import { toNextJsHandler } from 'better-auth/next-js';

/**
 * BetterAuth API Routes Handler
 * Handles all authentication endpoints:
 * - POST /api/auth/sign-in
 * - POST /api/auth/sign-up
 * - POST /api/auth/sign-out
 * - GET  /api/auth/session
 * - And more...
 */
export const { GET, POST } = toNextJsHandler(auth);
