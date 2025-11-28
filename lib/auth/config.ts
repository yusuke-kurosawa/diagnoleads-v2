import { db } from '@/lib/db/client';
import { env } from '@/lib/env';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';

/**
 * BetterAuth Configuration
 * Provides authentication with organization/team management support
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production with email provider
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day - update session if older than this
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes - cache session in cookie
    },
  },

  plugins: [
    organization({
      // Organization/team management plugin
      // Enables multi-tenant functionality
      async sendInvitationEmail(data) {
        // TODO: Implement email sending via Resend
        console.log('Invitation email:', data);
      },
    }),
  ],

  advanced: {
    // Security settings
    useSecureCookies: env.NODE_ENV === 'production',
    cookieDomain: env.NODE_ENV === 'production' ? env.BETTER_AUTH_URL : undefined,
  },

  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
});

/**
 * Export types for type-safe auth usage
 */
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
