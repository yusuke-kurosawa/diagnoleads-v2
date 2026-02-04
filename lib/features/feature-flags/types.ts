/**
 * Feature Flags Types
 *
 * Type definitions for the feature flag system
 */

import { z } from 'zod';

/**
 * Feature flag status
 */
export type FeatureFlagStatus = 'active' | 'inactive' | 'archived';

/**
 * Rollout strategy types
 */
export type RolloutStrategy =
  | 'all' // Enable for all users
  | 'none' // Disable for all users
  | 'percentage' // Enable for percentage of users
  | 'organization' // Enable for specific organizations
  | 'user' // Enable for specific users
  | 'environment'; // Enable based on environment

/**
 * Feature flag definition
 */
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  status: FeatureFlagStatus;
  strategy: RolloutStrategy;
  rolloutPercentage?: number;
  organizationIds?: string[];
  userIds?: string[];
  environments?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Feature flag evaluation context
 */
export interface FeatureFlagContext {
  userId?: string;
  organizationId?: string;
  environment?: string;
  attributes?: Record<string, unknown>;
}

/**
 * Feature flag evaluation result
 */
export interface FeatureFlagResult {
  enabled: boolean;
  flag: FeatureFlag | null;
  reason: string;
}

// Zod schemas for validation
export const featureFlagKeySchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9_-]*$/, 'Key must be lowercase alphanumeric with underscores or hyphens');

export const createFeatureFlagSchema = z.object({
  organizationId: z.string().uuid(),
  key: featureFlagKeySchema,
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('inactive'),
  strategy: z
    .enum(['all', 'none', 'percentage', 'organization', 'user', 'environment'])
    .default('none'),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  organizationIds: z.array(z.string().uuid()).optional(),
  userIds: z.array(z.string().uuid()).optional(),
  environments: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateFeatureFlagSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  strategy: z.enum(['all', 'none', 'percentage', 'organization', 'user', 'environment']).optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  organizationIds: z.array(z.string().uuid()).optional(),
  userIds: z.array(z.string().uuid()).optional(),
  environments: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listFeatureFlagsSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const evaluateFeatureFlagSchema = z.object({
  organizationId: z.string().uuid(),
  key: featureFlagKeySchema,
  context: z
    .object({
      userId: z.string().uuid().optional(),
      organizationId: z.string().uuid().optional(),
      environment: z.string().optional(),
      attributes: z.record(z.unknown()).optional(),
    })
    .optional(),
});

export type CreateFeatureFlagInput = z.infer<typeof createFeatureFlagSchema>;
export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;
export type ListFeatureFlagsInput = z.infer<typeof listFeatureFlagsSchema>;
export type EvaluateFeatureFlagInput = z.infer<typeof evaluateFeatureFlagSchema>;
