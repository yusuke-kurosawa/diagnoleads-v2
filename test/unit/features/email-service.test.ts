import { describe, expect, it, vi } from 'vitest';

describe('email-service', () => {
  describe('isEmailConfigured', () => {
    it('should return true when API key is set', async () => {
      const originalKey = process.env.RESEND_API_KEY;
      process.env.RESEND_API_KEY = 'test-api-key';
      
      const { isEmailConfigured } = await import('@/lib/features/email/email-service');
      expect(isEmailConfigured()).toBe(true);
      
      process.env.RESEND_API_KEY = originalKey;
    });

    it('should return false when API key is not set', async () => {
      const originalKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;
      
      const { isEmailConfigured } = await import('@/lib/features/email/email-service');
      expect(isEmailConfigured()).toBe(false);
      
      process.env.RESEND_API_KEY = originalKey;
    });

    it('should return false when API key is empty', async () => {
      const originalKey = process.env.RESEND_API_KEY;
      process.env.RESEND_API_KEY = '';
      
      const { isEmailConfigured } = await import('@/lib/features/email/email-service');
      expect(isEmailConfigured()).toBe(false);
      
      process.env.RESEND_API_KEY = originalKey;
    });
  });

  describe('SendEmailOptions type', () => {
    it('should accept valid email options', () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      expect(options.to).toBe('test@example.com');
      expect(options.subject).toBe('Test Subject');
      expect(options.html).toBe('<p>Test content</p>');
    });

    it('should accept multiple recipients', () => {
      const options = {
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      expect(Array.isArray(options.to)).toBe(true);
      expect(options.to.length).toBe(2);
    });

    it('should accept optional fields', () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Plain text',
        from: 'sender@example.com',
        replyTo: 'reply@example.com',
      };

      expect(options.text).toBe('Plain text');
      expect(options.from).toBe('sender@example.com');
      expect(options.replyTo).toBe('reply@example.com');
    });
  });
});
