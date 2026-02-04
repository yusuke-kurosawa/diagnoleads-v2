/**
 * Feature Flags Module
 *
 * Provides feature flag functionality for gradual rollouts and A/B testing
 *
 * @example
 * ```typescript
 * import { isFeatureEnabled, PREDEFINED_FLAGS } from '@/lib/features/feature-flags';
 *
 * // Check if a feature is enabled
 * const enabled = await isFeatureEnabled(PREDEFINED_FLAGS.AI_LEAD_SCORING, {
 *   userId: 'user-123',
 *   organizationId: 'org-456',
 * });
 * ```
 */

export * from './types';
export * from './service';
export { featureFlagsRouter } from './api/router';
