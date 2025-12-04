/**
 * Tags tRPC Router
 * Handles CRUD operations for tags and lead-tag associations
 */
import { leadTags, tags } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

// Schemas
const createTagSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#3b82f6'),
  description: z.string().max(200).optional(),
});

const updateTagSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  description: z.string().max(200).optional().nullable(),
});

const deleteTagSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const listTagsSchema = z.object({
  organizationId: z.string().uuid(),
});

const addTagToLeadSchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
  tagId: z.string().uuid(),
});

const removeTagFromLeadSchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
  tagId: z.string().uuid(),
});

const setLeadTagsSchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()),
});

const getLeadTagsSchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
});

export const tagsRouter = router({
  /**
   * List all tags for an organization
   */
  list: organizationProcedure.input(listTagsSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'タグを閲覧する権限がありません',
      });
    }

    const result = await ctx.db
      .select()
      .from(tags)
      .where(eq(tags.organizationId, input.organizationId))
      .orderBy(tags.name);

    return result;
  }),

  /**
   * Create a new tag
   */
  create: organizationProcedure.input(createTagSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('create', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'タグを作成する権限がありません',
      });
    }

    // Check for duplicate name
    const existing = await ctx.db.query.tags.findFirst({
      where: and(eq(tags.organizationId, input.organizationId), eq(tags.name, input.name)),
    });

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: '同じ名前のタグが既に存在します',
      });
    }

    const [tag] = await ctx.db
      .insert(tags)
      .values({
        organizationId: input.organizationId,
        name: input.name,
        color: input.color,
        description: input.description,
      })
      .returning();

    return tag;
  }),

  /**
   * Update a tag
   */
  update: organizationProcedure.input(updateTagSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'タグを更新する権限がありません',
      });
    }

    const existing = await ctx.db.query.tags.findFirst({
      where: and(eq(tags.id, input.id), eq(tags.organizationId, input.organizationId)),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'タグが見つかりません',
      });
    }

    // Check for duplicate name if name is being changed
    if (input.name && input.name !== existing.name) {
      const duplicate = await ctx.db.query.tags.findFirst({
        where: and(eq(tags.organizationId, input.organizationId), eq(tags.name, input.name)),
      });

      if (duplicate) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '同じ名前のタグが既に存在します',
        });
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.description !== undefined) updateData.description = input.description;

    const [updated] = await ctx.db
      .update(tags)
      .set(updateData)
      .where(and(eq(tags.id, input.id), eq(tags.organizationId, input.organizationId)))
      .returning();

    return updated;
  }),

  /**
   * Delete a tag
   */
  delete: organizationProcedure.input(deleteTagSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('delete', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'タグを削除する権限がありません',
      });
    }

    const existing = await ctx.db.query.tags.findFirst({
      where: and(eq(tags.id, input.id), eq(tags.organizationId, input.organizationId)),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'タグが見つかりません',
      });
    }

    await ctx.db
      .delete(tags)
      .where(and(eq(tags.id, input.id), eq(tags.organizationId, input.organizationId)));

    return { success: true };
  }),

  /**
   * Add a tag to a lead
   */
  addToLead: organizationProcedure.input(addTagToLeadSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'リードを更新する権限がありません',
      });
    }

    // Check if already exists
    const existing = await ctx.db.query.leadTags.findFirst({
      where: and(eq(leadTags.leadId, input.leadId), eq(leadTags.tagId, input.tagId)),
    });

    if (existing) {
      return existing;
    }

    const [leadTag] = await ctx.db
      .insert(leadTags)
      .values({
        leadId: input.leadId,
        tagId: input.tagId,
      })
      .returning();

    return leadTag;
  }),

  /**
   * Remove a tag from a lead
   */
  removeFromLead: organizationProcedure
    .input(removeTagFromLeadSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can('update', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードを更新する権限がありません',
        });
      }

      await ctx.db
        .delete(leadTags)
        .where(and(eq(leadTags.leadId, input.leadId), eq(leadTags.tagId, input.tagId)));

      return { success: true };
    }),

  /**
   * Set all tags for a lead (replace existing)
   */
  setLeadTags: organizationProcedure.input(setLeadTagsSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'リードを更新する権限がありません',
      });
    }

    // Delete existing tags
    await ctx.db.delete(leadTags).where(eq(leadTags.leadId, input.leadId));

    // Insert new tags
    if (input.tagIds.length > 0) {
      await ctx.db.insert(leadTags).values(
        input.tagIds.map((tagId) => ({
          leadId: input.leadId,
          tagId,
        }))
      );
    }

    // Get updated tags
    const result = await ctx.db
      .select({
        tag: tags,
      })
      .from(leadTags)
      .innerJoin(tags, eq(leadTags.tagId, tags.id))
      .where(eq(leadTags.leadId, input.leadId));

    return result.map((r) => r.tag);
  }),

  /**
   * Get tags for a lead
   */
  getLeadTags: organizationProcedure.input(getLeadTagsSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'リードを閲覧する権限がありません',
      });
    }

    const result = await ctx.db
      .select({
        tag: tags,
      })
      .from(leadTags)
      .innerJoin(tags, eq(leadTags.tagId, tags.id))
      .where(eq(leadTags.leadId, input.leadId));

    return result.map((r) => r.tag);
  }),

  /**
   * Bulk set tags for multiple leads
   */
  bulkSetLeadTags: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        leadIds: z.array(z.string().uuid()),
        tagIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can('update', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'リードを更新する権限がありません',
        });
      }

      // Delete existing tags for all leads
      await ctx.db.delete(leadTags).where(inArray(leadTags.leadId, input.leadIds));

      // Insert new tags for all leads
      if (input.tagIds.length > 0 && input.leadIds.length > 0) {
        const values = input.leadIds.flatMap((leadId) =>
          input.tagIds.map((tagId) => ({ leadId, tagId }))
        );
        await ctx.db.insert(leadTags).values(values);
      }

      return { success: true, updatedCount: input.leadIds.length };
    }),
});
