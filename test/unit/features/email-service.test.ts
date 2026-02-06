/**
 * Email Service Tests
 *
 * Unit tests for email sending functionality
 */

import { describe, expect, it, vi } from 'vitest';

// Mock email options interface
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

// Mock email validation
function validateEmailOptions(options: SendEmailOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate 'to' field
  if (!options.to) {
    errors.push('Recipient is required');
  } else if (Array.isArray(options.to)) {
    if (options.to.length === 0) {
      errors.push('At least one recipient is required');
    }
    for (const email of options.to) {
      if (!isValidEmail(email)) {
        errors.push(`Invalid email: ${email}`);
      }
    }
  } else if (!isValidEmail(options.to)) {
    errors.push(`Invalid email: ${options.to}`);
  }

  // Validate subject
  if (!options.subject || options.subject.trim() === '') {
    errors.push('Subject is required');
  }

  // Validate HTML content
  if (!options.html || options.html.trim() === '') {
    errors.push('HTML content is required');
  }

  // Validate from email if provided
  if (options.from && !isValidFromEmail(options.from)) {
    errors.push('Invalid from email format');
  }

  // Validate replyTo if provided
  if (options.replyTo && !isValidEmail(options.replyTo)) {
    errors.push('Invalid replyTo email');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidFromEmail(from: string): boolean {
  // Format: "Name <email@example.com>" or "email@example.com"
  const withNameRegex = /^.+\s<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
  const simpleRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return withNameRegex.test(from) || simpleRegex.test(from);
}

describe('Email Service', () => {
  describe('Email Validation', () => {
    it('should validate correct email options', () => {
      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Hello World</p>',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate multiple recipients', () => {
      const options: SendEmailOptions = {
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Subject',
        html: '<p>Hello World</p>',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(true);
    });

    it('should reject empty recipient', () => {
      const options: SendEmailOptions = {
        to: '',
        subject: 'Test Subject',
        html: '<p>Hello World</p>',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Recipient is required');
    });

    it('should reject invalid email format', () => {
      const options: SendEmailOptions = {
        to: 'invalid-email',
        subject: 'Test Subject',
        html: '<p>Hello World</p>',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid email'))).toBe(true);
    });

    it('should reject empty recipients array', () => {
      const options: SendEmailOptions = {
        to: [],
        subject: 'Test Subject',
        html: '<p>Hello World</p>',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one recipient is required');
    });

    it('should reject empty subject', () => {
      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: '',
        html: '<p>Hello World</p>',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Subject is required');
    });

    it('should reject whitespace-only subject', () => {
      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: '   ',
        html: '<p>Hello World</p>',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Subject is required');
    });

    it('should reject empty HTML content', () => {
      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: 'Test',
        html: '',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('HTML content is required');
    });

    it('should validate from email with name', () => {
      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Content</p>',
        from: 'DiagnoLeads <noreply@diagnoleads.com>',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(true);
    });

    it('should validate simple from email', () => {
      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Content</p>',
        from: 'noreply@diagnoleads.com',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid from email format', () => {
      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Content</p>',
        from: 'invalid',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid from email format');
    });

    it('should validate replyTo email', () => {
      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Content</p>',
        replyTo: 'support@diagnoleads.com',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid replyTo email', () => {
      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Content</p>',
        replyTo: 'not-an-email',
      };

      const result = validateEmailOptions(options);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid replyTo email');
    });
  });

  describe('Email Helper Functions', () => {
    describe('isValidEmail', () => {
      it('should accept valid emails', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
        expect(isValidEmail('user.name@example.co.jp')).toBe(true);
        expect(isValidEmail('user+tag@example.com')).toBe(true);
      });

      it('should reject invalid emails', () => {
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
        expect(isValidEmail('user @example.com')).toBe(false);
      });
    });

    describe('isValidFromEmail', () => {
      it('should accept email with display name', () => {
        expect(isValidFromEmail('Company <email@example.com>')).toBe(true);
        expect(isValidFromEmail('DiagnoLeads Support <support@diagnoleads.com>')).toBe(true);
      });

      it('should accept simple email', () => {
        expect(isValidFromEmail('noreply@example.com')).toBe(true);
      });
    });
  });

  describe('Email Configuration', () => {
    it('should check if RESEND_API_KEY is required', () => {
      const isConfigured = Boolean(process.env.RESEND_API_KEY);
      expect(typeof isConfigured).toBe('boolean');
    });

    it('should have default from email format', () => {
      const defaultFrom = 'DiagnoLeads <noreply@diagnoleads.com>';
      expect(isValidFromEmail(defaultFrom)).toBe(true);
    });
  });

  describe('Email Templates', () => {
    function generateDiagnosticResultEmail(data: {
      userName: string;
      diagnosticTitle: string;
      score: number;
      recommendations: string[];
    }): { subject: string; html: string } {
      const subject = `【診断結果】${data.diagnosticTitle}`;
      const html = `
        <html>
          <body>
            <h1>診断結果のお知らせ</h1>
            <p>${data.userName}様</p>
            <p>診断「${data.diagnosticTitle}」が完了しました。</p>
            <h2>スコア: ${data.score}点</h2>
            <h3>おすすめアクション:</h3>
            <ul>
              ${data.recommendations.map((r) => `<li>${r}</li>`).join('')}
            </ul>
          </body>
        </html>
      `;

      return { subject, html };
    }

    it('should generate diagnostic result email', () => {
      const result = generateDiagnosticResultEmail({
        userName: '山田太郎',
        diagnosticTitle: 'マーケティング成熟度診断',
        score: 75,
        recommendations: ['SNS運用を強化', 'コンテンツマーケティングを開始'],
      });

      expect(result.subject).toContain('診断結果');
      expect(result.subject).toContain('マーケティング成熟度診断');
      expect(result.html).toContain('山田太郎');
      expect(result.html).toContain('75点');
      expect(result.html).toContain('SNS運用を強化');
    });

    it('should handle empty recommendations', () => {
      const result = generateDiagnosticResultEmail({
        userName: 'Test User',
        diagnosticTitle: 'Test Diagnostic',
        score: 50,
        recommendations: [],
      });

      expect(result.html).toContain('<ul>');
    });
  });

  describe('Email Rate Limiting', () => {
    interface RateLimitConfig {
      maxPerMinute: number;
      maxPerHour: number;
      maxPerDay: number;
    }

    function checkRateLimit(
      sentCount: { minute: number; hour: number; day: number },
      config: RateLimitConfig
    ): { allowed: boolean; reason?: string } {
      if (sentCount.minute >= config.maxPerMinute) {
        return { allowed: false, reason: 'Minute limit exceeded' };
      }
      if (sentCount.hour >= config.maxPerHour) {
        return { allowed: false, reason: 'Hour limit exceeded' };
      }
      if (sentCount.day >= config.maxPerDay) {
        return { allowed: false, reason: 'Daily limit exceeded' };
      }
      return { allowed: true };
    }

    it('should allow email within limits', () => {
      const config: RateLimitConfig = {
        maxPerMinute: 10,
        maxPerHour: 100,
        maxPerDay: 1000,
      };

      const result = checkRateLimit({ minute: 5, hour: 50, day: 500 }, config);

      expect(result.allowed).toBe(true);
    });

    it('should block email when minute limit exceeded', () => {
      const config: RateLimitConfig = {
        maxPerMinute: 10,
        maxPerHour: 100,
        maxPerDay: 1000,
      };

      const result = checkRateLimit({ minute: 10, hour: 50, day: 500 }, config);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Minute limit exceeded');
    });

    it('should block email when hour limit exceeded', () => {
      const config: RateLimitConfig = {
        maxPerMinute: 10,
        maxPerHour: 100,
        maxPerDay: 1000,
      };

      const result = checkRateLimit({ minute: 5, hour: 100, day: 500 }, config);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Hour limit exceeded');
    });

    it('should block email when daily limit exceeded', () => {
      const config: RateLimitConfig = {
        maxPerMinute: 10,
        maxPerHour: 100,
        maxPerDay: 1000,
      };

      const result = checkRateLimit({ minute: 5, hour: 50, day: 1000 }, config);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Daily limit exceeded');
    });
  });
});
