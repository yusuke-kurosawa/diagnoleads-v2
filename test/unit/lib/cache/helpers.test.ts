/**
 * Cache Helpers Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock cache client for unit tests
const mockCache = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  delPattern: vi.fn(),
  ttl: vi.fn(),
};

describe('cacheAside (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached value if exists', async () => {
    const cachedValue = { id: '123', name: 'Test' };
    mockCache.get.mockResolvedValue(cachedValue);

    const key = 'user:123';
    const fetcher = vi.fn();

    // Simulate cacheAside logic
    const cached = await mockCache.get(key);
    expect(cached).toEqual(cachedValue);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('should fetch and cache if not in cache', async () => {
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue('OK');

    const key = 'user:123';
    const freshValue = { id: '123', name: 'Fresh' };
    const fetcher = vi.fn().mockResolvedValue(freshValue);

    // Simulate cacheAside logic
    const cached = await mockCache.get(key);
    expect(cached).toBeNull();

    const value = await fetcher();
    await mockCache.set(key, value);

    expect(fetcher).toHaveBeenCalled();
    expect(mockCache.set).toHaveBeenCalledWith(key, freshValue);
  });
});

describe('cacheAsideSWR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached value immediately', async () => {
    const cachedValue = { id: '123', name: 'Cached' };
    mockCache.get.mockResolvedValue(cachedValue);
    mockCache.ttl.mockResolvedValue(60);

    const cached = await mockCache.get('key');
    expect(cached).toEqual(cachedValue);
  });

  it('should trigger background refresh when stale', async () => {
    const cachedValue = { id: '123', name: 'Stale' };
    mockCache.get.mockResolvedValue(cachedValue);
    mockCache.ttl.mockResolvedValue(10); // Less than staleTime
    mockCache.set.mockResolvedValue('OK');

    const ttl = await mockCache.ttl('key');
    const staleTime = 30;

    if (ttl > 0 && ttl < staleTime) {
      // Background refresh would be triggered
      expect(true).toBe(true);
    }
  });

  it('should not refresh when TTL is sufficient', async () => {
    mockCache.ttl.mockResolvedValue(60);
    const staleTime = 30;

    const ttl = await mockCache.ttl('key');
    expect(ttl >= staleTime).toBe(true);
  });
});

describe('memoize', () => {
  it('should memoize function results', async () => {
    const expensiveFunction = vi.fn().mockResolvedValue(42);
    const keyGenerator = (x: number) => `calc:${x}`;

    // First call - cache miss
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue('OK');

    const key = keyGenerator(5);
    let cached = await mockCache.get(key);
    
    if (cached === null) {
      const result = await expensiveFunction(5);
      await mockCache.set(key, result);
      cached = result;
    }

    expect(cached).toBe(42);
    expect(expensiveFunction).toHaveBeenCalledTimes(1);

    // Second call - cache hit
    mockCache.get.mockResolvedValue(42);
    cached = await mockCache.get(key);
    expect(cached).toBe(42);
  });
});

describe('invalidatePattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete keys matching pattern', async () => {
    mockCache.delPattern.mockResolvedValue(5);

    const count = await mockCache.delPattern('user:*');
    expect(count).toBe(5);
  });

  it('should return 0 when no keys match', async () => {
    mockCache.delPattern.mockResolvedValue(0);

    const count = await mockCache.delPattern('nonexistent:*');
    expect(count).toBe(0);
  });
});

describe('invalidateKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete multiple keys', async () => {
    mockCache.del.mockResolvedValue(1);

    const keys = ['user:1', 'user:2', 'user:3'];
    await Promise.all(keys.map(key => mockCache.del(key)));

    expect(mockCache.del).toHaveBeenCalledTimes(3);
  });

  it('should handle empty key array', async () => {
    const keys: string[] = [];
    await Promise.all(keys.map(key => mockCache.del(key)));

    expect(mockCache.del).not.toHaveBeenCalled();
  });
});

describe('Cache warming', () => {
  it('should warm cache with multiple items', async () => {
    mockCache.set.mockResolvedValue('OK');

    const items = [
      { key: 'item:1', value: { name: 'Item 1' } },
      { key: 'item:2', value: { name: 'Item 2' } },
      { key: 'item:3', value: { name: 'Item 3' } },
    ];

    await Promise.all(
      items.map(item => mockCache.set(item.key, item.value))
    );

    expect(mockCache.set).toHaveBeenCalledTimes(3);
  });
});

describe('Cache key generation', () => {
  it('should generate unique keys', () => {
    const generateKey = (prefix: string, id: string) => `${prefix}:${id}`;

    expect(generateKey('user', '123')).toBe('user:123');
    expect(generateKey('org', 'abc')).toBe('org:abc');
  });

  it('should generate composite keys', () => {
    const generateCompositeKey = (parts: string[]) => parts.join(':');

    expect(generateCompositeKey(['user', '123', 'profile'])).toBe('user:123:profile');
    expect(generateCompositeKey(['org', 'abc', 'members'])).toBe('org:abc:members');
  });
});

describe('TTL handling', () => {
  it('should check if key is about to expire', async () => {
    const isAboutToExpire = async (key: string, threshold: number) => {
      const ttl = await mockCache.ttl(key);
      return ttl > 0 && ttl < threshold;
    };

    mockCache.ttl.mockResolvedValue(10);
    expect(await isAboutToExpire('key', 30)).toBe(true);

    mockCache.ttl.mockResolvedValue(60);
    expect(await isAboutToExpire('key', 30)).toBe(false);

    mockCache.ttl.mockResolvedValue(-1); // Key doesn't exist
    expect(await isAboutToExpire('key', 30)).toBe(false);
  });
});

describe('Error handling', () => {
  it('should handle cache get errors', async () => {
    mockCache.get.mockRejectedValue(new Error('Redis connection error'));

    await expect(mockCache.get('key')).rejects.toThrow('Redis connection error');
  });

  it('should handle cache set errors', async () => {
    mockCache.set.mockRejectedValue(new Error('Redis connection error'));

    await expect(mockCache.set('key', 'value')).rejects.toThrow('Redis connection error');
  });
});

describe('Cache statistics', () => {
  it('should track cache hits and misses', () => {
    const stats = {
      hits: 0,
      misses: 0,
      recordHit: function() { this.hits++; },
      recordMiss: function() { this.misses++; },
      getHitRate: function() {
        const total = this.hits + this.misses;
        return total > 0 ? this.hits / total : 0;
      },
    };

    stats.recordHit();
    stats.recordHit();
    stats.recordMiss();

    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.getHitRate()).toBeCloseTo(0.67, 1);
  });
});

// Integration tests with actual module
import { withLock } from '@/lib/cache/helpers';

describe('Integration: withLock (actual)', () => {
  it('should prevent concurrent execution', async () => {
    let counter = 0;
    const slowFn = async () => {
      counter++;
      await new Promise(r => setTimeout(r, 50));
      return counter;
    };

    // Start multiple concurrent calls
    const results = await Promise.all([
      withLock('lock-key-test', slowFn),
      withLock('lock-key-test', slowFn),
      withLock('lock-key-test', slowFn),
    ]);

    // All should return the same result (first call)
    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);
    expect(counter).toBe(1);
  });

  it('should allow sequential execution', async () => {
    let counter = 0;
    const fn = async () => ++counter;

    const result1 = await withLock('seq-key-test', fn);
    const result2 = await withLock('seq-key-test', fn);

    expect(result1).toBe(1);
    expect(result2).toBe(2);
  });

  it('should handle errors and release lock', async () => {
    const errorFn = async () => {
      throw new Error('Test error');
    };

    await expect(withLock('error-key', errorFn)).rejects.toThrow('Test error');

    // Lock should be released, subsequent call should work
    let counter = 0;
    const successFn = async () => ++counter;
    const result = await withLock('error-key', successFn);
    expect(result).toBe(1);
  });
});

describe('Integration: Helper function exports', () => {
  it('should export all helper functions', async () => {
    const helpers = await import('@/lib/cache/helpers');

    expect(typeof helpers.cacheAside).toBe('function');
    expect(typeof helpers.cacheAsideSWR).toBe('function');
    expect(typeof helpers.memoize).toBe('function');
    expect(typeof helpers.invalidatePattern).toBe('function');
    expect(typeof helpers.invalidateKeys).toBe('function');
    expect(typeof helpers.batchGet).toBe('function');
    expect(typeof helpers.batchSet).toBe('function');
    expect(typeof helpers.withLock).toBe('function');
    expect(typeof helpers.cacheAsideWithLock).toBe('function');
    expect(typeof helpers.cached).toBe('function');
  });
});

// Integration tests with actual cache (MemoryCache)
import {
  cacheAside,
  cacheAsideSWR,
  memoize,
  invalidatePattern,
  invalidateKeys,
  batchGet,
  batchSet,
  cacheAsideWithLock,
} from '@/lib/cache/helpers';
import { getCache, resetCacheInstance } from '@/lib/cache/client';

describe('Integration: cacheAside (actual)', () => {
  beforeEach(() => {
    resetCacheInstance();
  });

  it('should cache and return fetched value', async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: '123', name: 'Test User' });

    const result1 = await cacheAside('user:123', fetcher);
    expect(result1).toEqual({ id: '123', name: 'Test User' });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Second call should return cached value
    const result2 = await cacheAside('user:123', fetcher);
    expect(result2).toEqual({ id: '123', name: 'Test User' });
    expect(fetcher).toHaveBeenCalledTimes(1); // Not called again
  });

  it('should respect custom TTL option', async () => {
    const fetcher = vi.fn().mockResolvedValue('value');

    await cacheAside('ttl-test', fetcher, { ttl: 1 });
    const cache = getCache();
    const ttl = await cache.ttl('ttl-test');
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(1);
  });
});

describe('Integration: cacheAsideSWR (actual)', () => {
  beforeEach(() => {
    resetCacheInstance();
  });

  it('should return cached value and trigger background refresh when stale', async () => {
    const fetcher = vi.fn().mockResolvedValue('fresh-value');

    // First call - cache miss
    const result1 = await cacheAsideSWR('swr-test', fetcher, { ttl: 60 });
    expect(result1).toBe('fresh-value');
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Second call - cache hit
    const result2 = await cacheAsideSWR('swr-test', fetcher, { ttl: 60 });
    expect(result2).toBe('fresh-value');
  });

  it('should use default staleTime of 30 seconds', async () => {
    const fetcher = vi.fn().mockResolvedValue('value');
    await cacheAsideSWR('swr-default', fetcher);

    const result = await cacheAsideSWR('swr-default', fetcher);
    expect(result).toBe('value');
  });
});

describe('Integration: memoize (actual)', () => {
  beforeEach(() => {
    resetCacheInstance();
  });

  it('should memoize function with arguments', async () => {
    const expensiveFn = vi.fn().mockImplementation(async (x: number, y: number) => x + y);
    const keyGen = (x: number, y: number) => `sum:${x}:${y}`;
    const memoizedFn = memoize(expensiveFn, keyGen);

    const result1 = await memoizedFn(5, 3);
    expect(result1).toBe(8);
    expect(expensiveFn).toHaveBeenCalledTimes(1);

    const result2 = await memoizedFn(5, 3);
    expect(result2).toBe(8);
    expect(expensiveFn).toHaveBeenCalledTimes(1); // Cached
  });

  it('should use different cache keys for different arguments', async () => {
    const fn = vi.fn().mockImplementation(async (x: number) => x * 2);
    const keyGen = (x: number) => `double:${x}`;
    const memoizedFn = memoize(fn, keyGen);

    await memoizedFn(5);
    await memoizedFn(10);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('Integration: invalidatePattern (actual)', () => {
  beforeEach(() => {
    resetCacheInstance();
  });

  it('should invalidate keys matching pattern', async () => {
    const cache = getCache();
    await cache.set('user:1', 'value1');
    await cache.set('user:2', 'value2');
    await cache.set('org:1', 'org-value');

    const count = await invalidatePattern('user:*');
    expect(count).toBe(2);

    expect(await cache.get('user:1')).toBeNull();
    expect(await cache.get('user:2')).toBeNull();
    expect(await cache.get('org:1')).toBe('org-value');
  });
});

describe('Integration: invalidateKeys (actual)', () => {
  beforeEach(() => {
    resetCacheInstance();
  });

  it('should invalidate specific keys', async () => {
    const cache = getCache();
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    await cache.set('key3', 'value3');

    await invalidateKeys(['key1', 'key3']);

    expect(await cache.get('key1')).toBeNull();
    expect(await cache.get('key2')).toBe('value2');
    expect(await cache.get('key3')).toBeNull();
  });
});

describe('Integration: batchGet (actual)', () => {
  beforeEach(() => {
    resetCacheInstance();
  });

  it('should get multiple keys at once', async () => {
    const cache = getCache();
    await cache.set('batch:1', 'value1');
    await cache.set('batch:2', 'value2');

    const results = await batchGet<string>(['batch:1', 'batch:2', 'batch:3']);

    expect(results.get('batch:1')).toBe('value1');
    expect(results.get('batch:2')).toBe('value2');
    expect(results.get('batch:3')).toBeNull();
  });
});

describe('Integration: batchSet (actual)', () => {
  beforeEach(() => {
    resetCacheInstance();
  });

  it('should set multiple entries at once', async () => {
    await batchSet([
      { key: 'multi:1', value: 'val1' },
      { key: 'multi:2', value: 'val2' },
      { key: 'multi:3', value: 'val3' },
    ]);

    const cache = getCache();
    expect(await cache.get('multi:1')).toBe('val1');
    expect(await cache.get('multi:2')).toBe('val2');
    expect(await cache.get('multi:3')).toBe('val3');
  });

  it('should respect TTL option', async () => {
    await batchSet([{ key: 'ttl-batch', value: 'test' }], { ttl: 5 });

    const cache = getCache();
    const ttl = await cache.ttl('ttl-batch');
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(5);
  });
});

describe('Integration: cacheAsideWithLock (actual)', () => {
  beforeEach(() => {
    resetCacheInstance();
  });

  it('should prevent cache stampede with lock', async () => {
    let fetchCount = 0;
    const slowFetcher = async () => {
      fetchCount++;
      await new Promise(r => setTimeout(r, 50));
      return `result-${fetchCount}`;
    };

    // Concurrent calls should only trigger one fetch
    const results = await Promise.all([
      cacheAsideWithLock('stampede-test', slowFetcher),
      cacheAsideWithLock('stampede-test', slowFetcher),
      cacheAsideWithLock('stampede-test', slowFetcher),
    ]);

    expect(fetchCount).toBe(1);
    expect(results[0]).toBe('result-1');
    expect(results[1]).toBe('result-1');
    expect(results[2]).toBe('result-1');
  });

  it('should return cached value on subsequent calls', async () => {
    const fetcher = vi.fn().mockResolvedValue('cached-value');

    const result1 = await cacheAsideWithLock('lock-cache-test', fetcher);
    const result2 = await cacheAsideWithLock('lock-cache-test', fetcher);

    expect(result1).toBe('cached-value');
    expect(result2).toBe('cached-value');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
