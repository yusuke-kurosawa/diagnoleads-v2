/**
 * Rate Limit Tests
 *
 * Unit tests for rate limiting configuration and logic
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RATE_LIMITS,
  ENDPOINT_RATE_LIMITS,
  type RateLimitConfig,
} from '@/lib/middleware/rate-limit';

describe('DEFAULT_RATE_LIMITS', () => {
  it('should have api rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.api).toEqual({
      max: 100,
      windowMs: 60 * 1000,
    });
  });

  it('should have auth rate limit (stricter for security)', () => {
    expect(DEFAULT_RATE_LIMITS.auth).toEqual({
      max: 5,
      windowMs: 60 * 1000,
    });
    expect(DEFAULT_RATE_LIMITS.auth.max).toBeLessThan(DEFAULT_RATE_LIMITS.api.max);
  });

  it('should have page rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.page).toEqual({
      max: 300,
      windowMs: 60 * 1000,
    });
  });

  it('should have webhook rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.webhook).toEqual({
      max: 50,
      windowMs: 60 * 1000,
    });
  });

  it('should have ai rate limit (restricted)', () => {
    expect(DEFAULT_RATE_LIMITS.ai).toEqual({
      max: 20,
      windowMs: 60 * 1000,
    });
    expect(DEFAULT_RATE_LIMITS.ai.max).toBeLessThan(DEFAULT_RATE_LIMITS.api.max);
  });

  it('should have export rate limit (restricted)', () => {
    expect(DEFAULT_RATE_LIMITS.export).toEqual({
      max: 10,
      windowMs: 60 * 1000,
    });
  });

  it('should have upload rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.upload).toEqual({
      max: 30,
      windowMs: 60 * 1000,
    });
  });

  it('should have search rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.search).toEqual({
      max: 60,
      windowMs: 60 * 1000,
    });
  });

  it('should have diagnostic rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.diagnostic).toEqual({
      max: 30,
      windowMs: 60 * 1000,
    });
  });

  it('should have REST API v2 rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.restApiV2).toEqual({
      max: 200,
      windowMs: 60 * 1000,
    });
  });

  it('should have GraphQL rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.graphql).toEqual({
      max: 100,
      windowMs: 60 * 1000,
    });
  });
});

describe('ENDPOINT_RATE_LIMITS', () => {
  describe('Authentication endpoints', () => {
    it('should have strict limit for login', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/auth/login']).toEqual({
        max: 5,
        windowMs: 60 * 1000,
      });
    });

    it('should have strict limit for signup', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/auth/signup']).toEqual({
        max: 3,
        windowMs: 60 * 1000,
      });
    });

    it('should have strict limit for forgot-password', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/auth/forgot-password']).toEqual({
        max: 3,
        windowMs: 60 * 1000,
      });
    });

    it('should have strict limit for reset-password', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/auth/reset-password']).toEqual({
        max: 3,
        windowMs: 60 * 1000,
      });
    });
  });

  describe('AI endpoints', () => {
    it('should have limit for score leads', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/ai.scoreLeads']).toEqual({
        max: 10,
        windowMs: 60 * 1000,
      });
    });

    it('should have limit for chat', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/ai.chat']).toEqual({
        max: 30,
        windowMs: 60 * 1000,
      });
    });

    it('should have limit for search', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/ai.search']).toEqual({
        max: 30,
        windowMs: 60 * 1000,
      });
    });
  });

  describe('Export endpoints', () => {
    it('should have strict limit for leads export', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.export']).toEqual({
        max: 5,
        windowMs: 60 * 1000,
      });
    });

    it('should have strict limit for reports export', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/reports.export']).toEqual({
        max: 5,
        windowMs: 60 * 1000,
      });
    });

    it('should have strict limit for audit logs export', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/auditLogs.export']).toEqual({
        max: 3,
        windowMs: 60 * 1000,
      });
    });
  });

  describe('Bulk operation endpoints', () => {
    it('should have limit for bulk create', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkCreate']).toEqual({
        max: 10,
        windowMs: 60 * 1000,
      });
    });

    it('should have limit for bulk update', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkUpdate']).toEqual({
        max: 10,
        windowMs: 60 * 1000,
      });
    });

    it('should have stricter limit for bulk delete', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkDelete']).toEqual({
        max: 5,
        windowMs: 60 * 1000,
      });
    });
  });

  describe('REST API v2 endpoints', () => {
    it('should have limit for leads endpoint', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/v2/leads']).toEqual({
        max: 200,
        windowMs: 60 * 1000,
      });
    });

    it('should have limit for webhooks endpoint', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/v2/webhooks']).toEqual({
        max: 100,
        windowMs: 60 * 1000,
      });
    });

    it('should have limit for analytics endpoint', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/v2/analytics']).toEqual({
        max: 60,
        windowMs: 60 * 1000,
      });
    });
  });

  describe('Diagnostic endpoints', () => {
    it('should have limit for diagnostic API', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/diagnostic']).toEqual({
        max: 30,
        windowMs: 60 * 1000,
      });
    });

    it('should have higher limit for embed diagnostic', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/embed/v1/diagnostic']).toEqual({
        max: 60,
        windowMs: 60 * 1000,
      });
    });

    it('should have limit for embed lead', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/embed/v1/lead']).toEqual({
        max: 60,
        windowMs: 60 * 1000,
      });
    });
  });

  describe('GraphQL endpoint', () => {
    it('should have limit for GraphQL', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/graphql']).toEqual({
        max: 100,
        windowMs: 60 * 1000,
      });
    });
  });
});

describe('Rate limit security validation', () => {
  it('should have stricter limits for authentication than general API', () => {
    expect(ENDPOINT_RATE_LIMITS['/api/auth/login'].max).toBeLessThanOrEqual(5);
    expect(ENDPOINT_RATE_LIMITS['/api/auth/signup'].max).toBeLessThanOrEqual(5);
    expect(DEFAULT_RATE_LIMITS.api.max).toBeGreaterThanOrEqual(100);
  });

  it('should have stricter limits for destructive operations', () => {
    const bulkDeleteLimit = ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkDelete'].max;
    const bulkCreateLimit = ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkCreate'].max;

    expect(bulkDeleteLimit).toBeLessThanOrEqual(bulkCreateLimit);
  });

  it('should have reasonable window for all limits', () => {
    for (const [, config] of Object.entries(DEFAULT_RATE_LIMITS)) {
      expect(config.windowMs).toBeGreaterThanOrEqual(1000); // At least 1 second
      expect(config.windowMs).toBeLessThanOrEqual(60 * 60 * 1000); // At most 1 hour
    }
  });

  it('should have positive max values for all limits', () => {
    for (const [, config] of Object.entries(DEFAULT_RATE_LIMITS)) {
      expect(config.max).toBeGreaterThan(0);
    }

    for (const [, config] of Object.entries(ENDPOINT_RATE_LIMITS)) {
      expect(config.max).toBeGreaterThan(0);
    }
  });
});

describe('RateLimitConfig type validation', () => {
  it('should have required properties', () => {
    const config: RateLimitConfig = {
      max: 100,
      windowMs: 60000,
    };

    expect(config.max).toBe(100);
    expect(config.windowMs).toBe(60000);
    expect(config.skip).toBeUndefined();
    expect(config.keyGenerator).toBeUndefined();
  });

  it('should allow optional skip function', () => {
    const config: RateLimitConfig = {
      max: 100,
      windowMs: 60000,
      skip: () => false,
    };

    expect(typeof config.skip).toBe('function');
    expect(config.skip?.(null as never)).toBe(false);
  });

  it('should allow optional keyGenerator function', () => {
    const config: RateLimitConfig = {
      max: 100,
      windowMs: 60000,
      keyGenerator: () => 'custom-key',
    };

    expect(typeof config.keyGenerator).toBe('function');
    expect(config.keyGenerator?.(null as never)).toBe('custom-key');
  });
});
