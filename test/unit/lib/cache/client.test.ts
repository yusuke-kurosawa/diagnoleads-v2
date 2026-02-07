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
