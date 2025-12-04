import { leadTags, leads, tags } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import {
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
    const conditions = [eq(leads.organizationId, input.organizationId)];

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

    // Get total count
    const totalCount = await ctx.db
      .select({ count: leads.id })
      .from(leads)
      .where(and(...conditions));

    // Get paginated results with tags
    const results = await ctx.db.query.leads.findMany({
      where: and(...conditions),
      orderBy: [desc(leads.createdAt)],
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
