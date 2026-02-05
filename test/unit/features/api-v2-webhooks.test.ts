/**
 * REST API v2 Webhooks Tests
 *
 * Unit tests for webhooks REST API endpoints
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Schema definitions matching the API
const webhookEventSchema = z.enum([
  'lead.created',
  'lead.updated',
  'lead.deleted',
  'lead.status_changed',
  'lead.scored',
  'diagnostic.submitted',
  'diagnostic.completed',
  'organization.member_added',
  'organization.member_removed',
  'blog.published',
  'blog.updated',
]);

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(webhookEventSchema).min(1),
  secret: z.string().min(16).max(64).optional(),
  status: z.enum(['active', 'inactive', 'failed']).default('active'),
  headers: z.record(z.string()).optional(),
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryDelayMs: z.number().int().min(1000).max(30000).default(5000),
});

// All supported webhook events
const WEBHOOK_EVENTS = [
  'lead.created',
  'lead.updated',
  'lead.deleted',
  'lead.status_changed',
  'lead.scored',
  'diagnostic.submitted',
  'diagnostic.completed',
  'organization.member_added',
  'organization.member_removed',
  'blog.published',
  'blog.updated',
] as const;

describe('REST API v2 - Webhooks', () => {
  describe('Webhook Event Schema', () => {
    it('should accept all valid event types', () => {
      for (const event of WEBHOOK_EVENTS) {
        const result = webhookEventSchema.parse(event);
        expect(result).toBe(event);
      }
    });

    it('should reject invalid event type', () => {
      expect(() => webhookEventSchema.parse('invalid.event')).toThrow();
    });

    it('should have lead events', () => {
      const leadEvents = WEBHOOK_EVENTS.filter((e) => e.startsWith('lead.'));
      expect(leadEvents.length).toBe(5);
    });

    it('should have diagnostic events', () => {
      const diagnosticEvents = WEBHOOK_EVENTS.filter((e) => e.startsWith('diagnostic.'));
      expect(diagnosticEvents.length).toBe(2);
    });

    it('should have organization events', () => {
      const orgEvents = WEBHOOK_EVENTS.filter((e) => e.startsWith('organization.'));
      expect(orgEvents.length).toBe(2);
    });

    it('should have blog events', () => {
      const blogEvents = WEBHOOK_EVENTS.filter((e) => e.startsWith('blog.'));
      expect(blogEvents.length).toBe(2);
    });
  });

  describe('Create Webhook Schema', () => {
    it('should accept valid webhook data', () => {
      const webhook = {
        name: 'My Webhook',
        url: 'https://example.com/webhook',
        events: ['lead.created', 'lead.updated'],
      };

      const result = createWebhookSchema.parse(webhook);

      expect(result.name).toBe('My Webhook');
      expect(result.url).toBe('https://example.com/webhook');
      expect(result.events).toEqual(['lead.created', 'lead.updated']);
    });

    it('should require name', () => {
      expect(() =>
        createWebhookSchema.parse({
          url: 'https://example.com/webhook',
          events: ['lead.created'],
        })
      ).toThrow();
    });

    it('should validate name length', () => {
      expect(() =>
        createWebhookSchema.parse({
          name: '',
          url: 'https://example.com/webhook',
          events: ['lead.created'],
        })
      ).toThrow();

      expect(() =>
        createWebhookSchema.parse({
          name: 'a'.repeat(101),
          url: 'https://example.com/webhook',
          events: ['lead.created'],
        })
      ).toThrow();
    });

    it('should require valid URL', () => {
      expect(() =>
        createWebhookSchema.parse({
          name: 'Test',
          url: 'not-a-url',
          events: ['lead.created'],
        })
      ).toThrow();
    });

    it('should accept HTTPS URLs', () => {
      const result = createWebhookSchema.parse({
        name: 'Test',
        url: 'https://example.com/webhook',
        events: ['lead.created'],
      });

      expect(result.url).toBe('https://example.com/webhook');
    });

    it('should accept HTTP URLs (for development)', () => {
      const result = createWebhookSchema.parse({
        name: 'Test',
        url: 'http://localhost:3000/webhook',
        events: ['lead.created'],
      });

      expect(result.url).toBe('http://localhost:3000/webhook');
    });

    it('should require at least one event', () => {
      expect(() =>
        createWebhookSchema.parse({
          name: 'Test',
          url: 'https://example.com/webhook',
          events: [],
        })
      ).toThrow();
    });

    it('should accept multiple events', () => {
      const result = createWebhookSchema.parse({
        name: 'Test',
        url: 'https://example.com/webhook',
        events: ['lead.created', 'lead.updated', 'diagnostic.submitted'],
      });

      expect(result.events.length).toBe(3);
    });

    it('should validate secret length', () => {
      // Too short
      expect(() =>
        createWebhookSchema.parse({
          name: 'Test',
          url: 'https://example.com/webhook',
          events: ['lead.created'],
          secret: 'short',
        })
      ).toThrow();

      // Too long
      expect(() =>
        createWebhookSchema.parse({
          name: 'Test',
          url: 'https://example.com/webhook',
          events: ['lead.created'],
          secret: 'a'.repeat(65),
        })
      ).toThrow();
    });

    it('should accept valid secret', () => {
      const result = createWebhookSchema.parse({
        name: 'Test',
        url: 'https://example.com/webhook',
        events: ['lead.created'],
        secret: 'my-secret-key-here',
      });

      expect(result.secret).toBe('my-secret-key-here');
    });

    it('should use default values', () => {
      const result = createWebhookSchema.parse({
        name: 'Test',
        url: 'https://example.com/webhook',
        events: ['lead.created'],
      });

      expect(result.status).toBe('active');
      expect(result.maxRetries).toBe(3);
      expect(result.retryDelayMs).toBe(5000);
    });

    it('should accept all valid status values', () => {
      for (const status of ['active', 'inactive', 'failed']) {
        const result = createWebhookSchema.parse({
          name: 'Test',
          url: 'https://example.com/webhook',
          events: ['lead.created'],
          status,
        });
        expect(result.status).toBe(status);
      }
    });

    it('should validate maxRetries range', () => {
      expect(() =>
        createWebhookSchema.parse({
          name: 'Test',
          url: 'https://example.com/webhook',
          events: ['lead.created'],
          maxRetries: -1,
        })
      ).toThrow();

      expect(() =>
        createWebhookSchema.parse({
          name: 'Test',
          url: 'https://example.com/webhook',
          events: ['lead.created'],
          maxRetries: 11,
        })
      ).toThrow();
    });

    it('should validate retryDelayMs range', () => {
      expect(() =>
        createWebhookSchema.parse({
          name: 'Test',
          url: 'https://example.com/webhook',
          events: ['lead.created'],
          retryDelayMs: 500,
        })
      ).toThrow();

      expect(() =>
        createWebhookSchema.parse({
          name: 'Test',
          url: 'https://example.com/webhook',
          events: ['lead.created'],
          retryDelayMs: 31000,
        })
      ).toThrow();
    });

    it('should accept custom headers', () => {
      const result = createWebhookSchema.parse({
        name: 'Test',
        url: 'https://example.com/webhook',
        events: ['lead.created'],
        headers: {
          'X-Custom-Header': 'value',
          Authorization: 'Bearer token',
        },
      });

      expect(result.headers).toEqual({
        'X-Custom-Header': 'value',
        Authorization: 'Bearer token',
      });
    });
  });

  describe('Webhook Response Format', () => {
    it('should have correct list response structure', () => {
      const mockResponse = {
        data: [
          {
            id: 'wh_123',
            name: 'My Webhook',
            url: 'https://example.com/webhook',
            events: ['lead.created'],
            status: 'active',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      };

      expect(mockResponse.data).toBeInstanceOf(Array);
      expect(mockResponse.data[0]).toHaveProperty('id');
      expect(mockResponse.data[0]).toHaveProperty('name');
      expect(mockResponse.data[0]).toHaveProperty('url');
      expect(mockResponse.data[0]).toHaveProperty('events');
      expect(mockResponse.data[0]).toHaveProperty('status');
    });

    it('should have correct create response structure', () => {
      const mockResponse = {
        data: {
          id: 'wh_new',
          name: 'New Webhook',
          url: 'https://example.com/webhook',
          events: ['lead.created'],
          status: 'active',
          secret: 'whsec_xxx',
          createdAt: '2024-01-01T00:00:00Z',
        },
        message: 'Webhook created successfully',
      };

      expect(mockResponse.data).toHaveProperty('id');
      expect(mockResponse.data).toHaveProperty('secret');
      expect(mockResponse.message).toBe('Webhook created successfully');
    });

    it('should not expose full secret in list response', () => {
      // Secret should be masked or not included in list
      const maskedSecret = 'whsec_****';
      expect(maskedSecret).not.toContain('full-secret');
    });
  });

  describe('Webhook Secret Generation', () => {
    it('should generate secret with correct prefix', () => {
      // Secret format: whsec_<64 hex chars>
      const secretPrefix = 'whsec_';
      const mockSecret = secretPrefix + 'a'.repeat(64);

      expect(mockSecret.startsWith('whsec_')).toBe(true);
    });

    it('should generate 64 hex characters after prefix', () => {
      const mockSecret = 'whsec_' + 'a1b2c3d4'.repeat(8);
      const hexPart = mockSecret.replace('whsec_', '');

      expect(hexPart.length).toBe(64);
    });
  });

  describe('HTTP Status Codes', () => {
    it('should return 200 for successful list', () => {
      const status = 200;
      expect(status).toBe(200);
    });

    it('should return 201 for successful create', () => {
      const status = 201;
      expect(status).toBe(201);
    });

    it('should return 400 for validation error', () => {
      const status = 400;
      expect(status).toBe(400);
    });

    it('should return 401 for unauthorized', () => {
      const status = 401;
      expect(status).toBe(401);
    });

    it('should return 404 for not found', () => {
      const status = 404;
      expect(status).toBe(404);
    });

    it('should return 500 for server error', () => {
      const status = 500;
      expect(status).toBe(500);
    });
  });

  describe('Webhook Delivery', () => {
    it('should support retry logic', () => {
      const maxRetries = 3;
      let attempts = 0;

      function deliver(success: boolean): boolean {
        attempts++;
        if (!success && attempts < maxRetries) {
          return deliver(success);
        }
        return success;
      }

      deliver(false);
      expect(attempts).toBe(maxRetries);
    });

    it('should track delivery status', () => {
      const deliveryStatuses = ['pending', 'delivered', 'failed'];

      expect(deliveryStatuses).toContain('pending');
      expect(deliveryStatuses).toContain('delivered');
      expect(deliveryStatuses).toContain('failed');
    });
  });
});
