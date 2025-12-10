import { leadTags, leads, tags } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import {
  type SQL,
  and,
  asc,
  between,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  notIlike,
  notInArray,
  or,
  sql,
} from 'drizzle-orm';
import {
  type FilterCondition,
  type FilterGroup,
  bulkCreateSchema,
  bulkDeleteSchema,
  bulkUpdateStatusSchema,
  createLeadSchema,
  deleteLeadSchema,
  getLeadSchema,
  listLeadsSchema,
  updateLeadSchema,
} from '../types/schemas';

/**
 * Build SQL condition from a filter condition
 */
function buildCondition(condition: FilterCondition): SQL | undefined {
  const { field, operator, value, value2 } = condition;

  // Map field names to lead columns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columnMap: Record<string, any> = {
    name: leads.name,
    email: leads.email,
    company: leads.company,
    phone: leads.phone,
    status: leads.status,
    source: leads.source,
    score: leads.score,
    createdAt: leads.createdAt,
    updatedAt: leads.updatedAt,
  };

  const column = columnMap[field];
  if (!column) return undefined;

  switch (operator) {
    case 'equals':
      return eq(column, value as string);
    case 'not_equals':
      return ne(column, value as string);
    case 'contains':
      return ilike(column, `%${value}%`);
    case 'not_contains':
      return notIlike(column, `%${value}%`);
    case 'starts_with':
      return ilike(column, `${value}%`);
    case 'ends_with':
      return ilike(column, `%${value}`);
    case 'greater_than':
      return gt(column, value as number | Date);
    case 'less_than':
      return lt(column, value as number | Date);
    case 'greater_or_equal':
      return gte(column, value as number | Date);
    case 'less_or_equal':
      return lte(column, value as number | Date);
    case 'between':
      return between(column, value as number | Date, value2 as number | Date);
    case 'is_empty':
      return or(isNull(column), eq(column, ''));
    case 'is_not_empty':
      return and(isNotNull(column), ne(column, ''));
    case 'in':
      return inArray(column, value as string[]);
    case 'not_in':
      return notInArray(column, value as string[]);
    default:
      return undefined;
  }
}

/**
 * Build SQL conditions from a filter group (recursive)
 */
function buildFilterGroup(group: FilterGroup): SQL | undefined {
  const conditions: (SQL | undefined)[] = [];

  // Build conditions from this group
  for (const condition of group.conditions) {
    const sqlCondition = buildCondition(condition);
    if (sqlCondition) {
      conditions.push(sqlCondition);
    }
  }

  // Build nested groups
  if (group.groups) {
    for (const nestedGroup of group.groups) {
      const nestedCondition = buildFilterGroup(nestedGroup as FilterGroup);
      if (nestedCondition) {
        conditions.push(nestedCondition);
      }
    }
  }

  // Filter out undefined
  const validConditions = conditions.filter((c): c is SQL => c !== undefined);

  if (validConditions.length === 0) return undefined;
  if (validConditions.length === 1) return validConditions[0];

  return group.logic === 'and' ? and(...validConditions) : or(...validConditions);
}

/**
 * Leads tRPC router
 * Handles CRUD operations for leads with multi-tenant isolation
 */
export const leadsRouter = router({
  /**
   * Create a new lead
   */
  create: organizationProcedure.input(createLeadSchema).mutation(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('create', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'リードを作成する権限がありません',
      });
    }

    // Create lead
    const [lead] = await ctx.db
      .insert(leads)
      .values({
        organizationId: input.organizationId,
        email: input.email,
        name: input.name,
        company: input.company,
        phone: input.phone,
        status: input.status,
        score: input.score,
        source: input.source,
        responses: input.responses,
      })
      .returning();

    return lead;
  }),

  /**
   * Get lead by ID
   */
  get: organizationProcedure.input(getLeadSchema).query(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'リードを閲覧する権限がありません',
      });
    }

    const lead = await ctx.db.query.leads.findFirst({
      where: and(eq(leads.id, input.id), eq(leads.organizationId, input.organizationId)),
      with: {
        leadTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!lead) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'リードが見つかりません',
      });
    }

    // Transform to include tags array
    return {
      ...lead,
      tags: lead.leadTags.map((lt) => lt.tag),
    };
  }),

  /**
   * List leads with pagination and filtering
   */
  list: organizationProcedure.input(listLeadsSchema).query(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'リードを閲覧する権限がありません',
      });
    }

    // Build where conditions
    const conditions: (SQL | undefined)[] = [eq(leads.organizationId, input.organizationId)];

    // Basic filters
    if (input.status) {
      conditions.push(eq(leads.status, input.status));
    }

    if (input.source) {
      conditions.push(eq(leads.source, input.source));
    }

    if (input.search) {
      const searchTerm = `%${input.search}%`;
      conditions.push(
        or(
          ilike(leads.name, searchTerm),
          ilike(leads.email, searchTerm),
          ilike(leads.company, searchTerm)
        )!
      );
    }

    // Date range filter
    if (input.createdFrom) {
      conditions.push(gte(leads.createdAt, new Date(input.createdFrom)));
    }

    if (input.createdTo) {
      conditions.push(lte(leads.createdAt, new Date(input.createdTo)));
    }

    // Score range filter
    if (input.scoreMin !== undefined) {
      conditions.push(gte(leads.score, input.scoreMin));
    }

    if (input.scoreMax !== undefined) {
      conditions.push(lte(leads.score, input.scoreMax));
    }

    // Tag filter - get lead IDs that have the specified tags
    if (input.tagIds && input.tagIds.length > 0) {
      const leadsWithTags = await ctx.db
        .select({ leadId: leadTags.leadId })
        .from(leadTags)
        .where(inArray(leadTags.tagId, input.tagIds))
        .groupBy(leadTags.leadId);

      if (leadsWithTags.length > 0) {
        conditions.push(
          inArray(
            leads.id,
            leadsWithTags.map((lt) => lt.leadId)
          )
        );
      } else {
        // No leads match the tag filter
        return {
          items: [],
          total: 0,
          limit: input.limit,
          offset: input.offset,
        };
      }
    }

    // Advanced filter
    if (input.advancedFilter) {
      const advancedCondition = buildFilterGroup(input.advancedFilter);
      if (advancedCondition) {
        conditions.push(advancedCondition);
      }
    }

    // Build order by
    const sortColumn = input.sortBy || 'createdAt';
    const sortOrder = input.sortOrder || 'desc';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderByMap: Record<string, any> = {
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      name: leads.name,
      email: leads.email,
      score: leads.score,
      status: leads.status,
    };

    const orderColumn = orderByMap[sortColumn] || leads.createdAt;
    const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

    // Filter out undefined conditions
    const validConditions = conditions.filter((c): c is SQL => c !== undefined);

    // Get total count
    const totalCount = await ctx.db
      .select({ count: leads.id })
      .from(leads)
      .where(and(...validConditions));

    // Get paginated results with tags
    const results = await ctx.db.query.leads.findMany({
      where: and(...validConditions),
      orderBy: [orderDirection],
      limit: input.limit,
      offset: input.offset,
      with: {
        leadTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    // Transform results to include tags array
    const itemsWithTags = results.map((lead) => ({
      ...lead,
      tags: lead.leadTags.map((lt) => lt.tag),
    }));

    return {
      items: itemsWithTags,
      total: totalCount.length,
      limit: input.limit,
      offset: input.offset,
    };
  }),

  /**
   * Update a lead
   */
  update: organizationProcedure.input(updateLeadSchema).mutation(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'リードを更新する権限がありません',
      });
    }

    // Verify lead exists and belongs to organization
    const existing = await ctx.db.query.leads.findFirst({
      where: and(eq(leads.id, input.id), eq(leads.organizationId, input.organizationId)),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'リードが見つかりません',
      });
    }

    // Build update object (only include defined fields)
    const updateData: any = {};
    if (input.email !== undefined) updateData.email = input.email;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.company !== undefined) updateData.company = input.company;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.score !== undefined) updateData.score = input.score;
    if (input.source !== undefined) updateData.source = input.source;
    if (input.responses !== undefined) updateData.responses = input.responses;
    updateData.updatedAt = new Date();

    // Update lead
    const [updated] = await ctx.db
      .update(leads)
      .set(updateData)
      .where(and(eq(leads.id, input.id), eq(leads.organizationId, input.organizationId)))
      .returning();

    return updated;
  }),

  /**
   * Delete a lead
   */
  delete: organizationProcedure.input(deleteLeadSchema).mutation(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('delete', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'リードを削除する権限がありません',
      });
    }

    // Verify lead exists and belongs to organization
    const existing = await ctx.db.query.leads.findFirst({
      where: and(eq(leads.id, input.id), eq(leads.organizationId, input.organizationId)),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'リードが見つかりません',
      });
    }

    // Delete lead
    await ctx.db
      .delete(leads)
      .where(and(eq(leads.id, input.id), eq(leads.organizationId, input.organizationId)));

    return { success: true };
  }),

  /**
   * Bulk update status for multiple leads
   */
  bulkUpdateStatus: organizationProcedure
    .input(bulkUpdateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!ctx.ability.can('update', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードを更新する権限がありません',
        });
      }

      // Update all leads matching the IDs and organization
      const result = await ctx.db
        .update(leads)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(and(inArray(leads.id, input.ids), eq(leads.organizationId, input.organizationId)))
        .returning({ id: leads.id });

      return {
        success: true,
        updatedCount: result.length,
      };
    }),

  /**
   * Bulk delete multiple leads
   */
  bulkDelete: organizationProcedure.input(bulkDeleteSchema).mutation(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('delete', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'リードを削除する権限がありません',
      });
    }

    // Delete all leads matching the IDs and organization
    const result = await ctx.db
      .delete(leads)
      .where(and(inArray(leads.id, input.ids), eq(leads.organizationId, input.organizationId)))
      .returning({ id: leads.id });

    return {
      success: true,
      deletedCount: result.length,
    };
  }),

  /**
   * Bulk create leads from import
   */
  bulkCreate: organizationProcedure.input(bulkCreateSchema).mutation(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('create', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'リードを作成する権限がありません',
      });
    }

    // Insert all leads
    const leadsToInsert = input.leads.map((lead) => ({
      organizationId: input.organizationId,
      email: lead.email,
      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      status: lead.status,
      source: lead.source,
      score: lead.score,
    }));

    const result = await ctx.db.insert(leads).values(leadsToInsert).returning({ id: leads.id });

    return {
      success: true,
      createdCount: result.length,
    };
  }),
});
