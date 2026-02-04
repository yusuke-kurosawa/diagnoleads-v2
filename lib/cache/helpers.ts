/**
 * Cache Helpers
 *
 * Utility functions for common caching patterns
 */

import { getCache } from './client';
import type { CacheOptions } from './types';

/**
 * Cache-aside pattern (read-through)
 * Gets value from cache, or fetches and caches if not found
 */
export async function cacheAside<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const cache = getCache();

  // Try to get from cache
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const value = await fetcher();

  // Store in cache
  await cache.set(key, value, options);

  return value;
}

/**
 * Cache-aside with stale-while-revalidate
 * Returns stale data immediately while refreshing in background
 */
export async function cacheAsideSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions & { staleTime?: number }
): Promise<T> {
  const cache = getCache();

  // Try to get from cache
  const cached = await cache.get<T>(key);

  if (cached !== null) {
    // Check if we should revalidate in background
    const ttl = await cache.ttl(key);
    const staleTime = options?.staleTime ?? 30; // Default 30 seconds before expiry

    if (ttl > 0 && ttl < staleTime) {
      // Revalidate in background (don't await)
      fetcher()
        .then((value) => cache.set(key, value, options))
        .catch(console.error);
    }

    return cached;
  }

  // Fetch fresh data
  const value = await fetcher();
  await cache.set(key, value, options);

  return value;
}

/**
 * Memoize a function with caching
 */
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyGenerator: (...args: TArgs) => string,
  options?: CacheOptions
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const key = keyGenerator(...args);
    return cacheAside(key, () => fn(...args), options);
  };
}

/**
 * Invalidate cache entries by pattern
 */
export async function invalidatePattern(pattern: string): Promise<number> {
  const cache = getCache();
  return cache.delPattern(pattern);
}

/**
 * Invalidate multiple cache keys
 */
export async function invalidateKeys(keys: string[]): Promise<void> {
  const cache = getCache();
  await Promise.all(keys.map((key) => cache.del(key)));
}

/**
 * Batch get multiple cache keys
 */
export async function batchGet<T>(keys: string[]): Promise<Map<string, T | null>> {
  const cache = getCache();
  const results = new Map<string, T | null>();

  await Promise.all(
    keys.map(async (key) => {
      const value = await cache.get<T>(key);
      results.set(key, value);
    })
  );

  return results;
}

/**
 * Batch set multiple cache entries
 */
export async function batchSet<T>(
  entries: Array<{ key: string; value: T }>,
  options?: CacheOptions
): Promise<void> {
  const cache = getCache();
  await Promise.all(entries.map((entry) => cache.set(entry.key, entry.value, options)));
}

/**
 * Decorator-style caching for class methods
 */
export function cached(options?: CacheOptions) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const key = `${propertyKey}:${JSON.stringify(args)}`;
      return cacheAside(key, () => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Lock to prevent cache stampede
 */
const locks = new Map<string, Promise<unknown>>();

export async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existingLock = locks.get(key);
  if (existingLock) {
    return existingLock as Promise<T>;
  }

  const promise = fn().finally(() => {
    locks.delete(key);
  });

  locks.set(key, promise);
  return promise;
}

/**
 * Cache-aside with lock to prevent stampede
 */
export async function cacheAsideWithLock<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const cache = getCache();

  // Try to get from cache first
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Use lock to prevent multiple simultaneous fetches
  return withLock(key, async () => {
    // Double-check cache after acquiring lock
    const cachedAgain = await cache.get<T>(key);
    if (cachedAgain !== null) {
      return cachedAgain;
    }

    const value = await fetcher();
    await cache.set(key, value, options);
    return value;
  });
}
