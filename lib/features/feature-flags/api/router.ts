/**
 * Feature Flags tRPC Router
 *
 * API endpoints for managing feature flags
 */

import { db } from '@/lib/db/client';
import { featureFlags } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { evaluateFlag, invalidateFlagCache, getCachedFlag, setCachedFlag } from '../service';
import {
  createFeatureFlagSchema,
  evaluateFeatureFlagSchema,
  listFeatureFlagsSchema,
  updateFeatureFlagSchema,
} from '../types';

export const featureFlagsRouter = router({
  /**
   * List feature flags for the organization
   */
  list: organizationProcedure.input(listFeatureFlagsSchema).query(async ({ ctx, input }) => {
    const { status, limit, offset } = input;

    const conditions = [eq(featureFlags.organizationId, ctx.organization.id)];
    if (status) {
      conditions.push(eq(featureFlags.status, status));
    }

    const flags = await db
      .select()
      .from(featureFlags)
      .where(and(...conditions))
      .orderBy(desc(featureFlags.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select()
      .from(featureFlags)
      .where(and(...conditions));

    return {
      flags,
      total: countResult.length,
      limit,
      offset,
    };
  }),

  /**
   * Get a single feature flag by ID
   */
  get: organizationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [flag] = await db
        .select()
        .from(featureFlags)
        .where(
          and(eq(featureFlags.id, input.id), eq(featureFlags.organizationId, ctx.organization.id))
        )
        .limit(1);

      if (!flag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Feature flag not found',
        });
      }

      return flag;
    }),

  /**
   * Get a feature flag by key
   */
  getByKey: organizationProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check cache first
      const cached = getCachedFlag(ctx.organization.id, input.key);
      if (cached) {
        return cached;
      }

      const [flag] = await db
        .select()
        .from(featureFlags)
        .where(
          and(eq(featureFlags.key, input.key), eq(featureFlags.organizationId, ctx.organization.id))
        )
        .limit(1);

      if (!flag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Feature flag not found',
        });
      }

      // Cache the flag
      setCachedFlag(ctx.organization.id, flag as any);

      return flag;
    }),

  /**
   * Create a new feature flag
   */
  create: organizationProcedure.input(createFeatureFlagSchema).mutation(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('manage', 'Settings')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to manage feature flags',
      });
    }

    // Check for duplicate key
    const [existing] = await db
      .select()
      .from(featureFlags)
      .where(
        and(eq(featureFlags.key, input.key), eq(featureFlags.organizationId, ctx.organization.id))
      )
      .limit(1);

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'A feature flag with this key already exists',
      });
    }

    const [flag] = await db
      .insert(featureFlags)
      .values({
        organizationId: ctx.organization.id,
        key: input.key,
        name: input.name,
        description: input.description,
        status: input.status,
        strategy: input.strategy,
        rolloutPercentage: input.rolloutPercentage,
        targetOrganizationIds: input.organizationIds,
        targetUserIds: input.userIds,
        environments: input.environments,
        metadata: input.metadata,
      })
      .returning();

    return flag;
  }),

  /**
   * Update a feature flag
   */
  update: organizationProcedure.input(updateFeatureFlagSchema).mutation(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('manage', 'Settings')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to manage feature flags',
      });
    }

    const [existing] = await db
      .select()
      .from(featureFlags)
      .where(
        and(eq(featureFlags.id, input.id), eq(featureFlags.organizationId, ctx.organization.id))
      )
      .limit(1);

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Feature flag not found',
      });
    }

    const [updated] = await db
      .update(featureFlags)
      .set({
        name: input.name ?? existing.name,
        description: input.description ?? existing.description,
        status: input.status ?? existing.status,
        strategy: input.strategy ?? existing.strategy,
        rolloutPercentage: input.rolloutPercentage ?? existing.rolloutPercentage,
        targetOrganizationIds: input.organizationIds ?? existing.targetOrganizationIds,
        targetUserIds: input.userIds ?? existing.targetUserIds,
        environments: input.environments ?? existing.environments,
        metadata: input.metadata ?? existing.metadata,
        updatedAt: new Date(),
      })
      .where(eq(featureFlags.id, input.id))
      .returning();

    // Invalidate cache
    invalidateFlagCache(ctx.organization.id, existing.key);

    return updated;
  }),

  /**
   * Delete a feature flag
   */
  delete: organizationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!ctx.ability.can('manage', 'Settings')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to manage feature flags',
        });
      }

      const [existing] = await db
        .select()
        .from(featureFlags)
        .where(
          and(eq(featureFlags.id, input.id), eq(featureFlags.organizationId, ctx.organization.id))
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Feature flag not found',
        });
      }

      await db.delete(featureFlags).where(eq(featureFlags.id, input.id));

      // Invalidate cache
      invalidateFlagCache(ctx.organization.id, existing.key);

      return { success: true };
    }),

  /**
   * Evaluate a feature flag
   */
  evaluate: organizationProcedure.input(evaluateFeatureFlagSchema).query(async ({ ctx, input }) => {
    // Check cache first
    let flag = getCachedFlag(ctx.organization.id, input.key);

    if (!flag) {
      const [dbFlag] = await db
        .select()
        .from(featureFlags)
        .where(
          and(eq(featureFlags.key, input.key), eq(featureFlags.organizationId, ctx.organization.id))
        )
        .limit(1);

      if (!dbFlag) {
        return {
          enabled: false,
          flag: null,
          reason: 'Flag not found',
        };
      }

      flag = dbFlag as any;
      setCachedFlag(ctx.organization.id, flag!);
    }

    const context = {
      userId: input.context?.userId ?? ctx.user?.id,
      organizationId: input.context?.organizationId ?? ctx.organization.id,
      environment: input.context?.environment ?? process.env.NODE_ENV,
      attributes: input.context?.attributes,
    };

    return evaluateFlag(flag!, context);
  }),

  /**
   * Batch evaluate multiple feature flags
   */
  evaluateBatch: organizationProcedure
    .input(
      z.object({
        keys: z.array(z.string()),
        context: z
          .object({
            userId: z.string().uuid().optional(),
            organizationId: z.string().uuid().optional(),
            environment: z.string().optional(),
            attributes: z.record(z.unknown()).optional(),
          })
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const flags = await db
        .select()
        .from(featureFlags)
        .where(eq(featureFlags.organizationId, ctx.organization.id));

      const flagMap = new Map(flags.map((f) => [f.key, f]));

      const context = {
        userId: input.context?.userId ?? ctx.user?.id,
        organizationId: input.context?.organizationId ?? ctx.organization.id,
        environment: input.context?.environment ?? process.env.NODE_ENV,
        attributes: input.context?.attributes,
      };

      const results: Record<string, boolean> = {};
      for (const key of input.keys) {
        const flag = flagMap.get(key);
        if (flag) {
          results[key] = evaluateFlag(flag as any, context).enabled;
        } else {
          results[key] = false;
        }
      }

      return results;
    }),
});
