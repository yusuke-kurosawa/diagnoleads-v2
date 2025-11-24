import {
  ResetPasswordEmail,
  OrganizationInviteEmail,
  WelcomeEmail,
} from '@/emails';
import { sendEmail } from './client';

/**
 * パスワードリセットメールを送信
 */
export async function sendPasswordResetEmail({
  to,
  userName,
  resetLink,
  expiresIn = '1時間',
}: {
  to: string;
  userName: string;
  resetLink: string;
  expiresIn?: string;
}) {
  return sendEmail({
    to,
    subject: 'パスワードのリセット - DiagnoLeads',
    react: ResetPasswordEmail({
      userName,
      resetLink,
      expiresIn,
    }),
  });
}

/**
 * 組織招待メールを送信
 */
export async function sendOrganizationInviteEmail({
  to,
  inviterName,
  organizationName,
  inviteLink,
  role = 'メンバー',
  expiresIn = '7日間',
}: {
  to: string;
  inviterName: string;
  organizationName: string;
  inviteLink: string;
  role?: string;
  expiresIn?: string;
}) {
  return sendEmail({
    to,
    subject: `${organizationName}への招待 - DiagnoLeads`,
    react: OrganizationInviteEmail({
      inviterName,
      organizationName,
      inviteLink,
      role,
      expiresIn,
    }),
  });
}

/**
 * ウェルカムメールを送信
 */
export async function sendWelcomeEmail({
  to,
  userName,
  dashboardLink,
}: {
  to: string;
  userName: string;
  dashboardLink: string;
}) {
  return sendEmail({
    to,
    subject: 'DiagnoLeadsへようこそ！',
    react: WelcomeEmail({
      userName,
      dashboardLink,
    }),
  });
}
