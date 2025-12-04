/**
 * Comments tRPC Router
 * Handles CRUD operations for lead comments and notes
 */
import { leadComments, users } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

// Schemas
const createCommentSchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(['comment', 'note', 'activity']).default('comment'),
  parentId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateCommentSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

const deleteCommentSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const listCommentsSchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
  type: z.enum(['comment', 'note', 'activity', 'all']).default('all'),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const togglePinSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

export const commentsRouter = router({
  /**
   * List comments for a lead
   */
  list: organizationProcedure.input(listCommentsSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'コメントを閲覧する権限がありません',
      });
    }

    const conditions = [
      eq(leadComments.leadId, input.leadId),
      eq(leadComments.organizationId, input.organizationId),
      isNull(leadComments.parentId), // Only top-level comments
    ];

    if (input.type !== 'all') {
      conditions.push(eq(leadComments.type, input.type));
    }

    const results = await ctx.db.query.leadComments.findMany({
      where: and(...conditions),
      orderBy: [desc(leadComments.isPinned), desc(leadComments.createdAt)],
      limit: input.limit,
      offset: input.offset,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: [leadComments.createdAt],
        },
      },
    });

    // Get total count
    const totalCount = await ctx.db
      .select({ count: leadComments.id })
      .from(leadComments)
      .where(and(...conditions));

    return {
      items: results,
      total: totalCount.length,
      limit: input.limit,
      offset: input.offset,
    };
  }),

  /**
   * Create a new comment
   */
  create: organizationProcedure.input(createCommentSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'コメントを作成する権限がありません',
      });
    }

    const [comment] = await ctx.db
      .insert(leadComments)
      .values({
        leadId: input.leadId,
        userId: ctx.session.user.id,
        organizationId: input.organizationId,
        content: input.content,
        type: input.type,
        parentId: input.parentId,
        metadata: input.metadata,
      })
      .returning();

    // Fetch with user info
    const result = await ctx.db.query.leadComments.findFirst({
      where: eq(leadComments.id, comment.id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return result;
  }),

  /**
   * Update a comment
   */
  update: organizationProcedure.input(updateCommentSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'コメントを更新する権限がありません',
      });
    }

    // Verify comment exists and user owns it
    const existing = await ctx.db.query.leadComments.findFirst({
      where: and(
        eq(leadComments.id, input.id),
        eq(leadComments.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'コメントが見つかりません',
      });
    }

    // Only allow editing own comments (unless admin)
    if (existing.userId !== ctx.session.user.id && !ctx.ability.can('manage', 'all')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '自分のコメントのみ編集できます',
      });
    }

    const [updated] = await ctx.db
      .update(leadComments)
      .set({
        content: input.content,
        updatedAt: new Date(),
      })
      .where(
        and(eq(leadComments.id, input.id), eq(leadComments.organizationId, input.organizationId))
      )
      .returning();

    return updated;
  }),

  /**
   * Delete a comment
   */
  delete: organizationProcedure.input(deleteCommentSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'コメントを削除する権限がありません',
      });
    }

    const existing = await ctx.db.query.leadComments.findFirst({
      where: and(
        eq(leadComments.id, input.id),
        eq(leadComments.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'コメントが見つかりません',
      });
    }

    // Only allow deleting own comments (unless admin)
    if (existing.userId !== ctx.session.user.id && !ctx.ability.can('manage', 'all')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '自分のコメントのみ削除できます',
      });
    }

    await ctx.db
      .delete(leadComments)
      .where(
        and(eq(leadComments.id, input.id), eq(leadComments.organizationId, input.organizationId))
      );

    return { success: true };
  }),

  /**
   * Toggle pin status of a comment
   */
  togglePin: organizationProcedure.input(togglePinSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'コメントをピン留めする権限がありません',
      });
    }

    const existing = await ctx.db.query.leadComments.findFirst({
      where: and(
        eq(leadComments.id, input.id),
        eq(leadComments.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'コメントが見つかりません',
      });
    }

    const [updated] = await ctx.db
      .update(leadComments)
      .set({
        isPinned: !existing.isPinned,
        updatedAt: new Date(),
      })
      .where(
        and(eq(leadComments.id, input.id), eq(leadComments.organizationId, input.organizationId))
      )
      .returning();

    return updated;
  }),

  /**
   * Add activity log entry
   */
  addActivity: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        leadId: z.string().uuid(),
        content: z.string().min(1).max(1000),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can('update', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'アクティビティを記録する権限がありません',
        });
      }

      const [activity] = await ctx.db
        .insert(leadComments)
        .values({
          leadId: input.leadId,
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
          content: input.content,
          type: 'activity',
          metadata: input.metadata,
        })
        .returning();

      return activity;
    }),

  /**
   * Get comment count for a lead
   */
  getCount: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        leadId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.ability.can('read', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'コメントを閲覧する権限がありません',
        });
      }

      const result = await ctx.db
        .select({ count: leadComments.id })
        .from(leadComments)
        .where(
          and(
            eq(leadComments.leadId, input.leadId),
            eq(leadComments.organizationId, input.organizationId)
          )
        );

      return { count: result.length };
    }),
});
