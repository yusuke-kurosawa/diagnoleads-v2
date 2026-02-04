/**
 * Feature Flags Tests
 *
 * Unit tests for the feature flag service
 */

import { describe, expect, it, beforeEach } from 'vitest';
import {
  evaluateFlag,
  isFeatureEnabled,
  getCachedFlag,
  setCachedFlag,
  invalidateFlagCache,
  clearFlagCache,
  createDefaultFlag,
  PREDEFINED_FLAGS,
} from '@/lib/features/feature-flags/service';
import type { FeatureFlag, FeatureFlagContext } from '@/lib/features/feature-flags/types';

// Mock feature flag for testing
function createMockFlag(overrides: Partial<FeatureFlag> = {}): FeatureFlag {
  return {
    id: 'flag-001',
    key: 'demo-flag',
    name: 'Test Feature',
    description: 'A test feature flag',
    status: 'active',
    strategy: 'all',
    rolloutPercentage: undefined,
    organizationIds: undefined,
    userIds: undefined,
    environments: undefined,
    metadata: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Feature Flags Service', () => {
  beforeEach(() => {
    clearFlagCache();
  });

  describe('evaluateFlag', () => {
    it('should return false for inactive flags', () => {
      const flag = createMockFlag({ status: 'inactive' });
      const result = evaluateFlag(flag, {});

      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('Flag is inactive');
    });

    it('should return false for archived flags', () => {
      const flag = createMockFlag({ status: 'archived' });
      const result = evaluateFlag(flag, {});

      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('Flag is archived');
    });

    it('should return true for strategy "all"', () => {
      const flag = createMockFlag({ strategy: 'all' });
      const result = evaluateFlag(flag, {});

      expect(result.enabled).toBe(true);
      expect(result.reason).toBe('Strategy: all');
    });

    it('should return false for strategy "none"', () => {
      const flag = createMockFlag({ strategy: 'none' });
      const result = evaluateFlag(flag, {});

      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('Strategy: none');
    });

    describe('percentage strategy', () => {
      it('should return false when no rollout percentage is set', () => {
        const flag = createMockFlag({
          strategy: 'percentage',
          rolloutPercentage: undefined,
        });
        const result = evaluateFlag(flag, { userId: 'user-123' });

        expect(result.enabled).toBe(false);
        expect(result.reason).toBe('No rollout percentage configured');
      });

      it('should return consistent results for the same user', () => {
        const flag = createMockFlag({
          strategy: 'percentage',
          rolloutPercentage: 50,
        });
        const context: FeatureFlagContext = { userId: 'user-123' };

        const result1 = evaluateFlag(flag, context);
        const result2 = evaluateFlag(flag, context);

        expect(result1.enabled).toBe(result2.enabled);
      });

      it('should return true for 100% rollout', () => {
        const flag = createMockFlag({
          strategy: 'percentage',
          rolloutPercentage: 100,
        });
        const result = evaluateFlag(flag, { userId: 'any-user' });

        expect(result.enabled).toBe(true);
      });

      it('should return false for 0% rollout', () => {
        const flag = createMockFlag({
          strategy: 'percentage',
          rolloutPercentage: 0,
        });
        const result = evaluateFlag(flag, { userId: 'any-user' });

        expect(result.enabled).toBe(false);
      });
    });

    describe('organization strategy', () => {
      it('should return false when no organizations are configured', () => {
        const flag = createMockFlag({
          strategy: 'organization',
          organizationIds: [],
        });
        const result = evaluateFlag(flag, { organizationId: 'org-123' });

        expect(result.enabled).toBe(false);
        expect(result.reason).toBe('No organizations configured');
      });

      it('should return false when no organization in context', () => {
        const flag = createMockFlag({
          strategy: 'organization',
          organizationIds: ['org-123'],
        });
        const result = evaluateFlag(flag, {});

        expect(result.enabled).toBe(false);
        expect(result.reason).toBe('No organization in context');
      });

      it('should return true when organization is in allowlist', () => {
        const flag = createMockFlag({
          strategy: 'organization',
          organizationIds: ['org-123', 'org-456'],
        });
        const result = evaluateFlag(flag, { organizationId: 'org-123' });

        expect(result.enabled).toBe(true);
        expect(result.reason).toBe('Organization allowed');
      });

      it('should return false when organization is not in allowlist', () => {
        const flag = createMockFlag({
          strategy: 'organization',
          organizationIds: ['org-123'],
        });
        const result = evaluateFlag(flag, { organizationId: 'org-999' });

        expect(result.enabled).toBe(false);
        expect(result.reason).toBe('Organization not in allowlist');
      });
    });

    describe('user strategy', () => {
      it('should return false when no users are configured', () => {
        const flag = createMockFlag({
          strategy: 'user',
          userIds: [],
        });
        const result = evaluateFlag(flag, { userId: 'user-123' });

        expect(result.enabled).toBe(false);
        expect(result.reason).toBe('No users configured');
      });

      it('should return false when no user in context', () => {
        const flag = createMockFlag({
          strategy: 'user',
          userIds: ['user-123'],
        });
        const result = evaluateFlag(flag, {});

        expect(result.enabled).toBe(false);
        expect(result.reason).toBe('No user in context');
      });

      it('should return true when user is in allowlist', () => {
        const flag = createMockFlag({
          strategy: 'user',
          userIds: ['user-123', 'user-456'],
        });
        const result = evaluateFlag(flag, { userId: 'user-123' });

        expect(result.enabled).toBe(true);
        expect(result.reason).toBe('User allowed');
      });

      it('should return false when user is not in allowlist', () => {
        const flag = createMockFlag({
          strategy: 'user',
          userIds: ['user-123'],
        });
        const result = evaluateFlag(flag, { userId: 'user-999' });

        expect(result.enabled).toBe(false);
        expect(result.reason).toBe('User not in allowlist');
      });
    });

    describe('environment strategy', () => {
      it('should return false when no environments are configured', () => {
        const flag = createMockFlag({
          strategy: 'environment',
          environments: [],
        });
        const result = evaluateFlag(flag, { environment: 'production' });

        expect(result.enabled).toBe(false);
        expect(result.reason).toBe('No environments configured');
      });

      it('should return true when environment is in allowlist', () => {
        const flag = createMockFlag({
          strategy: 'environment',
          environments: ['development', 'staging'],
        });
        const result = evaluateFlag(flag, { environment: 'development' });

        expect(result.enabled).toBe(true);
      });

      it('should return false when environment is not in allowlist', () => {
        const flag = createMockFlag({
          strategy: 'environment',
          environments: ['development'],
        });
        const result = evaluateFlag(flag, { environment: 'production' });

        expect(result.enabled).toBe(false);
      });
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return false for null flag', () => {
      const result = isFeatureEnabled(null, {});
      expect(result).toBe(false);
    });

    it('should return evaluation result for valid flag', () => {
      const flag = createMockFlag({ strategy: 'all' });
      const result = isFeatureEnabled(flag, {});
      expect(result).toBe(true);
    });
  });

  describe('cache operations', () => {
    const orgId = 'org-123';
    const flag = createMockFlag();

    it('should set and get cached flag', () => {
      setCachedFlag(orgId, flag);
      const cached = getCachedFlag(orgId, flag.key);

      expect(cached).not.toBeNull();
      expect(cached?.key).toBe(flag.key);
    });

    it('should return null for non-existent cache entry', () => {
      const cached = getCachedFlag(orgId, 'non_existent');
      expect(cached).toBeNull();
    });

    it('should invalidate specific flag cache', () => {
      setCachedFlag(orgId, flag);
      invalidateFlagCache(orgId, flag.key);
      const cached = getCachedFlag(orgId, flag.key);

      expect(cached).toBeNull();
    });

    it('should invalidate all organization flags', () => {
      const flag2 = createMockFlag({ key: 'second-flag' });
      setCachedFlag(orgId, flag);
      setCachedFlag(orgId, flag2);

      invalidateFlagCache(orgId);

      expect(getCachedFlag(orgId, flag.key)).toBeNull();
      expect(getCachedFlag(orgId, flag2.key)).toBeNull();
    });

    it('should clear entire cache', () => {
      setCachedFlag('org-1', flag);
      setCachedFlag('org-2', flag);

      clearFlagCache();

      expect(getCachedFlag('org-1', flag.key)).toBeNull();
      expect(getCachedFlag('org-2', flag.key)).toBeNull();
    });
  });

  describe('createDefaultFlag', () => {
    it('should create flag with defaults', () => {
      const flag = createDefaultFlag('test_key', 'Test Flag');

      expect(flag.key).toBe('test_key');
      expect(flag.name).toBe('Test Flag');
      expect(flag.status).toBe('inactive');
      expect(flag.strategy).toBe('none');
    });

    it('should allow overriding defaults', () => {
      const flag = createDefaultFlag('test_key', 'Test Flag', {
        status: 'active',
        strategy: 'all',
        description: 'Custom description',
      });

      expect(flag.status).toBe('active');
      expect(flag.strategy).toBe('all');
      expect(flag.description).toBe('Custom description');
    });
  });

  describe('PREDEFINED_FLAGS', () => {
    it('should have AI feature flags', () => {
      expect(PREDEFINED_FLAGS.AI_LEAD_SCORING).toBe('ai_lead_scoring');
      expect(PREDEFINED_FLAGS.AI_SEMANTIC_SEARCH).toBe('ai_semantic_search');
      expect(PREDEFINED_FLAGS.AI_CHAT_ASSISTANT).toBe('ai_chat_assistant');
    });

    it('should have UI feature flags', () => {
      expect(PREDEFINED_FLAGS.NEW_DASHBOARD).toBe('new_dashboard');
      expect(PREDEFINED_FLAGS.DARK_MODE).toBe('dark_mode');
    });

    it('should have integration feature flags', () => {
      expect(PREDEFINED_FLAGS.SLACK_INTEGRATION).toBe('slack_integration');
      expect(PREDEFINED_FLAGS.ZAPIER_INTEGRATION).toBe('zapier_integration');
    });

    it('should have beta feature flags', () => {
      expect(PREDEFINED_FLAGS.BETA_WORKFLOWS).toBe('beta_workflows');
      expect(PREDEFINED_FLAGS.BETA_REPORTS).toBe('beta_reports');
    });
  });
});
