/**
 * Rate Limit Middleware Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  DEFAULT_RATE_LIMITS,
  ENDPOINT_RATE_LIMITS,
  checkRateLimit,
  setRateLimitHeaders,
  getRateLimitConfig,
  getOrganizationRateLimitKey,
  getRateLimitInfo,
  type RateLimitConfig,
  type RateLimitResult,
} from '@/lib/middleware/rate-limit';

// Mock NextRequest
function createMockRequest(pathname: string, headers: Record<string, string> = {}) {
  return {
    nextUrl: { pathname },
    headers: {
      get: (key: string) => headers[key] || null,
    },
  } as any;
}

describe('DEFAULT_RATE_LIMITS', () => {
  it('should have api limit', () => {
    expect(DEFAULT_RATE_LIMITS.api.max).toBe(100);
    expect(DEFAULT_RATE_LIMITS.api.windowMs).toBe(60 * 1000);
  });

  it('should have auth limit (stricter)', () => {
    expect(DEFAULT_RATE_LIMITS.auth.max).toBe(5);
    expect(DEFAULT_RATE_LIMITS.auth.windowMs).toBe(60 * 1000);
  });

  it('should have page limit', () => {
    expect(DEFAULT_RATE_LIMITS.page.max).toBe(300);
  });

  it('should have webhook limit', () => {
    expect(DEFAULT_RATE_LIMITS.webhook.max).toBe(50);
  });

  it('should have ai limit', () => {
    expect(DEFAULT_RATE_LIMITS.ai.max).toBe(20);
  });

  it('should have export limit', () => {
    expect(DEFAULT_RATE_LIMITS.export.max).toBe(10);
  });

  it('should have upload limit', () => {
    expect(DEFAULT_RATE_LIMITS.upload.max).toBe(30);
  });

  it('should have search limit', () => {
    expect(DEFAULT_RATE_LIMITS.search.max).toBe(60);
  });

  it('should have diagnostic limit', () => {
    expect(DEFAULT_RATE_LIMITS.diagnostic.max).toBe(30);
  });

  it('should have restApiV2 limit', () => {
    expect(DEFAULT_RATE_LIMITS.restApiV2.max).toBe(200);
  });

  it('should have graphql limit', () => {
    expect(DEFAULT_RATE_LIMITS.graphql.max).toBe(100);
  });
});

describe('ENDPOINT_RATE_LIMITS', () => {
  it('should have auth endpoints with strict limits', () => {
    expect(ENDPOINT_RATE_LIMITS['/api/auth/login'].max).toBe(5);
    expect(ENDPOINT_RATE_LIMITS['/api/auth/signup'].max).toBe(3);
    expect(ENDPOINT_RATE_LIMITS['/api/auth/forgot-password'].max).toBe(3);
  });

  it('should have AI endpoints', () => {
    expect(ENDPOINT_RATE_LIMITS['/api/trpc/ai.scoreLeads'].max).toBe(10);
    expect(ENDPOINT_RATE_LIMITS['/api/trpc/ai.chat'].max).toBe(30);
  });

  it('should have export endpoints', () => {
    expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.export'].max).toBe(5);
    expect(ENDPOINT_RATE_LIMITS['/api/trpc/reports.export'].max).toBe(5);
  });

  it('should have bulk operation endpoints', () => {
    expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkCreate'].max).toBe(10);
    expect(ENDPOINT_RATE_LIMITS['/api/trpc/leads.bulkDelete'].max).toBe(5);
  });

  it('should have REST API v2 endpoints', () => {
    expect(ENDPOINT_RATE_LIMITS['/api/v2/leads'].max).toBe(200);
    expect(ENDPOINT_RATE_LIMITS['/api/v2/analytics'].max).toBe(60);
  });

  it('should have diagnostic endpoints', () => {
    expect(ENDPOINT_RATE_LIMITS['/api/diagnostic'].max).toBe(30);
    expect(ENDPOINT_RATE_LIMITS['/api/embed/v1/diagnostic'].max).toBe(60);
  });

  it('should have GraphQL endpoint', () => {
    expect(ENDPOINT_RATE_LIMITS['/api/graphql'].max).toBe(100);
  });
});

describe('checkRateLimit', () => {
  it('should allow first request', () => {
    const request = createMockRequest('/api/test', { 'x-forwarded-for': '192.168.1.1' });
    const config: RateLimitConfig = { max: 10, windowMs: 60000 };
    
    const result = checkRateLimit(request, config);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(result.limit).toBe(10);
  });

  it('should return remaining count', () => {
    const request = createMockRequest('/api/test2', { 'x-forwarded-for': '192.168.1.2' });
    const config: RateLimitConfig = { max: 5, windowMs: 60000 };
    
    // Make multiple requests
    checkRateLimit(request, config);
    checkRateLimit(request, config);
    const result = checkRateLimit(request, config);
    
    expect(result.remaining).toBe(2);
  });

  it('should use x-real-ip header', () => {
    const request = createMockRequest('/api/test3', { 'x-real-ip': '10.0.0.1' });
    const config: RateLimitConfig = { max: 10, windowMs: 60000 };
    
    const result = checkRateLimit(request, config);
    
    expect(result.allowed).toBe(true);
  });

  it('should handle unknown IP', () => {
    const request = createMockRequest('/api/test4');
    const config: RateLimitConfig = { max: 10, windowMs: 60000 };
    
    const result = checkRateLimit(request, config);
    
    expect(result.allowed).toBe(true);
  });
});

describe('setRateLimitHeaders', () => {
  it('should set rate limit headers', () => {
    const headers = new Headers();
    const result = {
      allowed: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    };
    
    setRateLimitHeaders(headers, result);
    
    expect(headers.get('X-RateLimit-Limit')).toBe('100');
    expect(headers.get('X-RateLimit-Remaining')).toBe('99');
    expect(headers.get('X-RateLimit-Reset')).toBeDefined();
  });

  it('should set Retry-After when not allowed', () => {
    const headers = new Headers();
    const result = {
      allowed: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 30000,
    };
    
    setRateLimitHeaders(headers, result);
    
    expect(headers.get('Retry-After')).toBeDefined();
  });

  it('should not set Retry-After when allowed', () => {
    const headers = new Headers();
    const result = {
      allowed: true,
      limit: 10,
      remaining: 5,
      reset: Date.now() + 30000,
    };
    
    setRateLimitHeaders(headers, result);
    
    expect(headers.get('Retry-After')).toBeNull();
  });
});

describe('getRateLimitConfig', () => {
  it('should return exact match config', () => {
    const config = getRateLimitConfig('/api/auth/login');
    expect(config.max).toBe(5);
  });

  it('should return auth config for auth paths', () => {
    const config = getRateLimitConfig('/api/auth/verify');
    expect(config.max).toBe(5);
  });

  it('should return ai config for ai paths', () => {
    const config = getRateLimitConfig('/api/trpc/ai.unknown');
    expect(config.max).toBe(20);
  });

  it('should return export config for export paths', () => {
    const config = getRateLimitConfig('/api/something/export');
    expect(config.max).toBe(10);
  });

  it('should return graphql config', () => {
    const config = getRateLimitConfig('/api/graphql');
    expect(config.max).toBe(100);
  });

  it('should return restApiV2 config', () => {
    const config = getRateLimitConfig('/api/v2/custom');
    expect(config.max).toBe(200);
  });

  it('should return diagnostic config for embed', () => {
    const config = getRateLimitConfig('/api/embed/widget');
    expect(config.max).toBe(30);
  });

  it('should return api config for generic api paths', () => {
    const config = getRateLimitConfig('/api/unknown');
    expect(config.max).toBe(100);
  });

  it('should return page config for non-api paths', () => {
    const config = getRateLimitConfig('/dashboard');
    expect(config.max).toBe(300);
  });
});

describe('getOrganizationRateLimitKey', () => {
  it('should generate key with organization', () => {
    const request = createMockRequest('/api/test', { 'x-forwarded-for': '1.2.3.4' });
    const key = getOrganizationRateLimitKey(request, 'org-123');
    
    expect(key).toContain('org:org-123');
    expect(key).toContain('1.2.3.4');
    expect(key).toContain('/api/test');
  });
});

describe('getRateLimitInfo', () => {
  it('should return header info', () => {
    const result: RateLimitResult = {
      allowed: true,
      limit: 100,
      remaining: 50,
      reset: Date.now() + 60000,
    };
    
    const info = getRateLimitInfo(result);
    
    expect(info['X-RateLimit-Limit']).toBe('100');
    expect(info['X-RateLimit-Remaining']).toBe('50');
    expect(info['X-RateLimit-Reset']).toBeDefined();
  });

  it('should include Retry-After when not allowed', () => {
    const result: RateLimitResult = {
      allowed: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 30000,
      retryAfter: 30,
    };
    
    const info = getRateLimitInfo(result);
    
    expect(info['Retry-After']).toBe('30');
  });

  it('should not include Retry-After when allowed', () => {
    const result: RateLimitResult = {
      allowed: true,
      limit: 10,
      remaining: 5,
      reset: Date.now() + 30000,
    };
    
    const info = getRateLimitInfo(result);
    
    expect(info['Retry-After']).toBeUndefined();
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
      skip: () => true,
    };
    expect(config.skip?.(createMockRequest('/test'))).toBe(true);
  });

  it('should support optional keyGenerator', () => {
    const config: RateLimitConfig = {
      max: 100,
      windowMs: 60000,
      keyGenerator: (req) => `custom:${req.nextUrl.pathname}`,
    };
    const request = createMockRequest('/test');
    expect(config.keyGenerator?.(request)).toBe('custom:/test');
  });
});
