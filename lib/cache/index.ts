/**
 * Cache Module
 *
 * Provides a unified caching layer with support for:
 * - Upstash Redis (production)
 * - In-memory fallback (development/testing)
 *
 * @example
 * ```typescript
 * import { getCache, cacheAside, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
 *
 * // Direct cache usage
 * const cache = getCache();
 * await cache.set('key', { data: 'value' }, { ttl: 300 });
 * const value = await cache.get('key');
 *
 * // Cache-aside pattern
 * const lead = await cacheAside(
 *   CACHE_KEYS.lead(leadId),
 *   () => db.query.leads.findFirst({ where: eq(leads.id, leadId) }),
 *   { ttl: CACHE_TTL.MEDIUM }
 * );
 *
 * // Invalidate cache
 * await cache.del(CACHE_KEYS.lead(leadId));
 * await cache.delPattern('leads:org-123:*');
 * ```
 */

export * from './types';
export * from './client';
export * from './helpers';
