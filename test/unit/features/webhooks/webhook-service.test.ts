/**
 * Webhook Service Tests
 *
 * Tests for webhook signature generation, verification, and secret generation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';

// Mock the database module
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  webhooks: {},
  webhookDeliveries: {},
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn(),
  eq: vi.fn(),
  inArray: vi.fn(),
  lte: vi.fn(),
}));

import {
  generateWebhookSignature,
  verifyWebhookSignature,
  generateWebhookSecret,
} from '@/lib/features/webhooks/services/webhook-service';

describe('generateWebhookSignature', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate a valid signature format', () => {
    const payload = JSON.stringify({ event: 'lead.created', data: { id: '123' } });
    const secret = 'whsec_test_secret_12345';

    const signature = generateWebhookSignature(payload, secret);

    expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
  });

  it('should include timestamp in signature', () => {
    const payload = '{"test": true}';
    const secret = 'test_secret';

    const signature = generateWebhookSignature(payload, secret);
    const timestamp = Math.floor(new Date('2024-01-15T12:00:00.000Z').getTime() / 1000);

    expect(signature).toContain(`t=${timestamp}`);
  });

  it('should generate consistent signatures for same payload and secret', () => {
    const payload = '{"data": "test"}';
    const secret = 'consistent_secret';

    const sig1 = generateWebhookSignature(payload, secret);
    const sig2 = generateWebhookSignature(payload, secret);

    expect(sig1).toBe(sig2);
  });

  it('should generate different signatures for different payloads', () => {
    const secret = 'same_secret';

    const sig1 = generateWebhookSignature('payload1', secret);
    const sig2 = generateWebhookSignature('payload2', secret);

    expect(sig1).not.toBe(sig2);
  });

  it('should generate different signatures for different secrets', () => {
    const payload = 'same_payload';

    const sig1 = generateWebhookSignature(payload, 'secret1');
    const sig2 = generateWebhookSignature(payload, 'secret2');

    expect(sig1).not.toBe(sig2);
  });

  it('should handle empty payload', () => {
    const signature = generateWebhookSignature('', 'secret');

    expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
  });

  it('should handle unicode payload', () => {
    const payload = JSON.stringify({ name: '田中太郎', message: 'こんにちは' });
    const secret = 'unicode_secret';

    const signature = generateWebhookSignature(payload, secret);

    expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
  });

  it('should generate HMAC-SHA256 signature', () => {
    const payload = 'test_payload';
    const secret = 'test_secret';
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = generateWebhookSignature(payload, secret);

    // Manually compute expected signature
    const signaturePayload = `${timestamp}.${payload}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(signaturePayload).digest('hex');

    expect(signature).toContain(`v1=${expectedSig}`);
  });
});

describe('verifyWebhookSignature', () => {
  const secret = 'whsec_verification_secret';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should verify valid signature', () => {
    const payload = '{"event": "test"}';
    const signature = generateWebhookSignature(payload, secret);

    const isValid = verifyWebhookSignature(payload, signature, secret);

    expect(isValid).toBe(true);
  });

  it('should reject signature with wrong secret', () => {
    const payload = '{"event": "test"}';
    const signature = generateWebhookSignature(payload, secret);

    const isValid = verifyWebhookSignature(payload, signature, 'wrong_secret');

    expect(isValid).toBe(false);
  });

  it('should reject signature with modified payload', () => {
    const originalPayload = '{"event": "test"}';
    const modifiedPayload = '{"event": "modified"}';
    const signature = generateWebhookSignature(originalPayload, secret);

    const isValid = verifyWebhookSignature(modifiedPayload, signature, secret);

    expect(isValid).toBe(false);
  });

  it('should reject malformed signature (missing timestamp)', () => {
    const payload = '{"event": "test"}';
    const malformedSignature = 'v1=abc123';

    const isValid = verifyWebhookSignature(payload, malformedSignature, secret);

    expect(isValid).toBe(false);
  });

  it('should reject malformed signature (missing v1)', () => {
    const payload = '{"event": "test"}';
    const malformedSignature = 't=1234567890';

    const isValid = verifyWebhookSignature(payload, malformedSignature, secret);

    expect(isValid).toBe(false);
  });

  it('should reject empty signature', () => {
    const payload = '{"event": "test"}';

    const isValid = verifyWebhookSignature(payload, '', secret);

    expect(isValid).toBe(false);
  });

  it('should reject expired signature (outside tolerance)', () => {
    const payload = '{"event": "test"}';
    // Generate signature at current time
    const signature = generateWebhookSignature(payload, secret);

    // Advance time beyond tolerance (default 300 seconds)
    vi.advanceTimersByTime(301 * 1000);

    const isValid = verifyWebhookSignature(payload, signature, secret);

    expect(isValid).toBe(false);
  });

  it('should accept signature within tolerance', () => {
    const payload = '{"event": "test"}';
    const signature = generateWebhookSignature(payload, secret);

    // Advance time within tolerance
    vi.advanceTimersByTime(100 * 1000);

    const isValid = verifyWebhookSignature(payload, signature, secret);

    expect(isValid).toBe(true);
  });

  it('should respect custom tolerance', () => {
    const payload = '{"event": "test"}';
    const signature = generateWebhookSignature(payload, secret);

    // Advance time to 60 seconds
    vi.advanceTimersByTime(60 * 1000);

    // Should fail with 30 second tolerance
    const isValidShort = verifyWebhookSignature(payload, signature, secret, 30);
    expect(isValidShort).toBe(false);

    // Should pass with 120 second tolerance
    const isValidLong = verifyWebhookSignature(payload, signature, secret, 120);
    expect(isValidLong).toBe(true);
  });

  it('should handle signature verification error gracefully', () => {
    const payload = '{"event": "test"}';
    const invalidSignature = 't=abc,v1=def'; // Invalid timestamp format

    const isValid = verifyWebhookSignature(payload, invalidSignature, secret);

    expect(isValid).toBe(false);
  });

  it('should verify unicode payload', () => {
    const payload = JSON.stringify({ name: '山田花子' });
    const signature = generateWebhookSignature(payload, secret);

    const isValid = verifyWebhookSignature(payload, signature, secret);

    expect(isValid).toBe(true);
  });
});

describe('generateWebhookSecret', () => {
  it('should generate secret with correct prefix', () => {
    const secret = generateWebhookSecret();

    expect(secret).toMatch(/^whsec_/);
  });

  it('should generate secret with correct length', () => {
    const secret = generateWebhookSecret();

    // whsec_ (6) + 64 hex chars = 70 total
    expect(secret).toHaveLength(70);
  });

  it('should generate unique secrets', () => {
    const secrets = new Set<string>();

    for (let i = 0; i < 100; i++) {
      secrets.add(generateWebhookSecret());
    }

    // All 100 secrets should be unique
    expect(secrets.size).toBe(100);
  });

  it('should generate hex characters only after prefix', () => {
    const secret = generateWebhookSecret();
    const hexPart = secret.slice(6);

    expect(hexPart).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should be cryptographically random', () => {
    const secret1 = generateWebhookSecret();
    const secret2 = generateWebhookSecret();

    expect(secret1).not.toBe(secret2);
  });
});

describe('Webhook signature integration', () => {
  it('should round-trip: generate then verify', () => {
    const payload = JSON.stringify({
      event: 'lead.created',
      data: {
        id: 'lead-123',
        name: 'Test Lead',
        email: 'test@example.com',
      },
    });
    const secret = generateWebhookSecret();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));

    const signature = generateWebhookSignature(payload, secret);
    const isValid = verifyWebhookSignature(payload, signature, secret);

    vi.useRealTimers();

    expect(isValid).toBe(true);
  });

  it('should work with complex nested payload', () => {
    const payload = JSON.stringify({
      event: 'lead.updated',
      timestamp: '2024-01-15T12:00:00.000Z',
      data: {
        lead: {
          id: 'lead-456',
          customFields: {
            field1: 'value1',
            field2: ['a', 'b', 'c'],
            field3: { nested: true },
          },
          score: 85.5,
          tags: ['hot', 'enterprise'],
        },
        changes: {
          before: { status: 'new' },
          after: { status: 'qualified' },
        },
      },
    });
    const secret = generateWebhookSecret();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));

    const signature = generateWebhookSignature(payload, secret);
    const isValid = verifyWebhookSignature(payload, signature, secret);

    vi.useRealTimers();

    expect(isValid).toBe(true);
  });
});
