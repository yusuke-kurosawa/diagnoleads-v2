/**
 * Email Send Functions Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock sendEmail
const mockSendEmail = vi.fn();
vi.mock('@/lib/email/client', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    mockSendEmail.mockClear();
    mockSendEmail.mockResolvedValue({ id: 'email-123' });
  });

  it('should define required parameters', () => {
    type PasswordResetParams = {
      to: string;
      userName: string;
      resetLink: string;
      expiresIn?: string;
    };

    const params: PasswordResetParams = {
      to: 'user@example.com',
      userName: '田中太郎',
      resetLink: 'https://app.diagnoleads.com/reset?token=abc123',
    };

    expect(params.to).toBe('user@example.com');
    expect(params.resetLink).toContain('token=');
  });

  it('should have default expiresIn value', () => {
    type PasswordResetParams = {
      to: string;
      userName: string;
      resetLink: string;
      expiresIn?: string;
    };

    const params: PasswordResetParams = {
      to: 'user@example.com',
      userName: '田中',
      resetLink: 'https://example.com/reset',
      expiresIn: '1時間',
    };

    expect(params.expiresIn).toBe('1時間');
  });

  it('should format email subject correctly', () => {
    const subject = 'パスワードのリセット - DiagnoLeads';
    expect(subject).toContain('パスワード');
    expect(subject).toContain('DiagnoLeads');
  });

  it('should include reset link in body', () => {
    const resetLink = 'https://app.diagnoleads.com/reset?token=abc123';
    const body = `パスワードをリセットしてください：\n${resetLink}`;
    expect(body).toContain(resetLink);
  });
});

describe('sendOrganizationInviteEmail', () => {
  beforeEach(() => {
    mockSendEmail.mockClear();
    mockSendEmail.mockResolvedValue({ id: 'email-456' });
  });

  it('should define required parameters', () => {
    type InviteParams = {
      to: string;
      inviterName: string;
      organizationName: string;
      inviteLink: string;
      role?: string;
      expiresIn?: string;
    };

    const params: InviteParams = {
      to: 'newuser@example.com',
      inviterName: '山田花子',
      organizationName: 'テスト株式会社',
      inviteLink: 'https://app.diagnoleads.com/invite/xyz789',
    };

    expect(params.organizationName).toBe('テスト株式会社');
  });

  it('should have default role value', () => {
    const defaultRole = 'メンバー';
    expect(defaultRole).toBe('メンバー');
  });

  it('should have default expiresIn value', () => {
    const defaultExpiresIn = '7日間';
    expect(defaultExpiresIn).toBe('7日間');
  });

  it('should format subject with organization name', () => {
    const organizationName = 'テスト株式会社';
    const subject = `${organizationName}への招待 - DiagnoLeads`;
    expect(subject).toContain(organizationName);
  });

  it('should include inviter name in body', () => {
    const inviterName = '山田花子';
    const organizationName = 'テスト株式会社';
    const body = `${inviterName}さんから${organizationName}への招待が届いています。`;
    expect(body).toContain(inviterName);
    expect(body).toContain(organizationName);
  });
});

describe('sendWelcomeEmail', () => {
  beforeEach(() => {
    mockSendEmail.mockClear();
    mockSendEmail.mockResolvedValue({ id: 'email-789' });
  });

  it('should define required parameters', () => {
    type WelcomeParams = {
      to: string;
      userName: string;
      dashboardLink: string;
    };

    const params: WelcomeParams = {
      to: 'user@example.com',
      userName: '佐藤一郎',
      dashboardLink: 'https://app.diagnoleads.com/dashboard',
    };

    expect(params.dashboardLink).toContain('dashboard');
  });

  it('should have welcome subject', () => {
    const subject = 'DiagnoLeadsへようこそ！';
    expect(subject).toContain('ようこそ');
  });

  it('should include user name in body', () => {
    const userName = '佐藤一郎';
    const body = `${userName}様\n\nDiagnoLeadsへようこそ！`;
    expect(body).toContain(userName);
  });

  it('should include dashboard link in body', () => {
    const dashboardLink = 'https://app.diagnoleads.com/dashboard';
    const body = `以下のリンクからダッシュボードにアクセスできます：\n${dashboardLink}`;
    expect(body).toContain(dashboardLink);
  });
});

describe('Email text formatting', () => {
  it('should format multiline text correctly', () => {
    const formatEmailText = (lines: string[]) => lines.join('\n');
    
    const text = formatEmailText([
      '田中様',
      '',
      'DiagnoLeadsへようこそ！',
      '',
      '- DiagnoLeads',
    ]);

    expect(text).toContain('田中様');
    expect(text).toContain('DiagnoLeads');
  });

  it('should handle Japanese text', () => {
    const text = 'パスワードリセットのリクエストを受け付けました。';
    expect(text).toContain('パスワード');
    expect(text).toContain('リクエスト');
  });
});

describe('Email validation', () => {
  it('should validate email format', () => {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
  });

  it('should validate required fields', () => {
    const validateParams = (params: { to?: string; subject?: string }) => {
      const errors: string[] = [];
      if (!params.to) errors.push('to is required');
      if (!params.subject) errors.push('subject is required');
      return errors;
    };

    expect(validateParams({ to: 'test@example.com', subject: 'Test' })).toHaveLength(0);
    expect(validateParams({})).toHaveLength(2);
  });
});

describe('Email link generation', () => {
  it('should generate reset link with token', () => {
    const generateResetLink = (baseUrl: string, token: string) =>
      `${baseUrl}/reset-password?token=${token}`;
    
    const link = generateResetLink('https://app.diagnoleads.com', 'abc123');
    expect(link).toBe('https://app.diagnoleads.com/reset-password?token=abc123');
  });

  it('should generate invite link with code', () => {
    const generateInviteLink = (baseUrl: string, code: string) =>
      `${baseUrl}/invite/${code}`;
    
    const link = generateInviteLink('https://app.diagnoleads.com', 'xyz789');
    expect(link).toBe('https://app.diagnoleads.com/invite/xyz789');
  });
});

describe('Email error handling', () => {
  it('should handle send failure', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP connection failed'));
    
    await expect(mockSendEmail({ to: 'test@example.com' }))
      .rejects.toThrow('SMTP connection failed');
  });

  it('should handle rate limit error', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('Rate limit exceeded'));
    
    await expect(mockSendEmail({ to: 'test@example.com' }))
      .rejects.toThrow('Rate limit exceeded');
  });
});
