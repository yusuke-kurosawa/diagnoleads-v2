/**
 * Cache Types
 *
 * Type definitions for the caching system
 */

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Default TTL in seconds */
  defaultTTL: number;
  /** Key prefix for namespacing */
  prefix: string;
  /** Whether caching is enabled */
  enabled: boolean;
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
}

/**
 * Cache options for individual operations
 */
export interface CacheOptions {
  /** TTL in seconds (overrides default) */
  ttl?: number;
  /** Tags for cache invalidation */
  tags?: string[];
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

/**
 * Cache key patterns for different resources
 */
export const CACHE_KEYS = {
  // Lead related
  lead: (id: string) => `lead:${id}`,
  leadList: (orgId: string, page: number) => `leads:${orgId}:page:${page}`,
  leadCount: (orgId: string) => `leads:${orgId}:count`,

  // Organization related
  organization: (id: string) => `org:${id}`,
  organizationSettings: (id: string) => `org:${id}:settings`,
  organizationMembers: (id: string) => `org:${id}:members`,

  // User related
  user: (id: string) => `user:${id}`,
  userPermissions: (userId: string, orgId: string) => `user:${userId}:org:${orgId}:permissions`,

  // Feature flags
  featureFlag: (orgId: string, key: string) => `ff:${orgId}:${key}`,
  featureFlagList: (orgId: string) => `ff:${orgId}:list`,

  // Analytics
  analyticsDaily: (orgId: string, date: string) => `analytics:${orgId}:daily:${date}`,
  analyticsWeekly: (orgId: string, week: string) => `analytics:${orgId}:weekly:${week}`,

  // Diagnostic
  diagnosticForm: (id: string) => `diagnostic:form:${id}`,
  diagnosticResults: (id: string) => `diagnostic:results:${id}`,

  // API rate limiting
  rateLimit: (key: string) => `ratelimit:${key}`,

  // Session
  session: (id: string) => `session:${id}`,
} as const;

/**
 * Cache TTL presets (in seconds)
 */
export const CACHE_TTL = {
  /** Very short: 30 seconds */
  VERY_SHORT: 30,
  /** Short: 1 minute */
  SHORT: 60,
  /** Medium: 5 minutes */
  MEDIUM: 5 * 60,
  /** Long: 15 minutes */
  LONG: 15 * 60,
  /** Very long: 1 hour */
  VERY_LONG: 60 * 60,
  /** Day: 24 hours */
  DAY: 24 * 60 * 60,
  /** Week: 7 days */
  WEEK: 7 * 24 * 60 * 60,
} as const;

/**
 * Cache tags for grouped invalidation
 */
export const CACHE_TAGS = {
  LEADS: 'leads',
  ORGANIZATIONS: 'organizations',
  USERS: 'users',
  FEATURE_FLAGS: 'feature-flags',
  ANALYTICS: 'analytics',
  DIAGNOSTICS: 'diagnostics',
} as const;
