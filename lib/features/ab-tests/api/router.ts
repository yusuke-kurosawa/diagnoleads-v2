/**
 * A/B Tests tRPC Router
 * Handles A/B testing for diagnostic forms
 */
import { type AbTestVariant, diagnosticAbTests, diagnosticTemplates } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

const abTestStatusSchema = z.enum(['draft', 'running', 'paused', 'completed', 'cancelled']);
const goalTypeSchema = z.enum([
  'submission_rate',
  'conversion_rate',
  'completion_time',
  'score_average',
]);

const variantSchema = z.object({
  templateId: z.string().uuid(),
  name: z.string().min(1).max(50),
  trafficPercent: z.number().min(0).max(100),
  impressions: z.number().int().min(0).default(0),
  submissions: z.number().int().min(0).default(0),
  conversions: z.number().int().min(0).default(0),
});

const createAbTestSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  baseTemplateId: z.string().uuid(),
  goalType: goalTypeSchema.default('conversion_rate'),
  minSampleSize: z.number().int().min(10).max(10000).default(100),
  confidenceLevel: z.number().int().min(80).max(99).default(95),
  variants: z.array(variantSchema).min(2).max(5),
});

const updateAbTestSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  goalType: goalTypeSchema.optional(),
  minSampleSize: z.number().int().min(10).max(10000).optional(),
  confidenceLevel: z.number().int().min(80).max(99).optional(),
  variants: z.array(variantSchema).min(2).max(5).optional(),
});

const listAbTestsSchema = z.object({
  organizationId: z.string().uuid(),
  status: abTestStatusSchema.optional(),
});

const getAbTestSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const deleteAbTestSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const startAbTestSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const stopAbTestSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const recordEventSchema = z.object({
  organizationId: z.string().uuid(),
  testId: z.string().uuid(),
  variantTemplateId: z.string().uuid(),
  eventType: z.enum(['impression', 'submission', 'conversion']),
});

// ============================================================================
// Statistical Functions
// ============================================================================

/**
 * Calculate z-score for two proportions
 */
function calculateZScore(
  successes1: number,
  total1: number,
  successes2: number,
  total2: number
): number {
  if (total1 === 0 || total2 === 0) return 0;

  const p1 = successes1 / total1;
  const p2 = successes2 / total2;
  const pPool = (successes1 + successes2) / (total1 + total2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / total1 + 1 / total2));

  if (se === 0) return 0;
  return (p1 - p2) / se;
}

/**
 * Convert z-score to confidence level (one-tailed)
 */
function zScoreToConfidence(zScore: number): number {
  // Approximate using the error function
  const absZ = Math.abs(zScore);
  const t = 1 / (1 + 0.2316419 * absZ);
  const d = 0.3989423 * Math.exp((-absZ * absZ) / 2);
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return (1 - p) * 100;
}

/**
 * Calculate relative improvement
 */
function calculateImprovement(baseline: number, variant: number): number {
  if (baseline === 0) return variant > 0 ? 100 : 0;
  return ((variant - baseline) / baseline) * 100;
}

// ============================================================================
// Router
// ============================================================================

export const abTestsRouter = router({
  /**
   * List A/B tests
   */
  list: organizationProcedure.input(listAbTestsSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'A/Bテストを閲覧する権限がありません',
      });
    }

    const conditions = [eq(diagnosticAbTests.organizationId, input.organizationId)];

    if (input.status) {
      conditions.push(eq(diagnosticAbTests.status, input.status));
    }

    const tests = await ctx.db.query.diagnosticAbTests.findMany({
      where: and(...conditions),
      orderBy: [desc(diagnosticAbTests.updatedAt)],
      with: {
        baseTemplate: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return tests;
  }),

  /**
   * Get a single A/B test
   */
  get: organizationProcedure.input(getAbTestSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'A/Bテストを閲覧する権限がありません',
      });
    }

    const test = await ctx.db.query.diagnosticAbTests.findFirst({
      where: and(
        eq(diagnosticAbTests.id, input.id),
        eq(diagnosticAbTests.organizationId, input.organizationId)
      ),
      with: {
        baseTemplate: true,
      },
    });

    if (!test) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'A/Bテストが見つかりません',
      });
    }

    return test;
  }),

  /**
   * Create a new A/B test
   */
  create: organizationProcedure.input(createAbTestSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('create', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'A/Bテストを作成する権限がありません',
      });
    }

    // Verify base template exists
    const baseTemplate = await ctx.db.query.diagnosticTemplates.findFirst({
      where: and(
        eq(diagnosticTemplates.id, input.baseTemplateId),
        eq(diagnosticTemplates.organizationId, input.organizationId)
      ),
    });

    if (!baseTemplate) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'ベーステンプレートが見つかりません',
      });
    }

    // Verify all variant templates exist
    for (const variant of input.variants) {
      const template = await ctx.db.query.diagnosticTemplates.findFirst({
        where: and(
          eq(diagnosticTemplates.id, variant.templateId),
          eq(diagnosticTemplates.organizationId, input.organizationId)
        ),
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `バリアントテンプレート ${variant.name} が見つかりません`,
        });
      }
    }

    // Verify traffic percentages sum to 100
    const totalTraffic = input.variants.reduce((sum, v) => sum + v.trafficPercent, 0);
    if (totalTraffic !== 100) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'トラフィック配分の合計は100%である必要があります',
      });
    }

    const [test] = await ctx.db
      .insert(diagnosticAbTests)
      .values({
        organizationId: input.organizationId,
        name: input.name,
        description: input.description,
        baseTemplateId: input.baseTemplateId,
        goalType: input.goalType,
        minSampleSize: input.minSampleSize,
        confidenceLevel: input.confidenceLevel,
        variants: input.variants as AbTestVariant[],
        status: 'draft',
      })
      .returning();

    return test;
  }),

  /**
   * Update an A/B test (only in draft status)
   */
  update: organizationProcedure.input(updateAbTestSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'A/Bテストを更新する権限がありません',
      });
    }

    const existing = await ctx.db.query.diagnosticAbTests.findFirst({
      where: and(
        eq(diagnosticAbTests.id, input.id),
        eq(diagnosticAbTests.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'A/Bテストが見つかりません',
      });
    }

    if (existing.status !== 'draft') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '実行中または完了したテストは編集できません',
      });
    }

    // Verify traffic percentages if updating variants
    if (input.variants) {
      const totalTraffic = input.variants.reduce((sum, v) => sum + v.trafficPercent, 0);
      if (totalTraffic !== 100) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'トラフィック配分の合計は100%である必要があります',
        });
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.goalType !== undefined) updateData.goalType = input.goalType;
    if (input.minSampleSize !== undefined) updateData.minSampleSize = input.minSampleSize;
    if (input.confidenceLevel !== undefined) updateData.confidenceLevel = input.confidenceLevel;
    if (input.variants !== undefined) updateData.variants = input.variants;

    const [updated] = await ctx.db
      .update(diagnosticAbTests)
      .set(updateData)
      .where(
        and(
          eq(diagnosticAbTests.id, input.id),
          eq(diagnosticAbTests.organizationId, input.organizationId)
        )
      )
      .returning();

    return updated;
  }),

  /**
   * Delete an A/B test
   */
  delete: organizationProcedure.input(deleteAbTestSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('delete', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'A/Bテストを削除する権限がありません',
      });
    }

    const existing = await ctx.db.query.diagnosticAbTests.findFirst({
      where: and(
        eq(diagnosticAbTests.id, input.id),
        eq(diagnosticAbTests.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'A/Bテストが見つかりません',
      });
    }

    if (existing.status === 'running') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '実行中のテストは削除できません。先に停止してください。',
      });
    }

    await ctx.db
      .delete(diagnosticAbTests)
      .where(
        and(
          eq(diagnosticAbTests.id, input.id),
          eq(diagnosticAbTests.organizationId, input.organizationId)
        )
      );

    return { success: true };
  }),

  /**
   * Start an A/B test
   */
  start: organizationProcedure.input(startAbTestSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'A/Bテストを開始する権限がありません',
      });
    }

    const existing = await ctx.db.query.diagnosticAbTests.findFirst({
      where: and(
        eq(diagnosticAbTests.id, input.id),
        eq(diagnosticAbTests.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'A/Bテストが見つかりません',
      });
    }

    if (existing.status !== 'draft' && existing.status !== 'paused') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'このテストは開始できません',
      });
    }

    const [updated] = await ctx.db
      .update(diagnosticAbTests)
      .set({
        status: 'running',
        startedAt: existing.startedAt || new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(diagnosticAbTests.id, input.id),
          eq(diagnosticAbTests.organizationId, input.organizationId)
        )
      )
      .returning();

    return updated;
  }),

  /**
   * Pause an A/B test
   */
  pause: organizationProcedure.input(stopAbTestSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'A/Bテストを一時停止する権限がありません',
      });
    }

    const existing = await ctx.db.query.diagnosticAbTests.findFirst({
      where: and(
        eq(diagnosticAbTests.id, input.id),
        eq(diagnosticAbTests.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'A/Bテストが見つかりません',
      });
    }

    if (existing.status !== 'running') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '実行中のテストのみ一時停止できます',
      });
    }

    const [updated] = await ctx.db
      .update(diagnosticAbTests)
      .set({
        status: 'paused',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(diagnosticAbTests.id, input.id),
          eq(diagnosticAbTests.organizationId, input.organizationId)
        )
      )
      .returning();

    return updated;
  }),

  /**
   * Complete an A/B test and determine winner
   */
  complete: organizationProcedure.input(stopAbTestSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'A/Bテストを完了する権限がありません',
      });
    }

    const existing = await ctx.db.query.diagnosticAbTests.findFirst({
      where: and(
        eq(diagnosticAbTests.id, input.id),
        eq(diagnosticAbTests.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'A/Bテストが見つかりません',
      });
    }

    if (existing.status !== 'running' && existing.status !== 'paused') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'このテストは完了できません',
      });
    }

    // Determine winner based on goal type
    const variants = existing.variants as AbTestVariant[];
    let winnerId: string | null = null;
    let highestScore = -Infinity;

    for (const variant of variants) {
      let score = 0;
      switch (existing.goalType) {
        case 'submission_rate':
          score = variant.impressions > 0 ? variant.submissions / variant.impressions : 0;
          break;
        case 'conversion_rate':
          score = variant.submissions > 0 ? variant.conversions / variant.submissions : 0;
          break;
        default:
          score = variant.conversions;
      }

      if (score > highestScore) {
        highestScore = score;
        winnerId = variant.templateId;
      }
    }

    const [updated] = await ctx.db
      .update(diagnosticAbTests)
      .set({
        status: 'completed',
        winnerId,
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(diagnosticAbTests.id, input.id),
          eq(diagnosticAbTests.organizationId, input.organizationId)
        )
      )
      .returning();

    return updated;
  }),

  /**
   * Record an event for A/B testing
   */
  recordEvent: organizationProcedure.input(recordEventSchema).mutation(async ({ ctx, input }) => {
    const test = await ctx.db.query.diagnosticAbTests.findFirst({
      where: and(
        eq(diagnosticAbTests.id, input.testId),
        eq(diagnosticAbTests.organizationId, input.organizationId),
        eq(diagnosticAbTests.status, 'running')
      ),
    });

    if (!test) {
      return { success: false, message: 'Test not running' };
    }

    const variants = test.variants as AbTestVariant[];
    const variantIndex = variants.findIndex((v) => v.templateId === input.variantTemplateId);

    if (variantIndex === -1) {
      return { success: false, message: 'Variant not found' };
    }

    // Update the appropriate counter
    switch (input.eventType) {
      case 'impression':
        variants[variantIndex].impressions++;
        break;
      case 'submission':
        variants[variantIndex].submissions++;
        break;
      case 'conversion':
        variants[variantIndex].conversions++;
        break;
    }

    await ctx.db
      .update(diagnosticAbTests)
      .set({
        variants: variants as AbTestVariant[],
        updatedAt: new Date(),
      })
      .where(eq(diagnosticAbTests.id, input.testId));

    return { success: true };
  }),

  /**
   * Get A/B test results with statistical analysis
   */
  getResults: organizationProcedure.input(getAbTestSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'A/Bテスト結果を閲覧する権限がありません',
      });
    }

    const test = await ctx.db.query.diagnosticAbTests.findFirst({
      where: and(
        eq(diagnosticAbTests.id, input.id),
        eq(diagnosticAbTests.organizationId, input.organizationId)
      ),
      with: {
        baseTemplate: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!test) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'A/Bテストが見つかりません',
      });
    }

    const variants = test.variants as AbTestVariant[];
    if (variants.length < 2) {
      return {
        test,
        results: [],
        winner: null,
        confidence: 0,
        isSignificant: false,
      };
    }

    // Calculate metrics for each variant
    const results = variants.map((variant) => {
      const submissionRate =
        variant.impressions > 0 ? variant.submissions / variant.impressions : 0;
      const conversionRate =
        variant.submissions > 0 ? variant.conversions / variant.submissions : 0;

      return {
        ...variant,
        submissionRate: Math.round(submissionRate * 10000) / 100,
        conversionRate: Math.round(conversionRate * 10000) / 100,
      };
    });

    // Find control (first variant) and best performing variant
    const control = results[0];
    let bestVariant = control;
    let bestScore = 0;

    for (const result of results) {
      const score =
        test.goalType === 'submission_rate' ? result.submissionRate : result.conversionRate;
      if (score > bestScore) {
        bestScore = score;
        bestVariant = result;
      }
    }

    // Calculate statistical significance
    let zScore = 0;
    if (test.goalType === 'submission_rate') {
      zScore = calculateZScore(
        bestVariant.submissions,
        bestVariant.impressions,
        control.submissions,
        control.impressions
      );
    } else {
      zScore = calculateZScore(
        bestVariant.conversions,
        bestVariant.submissions,
        control.conversions,
        control.submissions
      );
    }

    const confidence = zScoreToConfidence(zScore);
    const isSignificant = confidence >= test.confidenceLevel;

    // Calculate improvement over control
    const improvementResults = results.map((result) => {
      const controlValue =
        test.goalType === 'submission_rate' ? control.submissionRate : control.conversionRate;
      const variantValue =
        test.goalType === 'submission_rate' ? result.submissionRate : result.conversionRate;
      const improvement = calculateImprovement(controlValue, variantValue);

      return {
        ...result,
        improvement: Math.round(improvement * 100) / 100,
        isControl: result.templateId === control.templateId,
        isWinner: result.templateId === bestVariant.templateId && isSignificant,
      };
    });

    return {
      test,
      results: improvementResults,
      winner: isSignificant ? bestVariant.templateId : null,
      confidence: Math.round(confidence * 100) / 100,
      isSignificant,
      sampleSizeReached: variants.every((v) => v.submissions >= test.minSampleSize),
    };
  }),

  /**
   * Select variant for a user (weighted random selection)
   */
  selectVariant: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        testId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const test = await ctx.db.query.diagnosticAbTests.findFirst({
        where: and(
          eq(diagnosticAbTests.id, input.testId),
          eq(diagnosticAbTests.organizationId, input.organizationId),
          eq(diagnosticAbTests.status, 'running')
        ),
      });

      if (!test) {
        return null;
      }

      const variants = test.variants as AbTestVariant[];
      const random = Math.random() * 100;
      let cumulative = 0;

      for (const variant of variants) {
        cumulative += variant.trafficPercent;
        if (random <= cumulative) {
          return variant.templateId;
        }
      }

      // Fallback to first variant
      return variants[0]?.templateId ?? null;
    }),
});
