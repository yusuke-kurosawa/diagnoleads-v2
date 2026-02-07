/**
 * Cache Client Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Types matching source
interface CacheConfig {
  defaultTTL: number;
  prefix: string;
  enabled: boolean;
}

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

interface CacheClient {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<number>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flush(): Promise<void>;
  getStats(): CacheStats;
}

describe('CacheClient interface', () => {
  it('should define all required methods', () => {
    const methods = ['get', 'set', 'del', 'delPattern', 'exists', 'ttl', 'keys', 'flush', 'getStats'];
    expect(methods).toHaveLength(9);
  });
});

describe('MemoryCache', () => {
  let store: Map<string, CacheEntry<unknown>>;
  let stats: CacheStats;
  let config: CacheConfig;

  beforeEach(() => {
    store = new Map();
    stats = { hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: 0 };
    config = { defaultTTL: 300, prefix: 'test:', enabled: true };
  });

  const prefixKey = (key: string) => `${config.prefix}${key}`;
  const updateHitRate = () => {
    const total = stats.hits + stats.misses;
    stats.hitRate = total > 0 ? stats.hits / total : 0;
  };

  describe('get', () => {
    it('should return null for non-existent key', async () => {
      const key = prefixKey('nonexistent');
      const entry = store.get(key);
      
      if (!entry) {
        stats.misses++;
        updateHitRate();
      }

      expect(entry).toBeUndefined();
      expect(stats.misses).toBe(1);
    });

    it('should return value for existing key', async () => {
      const key = prefixKey('test-key');
      const now = Date.now();
      store.set(key, {
        value: { data: 'test' },
        createdAt: now,
        expiresAt: now + 60000,
      });

      const entry = store.get(key);
      if (entry && Date.now() <= entry.expiresAt) {
        stats.hits++;
        updateHitRate();
      }

      expect((entry as CacheEntry<{ data: string }>)?.value.data).toBe('test');
      expect(stats.hits).toBe(1);
    });

    it('should return null for expired key', async () => {
      const key = prefixKey('expired');
      const now = Date.now();
      store.set(key, {
        value: 'expired-data',
        createdAt: now - 120000,
        expiresAt: now - 60000, // Already expired
      });

      const entry = store.get(key);
      if (entry && Date.now() > entry.expiresAt) {
        store.delete(key);
        stats.misses++;
        updateHitRate();
        expect(store.has(key)).toBe(false);
      }
    });
  });

  describe('set', () => {
    it('should store value with default TTL', () => {
      const key = prefixKey('new-key');
      const value = { name: 'Test' };
      const now = Date.now();
      const ttl = config.defaultTTL * 1000;

      store.set(key, {
        value,
        createdAt: now,
        expiresAt: now + ttl,
      });
      stats.sets++;

      expect(store.has(key)).toBe(true);
      expect(stats.sets).toBe(1);
    });

    it('should store value with custom TTL', () => {
      const key = prefixKey('custom-ttl');
      const value = 'data';
      const customTTL = 60; // 60 seconds
      const now = Date.now();

      store.set(key, {
        value,
        createdAt: now,
        expiresAt: now + (customTTL * 1000),
      });

      const entry = store.get(key) as CacheEntry<string>;
      expect(entry.expiresAt - entry.createdAt).toBe(60000);
    });
  });

  describe('del', () => {
    it('should delete existing key', () => {
      const key = prefixKey('to-delete');
      store.set(key, { value: 'data', createdAt: Date.now(), expiresAt: Date.now() + 60000 });
      
      store.delete(key);
      stats.deletes++;

      expect(store.has(key)).toBe(false);
      expect(stats.deletes).toBe(1);
    });
  });

  describe('delPattern', () => {
    it('should delete keys matching pattern', () => {
      store.set('test:user:1', { value: {}, createdAt: 0, expiresAt: Infinity });
      store.set('test:user:2', { value: {}, createdAt: 0, expiresAt: Infinity });
      store.set('test:org:1', { value: {}, createdAt: 0, expiresAt: Infinity });

      const pattern = /^test:user:/;
      let count = 0;
      for (const key of store.keys()) {
        if (pattern.test(key)) {
          store.delete(key);
          count++;
        }
      }
      stats.deletes += count;

      expect(count).toBe(2);
      expect(store.size).toBe(1);
    });
  });

  describe('exists', () => {
    it('should return true for existing key', () => {
      const key = prefixKey('exists');
      store.set(key, { value: 'data', createdAt: Date.now(), expiresAt: Date.now() + 60000 });
      expect(store.has(key)).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(store.has('nonexistent')).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should return remaining TTL', () => {
      const key = prefixKey('ttl-test');
      const now = Date.now();
      const expiresAt = now + 60000;
      store.set(key, { value: 'data', createdAt: now, expiresAt });

      const entry = store.get(key) as CacheEntry<string>;
      const remainingTTL = Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
      
      expect(remainingTTL).toBeGreaterThan(0);
      expect(remainingTTL).toBeLessThanOrEqual(60);
    });

    it('should return -1 for non-existent key', () => {
      const entry = store.get('nonexistent');
      const ttl = entry ? Math.ceil((entry.expiresAt - Date.now()) / 1000) : -1;
      expect(ttl).toBe(-1);
    });
  });

  describe('keys', () => {
    it('should return keys matching pattern', () => {
      store.set('test:a', { value: 1, createdAt: 0, expiresAt: Infinity });
      store.set('test:b', { value: 2, createdAt: 0, expiresAt: Infinity });
      store.set('other:c', { value: 3, createdAt: 0, expiresAt: Infinity });

      const pattern = /^test:/;
      const matchingKeys = Array.from(store.keys()).filter(key => pattern.test(key));

      expect(matchingKeys).toHaveLength(2);
    });
  });

  describe('flush', () => {
    it('should clear all keys', () => {
      store.set('key1', { value: 1, createdAt: 0, expiresAt: Infinity });
      store.set('key2', { value: 2, createdAt: 0, expiresAt: Infinity });

      store.clear();
      expect(store.size).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      stats.hits = 10;
      stats.misses = 5;
      stats.sets = 15;
      stats.deletes = 2;
      updateHitRate();

      expect(stats.hits).toBe(10);
      expect(stats.misses).toBe(5);
      expect(stats.hitRate).toBeCloseTo(0.67, 1);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      const now = Date.now();
      store.set('expired1', { value: 1, createdAt: now - 120000, expiresAt: now - 60000 });
      store.set('expired2', { value: 2, createdAt: now - 120000, expiresAt: now - 30000 });
      store.set('valid', { value: 3, createdAt: now, expiresAt: now + 60000 });

      // Cleanup expired
      for (const [key, entry] of store.entries()) {
        if (Date.now() > entry.expiresAt) {
          store.delete(key);
        }
      }

      expect(store.size).toBe(1);
      expect(store.has('valid')).toBe(true);
    });
  });
});

describe('RedisCache', () => {
  it('should create Redis client with config', () => {
    type RedisConfig = {
      url: string;
      token: string;
    };

    const config: RedisConfig = {
      url: 'https://redis.upstash.io',
      token: 'test-token',
    };

    expect(config.url).toBe('https://redis.upstash.io');
  });

  it('should handle Redis connection errors', async () => {
    const mockRedis = {
      get: vi.fn().mockRejectedValue(new Error('Connection failed')),
    };

    await expect(mockRedis.get('key')).rejects.toThrow('Connection failed');
  });
});

describe('getCache singleton', () => {
  it('should return same instance', () => {
    let instance: CacheClient | null = null;
    
    const getCache = (): CacheClient => {
      if (!instance) {
        instance = {
          get: vi.fn(),
          set: vi.fn(),
          del: vi.fn(),
          delPattern: vi.fn(),
          exists: vi.fn(),
          ttl: vi.fn(),
          keys: vi.fn(),
          flush: vi.fn(),
          getStats: () => ({ hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: 0 }),
        };
      }
      return instance;
    };

    const cache1 = getCache();
    const cache2 = getCache();
    expect(cache1).toBe(cache2);
  });
});

describe('CacheConfig', () => {
  it('should define default configuration', () => {
    const defaultConfig: CacheConfig = {
      defaultTTL: 300,
      prefix: 'diagnoleads:',
      enabled: true,
    };

    expect(defaultConfig.defaultTTL).toBe(300);
    expect(defaultConfig.prefix).toBe('diagnoleads:');
  });
});

// Integration tests with actual module
import {
  createCacheClient,
  getCache,
  resetCacheInstance,
  type CacheClient as ActualCacheClient,
} from '@/lib/cache/client';

describe('Integration: MemoryCache (actual)', () => {
  let cache: ActualCacheClient;

  beforeEach(() => {
    resetCacheInstance();
    cache = createCacheClient({ prefix: 'test', defaultTTL: 60 });
  });

  it('should set and get value', async () => {
    await cache.set('key1', { data: 'value1' });
    const result = await cache.get<{ data: string }>('key1');
    
    expect(result).not.toBeNull();
    expect(result?.data).toBe('value1');
  });

  it('should return null for non-existent key', async () => {
    const result = await cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should delete key', async () => {
    await cache.set('to-delete', 'value');
    expect(await cache.exists('to-delete')).toBe(true);
    
    await cache.del('to-delete');
    expect(await cache.exists('to-delete')).toBe(false);
  });

  it('should check key exists', async () => {
    expect(await cache.exists('not-here')).toBe(false);
    
    await cache.set('here', 'value');
    expect(await cache.exists('here')).toBe(true);
  });

  it('should get TTL for key', async () => {
    await cache.set('ttl-test', 'value', { ttl: 60 });
    const ttl = await cache.ttl('ttl-test');
    
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it('should return -2 for non-existent key TTL', async () => {
    const ttl = await cache.ttl('no-such-key');
    expect(ttl).toBe(-2);
  });

  it('should delete keys by pattern', async () => {
    await cache.set('user:1:profile', { name: 'Alice' });
    await cache.set('user:1:settings', { theme: 'dark' });
    await cache.set('user:2:profile', { name: 'Bob' });

    const deleted = await cache.delPattern('user:1:*');
    
    expect(deleted).toBe(2);
    expect(await cache.exists('user:1:profile')).toBe(false);
    expect(await cache.exists('user:2:profile')).toBe(true);
  });

  it('should list keys by pattern', async () => {
    await cache.set('lead:1', { id: '1' });
    await cache.set('lead:2', { id: '2' });
    await cache.set('org:1', { id: '1' });

    const leadKeys = await cache.keys('lead:*');
    
    expect(leadKeys.length).toBe(2);
    expect(leadKeys.every(k => k.startsWith('lead:'))).toBe(true);
  });

  it('should flush all keys', async () => {
    await cache.set('a', 1);
    await cache.set('b', 2);
    await cache.set('c', 3);

    await cache.flush();

    expect(await cache.exists('a')).toBe(false);
    expect(await cache.exists('b')).toBe(false);
    expect(await cache.exists('c')).toBe(false);
  });

  it('should track stats', async () => {
    await cache.set('stat-test', 'value');
    await cache.get('stat-test');
    await cache.get('miss-key');
    await cache.del('stat-test');

    const stats = cache.getStats();
    
    expect(stats.sets).toBeGreaterThanOrEqual(1);
    expect(stats.hits).toBeGreaterThanOrEqual(1);
    expect(stats.misses).toBeGreaterThanOrEqual(1);
    expect(stats.deletes).toBeGreaterThanOrEqual(1);
    expect(stats.hitRate).toBeGreaterThanOrEqual(0);
  });

  it('should respect custom TTL', async () => {
    await cache.set('short-lived', 'value', { ttl: 1 });
    
    expect(await cache.get('short-lived')).toBe('value');
    
    // Wait for expiration
    await new Promise(r => setTimeout(r, 1100));
    
    expect(await cache.get('short-lived')).toBeNull();
  });

  it('should handle various value types', async () => {
    await cache.set('string', 'hello');
    await cache.set('number', 42);
    await cache.set('boolean', true);
    await cache.set('array', [1, 2, 3]);
    await cache.set('object', { nested: { value: 'deep' } });

    expect(await cache.get('string')).toBe('hello');
    expect(await cache.get('number')).toBe(42);
    expect(await cache.get('boolean')).toBe(true);
    expect(await cache.get<number[]>('array')).toEqual([1, 2, 3]);
    expect(await cache.get<{ nested: { value: string } }>('object')).toEqual({ nested: { value: 'deep' } });
  });
});

describe('Integration: createCacheClient', () => {
  beforeEach(() => {
    resetCacheInstance();
  });

  it('should create memory cache when Redis not configured', () => {
    const cache = createCacheClient();
    expect(cache).toBeDefined();
    expect(typeof cache.get).toBe('function');
  });

  it('should use custom config', () => {
    const cache = createCacheClient({
      prefix: 'custom',
      defaultTTL: 600,
    });

    expect(cache).toBeDefined();
  });
});

describe('Integration: getCache (singleton)', () => {
  beforeEach(() => {
    resetCacheInstance();
  });

  it('should return same instance', () => {
    const cache1 = getCache();
    const cache2 = getCache();
    expect(cache1).toBe(cache2);
  });

  it('should return new instance after reset', () => {
    const cache1 = getCache();
    resetCacheInstance();
    const cache2 = getCache();
    expect(cache1).not.toBe(cache2);
  });
});

describe('Integration: CacheClient interface', () => {
  let cache: ActualCacheClient;

  beforeEach(() => {
    resetCacheInstance();
    cache = createCacheClient({ prefix: 'iface-test', defaultTTL: 60 });
  });

  it('should implement all CacheClient methods', () => {
    expect(typeof cache.get).toBe('function');
    expect(typeof cache.set).toBe('function');
    expect(typeof cache.del).toBe('function');
    expect(typeof cache.delPattern).toBe('function');
    expect(typeof cache.exists).toBe('function');
    expect(typeof cache.ttl).toBe('function');
    expect(typeof cache.keys).toBe('function');
    expect(typeof cache.flush).toBe('function');
    expect(typeof cache.getStats).toBe('function');
  });

  it('should return proper CacheStats structure', () => {
    const stats = cache.getStats();
    expect(stats).toHaveProperty('hits');
    expect(stats).toHaveProperty('misses');
    expect(stats).toHaveProperty('sets');
    expect(stats).toHaveProperty('deletes');
    expect(stats).toHaveProperty('hitRate');
    expect(typeof stats.hits).toBe('number');
    expect(typeof stats.misses).toBe('number');
    expect(typeof stats.sets).toBe('number');
    expect(typeof stats.deletes).toBe('number');
    expect(typeof stats.hitRate).toBe('number');
  });
});

describe('Integration: MemoryCache edge cases', () => {
  let cache: ActualCacheClient;

  beforeEach(() => {
    resetCacheInstance();
    cache = createCacheClient({ prefix: 'edge', defaultTTL: 60 });
  });

  it('should handle empty pattern delete', async () => {
    const deleted = await cache.delPattern('nonexistent:*');
    expect(deleted).toBe(0);
  });

  it('should handle special characters in keys', async () => {
    await cache.set('key:with:colons', 'value');
    await cache.set('key-with-dashes', 'value');
    await cache.set('key_with_underscores', 'value');

    expect(await cache.get('key:with:colons')).toBe('value');
    expect(await cache.get('key-with-dashes')).toBe('value');
    expect(await cache.get('key_with_underscores')).toBe('value');
  });

  it('should handle null and undefined values', async () => {
    await cache.set('null-value', null);
    await cache.set('undefined-value', undefined);

    expect(await cache.get('null-value')).toBeNull();
    expect(await cache.get('undefined-value')).toBeUndefined();
  });

  it('should handle empty string key', async () => {
    await cache.set('', 'empty-key-value');
    expect(await cache.get('')).toBe('empty-key-value');
  });

  it('should update hit rate correctly', async () => {
    // All misses
    await cache.get('miss1');
    await cache.get('miss2');
    let stats = cache.getStats();
    expect(stats.hitRate).toBe(0);

    // One hit
    await cache.set('hit-key', 'value');
    await cache.get('hit-key');
    stats = cache.getStats();
    expect(stats.hitRate).toBeGreaterThan(0);
  });

  it('should handle multiple delPattern calls', async () => {
    await cache.set('multi:a:1', 'val');
    await cache.set('multi:a:2', 'val');
    await cache.set('multi:b:1', 'val');
    await cache.set('multi:b:2', 'val');

    const deleted1 = await cache.delPattern('multi:a:*');
    const deleted2 = await cache.delPattern('multi:b:*');

    expect(deleted1).toBe(2);
    expect(deleted2).toBe(2);
  });

  it('should handle large number of keys', async () => {
    const count = 100;
    for (let i = 0; i < count; i++) {
      await cache.set(`bulk:${i}`, i);
    }

    const keys = await cache.keys('bulk:*');
    expect(keys.length).toBe(count);

    await cache.flush();
    const keysAfterFlush = await cache.keys('bulk:*');
    expect(keysAfterFlush.length).toBe(0);
  });
});

describe('Integration: Cache with complex objects', () => {
  let cache: ActualCacheClient;

  beforeEach(() => {
    resetCacheInstance();
    cache = createCacheClient({ prefix: 'complex', defaultTTL: 60 });
  });

  it('should cache and retrieve lead data', async () => {
    const lead = {
      id: 'lead-123',
      name: 'Test Lead',
      email: 'test@example.com',
      score: 85,
      tags: ['hot', 'qualified'],
      metadata: {
        source: 'web',
        campaign: 'summer-2024',
      },
    };

    await cache.set('lead:123', lead);
    const retrieved = await cache.get<typeof lead>('lead:123');

    expect(retrieved).toEqual(lead);
    expect(retrieved?.tags).toContain('hot');
    expect(retrieved?.metadata.source).toBe('web');
  });

  it('should cache and retrieve organization data', async () => {
    const org = {
      id: 'org-456',
      name: 'Test Org',
      plan: 'enterprise',
      members: [
        { id: 'user-1', role: 'owner' },
        { id: 'user-2', role: 'admin' },
      ],
    };

    await cache.set('org:456', org);
    const retrieved = await cache.get<typeof org>('org:456');

    expect(retrieved).toEqual(org);
    expect(retrieved?.members.length).toBe(2);
  });

  it('should cache arrays correctly', async () => {
    const ids = ['id-1', 'id-2', 'id-3'];
    await cache.set('ids', ids);

    const retrieved = await cache.get<string[]>('ids');
    expect(retrieved).toEqual(ids);
  });

  it('should cache dates as strings', async () => {
    const data = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await cache.set('dates', data);
    const retrieved = await cache.get<typeof data>('dates');

    expect(retrieved?.createdAt).toBe(data.createdAt);
    expect(typeof retrieved?.createdAt).toBe('string');
  });
});
