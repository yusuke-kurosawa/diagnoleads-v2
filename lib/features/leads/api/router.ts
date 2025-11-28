import { leads } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import {
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
    });

    if (!lead) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'リードが見つかりません',
      });
    }

    return lead;
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

    // Get paginated results
    const results = await ctx.db
      .select()
      .from(leads)
      .where(and(...conditions))
      .orderBy(desc(leads.createdAt))
      .limit(input.limit)
      .offset(input.offset);

    return {
      items: results,
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
});
