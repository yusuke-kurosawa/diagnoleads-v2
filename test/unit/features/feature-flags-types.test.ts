/**
 * Feature Flags Types Tests
 *
 * Unit tests for feature flag type definitions and schemas
 */

import { describe, expect, it } from 'vitest';
import {
  featureFlagKeySchema,
  createFeatureFlagSchema,
  updateFeatureFlagSchema,
  listFeatureFlagsSchema,
  evaluateFeatureFlagSchema,
  type FeatureFlagStatus,
  type RolloutStrategy,
  type FeatureFlag,
  type FeatureFlagContext,
  type FeatureFlagResult,
} from '@/lib/features/feature-flags/types';

describe('FeatureFlagStatus type', () => {
  it('should accept valid statuses', () => {
    const statuses: FeatureFlagStatus[] = ['active', 'inactive', 'archived'];
    expect(statuses).toHaveLength(3);
  });
});

describe('RolloutStrategy type', () => {
  it('should accept valid strategies', () => {
    const strategies: RolloutStrategy[] = [
      'all',
      'none',
      'percentage',
      'organization',
      'user',
      'environment',
    ];
    expect(strategies).toHaveLength(6);
  });
});

describe('FeatureFlag interface', () => {
  it('should create valid feature flag', () => {
    const flag: FeatureFlag = {
      id: 'flag-123',
      key: 'new-dashboard',
      name: 'New Dashboard',
      description: 'Enable new dashboard UI',
      status: 'active',
      strategy: 'percentage',
      rolloutPercentage: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(flag.key).toBe('new-dashboard');
    expect(flag.strategy).toBe('percentage');
  });
});

describe('FeatureFlagContext interface', () => {
  it('should create valid context', () => {
    const context: FeatureFlagContext = {
      userId: 'user-123',
      organizationId: 'org-123',
      environment: 'production',
      attributes: { plan: 'enterprise' },
    };

    expect(context.userId).toBe('user-123');
  });
});

describe('FeatureFlagResult interface', () => {
  it('should create valid result', () => {
    const result: FeatureFlagResult = {
      enabled: true,
      flag: null,
      reason: 'Flag enabled for all users',
    };

    expect(result.enabled).toBe(true);
  });
});

describe('featureFlagKeySchema', () => {
  it('should accept valid keys', () => {
    expect(featureFlagKeySchema.parse('new-feature')).toBe('new-feature');
    expect(featureFlagKeySchema.parse('feature_flag')).toBe('feature_flag');
    expect(featureFlagKeySchema.parse('feature123')).toBe('feature123');
    expect(featureFlagKeySchema.parse('a')).toBe('a');
  });

  it('should reject invalid keys', () => {
    expect(() => featureFlagKeySchema.parse('')).toThrow();
    expect(() => featureFlagKeySchema.parse('123feature')).toThrow();
    expect(() => featureFlagKeySchema.parse('Feature')).toThrow();
    expect(() => featureFlagKeySchema.parse('feature flag')).toThrow();
    expect(() => featureFlagKeySchema.parse('feature.flag')).toThrow();
  });

  it('should reject keys that are too long', () => {
    const longKey = 'a'.repeat(101);
    expect(() => featureFlagKeySchema.parse(longKey)).toThrow();
  });
});

describe('createFeatureFlagSchema', () => {
  it('should accept valid input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      key: 'new-feature',
      name: 'New Feature',
    };

    const result = createFeatureFlagSchema.parse(input);
    expect(result.key).toBe('new-feature');
    expect(result.status).toBe('inactive'); // default
    expect(result.strategy).toBe('none'); // default
  });

  it('should accept full input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      key: 'new-feature',
      name: 'New Feature',
      description: 'A new feature',
      status: 'active' as const,
      strategy: 'percentage' as const,
      rolloutPercentage: 50,
      organizationIds: ['123e4567-e89b-12d3-a456-426614174001'],
      userIds: ['123e4567-e89b-12d3-a456-426614174002'],
      environments: ['production'],
      metadata: { priority: 'high' },
    };

    const result = createFeatureFlagSchema.parse(input);
    expect(result.rolloutPercentage).toBe(50);
    expect(result.environments).toContain('production');
  });

  it('should reject invalid organizationId', () => {
    const input = {
      organizationId: 'invalid-uuid',
      key: 'feature',
      name: 'Feature',
    };

    expect(() => createFeatureFlagSchema.parse(input)).toThrow();
  });

  it('should validate rollout percentage range', () => {
    const baseInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      key: 'feature',
      name: 'Feature',
    };

    expect(() =>
      createFeatureFlagSchema.parse({ ...baseInput, rolloutPercentage: -1 })
    ).toThrow();
    expect(() =>
      createFeatureFlagSchema.parse({ ...baseInput, rolloutPercentage: 101 })
    ).toThrow();

    expect(
      createFeatureFlagSchema.parse({ ...baseInput, rolloutPercentage: 0 }).rolloutPercentage
    ).toBe(0);
    expect(
      createFeatureFlagSchema.parse({ ...baseInput, rolloutPercentage: 100 }).rolloutPercentage
    ).toBe(100);
  });
});

describe('updateFeatureFlagSchema', () => {
  it('should accept valid update input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Updated Name',
    };

    const result = updateFeatureFlagSchema.parse(input);
    expect(result.name).toBe('Updated Name');
  });

  it('should accept partial updates', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      id: '123e4567-e89b-12d3-a456-426614174001',
      status: 'archived' as const,
    };

    const result = updateFeatureFlagSchema.parse(input);
    expect(result.status).toBe('archived');
  });
});

describe('listFeatureFlagsSchema', () => {
  it('should accept minimal input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = listFeatureFlagsSchema.parse(input);
    expect(result.limit).toBe(50); // default
    expect(result.offset).toBe(0); // default
  });

  it('should accept status filter', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'active' as const,
    };

    const result = listFeatureFlagsSchema.parse(input);
    expect(result.status).toBe('active');
  });

  it('should validate limit range', () => {
    const baseInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => listFeatureFlagsSchema.parse({ ...baseInput, limit: 0 })).toThrow();
    expect(() => listFeatureFlagsSchema.parse({ ...baseInput, limit: 101 })).toThrow();
    expect(listFeatureFlagsSchema.parse({ ...baseInput, limit: 1 }).limit).toBe(1);
    expect(listFeatureFlagsSchema.parse({ ...baseInput, limit: 100 }).limit).toBe(100);
  });
});

describe('evaluateFeatureFlagSchema', () => {
  it('should accept minimal input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      key: 'feature-flag',
    };

    const result = evaluateFeatureFlagSchema.parse(input);
    expect(result.key).toBe('feature-flag');
  });

  it('should accept context', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      key: 'feature-flag',
      context: {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        environment: 'production',
        attributes: { tier: 'premium' },
      },
    };

    const result = evaluateFeatureFlagSchema.parse(input);
    expect(result.context?.environment).toBe('production');
  });
});
