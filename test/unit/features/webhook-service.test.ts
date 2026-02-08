import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock database
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'delivery-1' }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

import { db } from '@/lib/db/client';
import {
  cleanupOldDeliveries,
  generateWebhookSecret,
  generateWebhookSignature,
  processWebhookRetries,
  triggerWebhooks,
  verifyWebhookSignature,
} from '@/lib/features/webhooks/services/webhook-service';

describe('webhook-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-08T12:00:00Z'));
  });

  describe('generateWebhookSignature', () => {
    it('should generate signature with timestamp', () => {
      const payload = '{"test": "data"}';
      const secret = 'whsec_test_secret';

      const signature = generateWebhookSignature(payload, secret);

      expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]+$/);
    });

    it('should generate different signatures for different payloads', () => {
      const secret = 'whsec_test_secret';
      const sig1 = generateWebhookSignature('payload1', secret);
      const sig2 = generateWebhookSignature('payload2', secret);

      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different secrets', () => {
      const payload = '{"test": "data"}';
      const sig1 = generateWebhookSignature(payload, 'secret1');
      const sig2 = generateWebhookSignature(payload, 'secret2');

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      const payload = '{"test": "data"}';
      const secret = 'whsec_test_secret';
      const signature = generateWebhookSignature(payload, secret);

      const isValid = verifyWebhookSignature(payload, signature, secret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = '{"test": "data"}';
      const isValid = verifyWebhookSignature(payload, 't=123,v1=invalid', 'secret');

      expect(isValid).toBe(false);
    });

    it('should reject expired signature', () => {
      const payload = '{"test": "data"}';
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
      const signature = `t=${oldTimestamp},v1=somesignature`;

      const isValid = verifyWebhookSignature(payload, signature, 'secret', 300);

      expect(isValid).toBe(false);
    });

    it('should reject malformed signature', () => {
      const payload = '{"test": "data"}';

      expect(verifyWebhookSignature(payload, 'invalid', 'secret')).toBe(false);
      expect(verifyWebhookSignature(payload, 't=123', 'secret')).toBe(false);
      expect(verifyWebhookSignature(payload, 'v1=abc', 'secret')).toBe(false);
    });

    it('should handle custom tolerance', () => {
      const payload = '{"test": "data"}';
      const secret = 'whsec_test_secret';
      const signature = generateWebhookSignature(payload, secret);

      // Should be valid within 5 minutes
      expect(verifyWebhookSignature(payload, signature, secret, 300)).toBe(true);
    });
  });

  describe('generateWebhookSecret', () => {
    it('should generate secret with correct prefix', () => {
      const secret = generateWebhookSecret();
      expect(secret).toMatch(/^whsec_[a-f0-9]{64}$/);
    });

    it('should generate unique secrets', () => {
      const secret1 = generateWebhookSecret();
      const secret2 = generateWebhookSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('triggerWebhooks', () => {
    it('should return zeros when no webhooks found', async () => {
      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await triggerWebhooks('org-1', 'lead.created', { leadId: 'lead-1' });

      expect(result).toEqual({ triggered: 0, failed: 0 });
    });

    it('should trigger webhooks for subscribed events', async () => {
      const mockWebhook = {
        id: 'webhook-1',
        organizationId: 'org-1',
        url: 'https://example.com/webhook',
        secret: 'whsec_test',
        events: ['lead.created'],
        status: 'active',
        headers: {},
        retryConfig: { maxRetries: 3, retryDelayMs: 5000 },
        failureCount: 0,
      };

      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([mockWebhook]);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: vi.fn().mockResolvedValue('{"success": true}'),
      });

      const result = await triggerWebhooks('org-1', 'lead.created', { leadId: 'lead-1' });

      expect(result.triggered).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should not trigger webhooks for unsubscribed events', async () => {
      const mockWebhook = {
        id: 'webhook-1',
        events: ['lead.updated'], // Not subscribed to lead.created
        status: 'active',
      };

      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([mockWebhook]);

      const result = await triggerWebhooks('org-1', 'lead.created', { leadId: 'lead-1' });

      expect(result.triggered).toBe(0);
    });

    it('should handle delivery failure', async () => {
      const mockWebhook = {
        id: 'webhook-1',
        url: 'https://example.com/webhook',
        secret: 'whsec_test',
        events: ['lead.created'],
        status: 'active',
        headers: {},
        retryConfig: { maxRetries: 3, retryDelayMs: 5000 },
        failureCount: 0,
      };

      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([mockWebhook]);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockResolvedValue('Error'),
      });

      const result = await triggerWebhooks('org-1', 'lead.created', { leadId: 'lead-1' });

      expect(result.failed).toBe(1);
    });

    it('should handle network errors', async () => {
      const mockWebhook = {
        id: 'webhook-1',
        url: 'https://example.com/webhook',
        secret: 'whsec_test',
        events: ['lead.created'],
        status: 'active',
        headers: {},
        retryConfig: { maxRetries: 3, retryDelayMs: 5000 },
        failureCount: 0,
      };

      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([mockWebhook]);
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      const result = await triggerWebhooks('org-1', 'lead.created', { leadId: 'lead-1' });

      expect(result.failed).toBe(1);
    });
  });

  describe('processWebhookRetries', () => {
    it('should be a function', () => {
      expect(typeof processWebhookRetries).toBe('function');
    });
  });

  describe('cleanupOldDeliveries', () => {
    it('should delete old deliveries', async () => {
      (db.delete as ReturnType<typeof vi.fn>).mockReturnThis();
      (db.where as ReturnType<typeof vi.fn>).mockReturnThis();
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'old-1' }, { id: 'old-2' }]);

      const count = await cleanupOldDeliveries(30);

      expect(count).toBe(2);
    });

    it('should return 0 when no old deliveries', async () => {
      (db.delete as ReturnType<typeof vi.fn>).mockReturnThis();
      (db.where as ReturnType<typeof vi.fn>).mockReturnThis();
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const count = await cleanupOldDeliveries(30);

      expect(count).toBe(0);
    });

    it('should use custom days to keep', async () => {
      (db.delete as ReturnType<typeof vi.fn>).mockReturnThis();
      (db.where as ReturnType<typeof vi.fn>).mockReturnThis();
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await cleanupOldDeliveries(7);

      expect(db.delete).toHaveBeenCalled();
    });
  });
});
