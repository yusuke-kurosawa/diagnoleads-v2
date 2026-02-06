/**
 * Email Send Tests
 *
 * Unit tests for email sending utility functions
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the email client
vi.mock('@/lib/email/client', () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 'mock-id', success: true }),
}));

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send password reset email with required params', async () => {
    const { sendPasswordResetEmail } = await import('@/lib/email/send');
    const { sendEmail } = await import('@/lib/email/client');

    await sendPasswordResetEmail({
      to: 'user@example.com',
      userName: 'Test User',
      resetLink: 'https://example.com/reset?token=abc123',
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'パスワードのリセット - DiagnoLeads',
      text: expect.stringContaining('Test User'),
    });
    expect(sendEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'パスワードのリセット - DiagnoLeads',
      text: expect.stringContaining('https://example.com/reset?token=abc123'),
    });
  });

  it('should include default expiration time', async () => {
    const { sendPasswordResetEmail } = await import('@/lib/email/send');
    const { sendEmail } = await import('@/lib/email/client');

    await sendPasswordResetEmail({
      to: 'user@example.com',
      userName: 'Test User',
      resetLink: 'https://example.com/reset',
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'パスワードのリセット - DiagnoLeads',
      text: expect.stringContaining('1時間'),
    });
  });

  it('should use custom expiration time', async () => {
    const { sendPasswordResetEmail } = await import('@/lib/email/send');
    const { sendEmail } = await import('@/lib/email/client');

    await sendPasswordResetEmail({
      to: 'user@example.com',
      userName: 'Test User',
      resetLink: 'https://example.com/reset',
      expiresIn: '30分',
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'パスワードのリセット - DiagnoLeads',
      text: expect.stringContaining('30分'),
    });
  });
});

describe('sendOrganizationInviteEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send organization invite email', async () => {
    const { sendOrganizationInviteEmail } = await import('@/lib/email/send');
    const { sendEmail } = await import('@/lib/email/client');

    await sendOrganizationInviteEmail({
      to: 'invitee@example.com',
      inviterName: 'Admin User',
      organizationName: 'Acme Corp',
      inviteLink: 'https://example.com/invite?token=xyz',
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'invitee@example.com',
      subject: 'Acme Corpへの招待 - DiagnoLeads',
      text: expect.stringContaining('Admin User'),
    });
    expect(sendEmail).toHaveBeenCalledWith({
      to: 'invitee@example.com',
      subject: 'Acme Corpへの招待 - DiagnoLeads',
      text: expect.stringContaining('https://example.com/invite?token=xyz'),
    });
  });

  it('should include default role', async () => {
    const { sendOrganizationInviteEmail } = await import('@/lib/email/send');
    const { sendEmail } = await import('@/lib/email/client');

    await sendOrganizationInviteEmail({
      to: 'invitee@example.com',
      inviterName: 'Admin',
      organizationName: 'Company',
      inviteLink: 'https://example.com/invite',
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'invitee@example.com',
      subject: expect.any(String),
      text: expect.stringContaining('メンバー'),
    });
  });

  it('should use custom role', async () => {
    const { sendOrganizationInviteEmail } = await import('@/lib/email/send');
    const { sendEmail } = await import('@/lib/email/client');

    await sendOrganizationInviteEmail({
      to: 'invitee@example.com',
      inviterName: 'Admin',
      organizationName: 'Company',
      inviteLink: 'https://example.com/invite',
      role: '管理者',
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'invitee@example.com',
      subject: expect.any(String),
      text: expect.stringContaining('管理者'),
    });
  });

  it('should include expiration time', async () => {
    const { sendOrganizationInviteEmail } = await import('@/lib/email/send');
    const { sendEmail } = await import('@/lib/email/client');

    await sendOrganizationInviteEmail({
      to: 'invitee@example.com',
      inviterName: 'Admin',
      organizationName: 'Company',
      inviteLink: 'https://example.com/invite',
      expiresIn: '14日間',
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'invitee@example.com',
      subject: expect.any(String),
      text: expect.stringContaining('14日間'),
    });
  });
});

describe('sendWelcomeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send welcome email', async () => {
    const { sendWelcomeEmail } = await import('@/lib/email/send');
    const { sendEmail } = await import('@/lib/email/client');

    await sendWelcomeEmail({
      to: 'newuser@example.com',
      userName: 'New User',
      dashboardLink: 'https://example.com/dashboard',
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'newuser@example.com',
      subject: 'DiagnoLeadsへようこそ！',
      text: expect.stringContaining('New User'),
    });
    expect(sendEmail).toHaveBeenCalledWith({
      to: 'newuser@example.com',
      subject: 'DiagnoLeadsへようこそ！',
      text: expect.stringContaining('https://example.com/dashboard'),
    });
  });

  it('should include dashboard link', async () => {
    const { sendWelcomeEmail } = await import('@/lib/email/send');
    const { sendEmail } = await import('@/lib/email/client');

    await sendWelcomeEmail({
      to: 'user@example.com',
      userName: 'User',
      dashboardLink: 'https://app.diagnoleads.com/dashboard',
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: expect.any(String),
      text: expect.stringContaining('ダッシュボード'),
    });
  });
});
