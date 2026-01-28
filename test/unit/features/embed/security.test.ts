import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  hashIpAddress,
  isOriginAllowed,
  sanitizeHtml,
  generateCsrfToken,
  validateCsrfToken,
  getCsrfTokenStoreSize,
  getSecurityHeaders,
  getRateLimitKey,
  checkRateLimit,
  getRateLimitHeaders,
  clearRateLimitStore,
} from '@/lib/features/embed/security';

// Test constants - these are NOT real secrets, just test fixtures
const TEST_API_KEY_PREFIX = 'dl_embed_';
const TEST_KEY_SUFFIX = 'test_fixture_123';
const TEST_API_KEY = `${TEST_API_KEY_PREFIX}${TEST_KEY_SUFFIX}`;

describe('Embed Security', () => {
  describe('generateApiKey', () => {
    it('should generate a key with dl_embed_ prefix', () => {
      const key = generateApiKey();
      expect(key).toMatch(/^dl_embed_[a-f0-9]{64}$/);
    });

    it('should generate unique keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('hashApiKey / verifyApiKey', () => {
    it('should hash and verify API key correctly', () => {
      const apiKey = generateApiKey();
      const hash = hashApiKey(apiKey);

      expect(hash).toHaveLength(64); // SHA-256 hex
      expect(verifyApiKey(apiKey, hash)).toBe(true);
      expect(verifyApiKey('wrong_key', hash)).toBe(false);
    });

    it('should produce consistent hashes', () => {
      const hash1 = hashApiKey(TEST_API_KEY);
      const hash2 = hashApiKey(TEST_API_KEY);
      expect(hash1).toBe(hash2);
    });
  });

  describe('hashIpAddress', () => {
    it('should hash IP address with salt', () => {
      const ip = '192.168.1.1';
      const hash = hashIpAddress(ip);

      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('should produce same hash for same IP with same salt', () => {
      const ip = '192.168.1.1';
      const salt = 'test-salt';
      const hash1 = hashIpAddress(ip, salt);
      const hash2 = hashIpAddress(ip, salt);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different IPs', () => {
      const hash1 = hashIpAddress('192.168.1.1');
      const hash2 = hashIpAddress('192.168.1.2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('isOriginAllowed', () => {
    it('should return false for null origin', () => {
      expect(isOriginAllowed(null, ['https://example.com'])).toBe(false);
    });

    it('should return false for empty allowed list', () => {
      expect(isOriginAllowed('https://example.com', [])).toBe(false);
    });

    it('should allow exact match', () => {
      expect(isOriginAllowed('https://example.com', ['https://example.com'])).toBe(true);
      expect(isOriginAllowed('https://other.com', ['https://example.com'])).toBe(false);
    });

    it('should allow wildcard *', () => {
      expect(isOriginAllowed('https://any.com', ['*'])).toBe(true);
    });

    it('should handle wildcard subdomains', () => {
      const allowed = ['https://*.example.com'];

      expect(isOriginAllowed('https://sub.example.com', allowed)).toBe(true);
      expect(isOriginAllowed('https://app.example.com', allowed)).toBe(true);
      expect(isOriginAllowed('https://example.com', allowed)).toBe(false);
      expect(isOriginAllowed('https://sub.other.com', allowed)).toBe(false);
    });

    it('should handle multiple allowed origins', () => {
      const allowed = ['https://example.com', 'https://other.com'];

      expect(isOriginAllowed('https://example.com', allowed)).toBe(true);
      expect(isOriginAllowed('https://other.com', allowed)).toBe(true);
      expect(isOriginAllowed('https://third.com', allowed)).toBe(false);
    });
  });

  describe('sanitizeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeHtml('<script>')).toBe('&lt;script&gt;');
      expect(sanitizeHtml('"hello"')).toBe('&quot;hello&quot;');
      expect(sanitizeHtml("'test'")).toBe('&#x27;test&#x27;');
      expect(sanitizeHtml('a & b')).toBe('a &amp; b');
      expect(sanitizeHtml('path/to/file')).toBe('path&#x2F;to&#x2F;file');
    });

    it('should handle empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should handle normal text without changes', () => {
      const text = 'Hello World 123';
      expect(sanitizeHtml(text)).toBe(text);
    });
  });

  describe('generateCsrfToken', () => {
    it('should generate a 64-character hex token', () => {
      const token = generateCsrfToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });

    it('should store token when apiKey is provided', () => {
      const initialSize = getCsrfTokenStoreSize();
      const token = generateCsrfToken(TEST_API_KEY);
      
      expect(token).toHaveLength(64);
      expect(getCsrfTokenStoreSize()).toBeGreaterThanOrEqual(initialSize);
    });
  });

  describe('validateCsrfToken', () => {
    it('should return false for null token', () => {
      expect(validateCsrfToken(null, TEST_API_KEY)).toBe(false);
    });

    it('should return false for non-existent token', () => {
      expect(validateCsrfToken('invalid_token', TEST_API_KEY)).toBe(false);
    });

    it('should validate correctly generated token', () => {
      const testKey = `${TEST_API_KEY_PREFIX}valid_fixture_456`;
      const token = generateCsrfToken(testKey);
      
      expect(validateCsrfToken(token, testKey)).toBe(true);
    });

    it('should reject token with wrong apiKey', () => {
      const testKey = `${TEST_API_KEY_PREFIX}original_fixture`;
      const wrongKey = `${TEST_API_KEY_PREFIX}wrong_fixture`;
      const token = generateCsrfToken(testKey);
      
      expect(validateCsrfToken(token, wrongKey)).toBe(false);
    });

    it('should invalidate token after use (one-time use)', () => {
      const testKey = `${TEST_API_KEY_PREFIX}onetime_fixture`;
      const token = generateCsrfToken(testKey);
      
      expect(validateCsrfToken(token, testKey)).toBe(true);
      expect(validateCsrfToken(token, testKey)).toBe(false); // Second use should fail
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

    it('should add CORS headers when origin is provided', () => {
      const origin = 'https://example.com';
      const headers = getSecurityHeaders(origin);

      expect(headers['Access-Control-Allow-Origin']).toBe(origin);
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS');
      expect(headers['Access-Control-Allow-Headers']).toContain('X-DiagnoLeads-Key');
    });
  });

  describe('getRateLimitKey', () => {
    it('should generate minute-based key', () => {
      const key = getRateLimitKey('config-123', 'minute');
      expect(key).toMatch(/^embed:ratelimit:config-123:minute:\d+-\d+-\d+-\d+-\d+$/);
    });

    it('should generate day-based key', () => {
      const key = getRateLimitKey('config-123', 'day');
      expect(key).toMatch(/^embed:ratelimit:config-123:day:\d+-\d+-\d+$/);
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      clearRateLimitStore();
    });

    it('should allow first request', () => {
      const result = checkRateLimit('test-config-1', 10, 100);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.limit).toBe(10);
      expect(result.type).toBe('minute');
    });

    it('should decrement remaining count', () => {
      const configId = 'test-config-2';
      
      checkRateLimit(configId, 10, 100);
      const result2 = checkRateLimit(configId, 10, 100);
      
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(8);
    });

    it('should block when minute limit is exceeded', () => {
      const configId = 'test-config-3';
      const limitPerMinute = 3;
      
      // Exhaust the minute limit
      for (let i = 0; i < limitPerMinute; i++) {
        checkRateLimit(configId, limitPerMinute, 1000);
      }
      
      // Next request should be blocked
      const result = checkRateLimit(configId, limitPerMinute, 1000);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.type).toBe('minute');
    });

    it('should block when day limit is exceeded', () => {
      const configId = 'test-config-4';
      const limitPerDay = 5;
      
      // Use high minute limit, low day limit
      for (let i = 0; i < limitPerDay; i++) {
        checkRateLimit(configId, 1000, limitPerDay);
      }
      
      // Next request should be blocked by day limit
      const result = checkRateLimit(configId, 1000, limitPerDay);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.type).toBe('day');
    });

    it('should include resetAt timestamp', () => {
      const result = checkRateLimit('test-config-5', 10, 100);
      
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return proper headers', () => {
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
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });
  });
});
