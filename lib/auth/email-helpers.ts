/**
 * Auth Email Helpers
 * Utility functions for sending authentication-related emails
 */

import { env } from '@/lib/env';

export interface AuthEmailOptions {
  to: string;
  subject: string;
  text: string;
}

/**
 * Send authentication-related email
 * Uses lazy import to avoid circular dependencies
 */
export async function sendAuthEmail({ to, subject, text }: AuthEmailOptions): Promise<void> {
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
 * Generate password reset email content based on locale
 */
export function generatePasswordResetEmail(
  user: { name?: string | null; email: string },
  url: string,
  locale: 'ja' | 'en'
): { subject: string; text: string } {
  const subject =
    locale === 'ja' ? 'パスワードリセット - DiagnoLeads' : 'Password Reset - DiagnoLeads';

  const text =
    locale === 'ja'
      ? `${user.name || 'ユーザー'}様\n\nパスワードリセットのリクエストを受け付けました。\n\n以下のリンクからパスワードをリセットしてください：\n${url}\n\nこのリンクは1時間で期限切れとなります。\n\nこのリクエストに心当たりがない場合は、このメールを無視してください。\n\n- DiagnoLeads`
      : `Hi ${user.name || 'User'},\n\nWe received a request to reset your password.\n\nClick the link below to reset your password:\n${url}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\n- DiagnoLeads`;

  return { subject, text };
}

/**
 * Generate email verification email content based on locale
 */
export function generateVerificationEmail(
  user: { name?: string | null; email: string },
  url: string,
  locale: 'ja' | 'en'
): { subject: string; text: string } {
  const subject =
    locale === 'ja' ? 'メールアドレスの確認 - DiagnoLeads' : 'Verify Your Email - DiagnoLeads';

  const text =
    locale === 'ja'
      ? `${user.name || 'ユーザー'}様\n\nDiagnoLeadsへのご登録ありがとうございます。\n\n以下のリンクからメールアドレスを確認してください：\n${url}\n\n- DiagnoLeads`
      : `Hi ${user.name || 'User'},\n\nThank you for registering with DiagnoLeads.\n\nClick the link below to verify your email:\n${url}\n\n- DiagnoLeads`;

  return { subject, text };
}

/**
 * Generate organization invitation email content
 */
export function generateInvitationEmail(
  inviterName: string,
  organizationName: string,
  role: string,
  inviteId: string
): { subject: string; text: string } {
  const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/${inviteId}`;

  const subject = `${organizationName}への招待 - DiagnoLeads`;

  const text = `${inviterName}さんから${organizationName}への招待が届いています。\n\nロール: ${role}\n\n以下のリンクから招待を承認してください：\n${inviteUrl}\n\nこの招待は7日間で期限切れとなります。\n\n- DiagnoLeads`;

  return { subject, text };
}

/**
 * Detect locale from request headers
 */
export function detectLocaleFromHeaders(headers: Headers | null | undefined): 'ja' | 'en' {
  if (!headers) return 'ja';
  const acceptLanguage = headers.get('accept-language');
  return acceptLanguage?.startsWith('en') ? 'en' : 'ja';
}
