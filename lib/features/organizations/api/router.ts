import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure } from '@/lib/trpc/init';
import { organizations, organizationMembers } from '@/lib/db/schema';
import {
  getOrganizationSchema,
  listOrganizationsSchema,
  updateOrganizationSchema,
  createOrganizationSchema,
} from '../types/schemas';

/**
 * Organizations tRPC router
 * Handles organization management operations
 *
 * Note: Uses protectedProcedure (not organizationProcedure) because
 * these endpoints operate across multiple organizations
 */
export const organizationsRouter = router({
  /**
   * Get organization by ID
   * User must be a member of the organization
   */
  getById: protectedProcedure
    .input(getOrganizationSchema)
    .query(async ({ ctx, input }) => {
      // Verify membership
      const membership = await ctx.db.query.organizationMembers.findFirst({
        where: (members, { and, eq }) =>
          and(
            eq(members.userId, ctx.user.id),
            eq(members.organizationId, input.id)
          ),
        with: {
          organization: true,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '組織が見つからないか、アクセス権限がありません',
        });
      }

      return membership.organization;
    }),

  /**
   * List all organizations the user is a member of
   */
  list: protectedProcedure
    .input(listOrganizationsSchema)
    .query(async ({ ctx, input }) => {
      const memberships = await ctx.db.query.organizationMembers.findMany({
        where: eq(organizationMembers.userId, ctx.user.id),
        with: {
          organization: true,
        },
        limit: input.limit || 50,
        offset: input.offset || 0,
      });

      return {
        organizations: memberships.map((m) => ({
          ...m.organization,
          role: m.role,
          membershipId: m.id,
        })),
        total: memberships.length,
      };
    }),

  /**
   * Update organization
   * Only owner can update organization details
   */
  update: protectedProcedure
    .input(updateOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user is owner
      const membership = await ctx.db.query.organizationMembers.findFirst({
        where: (members, { and, eq }) =>
          and(
            eq(members.userId, ctx.user.id),
            eq(members.organizationId, input.id)
          ),
      });

      if (!membership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '組織が見つかりません',
        });
      }

      if (membership.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '組織の更新は オーナーのみ可能です',
        });
      }

      // Build update object
      const updateData: any = {
        updatedAt: new Date(),
      };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.slug !== undefined) updateData.slug = input.slug;
      if (input.settings !== undefined) updateData.settings = input.settings;

      // Update organization
      const [updated] = await ctx.db
        .update(organizations)
        .set(updateData)
        .where(eq(organizations.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Create organization
   * Automatically adds the creating user as owner
   */
  create: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if slug is already taken
      const existing = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.slug, input.slug),
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'このスラッグは既に使用されています',
        });
      }

      // Create organization
      const [organization] = await ctx.db
        .insert(organizations)
        .values({
          name: input.name,
          slug: input.slug,
          settings: input.settings || {},
        })
        .returning();

      // Add creator as owner
      await ctx.db.insert(organizationMembers).values({
        organizationId: organization.id,
        userId: ctx.user.id,
        role: 'owner',
      });

      return organization;
    }),
});
