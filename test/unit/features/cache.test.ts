/**
 * Cache Tests
 *
 * Unit tests for the caching system
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCacheClient,
  resetCacheInstance,
  getCache,
  type CacheClient,
} from '@/lib/cache/client';
import {
  cacheAside,
  cacheAsideWithLock,
  invalidatePattern,
  invalidateKeys,
  batchGet,
  batchSet,
  memoize,
} from '@/lib/cache/helpers';
import { CACHE_KEYS, CACHE_TTL, CACHE_TAGS } from '@/lib/cache/types';

describe('Cache Client', () => {
  let cache: CacheClient;

  beforeEach(() => {
    resetCacheInstance();
    cache = createCacheClient({ prefix: 'test', defaultTTL: 60 });
  });

  afterEach(async () => {
    await cache.flush();
  });

  describe('basic operations', () => {
    it('should set and get a value', async () => {
      await cache.set('key1', { name: 'test' });
      const value = await cache.get<{ name: string }>('key1');

      expect(value).toEqual({ name: 'test' });
    });

    it('should return null for non-existent key', async () => {
      const value = await cache.get('nonexistent');
      expect(value).toBeNull();
    });

    it('should delete a key', async () => {
      await cache.set('key1', 'value1');
      await cache.del('key1');
      const value = await cache.get('key1');

      expect(value).toBeNull();
    });

    it('should check if key exists', async () => {
      await cache.set('key1', 'value1');

      expect(await cache.exists('key1')).toBe(true);
      expect(await cache.exists('nonexistent')).toBe(false);
    });

    it('should return TTL for a key', async () => {
      await cache.set('key1', 'value1', { ttl: 100 });
      const ttl = await cache.ttl('key1');

      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(100);
    });

    it('should return -2 for non-existent key TTL', async () => {
      const ttl = await cache.ttl('nonexistent');
      expect(ttl).toBe(-2);
    });
  });

  describe('pattern operations', () => {
    it('should delete keys by pattern', async () => {
      await cache.set('user:1', 'data1');
      await cache.set('user:2', 'data2');
      await cache.set('org:1', 'data3');

      const deleted = await cache.delPattern('user:*');

      expect(deleted).toBe(2);
      expect(await cache.get('user:1')).toBeNull();
      expect(await cache.get('user:2')).toBeNull();
      expect(await cache.get('org:1')).not.toBeNull();
    });

    it('should find keys by pattern', async () => {
      await cache.set('user:1', 'data1');
      await cache.set('user:2', 'data2');
      await cache.set('org:1', 'data3');

      const keys = await cache.keys('user:*');

      expect(keys).toHaveLength(2);
      expect(keys).toContain('user:1');
      expect(keys).toContain('user:2');
    });
  });

  describe('flush', () => {
    it('should clear all keys', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      await cache.flush();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
    });
  });

  describe('stats', () => {
    it('should track cache statistics', async () => {
      await cache.set('key1', 'value1');
      await cache.get('key1'); // hit
      await cache.get('nonexistent'); // miss

      const stats = cache.getStats();

      expect(stats.sets).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });
  });

  describe('TTL expiration', () => {
    it('should expire keys after TTL', async () => {
      vi.useFakeTimers();

      await cache.set('expiring', 'value', { ttl: 1 });
      expect(await cache.get('expiring')).toBe('value');

      // Advance time by 2 seconds
      vi.advanceTimersByTime(2000);

      expect(await cache.get('expiring')).toBeNull();

      vi.useRealTimers();
    });
  });
});

describe('Cache Helpers', () => {
  let cache: CacheClient;

  beforeEach(() => {
    resetCacheInstance();
    cache = getCache();
  });

  afterEach(async () => {
    await cache.flush();
  });

  describe('cacheAside', () => {
    it('should return cached value if exists', async () => {
      await cache.set('key1', { cached: true });

      const fetcher = vi.fn().mockResolvedValue({ cached: false });
      const result = await cacheAside('key1', fetcher);

      expect(result).toEqual({ cached: true });
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not in cache', async () => {
      const fetcher = vi.fn().mockResolvedValue({ fetched: true });
      const result = await cacheAside('key1', fetcher);

      expect(result).toEqual({ fetched: true });
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Verify it was cached
      const cached = await cache.get('key1');
      expect(cached).toEqual({ fetched: true });
    });
  });

  describe('cacheAsideWithLock', () => {
    it('should prevent concurrent fetches (cache stampede)', async () => {
      const fetcher = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { data: 'value' };
      });

      // Start multiple concurrent requests
      const results = await Promise.all([
        cacheAsideWithLock('lock-key', fetcher),
        cacheAsideWithLock('lock-key', fetcher),
        cacheAsideWithLock('lock-key', fetcher),
      ]);

      // All should get the same result
      expect(results).toEqual([{ data: 'value' }, { data: 'value' }, { data: 'value' }]);

      // But fetcher should only be called once
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate keys matching pattern', async () => {
      await cache.set('leads:org1:1', 'data1');
      await cache.set('leads:org1:2', 'data2');
      await cache.set('leads:org2:1', 'data3');

      const count = await invalidatePattern('leads:org1:*');

      expect(count).toBe(2);
      expect(await cache.get('leads:org1:1')).toBeNull();
      expect(await cache.get('leads:org2:1')).not.toBeNull();
    });
  });

  describe('invalidateKeys', () => {
    it('should invalidate specific keys', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      await invalidateKeys(['key1', 'key3']);

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).not.toBeNull();
      expect(await cache.get('key3')).toBeNull();
    });
  });

  describe('batchGet', () => {
    it('should get multiple keys at once', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      const results = await batchGet<string>(['key1', 'key2', 'key3']);

      expect(results.get('key1')).toBe('value1');
      expect(results.get('key2')).toBe('value2');
      expect(results.get('key3')).toBeNull();
    });
  });

  describe('batchSet', () => {
    it('should set multiple keys at once', async () => {
      await batchSet([
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ]);

      expect(await cache.get('key1')).toBe('value1');
      expect(await cache.get('key2')).toBe('value2');
    });
  });

  describe('memoize', () => {
    it('should memoize function results', async () => {
      const expensive = vi.fn().mockImplementation(async (a: number, b: number) => a + b);

      const memoized = memoize(expensive, (a, b) => `sum:${a}:${b}`);

      const result1 = await memoized(1, 2);
      const result2 = await memoized(1, 2);
      const result3 = await memoized(2, 3);

      expect(result1).toBe(3);
      expect(result2).toBe(3);
      expect(result3).toBe(5);

      // Should only call expensive for unique args
      expect(expensive).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Cache Keys', () => {
  it('should generate correct lead keys', () => {
    expect(CACHE_KEYS.lead('lead-123')).toBe('lead:lead-123');
    expect(CACHE_KEYS.leadList('org-1', 1)).toBe('leads:org-1:page:1');
    expect(CACHE_KEYS.leadCount('org-1')).toBe('leads:org-1:count');
  });

  it('should generate correct organization keys', () => {
    expect(CACHE_KEYS.organization('org-1')).toBe('org:org-1');
    expect(CACHE_KEYS.organizationSettings('org-1')).toBe('org:org-1:settings');
    expect(CACHE_KEYS.organizationMembers('org-1')).toBe('org:org-1:members');
  });

  it('should generate correct user keys', () => {
    expect(CACHE_KEYS.user('user-1')).toBe('user:user-1');
    expect(CACHE_KEYS.userPermissions('user-1', 'org-1')).toBe('user:user-1:org:org-1:permissions');
  });

  it('should generate correct feature flag keys', () => {
    expect(CACHE_KEYS.featureFlag('org-1', 'dark-mode')).toBe('ff:org-1:dark-mode');
    expect(CACHE_KEYS.featureFlagList('org-1')).toBe('ff:org-1:list');
  });
});

describe('Cache TTL', () => {
  it('should have correct TTL values', () => {
    expect(CACHE_TTL.VERY_SHORT).toBe(30);
    expect(CACHE_TTL.SHORT).toBe(60);
    expect(CACHE_TTL.MEDIUM).toBe(300);
    expect(CACHE_TTL.LONG).toBe(900);
    expect(CACHE_TTL.VERY_LONG).toBe(3600);
    expect(CACHE_TTL.DAY).toBe(86400);
    expect(CACHE_TTL.WEEK).toBe(604800);
  });
});

describe('Cache Tags', () => {
  it('should have correct tag values', () => {
    expect(CACHE_TAGS.LEADS).toBe('leads');
    expect(CACHE_TAGS.ORGANIZATIONS).toBe('organizations');
    expect(CACHE_TAGS.USERS).toBe('users');
    expect(CACHE_TAGS.FEATURE_FLAGS).toBe('feature-flags');
    expect(CACHE_TAGS.ANALYTICS).toBe('analytics');
    expect(CACHE_TAGS.DIAGNOSTICS).toBe('diagnostics');
  });
});
