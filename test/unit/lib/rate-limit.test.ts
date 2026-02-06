/**
 * Rate Limit Tests
 *
 * Unit tests for rate limiting middleware
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  DEFAULT_RATE_LIMITS,
  ENDPOINT_RATE_LIMITS,
  getRateLimitConfig,
  getRateLimitInfo,
  type RateLimitConfig,
  type RateLimitResult,
} from '@/lib/middleware/rate-limit';

describe('DEFAULT_RATE_LIMITS', () => {
  it('should have api rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.api).toEqual({ max: 100, windowMs: 60 * 1000 });
  });

  it('should have auth rate limit (stricter)', () => {
    expect(DEFAULT_RATE_LIMITS.auth).toEqual({ max: 5, windowMs: 60 * 1000 });
    expect(DEFAULT_RATE_LIMITS.auth.max).toBeLessThan(DEFAULT_RATE_LIMITS.api.max);
  });

  it('should have page rate limit (more generous)', () => {
    expect(DEFAULT_RATE_LIMITS.page).toEqual({ max: 300, windowMs: 60 * 1000 });
    expect(DEFAULT_RATE_LIMITS.page.max).toBeGreaterThan(DEFAULT_RATE_LIMITS.api.max);
  });

  it('should have webhook rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.webhook).toEqual({ max: 50, windowMs: 60 * 1000 });
  });

  it('should have ai rate limit (restricted)', () => {
    expect(DEFAULT_RATE_LIMITS.ai).toEqual({ max: 20, windowMs: 60 * 1000 });
    expect(DEFAULT_RATE_LIMITS.ai.max).toBeLessThan(DEFAULT_RATE_LIMITS.api.max);
  });

  it('should have export rate limit (very restricted)', () => {
    expect(DEFAULT_RATE_LIMITS.export).toEqual({ max: 10, windowMs: 60 * 1000 });
    expect(DEFAULT_RATE_LIMITS.export.max).toBeLessThan(DEFAULT_RATE_LIMITS.ai.max);
  });

  it('should have diagnostic rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.diagnostic).toEqual({ max: 30, windowMs: 60 * 1000 });
  });

  it('should have REST API v2 rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.restApiV2).toEqual({ max: 200, windowMs: 60 * 1000 });
  });

  it('should have GraphQL rate limit', () => {
    expect(DEFAULT_RATE_LIMITS.graphql).toEqual({ max: 100, windowMs: 60 * 1000 });
  });
});

describe('ENDPOINT_RATE_LIMITS', () => {
  describe('auth endpoints', () => {
    it('should have strict login rate limit', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/auth/login']).toEqual({ max: 5, windowMs: 60 * 1000 });
    });

    it('should have strict signup rate limit', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/auth/signup']).toEqual({ max: 3, windowMs: 60 * 1000 });
    });

    it('should have strict password reset rate limits', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/auth/forgot-password']).toEqual({ max: 3, windowMs: 60 * 1000 });
      expect(ENDPOINT_RATE_LIMITS['/api/auth/reset-password']).toEqual({ max: 3, windowMs: 60 * 1000 });
    });
  });

  describe('AI endpoints', () => {
    it('should have rate limits for AI scoring', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/ai.scoreLeads']).toEqual({ max: 10, windowMs: 60 * 1000 });
    });

    it('should have rate limits for AI chat', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/ai.chat']).toEqual({ max: 30, windowMs: 60 * 1000 });
    });
  });

  describe('export endpoints', () => {
    it('should have rate limits for lead export', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.export']).toEqual({ max: 5, windowMs: 60 * 1000 });
    });

    it('should have rate limits for audit log export', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/auditLogs.export']).toEqual({ max: 3, windowMs: 60 * 1000 });
    });
  });

  describe('bulk operation endpoints', () => {
    it('should have rate limits for bulk create', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkCreate']).toEqual({ max: 10, windowMs: 60 * 1000 });
    });

    it('should have stricter rate limit for bulk delete', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkDelete']).toEqual({ max: 5, windowMs: 60 * 1000 });
    });
  });

  describe('REST API v2 endpoints', () => {
    it('should have rate limits for leads endpoint', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/v2/leads']).toEqual({ max: 200, windowMs: 60 * 1000 });
    });

    it('should have rate limits for webhooks endpoint', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/v2/webhooks']).toEqual({ max: 100, windowMs: 60 * 1000 });
    });

    it('should have rate limits for analytics endpoint', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/v2/analytics']).toEqual({ max: 60, windowMs: 60 * 1000 });
    });
  });

  describe('embed endpoints', () => {
    it('should have rate limits for diagnostic embed', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/embed/v1/diagnostic']).toEqual({ max: 60, windowMs: 60 * 1000 });
    });

    it('should have rate limits for lead embed', () => {
      expect(ENDPOINT_RATE_LIMITS['/api/embed/v1/lead']).toEqual({ max: 60, windowMs: 60 * 1000 });
    });
  });
});

describe('getRateLimitConfig', () => {
  describe('exact match endpoints', () => {
    it('should return exact match config for login', () => {
      const config = getRateLimitConfig('/api/auth/login');
      expect(config).toEqual({ max: 5, windowMs: 60 * 1000 });
    });

    it('should return exact match config for REST API v2', () => {
      const config = getRateLimitConfig('/api/v2/leads');
      expect(config).toEqual({ max: 200, windowMs: 60 * 1000 });
    });
  });

  describe('prefix matching', () => {
    it('should match auth endpoints', () => {
      const config = getRateLimitConfig('/api/auth/callback/google');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.auth);
    });

    it('should match AI endpoints', () => {
      const config = getRateLimitConfig('/api/trpc/ai.someNewMethod');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.ai);
    });

    it('should match export endpoints', () => {
      // Exact match takes precedence, so /api/trpc/leads.export matches first with max: 5
      const config = getRateLimitConfig('/api/trpc/leads.export');
      expect(config).toEqual({ max: 5, windowMs: 60 * 1000 });

      // Reports export also has exact match with max: 5
      const reportsConfig = getRateLimitConfig('/api/trpc/reports.export');
      expect(reportsConfig).toEqual({ max: 5, windowMs: 60 * 1000 });
    });

    it('should match diagnostic endpoints', () => {
      const config = getRateLimitConfig('/api/diagnostic/submit');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.diagnostic);
    });

    it('should match embed endpoints', () => {
      const config = getRateLimitConfig('/api/embed/v2/widget');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.diagnostic);
    });

    it('should match GraphQL endpoint', () => {
      const config = getRateLimitConfig('/api/graphql');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.graphql);
    });

    it('should match REST API v2 prefix', () => {
      const config = getRateLimitConfig('/api/v2/custom-endpoint');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.restApiV2);
    });
  });

  describe('fallback matching', () => {
    it('should fallback to api config for unknown API endpoints', () => {
      const config = getRateLimitConfig('/api/unknown-endpoint');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.api);
    });

    it('should fallback to page config for non-API paths', () => {
      const config = getRateLimitConfig('/dashboard/leads');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.page);
    });

    it('should fallback to page config for root path', () => {
      const config = getRateLimitConfig('/');
      expect(config).toEqual(DEFAULT_RATE_LIMITS.page);
    });
  });
});

describe('getRateLimitInfo', () => {
  it('should return headers for allowed request', () => {
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

  it('should include Retry-After for blocked request', () => {
    const result: RateLimitResult = {
      allowed: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfter: 60,
    };

    const headers = getRateLimitInfo(result);

    expect(headers['X-RateLimit-Limit']).toBe('100');
    expect(headers['X-RateLimit-Remaining']).toBe('0');
    expect(headers['Retry-After']).toBe('60');
  });

  it('should not include Retry-After if not provided', () => {
    const result: RateLimitResult = {
      allowed: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 60000,
    };

    const headers = getRateLimitInfo(result);

    expect(headers['Retry-After']).toBeUndefined();
  });
});

describe('RateLimitConfig type', () => {
  it('should have required properties', () => {
    const config: RateLimitConfig = {
      max: 100,
      windowMs: 60000,
    };

    expect(config.max).toBe(100);
    expect(config.windowMs).toBe(60000);
  });

  it('should support optional skip function', () => {
    const config: RateLimitConfig = {
      max: 100,
      windowMs: 60000,
      skip: (request) => request.headers.get('X-Internal') === 'true',
    };

    expect(config.skip).toBeDefined();
  });

  it('should support optional keyGenerator', () => {
    const config: RateLimitConfig = {
      max: 100,
      windowMs: 60000,
      keyGenerator: (request) => request.headers.get('X-User-Id') || 'anonymous',
    };

    expect(config.keyGenerator).toBeDefined();
  });
});

describe('Rate limit security considerations', () => {
  it('should have stricter limits for sensitive operations', () => {
    // Auth operations should be most restricted
    expect(ENDPOINT_RATE_LIMITS['/api/auth/login'].max).toBeLessThanOrEqual(5);
    expect(ENDPOINT_RATE_LIMITS['/api/auth/signup'].max).toBeLessThanOrEqual(5);

    // Bulk delete should be restricted
    expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkDelete'].max).toBeLessThanOrEqual(10);

    // Export should be restricted
    expect(ENDPOINT_RATE_LIMITS['/api/trpc/auditLogs.export'].max).toBeLessThanOrEqual(5);
  });

  it('should have appropriate limits for public endpoints', () => {
    // Diagnostic/embed endpoints should allow reasonable traffic
    expect(ENDPOINT_RATE_LIMITS['/api/embed/v1/diagnostic'].max).toBeGreaterThanOrEqual(30);
    expect(ENDPOINT_RATE_LIMITS['/api/embed/v1/lead'].max).toBeGreaterThanOrEqual(30);
  });

  it('should have all window times set to 1 minute', () => {
    const oneMinute = 60 * 1000;

    for (const [, config] of Object.entries(DEFAULT_RATE_LIMITS)) {
      expect(config.windowMs).toBe(oneMinute);
    }

    for (const [, config] of Object.entries(ENDPOINT_RATE_LIMITS)) {
      expect(config.windowMs).toBe(oneMinute);
    }
  });
});
