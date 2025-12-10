/**
 * Saved Filters tRPC Router
 * Handles CRUD operations for saved filters with advanced filtering support
 */
import { type FilterOperator, savedFilters } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, or, sql } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

const filterOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'greater_or_equal',
  'less_or_equal',
  'between',
  'is_empty',
  'is_not_empty',
  'in',
  'not_in',
]);

const filterConditionSchema = z.object({
  field: z.string().min(1),
  operator: filterOperatorSchema,
  value: z.unknown(),
  value2: z.unknown().optional(),
});

// Using z.lazy for recursive type without explicit type annotation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filterGroupSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    logic: z.enum(['and', 'or']),
    conditions: z.array(filterConditionSchema).default([]),
    groups: z.array(filterGroupSchema).optional(),
  })
);

const createFilterSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: filterGroupSchema,
  isPublic: z.boolean().default(false),
  color: z.string().max(20).optional(),
  icon: z.string().max(50).optional(),
});

const updateFilterSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  filters: filterGroupSchema.optional(),
  isPublic: z.boolean().optional(),
  color: z.string().max(20).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
});

const listFiltersSchema = z.object({
  organizationId: z.string().uuid(),
  includePublic: z.boolean().default(true),
  includePrivate: z.boolean().default(true),
});

const getFilterSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const deleteFilterSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const applyFilterSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

// ============================================================================
// Router
// ============================================================================

export const filtersRouter = router({
  /**
   * List saved filters for the organization
   */
  list: organizationProcedure.input(listFiltersSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'フィルターを閲覧する権限がありません',
      });
    }

    const conditions = [eq(savedFilters.organizationId, input.organizationId)];

    // Filter by ownership and visibility
    const visibilityConditions: ReturnType<typeof eq>[] = [];

    if (input.includePublic) {
      visibilityConditions.push(eq(savedFilters.isPublic, true));
    }

    if (input.includePrivate && ctx.user?.id) {
      visibilityConditions.push(eq(savedFilters.userId, ctx.user.id));
    }

    if (visibilityConditions.length > 0) {
      conditions.push(or(...visibilityConditions)!);
    }

    const results = await ctx.db.query.savedFilters.findMany({
      where: and(...conditions),
      orderBy: [desc(savedFilters.usageCount), asc(savedFilters.name)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return results;
  }),

  /**
   * Get a single saved filter
   */
  get: organizationProcedure.input(getFilterSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'フィルターを閲覧する権限がありません',
      });
    }

    const filter = await ctx.db.query.savedFilters.findFirst({
      where: and(
        eq(savedFilters.id, input.id),
        eq(savedFilters.organizationId, input.organizationId)
      ),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!filter) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'フィルターが見つかりません',
      });
    }

    // Check access: public or owner
    if (!filter.isPublic && filter.userId !== ctx.user?.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'このフィルターにアクセスする権限がありません',
      });
    }

    return filter;
  }),

  /**
   * Create a new saved filter
   */
  create: organizationProcedure.input(createFilterSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('create', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'フィルターを作成する権限がありません',
      });
    }

    const [filter] = await ctx.db
      .insert(savedFilters)
      .values({
        organizationId: input.organizationId,
        userId: ctx.user?.id,
        name: input.name,
        description: input.description,
        filters: input.filters,
        isPublic: input.isPublic,
        color: input.color,
        icon: input.icon,
      })
      .returning();

    return filter;
  }),

  /**
   * Update a saved filter
   */
  update: organizationProcedure.input(updateFilterSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'フィルターを更新する権限がありません',
      });
    }

    const existing = await ctx.db.query.savedFilters.findFirst({
      where: and(
        eq(savedFilters.id, input.id),
        eq(savedFilters.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'フィルターが見つかりません',
      });
    }

    // Check ownership
    if (existing.userId !== ctx.user?.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'このフィルターを編集する権限がありません',
      });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.filters !== undefined) updateData.filters = input.filters;
    if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.icon !== undefined) updateData.icon = input.icon;

    const [updated] = await ctx.db
      .update(savedFilters)
      .set(updateData)
      .where(
        and(eq(savedFilters.id, input.id), eq(savedFilters.organizationId, input.organizationId))
      )
      .returning();

    return updated;
  }),

  /**
   * Delete a saved filter
   */
  delete: organizationProcedure.input(deleteFilterSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('delete', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'フィルターを削除する権限がありません',
      });
    }

    const existing = await ctx.db.query.savedFilters.findFirst({
      where: and(
        eq(savedFilters.id, input.id),
        eq(savedFilters.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'フィルターが見つかりません',
      });
    }

    // Check ownership
    if (existing.userId !== ctx.user?.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'このフィルターを削除する権限がありません',
      });
    }

    await ctx.db
      .delete(savedFilters)
      .where(
        and(eq(savedFilters.id, input.id), eq(savedFilters.organizationId, input.organizationId))
      );

    return { success: true };
  }),

  /**
   * Apply a saved filter (increments usage count)
   */
  use: organizationProcedure.input(applyFilterSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'フィルターを適用する権限がありません',
      });
    }

    const existing = await ctx.db.query.savedFilters.findFirst({
      where: and(
        eq(savedFilters.id, input.id),
        eq(savedFilters.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'フィルターが見つかりません',
      });
    }

    // Check access
    if (!existing.isPublic && existing.userId !== ctx.user?.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'このフィルターにアクセスする権限がありません',
      });
    }

    // Increment usage count
    const [updated] = await ctx.db
      .update(savedFilters)
      .set({
        usageCount: sql`${savedFilters.usageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(
        and(eq(savedFilters.id, input.id), eq(savedFilters.organizationId, input.organizationId))
      )
      .returning();

    return updated;
  }),

  /**
   * Get available filter fields and operators
   * Returns metadata for building filter UI
   */
  getFilterMetadata: organizationProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx }) => {
      // Define available fields for filtering leads
      const fields = [
        {
          key: 'name',
          label: 'Name',
          type: 'text' as const,
          operators: [
            'equals',
            'not_equals',
            'contains',
            'not_contains',
            'starts_with',
            'ends_with',
            'is_empty',
            'is_not_empty',
          ] as FilterOperator[],
        },
        {
          key: 'email',
          label: 'Email',
          type: 'text' as const,
          operators: [
            'equals',
            'not_equals',
            'contains',
            'not_contains',
            'starts_with',
            'ends_with',
            'is_empty',
            'is_not_empty',
          ] as FilterOperator[],
        },
        {
          key: 'company',
          label: 'Company',
          type: 'text' as const,
          operators: [
            'equals',
            'not_equals',
            'contains',
            'not_contains',
            'starts_with',
            'ends_with',
            'is_empty',
            'is_not_empty',
          ] as FilterOperator[],
        },
        {
          key: 'phone',
          label: 'Phone',
          type: 'text' as const,
          operators: [
            'equals',
            'not_equals',
            'contains',
            'is_empty',
            'is_not_empty',
          ] as FilterOperator[],
        },
        {
          key: 'status',
          label: 'Status',
          type: 'select' as const,
          options: ['new', 'contacted', 'qualified', 'converted'],
          operators: ['equals', 'not_equals', 'in', 'not_in'] as FilterOperator[],
        },
        {
          key: 'source',
          label: 'Source',
          type: 'select' as const,
          options: ['website', 'embed', 'api'],
          operators: ['equals', 'not_equals', 'in', 'not_in'] as FilterOperator[],
        },
        {
          key: 'score',
          label: 'Score',
          type: 'number' as const,
          operators: [
            'equals',
            'not_equals',
            'greater_than',
            'less_than',
            'greater_or_equal',
            'less_or_equal',
            'between',
            'is_empty',
            'is_not_empty',
          ] as FilterOperator[],
        },
        {
          key: 'createdAt',
          label: 'Created At',
          type: 'date' as const,
          operators: [
            'equals',
            'not_equals',
            'greater_than',
            'less_than',
            'greater_or_equal',
            'less_or_equal',
            'between',
          ] as FilterOperator[],
        },
        {
          key: 'updatedAt',
          label: 'Updated At',
          type: 'date' as const,
          operators: [
            'equals',
            'not_equals',
            'greater_than',
            'less_than',
            'greater_or_equal',
            'less_or_equal',
            'between',
          ] as FilterOperator[],
        },
      ];

      return { fields };
    }),
});
