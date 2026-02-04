/**
 * Cache Client
 *
 * Unified cache client supporting both Redis (Upstash) and in-memory fallback
 */

import { Redis } from '@upstash/redis';
import type { CacheConfig, CacheEntry, CacheOptions, CacheStats } from './types';

/**
 * Cache interface for abstraction
 */
export interface CacheClient {
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

/**
 * In-memory cache implementation (fallback)
 */
class MemoryCache implements CacheClient {
  private store = new Map<string, CacheEntry<unknown>>();
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: 0 };
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;

    // Cleanup expired entries every minute
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const prefixedKey = this.prefixKey(key);
    const entry = this.store.get(prefixedKey) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(prefixedKey);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.value;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    const ttl = (options?.ttl ?? this.config.defaultTTL) * 1000;
    const now = Date.now();

    this.store.set(prefixedKey, {
      value,
      createdAt: now,
      expiresAt: now + ttl,
    });

    this.stats.sets++;
  }

  async del(key: string): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    this.store.delete(prefixedKey);
    this.stats.deletes++;
  }

  async delPattern(pattern: string): Promise<number> {
    const prefixedPattern = this.prefixKey(pattern);
    const regex = new RegExp(`^${prefixedPattern.replace(/\*/g, '.*')}$`);
    let count = 0;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    this.stats.deletes += count;
    return count;
  }

  async exists(key: string): Promise<boolean> {
    const prefixedKey = this.prefixKey(key);
    const entry = this.store.get(prefixedKey);

    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(prefixedKey);
      return false;
    }

    return true;
  }

  async ttl(key: string): Promise<number> {
    const prefixedKey = this.prefixKey(key);
    const entry = this.store.get(prefixedKey);

    if (!entry) return -2; // Key doesn't exist
    if (Date.now() > entry.expiresAt) return -1; // Key expired

    return Math.ceil((entry.expiresAt - Date.now()) / 1000);
  }

  async keys(pattern: string): Promise<string[]> {
    const prefixedPattern = this.prefixKey(pattern);
    const regex = new RegExp(`^${prefixedPattern.replace(/\*/g, '.*')}$`);
    const matchingKeys: string[] = [];

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        matchingKeys.push(key.replace(`${this.config.prefix}:`, ''));
      }
    }

    return matchingKeys;
  }

  async flush(): Promise<void> {
    this.store.clear();
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private prefixKey(key: string): string {
    return `${this.config.prefix}:${key}`;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Redis cache implementation (Upstash)
 */
class RedisCache implements CacheClient {
  private client: Redis;
  private config: CacheConfig;
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: 0 };

  constructor(client: Redis, config: CacheConfig) {
    this.client = client;
    this.config = config;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const prefixedKey = this.prefixKey(key);
      const value = await this.client.get<T>(prefixedKey);

      if (value === null) {
        this.stats.misses++;
      } else {
        this.stats.hits++;
      }
      this.updateHitRate();

      return value;
    } catch (error) {
      console.error('Redis get error:', error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const prefixedKey = this.prefixKey(key);
      const ttl = options?.ttl ?? this.config.defaultTTL;

      await this.client.set(prefixedKey, value, { ex: ttl });
      this.stats.sets++;
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const prefixedKey = this.prefixKey(key);
      await this.client.del(prefixedKey);
      this.stats.deletes++;
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  async delPattern(pattern: string): Promise<number> {
    try {
      const prefixedPattern = this.prefixKey(pattern);
      const keys = await this.client.keys(prefixedPattern);

      if (keys.length === 0) return 0;

      await this.client.del(...keys);
      this.stats.deletes += keys.length;
      return keys.length;
    } catch (error) {
      console.error('Redis delPattern error:', error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const prefixedKey = this.prefixKey(key);
      const result = await this.client.exists(prefixedKey);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const prefixedKey = this.prefixKey(key);
      return await this.client.ttl(prefixedKey);
    } catch (error) {
      console.error('Redis ttl error:', error);
      return -2;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const prefixedPattern = this.prefixKey(pattern);
      const keys = await this.client.keys(prefixedPattern);
      return keys.map((k) => k.replace(`${this.config.prefix}:`, ''));
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  async flush(): Promise<void> {
    try {
      const keys = await this.client.keys(`${this.config.prefix}:*`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error('Redis flush error:', error);
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private prefixKey(key: string): string {
    return `${this.config.prefix}:${key}`;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

/**
 * Default cache configuration
 */
const defaultConfig: CacheConfig = {
  defaultTTL: 300, // 5 minutes
  prefix: 'diagnoleads',
  enabled: true,
};

/**
 * Create cache client based on environment
 */
export function createCacheClient(config: Partial<CacheConfig> = {}): CacheClient {
  const mergedConfig = { ...defaultConfig, ...config };

  // Check for Upstash Redis credentials
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    console.log('[Cache] Using Upstash Redis');
    return new RedisCache(redis, mergedConfig);
  }

  console.log('[Cache] Using in-memory cache (Redis not configured)');
  return new MemoryCache(mergedConfig);
}

// Singleton instance
let cacheInstance: CacheClient | null = null;

/**
 * Get the cache client instance (singleton)
 */
export function getCache(): CacheClient {
  if (!cacheInstance) {
    cacheInstance = createCacheClient();
  }
  return cacheInstance;
}

/**
 * Reset cache instance (for testing)
 */
export function resetCacheInstance(): void {
  cacheInstance = null;
}
