import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

/**
 * Client-side auth instance
 * Use this in React components for authentication
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient()],
});

/**
 * Export hooks and utilities for use in components
 */
export const {
  useSession,
  signIn,
  signOut,
  signUp,
  useActiveOrganization,
  useListOrganizations,
} = authClient;
