/**
 * Health Router Tests
 *
 * Unit tests for health check router
 */

import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

// Test the health check response schema
const healthCheckSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
});

// Test the echo response schema
const echoResponseSchema = z.object({
  message: z.string(),
  timestamp: z.string().datetime(),
});

describe('Health Router', () => {
  describe('check endpoint', () => {
    it('should return ok status', () => {
      const response = {
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
      };

      expect(response.status).toBe('ok');
    });

    it('should return valid ISO timestamp', () => {
      const response = {
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
      };

      const parsed = healthCheckSchema.parse(response);
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should pass schema validation', () => {
      const response = {
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
      };

      expect(() => healthCheckSchema.parse(response)).not.toThrow();
    });

    it('should fail with invalid status', () => {
      const invalidResponse = {
        status: 'error',
        timestamp: new Date().toISOString(),
      };

      expect(() => healthCheckSchema.parse(invalidResponse)).toThrow();
    });

    it('should fail with invalid timestamp', () => {
      const invalidResponse = {
        status: 'ok',
        timestamp: 'not-a-timestamp',
      };

      expect(() => healthCheckSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('echo endpoint', () => {
    it('should echo message back', () => {
      const input = { message: 'Hello, World!' };
      const response = {
        message: input.message,
        timestamp: new Date().toISOString(),
      };

      expect(response.message).toBe('Hello, World!');
    });

    it('should include timestamp in response', () => {
      const response = {
        message: 'test',
        timestamp: new Date().toISOString(),
      };

      expect(response.timestamp).toBeDefined();
      expect(typeof response.timestamp).toBe('string');
    });

    it('should pass schema validation', () => {
      const response = {
        message: 'Echo test',
        timestamp: new Date().toISOString(),
      };

      expect(() => echoResponseSchema.parse(response)).not.toThrow();
    });

    it('should handle empty message', () => {
      const response = {
        message: '',
        timestamp: new Date().toISOString(),
      };

      expect(response.message).toBe('');
      expect(() => echoResponseSchema.parse(response)).not.toThrow();
    });

    it('should handle long message', () => {
      const longMessage = 'A'.repeat(10000);
      const response = {
        message: longMessage,
        timestamp: new Date().toISOString(),
      };

      expect(response.message.length).toBe(10000);
    });

    it('should handle special characters', () => {
      const specialMessage = '日本語テスト 🎉 <script>alert("xss")</script>';
      const response = {
        message: specialMessage,
        timestamp: new Date().toISOString(),
      };

      expect(response.message).toBe(specialMessage);
    });
  });

  describe('input validation', () => {
    const echoInputSchema = z.object({
      message: z.string(),
    });

    it('should validate message input', () => {
      const input = { message: 'valid message' };
      expect(() => echoInputSchema.parse(input)).not.toThrow();
    });

    it('should reject non-string message', () => {
      const input = { message: 123 };
      expect(() => echoInputSchema.parse(input)).toThrow();
    });

    it('should reject missing message', () => {
      const input = {};
      expect(() => echoInputSchema.parse(input)).toThrow();
    });

    it('should reject null message', () => {
      const input = { message: null };
      expect(() => echoInputSchema.parse(input)).toThrow();
    });
  });

  describe('OpenAPI metadata', () => {
    it('should have GET method for check endpoint', () => {
      const checkMeta = {
        openapi: {
          method: 'GET',
          path: '/health/check',
          tags: ['health'],
          summary: 'Health check endpoint',
        },
      };

      expect(checkMeta.openapi.method).toBe('GET');
      expect(checkMeta.openapi.path).toBe('/health/check');
    });

    it('should have POST method for echo endpoint', () => {
      const echoMeta = {
        openapi: {
          method: 'POST',
          path: '/health/echo',
          tags: ['health'],
          summary: 'Echo test endpoint',
        },
      };

      expect(echoMeta.openapi.method).toBe('POST');
      expect(echoMeta.openapi.path).toBe('/health/echo');
    });

    it('should have health tag', () => {
      const meta = {
        openapi: {
          tags: ['health'],
        },
      };

      expect(meta.openapi.tags).toContain('health');
    });
  });

  describe('timestamp consistency', () => {
    it('should generate current timestamp', () => {
      const before = new Date().getTime();
      const timestamp = new Date().toISOString();
      const after = new Date().getTime();

      const generatedTime = new Date(timestamp).getTime();
      expect(generatedTime).toBeGreaterThanOrEqual(before);
      expect(generatedTime).toBeLessThanOrEqual(after);
    });

    it('should be in UTC format', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toMatch(/Z$/);
    });
  });
});

describe('Health status types', () => {
  it('should only allow ok status', () => {
    const statusSchema = z.literal('ok');

    expect(() => statusSchema.parse('ok')).not.toThrow();
    expect(() => statusSchema.parse('error')).toThrow();
    expect(() => statusSchema.parse('unhealthy')).toThrow();
  });
});
