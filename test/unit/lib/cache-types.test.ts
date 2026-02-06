/**
 * Cache Types Tests
 *
 * Unit tests for cache type definitions and constants
 */

import { describe, expect, it } from 'vitest';
import {
  CACHE_KEYS,
  CACHE_TTL,
  CACHE_TAGS,
  type CacheConfig,
  type CacheEntry,
  type CacheOptions,
  type CacheStats,
} from '@/lib/cache/types';

describe('CACHE_KEYS', () => {
  describe('Lead keys', () => {
    it('should generate lead key', () => {
      expect(CACHE_KEYS.lead('lead-123')).toBe('lead:lead-123');
    });

    it('should generate lead list key', () => {
      expect(CACHE_KEYS.leadList('org-123', 1)).toBe('leads:org-123:page:1');
      expect(CACHE_KEYS.leadList('org-456', 5)).toBe('leads:org-456:page:5');
    });

    it('should generate lead count key', () => {
      expect(CACHE_KEYS.leadCount('org-123')).toBe('leads:org-123:count');
    });
  });

  describe('Organization keys', () => {
    it('should generate organization key', () => {
      expect(CACHE_KEYS.organization('org-123')).toBe('org:org-123');
    });

    it('should generate organization settings key', () => {
      expect(CACHE_KEYS.organizationSettings('org-123')).toBe('org:org-123:settings');
    });

    it('should generate organization members key', () => {
      expect(CACHE_KEYS.organizationMembers('org-123')).toBe('org:org-123:members');
    });
  });

  describe('User keys', () => {
    it('should generate user key', () => {
      expect(CACHE_KEYS.user('user-123')).toBe('user:user-123');
    });

    it('should generate user permissions key', () => {
      expect(CACHE_KEYS.userPermissions('user-123', 'org-456')).toBe(
        'user:user-123:org:org-456:permissions'
      );
    });
  });

  describe('Feature flag keys', () => {
    it('should generate feature flag key', () => {
      expect(CACHE_KEYS.featureFlag('org-123', 'new-feature')).toBe('ff:org-123:new-feature');
    });

    it('should generate feature flag list key', () => {
      expect(CACHE_KEYS.featureFlagList('org-123')).toBe('ff:org-123:list');
    });
  });

  describe('Analytics keys', () => {
    it('should generate daily analytics key', () => {
      expect(CACHE_KEYS.analyticsDaily('org-123', '2024-02-06')).toBe(
        'analytics:org-123:daily:2024-02-06'
      );
    });

    it('should generate weekly analytics key', () => {
      expect(CACHE_KEYS.analyticsWeekly('org-123', '2024-W06')).toBe(
        'analytics:org-123:weekly:2024-W06'
      );
    });
  });

  describe('Diagnostic keys', () => {
    it('should generate diagnostic form key', () => {
      expect(CACHE_KEYS.diagnosticForm('form-123')).toBe('diagnostic:form:form-123');
    });

    it('should generate diagnostic results key', () => {
      expect(CACHE_KEYS.diagnosticResults('result-123')).toBe('diagnostic:results:result-123');
    });
  });

  describe('Rate limit keys', () => {
    it('should generate rate limit key', () => {
      expect(CACHE_KEYS.rateLimit('api:user-123')).toBe('ratelimit:api:user-123');
    });
  });

  describe('Session keys', () => {
    it('should generate session key', () => {
      expect(CACHE_KEYS.session('session-abc')).toBe('session:session-abc');
    });
  });
});

describe('CACHE_TTL', () => {
  it('should have VERY_SHORT as 30 seconds', () => {
    expect(CACHE_TTL.VERY_SHORT).toBe(30);
  });

  it('should have SHORT as 1 minute', () => {
    expect(CACHE_TTL.SHORT).toBe(60);
  });

  it('should have MEDIUM as 5 minutes', () => {
    expect(CACHE_TTL.MEDIUM).toBe(5 * 60);
  });

  it('should have LONG as 15 minutes', () => {
    expect(CACHE_TTL.LONG).toBe(15 * 60);
  });

  it('should have VERY_LONG as 1 hour', () => {
    expect(CACHE_TTL.VERY_LONG).toBe(60 * 60);
  });

  it('should have DAY as 24 hours', () => {
    expect(CACHE_TTL.DAY).toBe(24 * 60 * 60);
  });

  it('should have WEEK as 7 days', () => {
    expect(CACHE_TTL.WEEK).toBe(7 * 24 * 60 * 60);
  });

  it('should have increasing TTL values', () => {
    expect(CACHE_TTL.VERY_SHORT).toBeLessThan(CACHE_TTL.SHORT);
    expect(CACHE_TTL.SHORT).toBeLessThan(CACHE_TTL.MEDIUM);
    expect(CACHE_TTL.MEDIUM).toBeLessThan(CACHE_TTL.LONG);
    expect(CACHE_TTL.LONG).toBeLessThan(CACHE_TTL.VERY_LONG);
    expect(CACHE_TTL.VERY_LONG).toBeLessThan(CACHE_TTL.DAY);
    expect(CACHE_TTL.DAY).toBeLessThan(CACHE_TTL.WEEK);
  });
});

describe('CACHE_TAGS', () => {
  it('should have LEADS tag', () => {
    expect(CACHE_TAGS.LEADS).toBe('leads');
  });

  it('should have ORGANIZATIONS tag', () => {
    expect(CACHE_TAGS.ORGANIZATIONS).toBe('organizations');
  });

  it('should have USERS tag', () => {
    expect(CACHE_TAGS.USERS).toBe('users');
  });

  it('should have FEATURE_FLAGS tag', () => {
    expect(CACHE_TAGS.FEATURE_FLAGS).toBe('feature-flags');
  });

  it('should have ANALYTICS tag', () => {
    expect(CACHE_TAGS.ANALYTICS).toBe('analytics');
  });

  it('should have DIAGNOSTICS tag', () => {
    expect(CACHE_TAGS.DIAGNOSTICS).toBe('diagnostics');
  });
});

describe('Cache interface types', () => {
  describe('CacheConfig', () => {
    it('should create valid cache config', () => {
      const config: CacheConfig = {
        defaultTTL: 300,
        prefix: 'app',
        enabled: true,
      };

      expect(config.defaultTTL).toBe(300);
      expect(config.prefix).toBe('app');
      expect(config.enabled).toBe(true);
    });
  });

  describe('CacheEntry', () => {
    it('should create valid cache entry', () => {
      const now = Date.now();
      const entry: CacheEntry<{ name: string }> = {
        value: { name: 'test' },
        createdAt: now,
        expiresAt: now + 300000,
      };

      expect(entry.value.name).toBe('test');
      expect(entry.expiresAt).toBeGreaterThan(entry.createdAt);
    });

    it('should support different value types', () => {
      const stringEntry: CacheEntry<string> = {
        value: 'hello',
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
      };

      const numberEntry: CacheEntry<number> = {
        value: 42,
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
      };

      const arrayEntry: CacheEntry<string[]> = {
        value: ['a', 'b', 'c'],
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
      };

      expect(stringEntry.value).toBe('hello');
      expect(numberEntry.value).toBe(42);
      expect(arrayEntry.value).toHaveLength(3);
    });
  });

  describe('CacheOptions', () => {
    it('should create cache options with TTL', () => {
      const options: CacheOptions = {
        ttl: 600,
      };

      expect(options.ttl).toBe(600);
    });

    it('should create cache options with tags', () => {
      const options: CacheOptions = {
        tags: ['leads', 'org-123'],
      };

      expect(options.tags).toContain('leads');
      expect(options.tags).toContain('org-123');
    });

    it('should create cache options with both', () => {
      const options: CacheOptions = {
        ttl: 300,
        tags: ['analytics'],
      };

      expect(options.ttl).toBe(300);
      expect(options.tags).toHaveLength(1);
    });
  });

  describe('CacheStats', () => {
    it('should create valid cache stats', () => {
      const stats: CacheStats = {
        hits: 100,
        misses: 25,
        sets: 50,
        deletes: 10,
        hitRate: 0.8,
      };

      expect(stats.hits).toBe(100);
      expect(stats.misses).toBe(25);
      expect(stats.hitRate).toBe(0.8);
    });

    it('should calculate hit rate correctly', () => {
      const stats: CacheStats = {
        hits: 80,
        misses: 20,
        sets: 100,
        deletes: 5,
        hitRate: 80 / (80 + 20),
      };

      expect(stats.hitRate).toBe(0.8);
    });
  });
});
