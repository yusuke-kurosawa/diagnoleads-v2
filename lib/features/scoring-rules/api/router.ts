/**
 * Lead Scoring Rules tRPC Router
 * Handles custom lead scoring ruleset management and score calculation
 */
import {
  type ScoringCondition,
  type ScoringRule,
  leadScoringRulesets,
  leads,
} from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

const conditionTypeSchema = z.enum([
  'field_value',
  'field_contains',
  'field_matches',
  'source_is',
  'industry_is',
  'employee_count',
  'budget_range',
  'timeline',
  'custom',
]);

const operatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'greater_than',
  'less_than',
  'between',
  'in',
  'not_in',
]);

const conditionSchema = z.object({
  id: z.string(),
  type: conditionTypeSchema,
  field: z.string().optional(),
  operator: operatorSchema,
  value: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]),
  value2: z.union([z.string(), z.number()]).optional(),
});

const ruleSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  conditions: z.array(conditionSchema).min(1),
  conditionOperator: z.enum(['and', 'or']),
  scoreAdjustment: z.number().int().min(-100).max(100),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(50),
});

const createRulesetSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  baseScore: z.number().int().min(0).max(100).default(50),
  minScore: z.number().int().min(0).max(100).default(0),
  maxScore: z.number().int().min(0).max(100).default(100),
  rules: z.array(ruleSchema).default([]),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

const updateRulesetSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  baseScore: z.number().int().min(0).max(100).optional(),
  minScore: z.number().int().min(0).max(100).optional(),
  maxScore: z.number().int().min(0).max(100).optional(),
  rules: z.array(ruleSchema).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

const listRulesetsSchema = z.object({
  organizationId: z.string().uuid(),
  includeInactive: z.boolean().default(false),
});

const getRulesetSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const deleteRulesetSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const calculateScoreSchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
  rulesetId: z.string().uuid().optional(),
});

const simulateScoreSchema = z.object({
  organizationId: z.string().uuid(),
  rulesetId: z.string().uuid(),
  leadData: z.record(z.unknown()),
});

// ============================================================================
// Scoring Engine
// ============================================================================

interface LeadData {
  source?: string;
  industry?: string;
  employeeCount?: string;
  budget?: string;
  timeline?: string;
  [key: string]: unknown;
}

/**
 * Evaluate a single condition against lead data
 */
function evaluateCondition(condition: ScoringCondition, leadData: LeadData): boolean {
  let fieldValue: unknown;

  switch (condition.type) {
    case 'source_is':
      fieldValue = leadData.source;
      break;
    case 'industry_is':
      fieldValue = leadData.industry;
      break;
    case 'employee_count':
      fieldValue = leadData.employeeCount;
      break;
    case 'budget_range':
      fieldValue = leadData.budget;
      break;
    case 'timeline':
      fieldValue = leadData.timeline;
      break;
    case 'field_value':
    case 'field_contains':
    case 'field_matches':
    case 'custom':
      fieldValue = condition.field ? leadData[condition.field] : undefined;
      break;
    default:
      return false;
  }

  const value = condition.value;
  const value2 = condition.value2;

  switch (condition.operator) {
    case 'equals':
      return String(fieldValue) === String(value);

    case 'not_equals':
      return String(fieldValue) !== String(value);

    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());

    case 'greater_than':
      return Number(fieldValue) > Number(value);

    case 'less_than':
      return Number(fieldValue) < Number(value);

    case 'between': {
      if (value2 === undefined) return false;
      const numValue = Number(fieldValue);
      return numValue >= Number(value) && numValue <= Number(value2);
    }

    case 'in':
      if (!Array.isArray(value)) return false;
      return (value as (string | number)[]).map(String).includes(String(fieldValue));

    case 'not_in':
      if (!Array.isArray(value)) return false;
      return !(value as (string | number)[]).map(String).includes(String(fieldValue));

    default:
      return false;
  }
}

/**
 * Evaluate a rule against lead data
 */
function evaluateRule(rule: ScoringRule, leadData: LeadData): boolean {
  if (!rule.isActive) return false;
  if (rule.conditions.length === 0) return false;

  const results = rule.conditions.map((c) => evaluateCondition(c, leadData));

  if (rule.conditionOperator === 'and') {
    return results.every((r) => r);
  }
  return results.some((r) => r);
}

/**
 * Calculate score based on ruleset and lead data
 */
function calculateScoreFromRuleset(
  ruleset: {
    baseScore: number;
    minScore: number;
    maxScore: number;
    rules: ScoringRule[];
  },
  leadData: LeadData
): { score: number; appliedRules: { rule: ScoringRule; adjustment: number }[] } {
  let score = ruleset.baseScore;
  const appliedRules: { rule: ScoringRule; adjustment: number }[] = [];

  // Sort rules by priority (higher priority first)
  const sortedRules = [...ruleset.rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (evaluateRule(rule, leadData)) {
      score += rule.scoreAdjustment;
      appliedRules.push({ rule, adjustment: rule.scoreAdjustment });
    }
  }

  // Clamp score to min/max
  score = Math.max(ruleset.minScore, Math.min(ruleset.maxScore, score));

  return { score, appliedRules };
}

// ============================================================================
// Router
// ============================================================================

export const scoringRulesRouter = router({
  /**
   * List scoring rulesets
   */
  list: organizationProcedure.input(listRulesetsSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'スコアリングルールを閲覧する権限がありません',
      });
    }

    const conditions = [eq(leadScoringRulesets.organizationId, input.organizationId)];

    if (!input.includeInactive) {
      conditions.push(eq(leadScoringRulesets.isActive, true));
    }

    const rulesets = await ctx.db.query.leadScoringRulesets.findMany({
      where: and(...conditions),
      orderBy: [desc(leadScoringRulesets.isDefault), desc(leadScoringRulesets.updatedAt)],
    });

    return rulesets;
  }),

  /**
   * Get a single ruleset
   */
  get: organizationProcedure.input(getRulesetSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'スコアリングルールを閲覧する権限がありません',
      });
    }

    const ruleset = await ctx.db.query.leadScoringRulesets.findFirst({
      where: and(
        eq(leadScoringRulesets.id, input.id),
        eq(leadScoringRulesets.organizationId, input.organizationId)
      ),
    });

    if (!ruleset) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'スコアリングルールセットが見つかりません',
      });
    }

    return ruleset;
  }),

  /**
   * Get the default ruleset
   */
  getDefault: organizationProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.ability.can('read', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'スコアリングルールを閲覧する権限がありません',
        });
      }

      const ruleset = await ctx.db.query.leadScoringRulesets.findFirst({
        where: and(
          eq(leadScoringRulesets.organizationId, input.organizationId),
          eq(leadScoringRulesets.isDefault, true),
          eq(leadScoringRulesets.isActive, true)
        ),
      });

      return ruleset ?? null;
    }),

  /**
   * Create a new ruleset
   */
  create: organizationProcedure.input(createRulesetSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('create', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'スコアリングルールを作成する権限がありません',
      });
    }

    // Validate min/max score
    if (input.minScore >= input.maxScore) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '最小スコアは最大スコアより小さくする必要があります',
      });
    }

    if (input.baseScore < input.minScore || input.baseScore > input.maxScore) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '基本スコアは最小と最大の範囲内である必要があります',
      });
    }

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await ctx.db
        .update(leadScoringRulesets)
        .set({ isDefault: false })
        .where(eq(leadScoringRulesets.organizationId, input.organizationId));
    }

    const [ruleset] = await ctx.db
      .insert(leadScoringRulesets)
      .values({
        organizationId: input.organizationId,
        name: input.name,
        description: input.description,
        baseScore: input.baseScore,
        minScore: input.minScore,
        maxScore: input.maxScore,
        rules: input.rules as ScoringRule[],
        isActive: input.isActive,
        isDefault: input.isDefault,
      })
      .returning();

    return ruleset;
  }),

  /**
   * Update a ruleset
   */
  update: organizationProcedure.input(updateRulesetSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'スコアリングルールを更新する権限がありません',
      });
    }

    const existing = await ctx.db.query.leadScoringRulesets.findFirst({
      where: and(
        eq(leadScoringRulesets.id, input.id),
        eq(leadScoringRulesets.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'スコアリングルールセットが見つかりません',
      });
    }

    // Validate min/max score if provided
    const minScore = input.minScore ?? existing.minScore;
    const maxScore = input.maxScore ?? existing.maxScore;
    const baseScore = input.baseScore ?? existing.baseScore;

    if (minScore >= maxScore) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '最小スコアは最大スコアより小さくする必要があります',
      });
    }

    if (baseScore < minScore || baseScore > maxScore) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '基本スコアは最小と最大の範囲内である必要があります',
      });
    }

    // If setting as default, unset other defaults
    if (input.isDefault && !existing.isDefault) {
      await ctx.db
        .update(leadScoringRulesets)
        .set({ isDefault: false })
        .where(eq(leadScoringRulesets.organizationId, input.organizationId));
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.baseScore !== undefined) updateData.baseScore = input.baseScore;
    if (input.minScore !== undefined) updateData.minScore = input.minScore;
    if (input.maxScore !== undefined) updateData.maxScore = input.maxScore;
    if (input.rules !== undefined) updateData.rules = input.rules;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

    const [updated] = await ctx.db
      .update(leadScoringRulesets)
      .set(updateData)
      .where(
        and(
          eq(leadScoringRulesets.id, input.id),
          eq(leadScoringRulesets.organizationId, input.organizationId)
        )
      )
      .returning();

    return updated;
  }),

  /**
   * Delete a ruleset
   */
  delete: organizationProcedure.input(deleteRulesetSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('delete', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'スコアリングルールを削除する権限がありません',
      });
    }

    const existing = await ctx.db.query.leadScoringRulesets.findFirst({
      where: and(
        eq(leadScoringRulesets.id, input.id),
        eq(leadScoringRulesets.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'スコアリングルールセットが見つかりません',
      });
    }

    await ctx.db
      .delete(leadScoringRulesets)
      .where(
        and(
          eq(leadScoringRulesets.id, input.id),
          eq(leadScoringRulesets.organizationId, input.organizationId)
        )
      );

    return { success: true };
  }),

  /**
   * Calculate score for a lead
   */
  calculateScore: organizationProcedure
    .input(calculateScoreSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can('update', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードスコアを計算する権限がありません',
        });
      }

      // Get the lead
      const lead = await ctx.db.query.leads.findFirst({
        where: and(eq(leads.id, input.leadId), eq(leads.organizationId, input.organizationId)),
      });

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'リードが見つかりません',
        });
      }

      // Get the ruleset
      let ruleset;
      if (input.rulesetId) {
        ruleset = await ctx.db.query.leadScoringRulesets.findFirst({
          where: and(
            eq(leadScoringRulesets.id, input.rulesetId),
            eq(leadScoringRulesets.organizationId, input.organizationId),
            eq(leadScoringRulesets.isActive, true)
          ),
        });
      } else {
        ruleset = await ctx.db.query.leadScoringRulesets.findFirst({
          where: and(
            eq(leadScoringRulesets.organizationId, input.organizationId),
            eq(leadScoringRulesets.isDefault, true),
            eq(leadScoringRulesets.isActive, true)
          ),
        });
      }

      if (!ruleset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'スコアリングルールセットが見つかりません',
        });
      }

      // Extract lead data for scoring
      const responses = lead.responses as Record<string, unknown> | null;
      const leadData: LeadData = {
        source: lead.source ?? undefined,
        industry: responses?.industry as string,
        employeeCount: responses?.employeeCount as string,
        budget: responses?.budget as string,
        timeline: responses?.timeline as string,
        ...responses,
      };

      // Calculate score
      const result = calculateScoreFromRuleset(
        {
          baseScore: ruleset.baseScore,
          minScore: ruleset.minScore,
          maxScore: ruleset.maxScore,
          rules: ruleset.rules as ScoringRule[],
        },
        leadData
      );

      // Update lead score
      await ctx.db
        .update(leads)
        .set({
          score: result.score,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, input.leadId));

      return {
        leadId: input.leadId,
        previousScore: lead.score,
        newScore: result.score,
        appliedRules: result.appliedRules.map((ar) => ({
          ruleName: ar.rule.name,
          adjustment: ar.adjustment,
        })),
      };
    }),

  /**
   * Simulate score calculation without updating the lead
   */
  simulateScore: organizationProcedure.input(simulateScoreSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'スコアをシミュレートする権限がありません',
      });
    }

    const ruleset = await ctx.db.query.leadScoringRulesets.findFirst({
      where: and(
        eq(leadScoringRulesets.id, input.rulesetId),
        eq(leadScoringRulesets.organizationId, input.organizationId)
      ),
    });

    if (!ruleset) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'スコアリングルールセットが見つかりません',
      });
    }

    const result = calculateScoreFromRuleset(
      {
        baseScore: ruleset.baseScore,
        minScore: ruleset.minScore,
        maxScore: ruleset.maxScore,
        rules: ruleset.rules as ScoringRule[],
      },
      input.leadData as LeadData
    );

    return {
      score: result.score,
      baseScore: ruleset.baseScore,
      appliedRules: result.appliedRules.map((ar) => ({
        ruleName: ar.rule.name,
        ruleDescription: ar.rule.description,
        adjustment: ar.adjustment,
        priority: ar.rule.priority,
      })),
      allRules: (ruleset.rules as ScoringRule[]).map((rule) => ({
        name: rule.name,
        description: rule.description,
        adjustment: rule.scoreAdjustment,
        isActive: rule.isActive,
        wasApplied: result.appliedRules.some((ar) => ar.rule.id === rule.id),
      })),
    };
  }),

  /**
   * Recalculate scores for all leads in the organization
   */
  recalculateAll: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        rulesetId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can('update', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードスコアを再計算する権限がありません',
        });
      }

      // Get the ruleset
      let ruleset;
      if (input.rulesetId) {
        ruleset = await ctx.db.query.leadScoringRulesets.findFirst({
          where: and(
            eq(leadScoringRulesets.id, input.rulesetId),
            eq(leadScoringRulesets.organizationId, input.organizationId),
            eq(leadScoringRulesets.isActive, true)
          ),
        });
      } else {
        ruleset = await ctx.db.query.leadScoringRulesets.findFirst({
          where: and(
            eq(leadScoringRulesets.organizationId, input.organizationId),
            eq(leadScoringRulesets.isDefault, true),
            eq(leadScoringRulesets.isActive, true)
          ),
        });
      }

      if (!ruleset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'スコアリングルールセットが見つかりません',
        });
      }

      // Get all leads
      const allLeads = await ctx.db.query.leads.findMany({
        where: eq(leads.organizationId, input.organizationId),
      });

      let updatedCount = 0;

      for (const lead of allLeads) {
        const responses = lead.responses as Record<string, unknown> | null;
        const leadData: LeadData = {
          source: lead.source ?? undefined,
          industry: responses?.industry as string,
          employeeCount: responses?.employeeCount as string,
          budget: responses?.budget as string,
          timeline: responses?.timeline as string,
          ...responses,
        };

        const result = calculateScoreFromRuleset(
          {
            baseScore: ruleset.baseScore,
            minScore: ruleset.minScore,
            maxScore: ruleset.maxScore,
            rules: ruleset.rules as ScoringRule[],
          },
          leadData
        );

        if (lead.score !== result.score) {
          await ctx.db
            .update(leads)
            .set({
              score: result.score,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, lead.id));
          updatedCount++;
        }
      }

      return {
        totalLeads: allLeads.length,
        updatedLeads: updatedCount,
        rulesetUsed: ruleset.name,
      };
    }),

  /**
   * Get available condition types with their configurations
   */
  getConditionTypes: organizationProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async () => {
      return [
        {
          type: 'source_is',
          name: 'リードソース',
          description: 'リードの獲得ソースに基づく条件',
          operators: ['equals', 'not_equals', 'in', 'not_in'],
          suggestedValues: ['organic', 'paid', 'referral', 'social', 'email', 'diagnostic'],
        },
        {
          type: 'industry_is',
          name: '業種',
          description: '企業の業種に基づく条件',
          operators: ['equals', 'not_equals', 'in', 'not_in'],
          suggestedValues: [
            'technology',
            'finance',
            'healthcare',
            'manufacturing',
            'retail',
            'other',
          ],
        },
        {
          type: 'employee_count',
          name: '従業員数',
          description: '企業の従業員規模に基づく条件',
          operators: ['equals', 'in'],
          suggestedValues: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
        },
        {
          type: 'budget_range',
          name: '予算',
          description: '予算規模に基づく条件',
          operators: ['equals', 'in'],
          suggestedValues: ['under10k', '10k-50k', '50k-100k', '100k+'],
        },
        {
          type: 'timeline',
          name: '導入時期',
          description: '導入予定時期に基づく条件',
          operators: ['equals', 'in'],
          suggestedValues: ['immediate', '1-3months', '3-6months', '6months+'],
        },
        {
          type: 'field_value',
          name: 'カスタムフィールド',
          description: '任意のフィールド値に基づく条件',
          operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'between'],
          requiresField: true,
        },
        {
          type: 'field_contains',
          name: 'フィールド含む',
          description: 'フィールドに特定の文字列が含まれるかの条件',
          operators: ['contains'],
          requiresField: true,
        },
      ];
    }),
});
