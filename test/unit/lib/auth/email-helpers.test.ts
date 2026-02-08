/**
 * Auth Email Helpers Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the email client
vi.mock('@/lib/email/client', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock env
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'https://app.diagnoleads.com',
  },
}));

import {
  detectLocaleFromHeaders,
  generateInvitationEmail,
  generatePasswordResetEmail,
  generateVerificationEmail,
  sendAuthEmail,
} from '@/lib/auth/email-helpers';

describe('detectLocaleFromHeaders', () => {
  it('should return ja when headers is null', () => {
    expect(detectLocaleFromHeaders(null)).toBe('ja');
  });

  it('should return ja when headers is undefined', () => {
    expect(detectLocaleFromHeaders(undefined)).toBe('ja');
  });

  it('should return ja when accept-language is not set', () => {
    const headers = new Headers();
    expect(detectLocaleFromHeaders(headers)).toBe('ja');
  });

  it('should return en when accept-language starts with en', () => {
    const headers = new Headers();
    headers.set('accept-language', 'en-US,en;q=0.9');
    expect(detectLocaleFromHeaders(headers)).toBe('en');
  });

  it('should return ja when accept-language does not start with en', () => {
    const headers = new Headers();
    headers.set('accept-language', 'ja-JP,ja;q=0.9');
    expect(detectLocaleFromHeaders(headers)).toBe('ja');
  });

  it('should return ja when accept-language is fr', () => {
    const headers = new Headers();
    headers.set('accept-language', 'fr-FR,fr;q=0.9');
    expect(detectLocaleFromHeaders(headers)).toBe('ja');
  });
});

describe('generatePasswordResetEmail', () => {
  const mockUser = { name: 'John Doe', email: 'john@example.com' };
  const mockUrl = 'https://app.diagnoleads.com/reset-password/token123';

  describe('Japanese locale', () => {
    it('should generate Japanese password reset email', () => {
      const { subject, text } = generatePasswordResetEmail(mockUser, mockUrl, 'ja');

      expect(subject).toBe('パスワードリセット - DiagnoLeads');
      expect(text).toContain('John Doe様');
      expect(text).toContain('パスワードリセットのリクエストを受け付けました');
      expect(text).toContain(mockUrl);
      expect(text).toContain('1時間で期限切れ');
    });

    it('should use default name when user name is null', () => {
      const { text } = generatePasswordResetEmail(
        { name: null, email: 'john@example.com' },
        mockUrl,
        'ja'
      );

      expect(text).toContain('ユーザー様');
    });

    it('should use default name when user name is undefined', () => {
      const { text } = generatePasswordResetEmail(
        { email: 'john@example.com' },
        mockUrl,
        'ja'
      );

      expect(text).toContain('ユーザー様');
    });
  });

  describe('English locale', () => {
    it('should generate English password reset email', () => {
      const { subject, text } = generatePasswordResetEmail(mockUser, mockUrl, 'en');

      expect(subject).toBe('Password Reset - DiagnoLeads');
      expect(text).toContain('Hi John Doe');
      expect(text).toContain('We received a request to reset your password');
      expect(text).toContain(mockUrl);
      expect(text).toContain('expire in 1 hour');
    });

    it('should use default name when user name is null', () => {
      const { text } = generatePasswordResetEmail(
        { name: null, email: 'john@example.com' },
        mockUrl,
        'en'
      );

      expect(text).toContain('Hi User');
    });
  });
});

describe('generateVerificationEmail', () => {
  const mockUser = { name: 'Jane Doe', email: 'jane@example.com' };
  const mockUrl = 'https://app.diagnoleads.com/verify/token456';

  describe('Japanese locale', () => {
    it('should generate Japanese verification email', () => {
      const { subject, text } = generateVerificationEmail(mockUser, mockUrl, 'ja');

      expect(subject).toBe('メールアドレスの確認 - DiagnoLeads');
      expect(text).toContain('Jane Doe様');
      expect(text).toContain('DiagnoLeadsへのご登録ありがとうございます');
      expect(text).toContain(mockUrl);
    });

    it('should use default name when user name is null', () => {
      const { text } = generateVerificationEmail(
        { name: null, email: 'jane@example.com' },
        mockUrl,
        'ja'
      );

      expect(text).toContain('ユーザー様');
    });
  });

  describe('English locale', () => {
    it('should generate English verification email', () => {
      const { subject, text } = generateVerificationEmail(mockUser, mockUrl, 'en');

      expect(subject).toBe('Verify Your Email - DiagnoLeads');
      expect(text).toContain('Hi Jane Doe');
      expect(text).toContain('Thank you for registering with DiagnoLeads');
      expect(text).toContain(mockUrl);
    });

    it('should use default name when user name is null', () => {
      const { text } = generateVerificationEmail(
        { name: null, email: 'jane@example.com' },
        mockUrl,
        'en'
      );

      expect(text).toContain('Hi User');
    });
  });
});

describe('generateInvitationEmail', () => {
  it('should generate invitation email with correct content', () => {
    const { subject, text } = generateInvitationEmail(
      'John Doe',
      'Acme Inc',
      'admin',
      'invite-123'
    );

    expect(subject).toBe('Acme Incへの招待 - DiagnoLeads');
    expect(text).toContain('John Doeさんから');
    expect(text).toContain('Acme Incへの招待');
    expect(text).toContain('ロール: admin');
    expect(text).toContain('https://app.diagnoleads.com/invite/invite-123');
    expect(text).toContain('7日間で期限切れ');
  });

  it('should work with different roles', () => {
    const { text: adminText } = generateInvitationEmail('Alice', 'Corp', 'admin', 'inv-1');
    const { text: memberText } = generateInvitationEmail('Bob', 'Corp', 'member', 'inv-2');
    const { text: ownerText } = generateInvitationEmail('Carol', 'Corp', 'owner', 'inv-3');

    expect(adminText).toContain('ロール: admin');
    expect(memberText).toContain('ロール: member');
    expect(ownerText).toContain('ロール: owner');
  });

  it('should handle special characters in organization name', () => {
    const { subject, text } = generateInvitationEmail(
      'Test User',
      'Org & Co.',
      'member',
      'inv-special'
    );

    expect(subject).toContain('Org & Co.');
    expect(text).toContain('Org & Co.');
  });
});

describe('sendAuthEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call sendEmail with correct parameters', async () => {
    const { sendEmail } = await import('@/lib/email/client');

    await sendAuthEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test message body',
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test message body',
    });
  });

  it('should not throw when sendEmail fails', async () => {
    const { sendEmail } = await import('@/lib/email/client');
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('SMTP error'));

    // Should not throw
    await expect(
      sendAuthEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      })
    ).resolves.toBeUndefined();
  });

  it('should log error when sendEmail fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { sendEmail } = await import('@/lib/email/client');
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('Network error'));

    await sendAuthEmail({
      to: 'test@example.com',
      subject: 'Test',
      text: 'Test',
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to send auth email:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
});
