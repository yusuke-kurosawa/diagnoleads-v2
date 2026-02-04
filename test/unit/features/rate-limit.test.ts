/**
 * Rate Limit Tests
 *
 * Unit tests for the rate limiting middleware
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RATE_LIMITS,
  ENDPOINT_RATE_LIMITS,
  getRateLimitConfig,
  getRateLimitInfo,
  type RateLimitResult,
} from '@/lib/middleware/rate-limit';

describe('Rate Limit Configuration', () => {
  describe('DEFAULT_RATE_LIMITS', () => {
    it('should have API rate limit', () => {
      expect(DEFAULT_RATE_LIMITS.api).toEqual({ max: 100, windowMs: 60000 });
    });

    it('should have auth rate limit (stricter)', () => {
      expect(DEFAULT_RATE_LIMITS.auth).toEqual({ max: 5, windowMs: 60000 });
    });

    it('should have page rate limit', () => {
      expect(DEFAULT_RATE_LIMITS.page).toEqual({ max: 300, windowMs: 60000 });
    });

    it('should have AI rate limit', () => {
      expect(DEFAULT_RATE_LIMITS.ai).toEqual({ max: 20, windowMs: 60000 });
    });

    it('should have export rate limit', () => {
      expect(DEFAULT_RATE_LIMITS.export).toEqual({ max: 10, windowMs: 60000 });
    });

    it('should have webhook rate limit', () => {
      expect(DEFAULT_RATE_LIMITS.webhook).toEqual({ max: 50, windowMs: 60000 });
    });

    it('should have REST API v2 rate limit', () => {
      expect(DEFAULT_RATE_LIMITS.restApiV2).toEqual({ max: 200, windowMs: 60000 });
    });

    it('should have GraphQL rate limit', () => {
      expect(DEFAULT_RATE_LIMITS.graphql).toEqual({ max: 100, windowMs: 60000 });
    });
  });

  describe('ENDPOINT_RATE_LIMITS', () => {
    it('should have strict limits for auth endpoints', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/auth/login']).toEqual({ max: 5, windowMs: 60000 });
      expect(ENDPOINT_RATE_LIMITS['/api/auth/signup']).toEqual({ max: 3, windowMs: 60000 });
    });

    it('should have limits for AI endpoints', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/ai.scoreLeads']).toEqual({ max: 10, windowMs: 60000 });
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/ai.chat']).toEqual({ max: 30, windowMs: 60000 });
    });

    it('should have strict limits for export endpoints', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.export']).toEqual({ max: 5, windowMs: 60000 });
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/auditLogs.export']).toEqual({ max: 3, windowMs: 60000 });
    });

    it('should have limits for bulk operations', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkCreate']).toEqual({ max: 10, windowMs: 60000 });
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkDelete']).toEqual({ max: 5, windowMs: 60000 });
    });

    it('should have limits for REST API v2', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/v2/leads']).toEqual({ max: 200, windowMs: 60000 });
      expect(ENDPOINT_RATE_LIMITS['/api/v2/analytics']).toEqual({ max: 60, windowMs: 60000 });
    });
  });
});

describe('getRateLimitConfig', () => {
  describe('endpoint matching', () => {
    it('should match exact endpoints', () => {
      const config = getRateLimitConfig('/api/auth/login');
      expect(config.max).toBe(5);
    });

    it('should match prefix endpoints', () => {
      const config = getRateLimitConfig('/api/v2/leads/some-id');
      expect(config.max).toBe(200);
    });
  });

  describe('category fallback', () => {
    it('should return auth limits for /api/auth paths', () => {
      const config = getRateLimitConfig('/api/auth/unknown');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.auth);
    });

    it('should return AI limits for AI paths', () => {
      const config = getRateLimitConfig('/api/ai/unknown');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.ai);
    });

    it('should return export limits for export paths', () => {
      const config = getRateLimitConfig('/api/some/export');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.export);
    });

    it('should return GraphQL limits for GraphQL paths', () => {
      const config = getRateLimitConfig('/api/graphql');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.graphql);
    });

    it('should return REST API v2 limits for /api/v2 paths', () => {
      const config = getRateLimitConfig('/api/v2/unknown');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.restApiV2);
    });

    it('should return diagnostic limits for diagnostic paths', () => {
      const config = getRateLimitConfig('/api/diagnostic/submit');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.diagnostic);
    });

    it('should return API limits for generic API paths', () => {
      const config = getRateLimitConfig('/api/unknown');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.api);
    });

    it('should return page limits for non-API paths', () => {
      const config = getRateLimitConfig('/dashboard');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.page);
    });
  });
});

describe('getRateLimitInfo', () => {
  it('should return correct headers for allowed request', () => {
    const result: RateLimitResult = {
      allowed: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    };

    const headers = getRateLimitInfo(result);

    expect(headers['X-RateLimit-Limit']).toBe('100');
    expect(headers['X-RateLimit-Remaining']).toBe('99');
    expect(headers['X-RateLimit-Reset']).toBeDefined();
    expect(headers['Retry-After']).toBeUndefined();
  });

  it('should include Retry-After for blocked requests', () => {
    const result: RateLimitResult = {
      allowed: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 30000,
      retryAfter: 30,
    };

    const headers = getRateLimitInfo(result);

    expect(headers['X-RateLimit-Limit']).toBe('5');
    expect(headers['X-RateLimit-Remaining']).toBe('0');
    expect(headers['Retry-After']).toBe('30');
  });
});

describe('Rate Limit Security', () => {
  it('should have stricter limits for sensitive operations', () => {
    // Auth should be strictest
    expect(DEFAULT_RATE_LIMITS.auth.max).toBeLessThanOrEqual(5);

    // Export should be limited
    expect(DEFAULT_RATE_LIMITS.export.max).toBeLessThanOrEqual(10);

    // Bulk operations should be limited
    expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkDelete'].max).toBeLessThanOrEqual(5);
  });

  it('should have reasonable limits for read operations', () => {
    // General API should allow more requests
    expect(DEFAULT_RATE_LIMITS.api.max).toBeGreaterThanOrEqual(100);

    // REST API v2 should be relatively generous
    expect(DEFAULT_RATE_LIMITS.restApiV2.max).toBeGreaterThanOrEqual(200);
  });

  it('should use 1 minute windows for all limits', () => {
    const oneMinute = 60 * 1000;

    Object.values(DEFAULT_RATE_LIMITS).forEach((config) => {
      expect(config.windowMs).toBe(oneMinute);
    });

    Object.values(ENDPOINT_RATE_LIMITS).forEach((config) => {
      expect(config.windowMs).toBe(oneMinute);
    });
  });
});
