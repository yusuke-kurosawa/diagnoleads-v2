/**
 * Zapier Service Tests
 *
 * Unit tests for Zapier/Make integration service
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatLeadForAutomation,
  createAutomationPayload,
  sendAutomationWebhook,
  generateZapierAuthTestResponse,
  generateZapierSampleData,
  validateZapierRequest,
  zapierRestHookEndpoints,
} from '@/lib/features/integrations/zapier/zapier-service';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Zapier Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatLeadForAutomation', () => {
    it('should format lead with all fields', () => {
      const lead = {
        id: 'lead-123',
        email: 'john@example.com',
        name: 'John Doe',
        company: 'TechCorp',
        phone: '+1234567890',
        position: 'CTO',
        source: 'website',
        status: 'new',
        score: 85,
        notes: 'High priority',
        metadata: { industry: 'tech' },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const result = formatLeadForAutomation(lead);

      expect(result.id).toBe('lead-123');
      expect(result.email).toBe('john@example.com');
      expect(result.name).toBe('John Doe');
      expect(result.company).toBe('TechCorp');
      expect(result.phone).toBe('+1234567890');
      expect(result.position).toBe('CTO');
      expect(result.source).toBe('website');
      expect(result.status).toBe('new');
      expect(result.score).toBe(85);
      expect(result.notes).toBe('High priority');
      expect(result.metadata).toEqual({ industry: 'tech' });
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.updatedAt).toBe('2024-01-02T00:00:00.000Z');
    });

    it('should handle null/undefined fields', () => {
      const lead = {
        id: 'lead-123',
        email: 'test@example.com',
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = formatLeadForAutomation(lead);

      expect(result.name).toBeNull();
      expect(result.company).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.position).toBeNull();
      expect(result.source).toBeNull();
      expect(result.score).toBeNull();
      expect(result.notes).toBeNull();
      expect(result.metadata).toEqual({});
    });

    it('should convert dates to ISO strings', () => {
      const now = new Date();
      const lead = {
        id: 'lead-123',
        email: 'test@example.com',
        status: 'new',
        createdAt: now,
        updatedAt: now,
      };

      const result = formatLeadForAutomation(lead);

      expect(result.createdAt).toBe(now.toISOString());
      expect(result.updatedAt).toBe(now.toISOString());
    });
  });

  describe('createAutomationPayload', () => {
    it('should create valid payload structure', () => {
      const event = 'lead.created';
      const data = { leadId: 'lead-123' };
      const organization = { id: 'org-123', name: 'TestOrg' };

      const payload = createAutomationPayload(event, data, organization);

      expect(payload.id).toBeDefined();
      expect(payload.event).toBe('lead.created');
      expect(payload.timestamp).toBeDefined();
      expect(payload.source).toBe('diagnoleads');
      expect(payload.version).toBe('1.0');
      expect(payload.data).toEqual({ leadId: 'lead-123' });
      expect(payload.organization).toEqual({ id: 'org-123', name: 'TestOrg' });
    });

    it('should generate unique IDs', () => {
      const org = { id: 'org-1', name: 'Test' };

      const payload1 = createAutomationPayload('test', {}, org);
      const payload2 = createAutomationPayload('test', {}, org);

      expect(payload1.id).not.toBe(payload2.id);
    });

    it('should include timestamp in ISO format', () => {
      const payload = createAutomationPayload('test', {}, { id: 'org-1', name: 'Test' });

      expect(() => new Date(payload.timestamp)).not.toThrow();
    });
  });

  describe('sendAutomationWebhook', () => {
    const webhookUrl = 'https://hooks.zapier.com/test';
    const payload = createAutomationPayload('lead.created', { id: '123' }, { id: 'org-1', name: 'Test' });

    it('should send webhook successfully', async () => {
      const result = await sendAutomationWebhook(webhookUrl, payload);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        webhookUrl,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include DiagnoLeads headers', async () => {
      await sendAutomationWebhook(webhookUrl, payload);

      const [, options] = mockFetch.mock.calls[0];

      expect(options.headers['X-DiagnoLeads-Event']).toBe('lead.created');
      expect(options.headers['X-DiagnoLeads-Delivery']).toBe(payload.id);
      expect(options.headers['User-Agent']).toBe('DiagnoLeads-Automation/1.0');
    });

    it('should add HMAC signature when secret provided', async () => {
      await sendAutomationWebhook(webhookUrl, payload, { secret: 'test-secret' });

      const [, options] = mockFetch.mock.calls[0];

      expect(options.headers['X-DiagnoLeads-Signature']).toMatch(/^sha256=/);
    });

    it('should add Zapier-specific header for Zapier platform', async () => {
      await sendAutomationWebhook(webhookUrl, payload, { platform: 'zapier' });

      const [, options] = mockFetch.mock.calls[0];

      expect(options.headers['X-Zapier-Event']).toBe('lead.created');
    });

    it('should add Make-specific header for Make platform', async () => {
      await sendAutomationWebhook(webhookUrl, payload, { platform: 'make' });

      const [, options] = mockFetch.mock.calls[0];

      expect(options.headers['X-Make-Event']).toBe('lead.created');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const result = await sendAutomationWebhook(webhookUrl, payload);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toContain('HTTP 400');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendAutomationWebhook(webhookUrl, payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('generateZapierAuthTestResponse', () => {
    it('should generate auth test response', () => {
      const organization = { id: 'org-123', name: 'TestOrg' };

      const response = generateZapierAuthTestResponse(organization);

      expect(response.id).toBe('org-123');
      expect(response.name).toBe('TestOrg');
      expect(response.authenticated).toBe(true);
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('generateZapierSampleData', () => {
    it('should generate sample for lead.created', () => {
      const sample = generateZapierSampleData('lead.created');

      expect(sample.id).toBeDefined();
      expect(sample.email).toBeDefined();
      expect(sample.name).toBeDefined();
      expect(sample.company).toBeDefined();
      expect(sample.score).toBeDefined();
    });

    it('should generate sample for lead.updated', () => {
      const sample = generateZapierSampleData('lead.updated');

      expect(sample.id).toBeDefined();
      expect(sample.previousStatus).toBeDefined();
      expect(sample.newStatus).toBeDefined();
    });

    it('should generate sample for lead.status_changed', () => {
      const sample = generateZapierSampleData('lead.status_changed');

      expect(sample.previousStatus).toBeDefined();
      expect(sample.newStatus).toBeDefined();
      expect(sample.changedAt).toBeDefined();
    });

    it('should generate sample for diagnostic.submitted', () => {
      const sample = generateZapierSampleData('diagnostic.submitted');

      expect(sample.email).toBeDefined();
      expect(sample.companyName).toBeDefined();
      expect(sample.score).toBeDefined();
      expect(sample.submittedAt).toBeDefined();
    });

    it('should generate generic sample for unknown trigger', () => {
      const sample = generateZapierSampleData('unknown.event');

      expect(sample.message).toContain('unknown.event');
      expect(sample.timestamp).toBeDefined();
    });
  });

  describe('validateZapierRequest', () => {
    it('should validate valid Bearer token', () => {
      const headers = { authorization: 'Bearer test-api-key' };

      const isValid = validateZapierRequest(headers, 'test-api-key');

      expect(isValid).toBe(true);
    });

    it('should validate with Authorization header (capital A)', () => {
      const headers = { Authorization: 'Bearer test-api-key' };

      const isValid = validateZapierRequest(headers, 'test-api-key');

      expect(isValid).toBe(true);
    });

    it('should reject invalid API key', () => {
      const headers = { authorization: 'Bearer wrong-key' };

      const isValid = validateZapierRequest(headers, 'test-api-key');

      expect(isValid).toBe(false);
    });

    it('should reject missing authorization header', () => {
      const headers = {};

      const isValid = validateZapierRequest(headers, 'test-api-key');

      expect(isValid).toBe(false);
    });

    it('should reject non-Bearer token format', () => {
      const headers = { authorization: 'Basic dXNlcjpwYXNz' };

      const isValid = validateZapierRequest(headers, 'test-api-key');

      expect(isValid).toBe(false);
    });
  });

  describe('zapierRestHookEndpoints', () => {
    it('should have subscribe endpoint', () => {
      expect(zapierRestHookEndpoints.subscribe).toBe('/api/integrations/zapier/subscribe');
    });

    it('should have unsubscribe endpoint', () => {
      expect(zapierRestHookEndpoints.unsubscribe).toBe('/api/integrations/zapier/unsubscribe');
    });

    it('should have performList endpoint', () => {
      expect(zapierRestHookEndpoints.performList).toBe('/api/integrations/zapier/perform-list');
    });
  });
});
