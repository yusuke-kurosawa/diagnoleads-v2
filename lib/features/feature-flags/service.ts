/**
 * Feature Flags Service
 *
 * Core service for managing and evaluating feature flags
 */

import crypto from 'node:crypto';
import type {
  FeatureFlag,
  FeatureFlagContext,
  FeatureFlagResult,
  FeatureFlagStatus,
  RolloutStrategy,
} from './types';

// In-memory cache for feature flags (could be replaced with Redis)
const flagCache = new Map<string, { flag: FeatureFlag; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Generate a deterministic hash for percentage-based rollout
 * This ensures the same user always gets the same result
 */
function hashForPercentage(key: string, identifier: string): number {
  const hash = crypto.createHash('md5').update(`${key}:${identifier}`).digest('hex');
  const num = Number.parseInt(hash.substring(0, 8), 16);
  return (num % 100) + 1; // Returns 1-100
}

/**
 * Evaluate if a feature flag is enabled for the given context
 */
export function evaluateFlag(flag: FeatureFlag, context: FeatureFlagContext): FeatureFlagResult {
  // Check if flag is active
  if (flag.status !== 'active') {
    return {
      enabled: false,
      flag,
      reason: `Flag is ${flag.status}`,
    };
  }

  // Evaluate based on strategy
  switch (flag.strategy) {
    case 'all':
      return {
        enabled: true,
        flag,
        reason: 'Strategy: all',
      };

    case 'none':
      return {
        enabled: false,
        flag,
        reason: 'Strategy: none',
      };

    case 'percentage': {
      if (!flag.rolloutPercentage) {
        return {
          enabled: false,
          flag,
          reason: 'No rollout percentage configured',
        };
      }

      // Use userId or organizationId for deterministic hashing
      const identifier = context.userId || context.organizationId || 'anonymous';
      const hash = hashForPercentage(flag.key, identifier);
      const enabled = hash <= flag.rolloutPercentage;

      return {
        enabled,
        flag,
        reason: `Percentage rollout: ${hash} ${enabled ? '<=' : '>'} ${flag.rolloutPercentage}%`,
      };
    }

    case 'organization': {
      if (!flag.organizationIds?.length) {
        return {
          enabled: false,
          flag,
          reason: 'No organizations configured',
        };
      }

      if (!context.organizationId) {
        return {
          enabled: false,
          flag,
          reason: 'No organization in context',
        };
      }

      const enabled = flag.organizationIds.includes(context.organizationId);
      return {
        enabled,
        flag,
        reason: enabled ? 'Organization allowed' : 'Organization not in allowlist',
      };
    }

    case 'user': {
      if (!flag.userIds?.length) {
        return {
          enabled: false,
          flag,
          reason: 'No users configured',
        };
      }

      if (!context.userId) {
        return {
          enabled: false,
          flag,
          reason: 'No user in context',
        };
      }

      const enabled = flag.userIds.includes(context.userId);
      return {
        enabled,
        flag,
        reason: enabled ? 'User allowed' : 'User not in allowlist',
      };
    }

    case 'environment': {
      if (!flag.environments?.length) {
        return {
          enabled: false,
          flag,
          reason: 'No environments configured',
        };
      }

      const currentEnv = context.environment || process.env.NODE_ENV || 'development';
      const enabled = flag.environments.includes(currentEnv);
      return {
        enabled,
        flag,
        reason: enabled
          ? `Environment ${currentEnv} allowed`
          : `Environment ${currentEnv} not in allowlist`,
      };
    }

    default:
      return {
        enabled: false,
        flag,
        reason: `Unknown strategy: ${flag.strategy}`,
      };
  }
}

/**
 * Check if a feature is enabled (simple helper)
 */
export function isFeatureEnabled(flag: FeatureFlag | null, context: FeatureFlagContext): boolean {
  if (!flag) return false;
  return evaluateFlag(flag, context).enabled;
}

/**
 * Get cache key for a flag
 */
function getCacheKey(organizationId: string, key: string): string {
  return `${organizationId}:${key}`;
}

/**
 * Get flag from cache
 */
export function getCachedFlag(organizationId: string, key: string): FeatureFlag | null {
  const cacheKey = getCacheKey(organizationId, key);
  const cached = flagCache.get(cacheKey);

  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    flagCache.delete(cacheKey);
    return null;
  }

  return cached.flag;
}

/**
 * Set flag in cache
 */
export function setCachedFlag(organizationId: string, flag: FeatureFlag): void {
  const cacheKey = getCacheKey(organizationId, flag.key);
  flagCache.set(cacheKey, {
    flag,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Invalidate flag cache
 */
export function invalidateFlagCache(organizationId: string, key?: string): void {
  if (key) {
    flagCache.delete(getCacheKey(organizationId, key));
  } else {
    // Invalidate all flags for organization
    for (const cacheKey of flagCache.keys()) {
      if (cacheKey.startsWith(`${organizationId}:`)) {
        flagCache.delete(cacheKey);
      }
    }
  }
}

/**
 * Clear entire flag cache
 */
export function clearFlagCache(): void {
  flagCache.clear();
}

/**
 * Create a default feature flag object
 */
export function createDefaultFlag(
  key: string,
  name: string,
  options?: Partial<FeatureFlag>
): Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    key,
    name,
    description: options?.description,
    status: options?.status ?? 'inactive',
    strategy: options?.strategy ?? 'none',
    rolloutPercentage: options?.rolloutPercentage,
    organizationIds: options?.organizationIds,
    userIds: options?.userIds,
    environments: options?.environments,
    metadata: options?.metadata,
  };
}

/**
 * Predefined feature flags for the application
 */
export const PREDEFINED_FLAGS = {
  // AI Features
  AI_LEAD_SCORING: 'ai_lead_scoring',
  AI_SEMANTIC_SEARCH: 'ai_semantic_search',
  AI_CHAT_ASSISTANT: 'ai_chat_assistant',
  AI_CONVERSION_PREDICTION: 'ai_conversion_prediction',

  // UI Features
  NEW_DASHBOARD: 'new_dashboard',
  DARK_MODE: 'dark_mode',
  ADVANCED_FILTERS: 'advanced_filters',

  // Integration Features
  SLACK_INTEGRATION: 'slack_integration',
  ZAPIER_INTEGRATION: 'zapier_integration',
  CRM_SYNC: 'crm_sync',

  // Experimental Features
  BETA_WORKFLOWS: 'beta_workflows',
  BETA_REPORTS: 'beta_reports',
  BETA_AB_TESTING: 'beta_ab_testing',
} as const;

export type PredefinedFlag = (typeof PREDEFINED_FLAGS)[keyof typeof PREDEFINED_FLAGS];
