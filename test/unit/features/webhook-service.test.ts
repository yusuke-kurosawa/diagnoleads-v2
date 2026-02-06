/**
 * Webhook Service Tests
 *
 * Unit tests for webhook signature and utility functions
 */

import { describe, expect, it } from 'vitest';
import {
  generateWebhookSignature,
  verifyWebhookSignature,
  generateWebhookSecret,
} from '@/lib/features/webhooks/services/webhook-service';

describe('generateWebhookSecret', () => {
  it('should generate secret with correct prefix', () => {
    const secret = generateWebhookSecret();
    expect(secret.startsWith('whsec_')).toBe(true);
  });

  it('should generate 64 character hex after prefix', () => {
    const secret = generateWebhookSecret();
    const hexPart = secret.replace('whsec_', '');
    expect(hexPart.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(hexPart)).toBe(true);
  });

  it('should generate unique secrets', () => {
    const secrets = new Set<string>();
    for (let i = 0; i < 100; i++) {
      secrets.add(generateWebhookSecret());
    }
    expect(secrets.size).toBe(100);
  });
});

describe('generateWebhookSignature', () => {
  it('should generate signature with timestamp and version', () => {
    const payload = JSON.stringify({ event: 'test', data: {} });
    const secret = 'test-secret';
    const signature = generateWebhookSignature(payload, secret);

    expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
  });

  it('should include timestamp', () => {
    const before = Math.floor(Date.now() / 1000);
    const signature = generateWebhookSignature('{}', 'secret');
    const after = Math.floor(Date.now() / 1000);

    const timestampMatch = signature.match(/t=(\d+)/);
    expect(timestampMatch).not.toBeNull();

    const timestamp = parseInt(timestampMatch![1], 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('should generate consistent signatures for same inputs within same second', () => {
    const payload = '{"test": true}';
    const secret = 'consistent-secret';

    // Due to timestamp, signatures may differ if called across seconds
    // But the signature algorithm should be consistent
    const sig1 = generateWebhookSignature(payload, secret);
    const sig2 = generateWebhookSignature(payload, secret);

    // Extract just the hash part for comparison
    const hash1 = sig1.split(',')[1];
    const hash2 = sig2.split(',')[1];

    // If timestamps match, hashes should match
    const ts1 = sig1.split(',')[0];
    const ts2 = sig2.split(',')[0];

    if (ts1 === ts2) {
      expect(hash1).toBe(hash2);
    }
  });

  it('should generate different signatures for different payloads', () => {
    const secret = 'test-secret';
    const sig1 = generateWebhookSignature('{"a": 1}', secret);
    const sig2 = generateWebhookSignature('{"a": 2}', secret);

    // Hashes should differ even if timestamps match
    const hash1 = sig1.split(',')[1];
    const hash2 = sig2.split(',')[1];
    expect(hash1).not.toBe(hash2);
  });

  it('should generate different signatures for different secrets', () => {
    const payload = '{"test": true}';
    const sig1 = generateWebhookSignature(payload, 'secret1');
    const sig2 = generateWebhookSignature(payload, 'secret2');

    const hash1 = sig1.split(',')[1];
    const hash2 = sig2.split(',')[1];
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyWebhookSignature', () => {
  it('should verify valid signature', () => {
    const payload = '{"event": "lead.created"}';
    const secret = 'whsec_test123';
    const signature = generateWebhookSignature(payload, secret);

    const isValid = verifyWebhookSignature(payload, signature, secret);
    expect(isValid).toBe(true);
  });

  it('should reject signature with wrong secret', () => {
    const payload = '{"event": "lead.created"}';
    const signature = generateWebhookSignature(payload, 'correct-secret');

    const isValid = verifyWebhookSignature(payload, signature, 'wrong-secret');
    expect(isValid).toBe(false);
  });

  it('should reject signature with modified payload', () => {
    const originalPayload = '{"event": "lead.created"}';
    const modifiedPayload = '{"event": "lead.updated"}';
    const secret = 'test-secret';
    const signature = generateWebhookSignature(originalPayload, secret);

    const isValid = verifyWebhookSignature(modifiedPayload, signature, secret);
    expect(isValid).toBe(false);
  });

  it('should reject invalid signature format', () => {
    expect(verifyWebhookSignature('{}', 'invalid', 'secret')).toBe(false);
    expect(verifyWebhookSignature('{}', 't=123', 'secret')).toBe(false);
    expect(verifyWebhookSignature('{}', 'v1=abc', 'secret')).toBe(false);
    expect(verifyWebhookSignature('{}', '', 'secret')).toBe(false);
  });

  it('should reject expired signature by default (5 minutes)', () => {
    const payload = '{}';
    const secret = 'test-secret';

    // Create a signature with old timestamp (6 minutes ago)
    const oldTimestamp = Math.floor(Date.now() / 1000) - 360;
    const signaturePayload = `${oldTimestamp}.${payload}`;
    const crypto = require('node:crypto');
    const hash = crypto.createHmac('sha256', secret).update(signaturePayload).digest('hex');
    const oldSignature = `t=${oldTimestamp},v1=${hash}`;

    const isValid = verifyWebhookSignature(payload, oldSignature, secret);
    expect(isValid).toBe(false);
  });

  it('should accept signature within custom tolerance', () => {
    const payload = '{}';
    const secret = 'test-secret';

    // Create a signature with timestamp 2 minutes ago
    const recentTimestamp = Math.floor(Date.now() / 1000) - 120;
    const signaturePayload = `${recentTimestamp}.${payload}`;
    const crypto = require('node:crypto');
    const hash = crypto.createHmac('sha256', secret).update(signaturePayload).digest('hex');
    const signature = `t=${recentTimestamp},v1=${hash}`;

    // Should be valid with 5 minute tolerance (default)
    const isValid = verifyWebhookSignature(payload, signature, secret, 300);
    expect(isValid).toBe(true);
  });

  it('should reject future timestamps beyond tolerance', () => {
    const payload = '{}';
    const secret = 'test-secret';

    // Create a signature with future timestamp (10 minutes ahead)
    const futureTimestamp = Math.floor(Date.now() / 1000) + 600;
    const signaturePayload = `${futureTimestamp}.${payload}`;
    const crypto = require('node:crypto');
    const hash = crypto.createHmac('sha256', secret).update(signaturePayload).digest('hex');
    const futureSignature = `t=${futureTimestamp},v1=${hash}`;

    const isValid = verifyWebhookSignature(payload, futureSignature, secret, 300);
    expect(isValid).toBe(false);
  });
});

describe('Webhook signature integration', () => {
  it('should work with complex JSON payloads', () => {
    const payload = JSON.stringify({
      id: 'evt_123',
      event: 'lead.created',
      timestamp: new Date().toISOString(),
      data: {
        lead: {
          id: 'lead_456',
          name: 'Test Lead',
          email: 'test@example.com',
          metadata: {
            source: 'web',
            campaign: 'summer-2024',
          },
        },
      },
    });
    const secret = generateWebhookSecret();
    const signature = generateWebhookSignature(payload, secret);

    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('should work with unicode characters', () => {
    const payload = JSON.stringify({
      name: '日本語テスト',
      emoji: '🎉',
    });
    const secret = 'unicode-secret';
    const signature = generateWebhookSignature(payload, secret);

    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('should work with empty payload', () => {
    const payload = '{}';
    const secret = 'empty-payload-secret';
    const signature = generateWebhookSignature(payload, secret);

    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });
});
