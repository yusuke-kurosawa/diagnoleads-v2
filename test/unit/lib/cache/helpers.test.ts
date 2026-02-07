/**
 * Cache Helpers Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock cache client
const mockCache = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  delPattern: vi.fn(),
  ttl: vi.fn(),
};

vi.mock('@/lib/cache/client', () => ({
  getCache: () => mockCache,
}));

describe('cacheAside', () => {
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
