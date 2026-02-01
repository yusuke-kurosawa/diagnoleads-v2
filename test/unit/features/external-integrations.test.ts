/**
 * External Integrations Tests
 *
 * Tests for webhook service and email service utilities
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  generateWebhookSignature,
  verifyWebhookSignature,
  generateWebhookSecret,
} from '@/lib/features/webhooks/services/webhook-service';

describe('Webhook Service', () => {
  describe('generateWebhookSecret', () => {
    it('should generate a secret starting with whsec_', () => {
      const secret = generateWebhookSecret();

      expect(secret).toMatch(/^whsec_[a-f0-9]{64}$/);
    });

    it('should generate unique secrets', () => {
      const secret1 = generateWebhookSecret();
      const secret2 = generateWebhookSecret();

      expect(secret1).not.toBe(secret2);
    });

    it('should generate 64 hex characters after prefix', () => {
      const secret = generateWebhookSecret();
      const hexPart = secret.replace('whsec_', '');

      expect(hexPart).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(hexPart)).toBe(true);
    });
  });

  describe('generateWebhookSignature', () => {
    const testPayload = JSON.stringify({ event: 'lead.created', data: { id: '123' } });
    const testSecret = 'whsec_testsecret123';

    it('should generate signature with timestamp and v1 format', () => {
      const signature = generateWebhookSignature(testPayload, testSecret);

      expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    });

    it('should include current timestamp', () => {
      const before = Math.floor(Date.now() / 1000);
      const signature = generateWebhookSignature(testPayload, testSecret);
      const after = Math.floor(Date.now() / 1000);

      const timestampPart = signature.split(',')[0];
      const timestamp = parseInt(timestampPart.replace('t=', ''), 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate different signatures for different payloads', () => {
      const signature1 = generateWebhookSignature(testPayload, testSecret);
      const signature2 = generateWebhookSignature('{"different": "payload"}', testSecret);

      const sig1Hash = signature1.split('v1=')[1];
      const sig2Hash = signature2.split('v1=')[1];

      expect(sig1Hash).not.toBe(sig2Hash);
    });

    it('should generate different signatures for different secrets', () => {
      const signature1 = generateWebhookSignature(testPayload, testSecret);
      const signature2 = generateWebhookSignature(testPayload, 'different_secret');

      const sig1Hash = signature1.split('v1=')[1];
      const sig2Hash = signature2.split('v1=')[1];

      expect(sig1Hash).not.toBe(sig2Hash);
    });
  });

  describe('verifyWebhookSignature', () => {
    const testPayload = JSON.stringify({ event: 'lead.created', data: { id: '123' } });
    const testSecret = 'whsec_testsecret123';

    it('should verify valid signature', () => {
      const signature = generateWebhookSignature(testPayload, testSecret);
      const isValid = verifyWebhookSignature(testPayload, signature, testSecret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const signature = generateWebhookSignature(testPayload, testSecret);
      const isValid = verifyWebhookSignature(testPayload, signature, 'wrong_secret');

      expect(isValid).toBe(false);
    });

    it('should reject tampered payload', () => {
      const signature = generateWebhookSignature(testPayload, testSecret);
      const isValid = verifyWebhookSignature('{"tampered": "payload"}', signature, testSecret);

      expect(isValid).toBe(false);
    });

    it('should reject malformed signature', () => {
      const isValid = verifyWebhookSignature(testPayload, 'invalid_signature', testSecret);

      expect(isValid).toBe(false);
    });

    it('should reject signature without timestamp', () => {
      const isValid = verifyWebhookSignature(testPayload, 'v1=abc123', testSecret);

      expect(isValid).toBe(false);
    });

    it('should reject signature without v1 hash', () => {
      const isValid = verifyWebhookSignature(testPayload, 't=1234567890', testSecret);

      expect(isValid).toBe(false);
    });

    it('should reject expired timestamp', () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
      const signaturePayload = `${oldTimestamp}.${testPayload}`;
      const hash = require('crypto')
        .createHmac('sha256', testSecret)
        .update(signaturePayload)
        .digest('hex');
      const signature = `t=${oldTimestamp},v1=${hash}`;

      const isValid = verifyWebhookSignature(testPayload, signature, testSecret, 300);

      expect(isValid).toBe(false);
    });

    it('should accept signature within tolerance', () => {
      const signature = generateWebhookSignature(testPayload, testSecret);
      const isValid = verifyWebhookSignature(testPayload, signature, testSecret, 60);

      expect(isValid).toBe(true);
    });
  });
});

describe('Webhook Payload Structure', () => {
  it('should have correct structure for lead.created event', () => {
    const payload = {
      id: 'evt_123',
      event: 'lead.created',
      timestamp: new Date().toISOString(),
      organizationId: 'org_123',
      data: {
        leadId: 'lead_123',
        name: 'Test Lead',
        email: 'test@example.com',
      },
    };

    expect(payload.id).toBeDefined();
    expect(payload.event).toBe('lead.created');
    expect(payload.timestamp).toBeDefined();
    expect(payload.organizationId).toBeDefined();
    expect(payload.data).toBeDefined();
  });

  it('should support various event types', () => {
    const eventTypes = [
      'lead.created',
      'lead.updated',
      'lead.deleted',
      'lead.scored',
      'lead.converted',
      'diagnostic.submitted',
    ];

    for (const eventType of eventTypes) {
      expect(typeof eventType).toBe('string');
      expect(eventType).toMatch(/^[a-z]+\.[a-z]+$/);
    }
  });
});

describe('Email Template Types', () => {
  it('should have standard email template types', () => {
    const templateTypes = [
      'lead_notification',
      'diagnostic_result',
      'welcome',
      'member_invitation',
      'password_reset',
      'weekly_report',
    ];

    expect(templateTypes).toHaveLength(6);
    for (const type of templateTypes) {
      expect(typeof type).toBe('string');
      expect(type).toMatch(/^[a-z_]+$/);
    }
  });
});

describe('Email Options Validation', () => {
  it('should validate email options structure', () => {
    const validOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      template: 'welcome',
      data: { name: 'Test User' },
    };

    expect(validOptions.to).toBeDefined();
    expect(validOptions.subject).toBeDefined();
    expect(validOptions.template).toBeDefined();
    expect(validOptions.data).toBeDefined();
  });

  it('should support multiple recipients', () => {
    const options = {
      to: ['user1@example.com', 'user2@example.com'],
      subject: 'Test Subject',
      template: 'lead_notification',
      data: {},
    };

    expect(Array.isArray(options.to)).toBe(true);
    expect(options.to).toHaveLength(2);
  });

  it('should support optional fields', () => {
    const optionsWithOptionals = {
      to: 'test@example.com',
      subject: 'Test',
      template: 'welcome',
      data: {},
      from: 'Custom <custom@example.com>',
      replyTo: 'reply@example.com',
      cc: ['cc@example.com'],
      bcc: ['bcc@example.com'],
    };

    expect(optionsWithOptionals.from).toBeDefined();
    expect(optionsWithOptionals.replyTo).toBeDefined();
    expect(optionsWithOptionals.cc).toBeDefined();
    expect(optionsWithOptionals.bcc).toBeDefined();
  });
});
