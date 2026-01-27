import { auth } from '@/lib/auth/config';
import { organizationMembers } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import {
  inviteMemberSchema,
  listMembersSchema,
  removeMemberSchema,
  updateRoleSchema,
} from '../types/schemas';

/**
 * Members tRPC router
 * Handles organization member management operations
 *
 * All procedures use organizationProcedure for automatic organization scoping
 */
export const membersRouter = router({
  /**
   * List all members of an organization
   * Returns members with their user information and roles
   */
  list: organizationProcedure.input(listMembersSchema).query(async ({ ctx, input }) => {
    const members = await ctx.db.query.organizationMembers.findMany({
      where: eq(organizationMembers.organizationId, input.organizationId),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            name: true,
            image: true,
            createdAt: true,
          },
        },
      },
      limit: input.limit,
      offset: input.offset,
    });

    // Count total members
    const totalResult = await ctx.db
      .select({ count: organizationMembers.id })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, input.organizationId));

    const total = totalResult.length;

    return {
      members,
      total,
    };
  }),

  /**
   * Invite a new member to the organization
   * Sends invitation email (mocked for now, Phase 5 will implement real emails)
   *
   * Only admin and owner can invite members
   */
  invite: organizationProcedure.input(inviteMemberSchema).mutation(async ({ ctx, input }) => {
    // Check if user has permission to invite
    if (ctx.membership.role !== 'admin' && ctx.membership.role !== 'owner') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'メンバーの招待は管理者またはオーナーのみ可能です',
      });
    }

    // Check if email is already a member by first finding the user
    const existingUser = await ctx.db.query.users.findFirst({
      where: (user, { eq }) => eq(user.email, input.email),
    });

    if (existingUser) {
      // Check if this user is already a member of the organization
      const existingMembership = await ctx.db.query.organizationMembers.findFirst({
        where: (members, { and, eq }) =>
          and(
            eq(members.organizationId, input.organizationId),
            eq(members.userId, existingUser.id)
          ),
      });

      if (existingMembership) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'このメールアドレスは既にメンバーです',
        });
      }
    }

    // Use BetterAuth's organization plugin to create invitation
    // For now, we'll create a simple invitation record
    // Phase 5 will implement full email sending with Resend

    try {
      // Generate a unique invitation ID
      const invitationId = crypto.randomUUID();

      // TODO: Phase 5 - Store invitation in database and send email via Resend
      // For now, just return a placeholder response
      // await sendInvitationEmail({
      //   email: input.email,
      //   organizationName: ctx.organization.name,
      //   invitedBy: ctx.user.name || ctx.user.email,
      //   inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${invitationId}`,
      // });

      return {
        success: true,
        invitationId: invitationId,
        message: '招待メールを送信しました（Phase 5で実装予定）',
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || '招待の作成に失敗しました',
      });
    }
  }),

  /**
   * Update member role
   * Only admin and owner can update roles
   * Owner cannot be changed or removed
   */
  updateRole: organizationProcedure.input(updateRoleSchema).mutation(async ({ ctx, input }) => {
    // Check if user has permission to update roles
    if (ctx.membership.role !== 'admin' && ctx.membership.role !== 'owner') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'ロールの変更は管理者またはオーナーのみ可能です',
      });
    }

    // Get target membership
    const targetMembership = await ctx.db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.id, input.membershipId),
        eq(organizationMembers.organizationId, input.organizationId)
      ),
    });

    if (!targetMembership) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'メンバーが見つかりません',
      });
    }

    // Cannot change owner role
    if (targetMembership.role === 'owner') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'オーナーのロールは変更できません',
      });
    }

    // Admin cannot promote to owner
    if (ctx.membership.role === 'admin' && input.role === 'owner') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'オーナーへの昇格は現在のオーナーのみ可能です',
      });
    }

    // Update role
    const [updated] = await ctx.db
      .update(organizationMembers)
      .set({
        role: input.role,
        updatedAt: new Date(),
      })
      .where(eq(organizationMembers.id, input.membershipId))
      .returning();

    return updated;
  }),

  /**
   * Remove member from organization
   * Only admin and owner can remove members
   * Owner cannot be removed
   * Cannot remove yourself
   */
  remove: organizationProcedure.input(removeMemberSchema).mutation(async ({ ctx, input }) => {
    // Check if user has permission to remove members
    if (ctx.membership.role !== 'admin' && ctx.membership.role !== 'owner') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'メンバーの削除は管理者またはオーナーのみ可能です',
      });
    }

    // Get target membership
    const targetMembership = await ctx.db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.id, input.membershipId),
        eq(organizationMembers.organizationId, input.organizationId)
      ),
    });

    if (!targetMembership) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'メンバーが見つかりません',
      });
    }

    // Cannot remove owner
    if (targetMembership.role === 'owner') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'オーナーは削除できません',
      });
    }

    // Cannot remove yourself
    if (targetMembership.userId === ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '自分自身を削除することはできません',
      });
    }

    // Delete membership
    await ctx.db.delete(organizationMembers).where(eq(organizationMembers.id, input.membershipId));

    return {
      success: true,
      message: 'メンバーを削除しました',
    };
  }),
});
