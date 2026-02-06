/**
 * Embed Security Tests
 *
 * Unit tests for embed widget security utilities
 */

import { describe, expect, it, beforeEach } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  hashIpAddress,
  isOriginAllowed,
  sanitizeHtml,
  generateCsrfToken,
  validateCsrfToken,
  getSecurityHeaders,
  getRateLimitKey,
  checkRateLimit,
  getRateLimitHeaders,
  clearRateLimitStore,
  getCsrfTokenStoreSize,
} from '@/lib/features/embed/security';

describe('generateApiKey', () => {
  it('should generate API key with correct prefix', () => {
    const key = generateApiKey();
    expect(key.startsWith('dl_embed_')).toBe(true);
  });

  it('should generate 64 character hex after prefix', () => {
    const key = generateApiKey();
    const hexPart = key.replace('dl_embed_', '');
    expect(hexPart.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(hexPart)).toBe(true);
  });

  it('should generate unique keys', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateApiKey());
    }
    expect(keys.size).toBe(100);
  });
});

describe('hashApiKey', () => {
  it('should produce consistent hash for same input', () => {
    const key = 'dl_embed_test123';
    const hash1 = hashApiKey(key);
    const hash2 = hashApiKey(key);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hash for different input', () => {
    const hash1 = hashApiKey('key1');
    const hash2 = hashApiKey('key2');
    expect(hash1).not.toBe(hash2);
  });

  it('should produce 64 character hex hash', () => {
    const hash = hashApiKey('test');
    expect(hash.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });
});

describe('verifyApiKey', () => {
  it('should verify correct API key', () => {
    const key = generateApiKey();
    const hash = hashApiKey(key);
    expect(verifyApiKey(key, hash)).toBe(true);
  });

  it('should reject incorrect API key', () => {
    const key = generateApiKey();
    const hash = hashApiKey(key);
    expect(verifyApiKey('wrong-key', hash)).toBe(false);
  });
});

describe('hashIpAddress', () => {
  it('should hash IP address consistently', () => {
    const ip = '192.168.1.1';
    const hash1 = hashIpAddress(ip, 'test-salt');
    const hash2 = hashIpAddress(ip, 'test-salt');
    expect(hash1).toBe(hash2);
  });

  it('should produce different hash with different salt', () => {
    const ip = '192.168.1.1';
    const hash1 = hashIpAddress(ip, 'salt1');
    const hash2 = hashIpAddress(ip, 'salt2');
    expect(hash1).not.toBe(hash2);
  });

  it('should produce 16 character hash', () => {
    const hash = hashIpAddress('10.0.0.1', 'salt');
    expect(hash.length).toBe(16);
  });
});

describe('isOriginAllowed', () => {
  it('should allow exact match', () => {
    expect(isOriginAllowed('https://example.com', ['https://example.com'])).toBe(true);
  });

  it('should reject non-matching origin', () => {
    expect(isOriginAllowed('https://other.com', ['https://example.com'])).toBe(false);
  });

  it('should allow wildcard subdomain', () => {
    expect(isOriginAllowed('https://app.example.com', ['https://*.example.com'])).toBe(true);
    expect(isOriginAllowed('https://api.example.com', ['https://*.example.com'])).toBe(true);
  });

  it('should reject non-matching wildcard', () => {
    expect(isOriginAllowed('https://example.com', ['https://*.example.com'])).toBe(false);
    expect(isOriginAllowed('https://other.com', ['https://*.example.com'])).toBe(false);
  });

  it('should allow any origin with *', () => {
    expect(isOriginAllowed('https://any.com', ['*'])).toBe(true);
    expect(isOriginAllowed('http://localhost:3000', ['*'])).toBe(true);
  });

  it('should reject null origin', () => {
    expect(isOriginAllowed(null, ['https://example.com'])).toBe(false);
  });

  it('should reject with empty allowed list', () => {
    expect(isOriginAllowed('https://example.com', [])).toBe(false);
  });

  it('should check multiple allowed origins', () => {
    const allowed = ['https://example.com', 'https://app.example.com'];
    expect(isOriginAllowed('https://example.com', allowed)).toBe(true);
    expect(isOriginAllowed('https://app.example.com', allowed)).toBe(true);
    expect(isOriginAllowed('https://other.com', allowed)).toBe(false);
  });
});

describe('sanitizeHtml', () => {
  it('should escape HTML tags', () => {
    expect(sanitizeHtml('<script>')).toBe('&lt;script&gt;');
    expect(sanitizeHtml('<div class="test">')).toBe('&lt;div class=&quot;test&quot;&gt;');
  });

  it('should escape ampersands', () => {
    expect(sanitizeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('should escape quotes', () => {
    expect(sanitizeHtml('"hello"')).toBe('&quot;hello&quot;');
    expect(sanitizeHtml("'hello'")).toBe('&#x27;hello&#x27;');
  });

  it('should escape forward slashes', () => {
    expect(sanitizeHtml('</script>')).toBe('&lt;&#x2F;script&gt;');
  });

  it('should handle normal text', () => {
    expect(sanitizeHtml('Hello World')).toBe('Hello World');
  });
});

describe('CSRF token', () => {
  it('should generate token', () => {
    const token = generateCsrfToken();
    expect(token.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it('should validate token with matching API key', () => {
    const apiKey = 'test-api-key';
    const token = generateCsrfToken(apiKey);
    expect(validateCsrfToken(token, apiKey)).toBe(true);
  });

  it('should reject token with wrong API key', () => {
    const apiKey = 'test-api-key';
    const token = generateCsrfToken(apiKey);
    expect(validateCsrfToken(token, 'wrong-api-key')).toBe(false);
  });

  it('should reject null token', () => {
    expect(validateCsrfToken(null, 'api-key')).toBe(false);
  });

  it('should reject non-existent token', () => {
    expect(validateCsrfToken('non-existent-token', 'api-key')).toBe(false);
  });

  it('should invalidate token after use', () => {
    const apiKey = 'test-api-key';
    const token = generateCsrfToken(apiKey);
    expect(validateCsrfToken(token, apiKey)).toBe(true);
    expect(validateCsrfToken(token, apiKey)).toBe(false);
  });
});

describe('getSecurityHeaders', () => {
  it('should return base security headers', () => {
    const headers = getSecurityHeaders(null);
    expect(headers['Content-Security-Policy']).toBeDefined();
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(headers['X-XSS-Protection']).toBe('1; mode=block');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should include CORS headers with origin', () => {
    const headers = getSecurityHeaders('https://example.com');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com');
    expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS');
    expect(headers['Access-Control-Allow-Headers']).toContain('X-DiagnoLeads-Key');
  });
});

describe('Rate limiting', () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  describe('getRateLimitKey', () => {
    it('should generate minute key', () => {
      const key = getRateLimitKey('config-123', 'minute');
      expect(key).toMatch(/^embed:ratelimit:config-123:minute:\d+-\d+-\d+-\d+-\d+$/);
    });

    it('should generate day key', () => {
      const key = getRateLimitKey('config-123', 'day');
      expect(key).toMatch(/^embed:ratelimit:config-123:day:\d+-\d+-\d+$/);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit('config-1', 10, 100);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should decrement remaining count', () => {
      checkRateLimit('config-2', 10, 100);
      const result = checkRateLimit('config-2', 10, 100);
      expect(result.remaining).toBe(8);
    });

    it('should block when minute limit exceeded', () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit('config-3', 5, 100);
      }
      const result = checkRateLimit('config-3', 5, 100);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.type).toBe('minute');
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return rate limit headers', () => {
      const result = {
        allowed: true,
        remaining: 5,
        limit: 10,
        resetAt: Date.now() + 60000,
        type: 'minute' as const,
      };
      const headers = getRateLimitHeaders(result);
      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('5');
      expect(headers['X-RateLimit-Type']).toBe('minute');
    });
  });
});

describe('getCsrfTokenStoreSize', () => {
  it('should return store size', () => {
    const size = getCsrfTokenStoreSize();
    expect(typeof size).toBe('number');
  });
});
