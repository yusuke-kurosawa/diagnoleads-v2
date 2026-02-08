import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { env } from '@/lib/env';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';

/**
 * Email sending helper (lazy import to avoid circular dependencies)
 */
async function sendAuthEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  try {
    const { sendEmail } = await import('@/lib/email/client');
    await sendEmail({
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error('Failed to send auth email:', error);
    // Don't throw - avoid timing attacks
  }
}

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
    sendResetPassword: async ({ user, url, token }, request) => {
      const locale = request?.headers.get('accept-language')?.startsWith('en') ? 'en' : 'ja';
      const subject =
        locale === 'ja' ? 'パスワードリセット - DiagnoLeads' : 'Password Reset - DiagnoLeads';
      const text =
        locale === 'ja'
          ? `${user.name || 'ユーザー'}様\n\nパスワードリセットのリクエストを受け付けました。\n\n以下のリンクからパスワードをリセットしてください：\n${url}\n\nこのリンクは1時間で期限切れとなります。\n\nこのリクエストに心当たりがない場合は、このメールを無視してください。\n\n- DiagnoLeads`
          : `Hi ${user.name || 'User'},\n\nWe received a request to reset your password.\n\nClick the link below to reset your password:\n${url}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\n- DiagnoLeads`;

      void sendAuthEmail({ to: user.email, subject, text });
    },
    /**
     * Callback after password reset is complete
     */
    onPasswordReset: async ({ user }, request) => {
      console.log(`Password reset completed for user: ${user.email}`);
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
  },

  /**
   * Email verification configuration
   * Note: requireEmailVerification is false, so this is only triggered manually
   */
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const locale = request?.headers.get('accept-language')?.startsWith('en') ? 'en' : 'ja';
      const subject =
        locale === 'ja' ? 'メールアドレスの確認 - DiagnoLeads' : 'Verify Your Email - DiagnoLeads';
      const text =
        locale === 'ja'
          ? `${user.name || 'ユーザー'}様\n\nDiagnoLeadsへのご登録ありがとうございます。\n\n以下のリンクからメールアドレスを確認してください：\n${url}\n\n- DiagnoLeads`
          : `Hi ${user.name || 'User'},\n\nThank you for registering with DiagnoLeads.\n\nClick the link below to verify your email:\n${url}\n\n- DiagnoLeads`;

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
        const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/${data.id}`;

        void sendAuthEmail({
          to: email,
          subject: `${organization.name}への招待 - DiagnoLeads`,
          text: `${inviter.user.name || inviter.user.email}さんから${organization.name}への招待が届いています。\n\nロール: ${role}\n\n以下のリンクから招待を承認してください：\n${inviteUrl}\n\nこの招待は7日間で期限切れとなります。\n\n- DiagnoLeads`,
        });
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
