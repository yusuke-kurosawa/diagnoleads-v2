import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { env } from '@/lib/env';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import {
  detectLocaleFromHeaders,
  generateInvitationEmail,
  generatePasswordResetEmail,
  generateVerificationEmail,
  sendAuthEmail,
} from './email-helpers';

/**
 * BetterAuth Configuration
 * Provides authentication with organization/team management support
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
    minPasswordLength: 8,
    maxPasswordLength: 128,
    /**
     * Send password reset email
     * Called when user requests password reset via requestPasswordReset
     */
    sendResetPassword: async ({ user, url }, request) => {
      const locale = detectLocaleFromHeaders(request?.headers);
      const { subject, text } = generatePasswordResetEmail(user, url, locale);
      void sendAuthEmail({ to: user.email, subject, text });
    },
    /**
     * Callback after password reset is complete
     */
    onPasswordReset: async ({ user }) => {
      console.log(`Password reset completed for user: ${user.email}`);
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
  },

  /**
   * Email verification configuration
   * Note: requireEmailVerification is false, so this is only triggered manually
   */
  emailVerification: {
    sendVerificationEmail: async ({ user, url }, request) => {
      const locale = detectLocaleFromHeaders(request?.headers);
      const { subject, text } = generateVerificationEmail(user, url, locale);
      void sendAuthEmail({ to: user.email, subject, text });
    },
    sendOnSignUp: false, // Don't auto-send on signup (requireEmailVerification is false)
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
      async sendInvitationEmail(data) {
        const { email, organization, inviter, role } = data;
        const inviterName = inviter.user.name || inviter.user.email;
        const { subject, text } = generateInvitationEmail(
          inviterName,
          organization.name,
          role,
          data.id
        );
        void sendAuthEmail({ to: email, subject, text });
      },
    }),
  ],

  advanced: {
    useSecureCookies: env.NODE_ENV === 'production',
    cookieDomain: env.NODE_ENV === 'production' ? env.BETTER_AUTH_URL : undefined,
    database: {
      generateId: 'uuid',
    },
  },

  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
});

/**
 * Export types for type-safe auth usage
 */
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
