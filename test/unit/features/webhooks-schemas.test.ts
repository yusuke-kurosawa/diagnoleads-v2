/**
 * Webhooks Schemas Tests
 *
 * Unit tests for webhook type definitions and validation schemas
 */

import { describe, expect, it } from 'vitest';
import {
  webhookEventTypes,
  webhookStatuses,
  createWebhookSchema,
  updateWebhookSchema,
  webhookPayloadSchema,
  listWebhooksSchema,
  listDeliveriesSchema,
  testWebhookSchema,
  type WebhookEventType,
  type WebhookStatus,
  type CreateWebhookInput,
} from '@/lib/features/webhooks/types/schemas';

describe('webhookEventTypes', () => {
  it('should have lead events', () => {
    expect(webhookEventTypes).toContain('lead.created');
    expect(webhookEventTypes).toContain('lead.updated');
    expect(webhookEventTypes).toContain('lead.deleted');
    expect(webhookEventTypes).toContain('lead.status_changed');
    expect(webhookEventTypes).toContain('lead.scored');
  });

  it('should have diagnostic events', () => {
    expect(webhookEventTypes).toContain('diagnostic.submitted');
    expect(webhookEventTypes).toContain('diagnostic.completed');
  });

  it('should have organization events', () => {
    expect(webhookEventTypes).toContain('organization.member_added');
    expect(webhookEventTypes).toContain('organization.member_removed');
  });

  it('should have content events', () => {
    expect(webhookEventTypes).toContain('blog.published');
    expect(webhookEventTypes).toContain('faq.published');
  });
});

describe('webhookStatuses', () => {
  it('should have all statuses', () => {
    expect(webhookStatuses).toContain('active');
    expect(webhookStatuses).toContain('inactive');
    expect(webhookStatuses).toContain('failed');
    expect(webhookStatuses).toHaveLength(3);
  });
});

describe('createWebhookSchema', () => {
  it('should accept valid minimal input', () => {
    const input: CreateWebhookInput = {
      name: 'My Webhook',
      url: 'https://example.com/webhook',
      events: ['lead.created'],
    };

    const result = createWebhookSchema.parse(input);
    expect(result.name).toBe('My Webhook');
    expect(result.events).toContain('lead.created');
  });

  it('should accept full input', () => {
    const input = {
      name: 'Full Webhook',
      url: 'https://api.example.com/webhooks/receive',
      events: ['lead.created', 'lead.updated', 'lead.scored'] as const,
      headers: {
        'X-Custom-Header': 'value',
        Authorization: 'Bearer token',
      },
      retryConfig: {
        maxRetries: 5,
        retryDelayMs: 10000,
      },
    };

    const result = createWebhookSchema.parse(input);
    expect(result.headers?.['X-Custom-Header']).toBe('value');
    expect(result.retryConfig?.maxRetries).toBe(5);
  });

  it('should reject invalid URL', () => {
    expect(() =>
      createWebhookSchema.parse({
        name: 'Test',
        url: 'not-a-url',
        events: ['lead.created'],
      })
    ).toThrow();
  });

  it('should require at least one event', () => {
    expect(() =>
      createWebhookSchema.parse({
        name: 'Test',
        url: 'https://example.com',
        events: [],
      })
    ).toThrow();
  });

  it('should validate name length', () => {
    expect(() =>
      createWebhookSchema.parse({
        name: '',
        url: 'https://example.com',
        events: ['lead.created'],
      })
    ).toThrow();

    expect(() =>
      createWebhookSchema.parse({
        name: 'a'.repeat(101),
        url: 'https://example.com',
        events: ['lead.created'],
      })
    ).toThrow();
  });

  it('should validate retry config', () => {
    const baseInput = {
      name: 'Test',
      url: 'https://example.com',
      events: ['lead.created'] as const,
    };

    expect(() =>
      createWebhookSchema.parse({
        ...baseInput,
        retryConfig: { maxRetries: 11, retryDelayMs: 5000 },
      })
    ).toThrow();

    expect(() =>
      createWebhookSchema.parse({
        ...baseInput,
        retryConfig: { maxRetries: 3, retryDelayMs: 500 },
      })
    ).toThrow();
  });
});

describe('updateWebhookSchema', () => {
  it('should accept partial update', () => {
    const input = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'inactive' as const,
    };

    const result = updateWebhookSchema.parse(input);
    expect(result.status).toBe('inactive');
    expect(result.name).toBeUndefined();
  });

  it('should accept full update', () => {
    const input = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Updated Name',
      url: 'https://new-url.com/webhook',
      events: ['lead.deleted'] as const,
      status: 'active' as const,
      headers: { 'X-New-Header': 'value' },
    };

    const result = updateWebhookSchema.parse(input);
    expect(result.name).toBe('Updated Name');
    expect(result.events).toContain('lead.deleted');
  });

  it('should require valid UUID for id', () => {
    expect(() =>
      updateWebhookSchema.parse({
        id: 'not-a-uuid',
        name: 'Test',
      })
    ).toThrow();
  });
});

describe('webhookPayloadSchema', () => {
  it('should accept valid payload', () => {
    const payload = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      event: 'lead.created' as const,
      timestamp: new Date().toISOString(),
      organizationId: '123e4567-e89b-12d3-a456-426614174001',
      data: {
        leadId: 'lead-123',
        email: 'test@example.com',
      },
    };

    const result = webhookPayloadSchema.parse(payload);
    expect(result.event).toBe('lead.created');
    expect(result.data).toHaveProperty('leadId');
  });

  it('should require valid datetime timestamp', () => {
    expect(() =>
      webhookPayloadSchema.parse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        event: 'lead.created',
        timestamp: 'invalid-date',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        data: {},
      })
    ).toThrow();
  });
});

describe('listWebhooksSchema', () => {
  it('should accept empty input with defaults', () => {
    const result = listWebhooksSchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it('should accept filter by status', () => {
    const result = listWebhooksSchema.parse({ status: 'active' });
    expect(result.status).toBe('active');
  });

  it('should accept pagination options', () => {
    const result = listWebhooksSchema.parse({ limit: 50, offset: 100 });
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(100);
  });

  it('should validate limit range', () => {
    expect(() => listWebhooksSchema.parse({ limit: 0 })).toThrow();
    expect(() => listWebhooksSchema.parse({ limit: 101 })).toThrow();
  });
});

describe('listDeliveriesSchema', () => {
  it('should accept empty input with defaults', () => {
    const result = listDeliveriesSchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it('should accept webhookId filter', () => {
    const result = listDeliveriesSchema.parse({
      webhookId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.webhookId).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should accept status filter', () => {
    const result = listDeliveriesSchema.parse({ status: 'failed' });
    expect(result.status).toBe('failed');
  });
});

describe('testWebhookSchema', () => {
  it('should accept valid UUID', () => {
    const result = testWebhookSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should reject invalid UUID', () => {
    expect(() => testWebhookSchema.parse({ id: 'not-a-uuid' })).toThrow();
  });
});
