// TODO: Re-enable after fixing react-email build issue
// import {
//   ResetPasswordEmail,
//   OrganizationInviteEmail,
//   WelcomeEmail,
// } from '@/emails';
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
  // TODO: Re-enable react-email templates after fixing build issue
  return sendEmail({
    to,
    subject: 'パスワードのリセット - DiagnoLeads',
    text: `${userName}様\n\nパスワードリセットのリクエストを受け付けました。\n\n以下のリンクからパスワードをリセットしてください：\n${resetLink}\n\nこのリンクは${expiresIn}で期限切れとなります。\n\n- DiagnoLeads`,
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
  // TODO: Re-enable react-email templates after fixing build issue
  return sendEmail({
    to,
    subject: `${organizationName}への招待 - DiagnoLeads`,
    text: `${inviterName}さんから${organizationName}への招待が届いています。\n\nロール: ${role}\n\n以下のリンクから招待を承認してください：\n${inviteLink}\n\nこの招待は${expiresIn}で期限切れとなります。\n\n- DiagnoLeads`,
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
  // TODO: Re-enable react-email templates after fixing build issue
  return sendEmail({
    to,
    subject: 'DiagnoLeadsへようこそ！',
    text: `${userName}様\n\nDiagnoLeadsへようこそ！\n\n以下のリンクからダッシュボードにアクセスできます：\n${dashboardLink}\n\n- DiagnoLeads`,
  });
}
