/**
 * Organization Hierarchy tRPC Router
 *
 * Phase 2.7: ホールディングス・グループ企業対応
 *
 * Endpoints:
 * - getHierarchy: Get organization hierarchy tree
 * - getChildren: Get direct child organizations
 * - getDescendants: Get all descendant organizations
 * - getAncestors: Get all ancestor organizations
 * - setParent: Set/change parent organization
 * - updateDataSharingPolicy: Update data sharing settings
 * - getAccessibleOrganizations: Get all orgs user can access
 */

import { z } from 'zod';
import { eq, sql, and, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { protectedProcedure, router } from '@/lib/trpc/init';
import { organizations, organizationMembers } from '@/lib/db/schema';
import type { Organization, OrganizationType, DataSharingPolicy } from '@/lib/db/schema';
import { canModifyHierarchy, canAccessChildOrganizations } from '@/lib/auth/permissions';

// =============================================================================
// Input Schemas
// =============================================================================

const organizationIdSchema = z.object({
  organizationId: z.string().uuid(),
});

const setParentSchema = z.object({
  organizationId: z.string().uuid(),
  parentOrganizationId: z.string().uuid().nullable(),
});

const updateDataSharingPolicySchema = z.object({
  organizationId: z.string().uuid(),
  policy: z.object({
    allowParentAccess: z.boolean(),
    allowChildAccess: z.boolean(),
    allowSiblingAccess: z.boolean(),
    sharedFields: z.array(z.string()).optional(),
  }),
});

const updateOrganizationTypeSchema = z.object({
  organizationId: z.string().uuid(),
  organizationType: z.enum(['holding', 'subsidiary', 'independent']),
});

// =============================================================================
// Response Types
// =============================================================================

interface HierarchyNode {
  id: string;
  name: string;
  slug: string;
  organizationType: OrganizationType;
  hierarchyLevel: number;
  parentOrganizationId: string | null;
  childCount: number;
  children?: HierarchyNode[];
}

interface AccessibleOrganization {
  id: string;
  name: string;
  slug: string;
  organizationType: OrganizationType;
  hierarchyLevel: number;
  accessType: 'direct' | 'descendant' | 'group';
}

// =============================================================================
// Router
// =============================================================================

export const hierarchyRouter = router({
  /**
   * Get the full hierarchy tree for an organization
   */
  getHierarchy: protectedProcedure
    .input(organizationIdSchema)
    .query(async ({ ctx, input }) => {
      // Verify user has access to view hierarchy
      const membership = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, input.organizationId),
          eq(organizationMembers.userId, ctx.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied to this organization',
        });
      }

      // Get the organization and its group
      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, input.organizationId),
      });

      if (!org) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      // Get all organizations in the same group
      const groupOrgs = await ctx.db
        .select()
        .from(organizations)
        .where(eq(organizations.groupId, org.groupId || org.id));

      // Build hierarchy tree
      const buildTree = (parentId: string | null): HierarchyNode[] => {
        return groupOrgs
          .filter((o) => o.parentOrganizationId === parentId)
          .map((o) => {
            const children = buildTree(o.id);
            return {
              id: o.id,
              name: o.name,
              slug: o.slug,
              organizationType: o.organizationType as OrganizationType,
              hierarchyLevel: o.hierarchyLevel,
              parentOrganizationId: o.parentOrganizationId,
              childCount: children.length,
              children: children.length > 0 ? children : undefined,
            };
          });
      };

      // Find root organization(s)
      const roots = buildTree(null);

      return {
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          organizationType: org.organizationType as OrganizationType,
          hierarchyLevel: org.hierarchyLevel,
          groupId: org.groupId,
        },
        hierarchy: roots,
        totalOrganizations: groupOrgs.length,
      };
    }),

  /**
   * Get direct child organizations
   */
  getChildren: protectedProcedure
    .input(organizationIdSchema)
    .query(async ({ ctx, input }) => {
      // Verify membership
      const membership = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, input.organizationId),
          eq(organizationMembers.userId, ctx.user.id)
        ),
      });

      if (!membership || !canAccessChildOrganizations(membership.role as any)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const children = await ctx.db
        .select()
        .from(organizations)
        .where(eq(organizations.parentOrganizationId, input.organizationId));

      return children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        organizationType: child.organizationType as OrganizationType,
        hierarchyLevel: child.hierarchyLevel,
        dataSharingPolicy: child.dataSharingPolicy as DataSharingPolicy,
      }));
    }),

  /**
   * Get all descendant organizations (using ltree)
   */
  getDescendants: protectedProcedure
    .input(organizationIdSchema)
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, input.organizationId),
          eq(organizationMembers.userId, ctx.user.id)
        ),
      });

      if (!membership || !canAccessChildOrganizations(membership.role as any)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      // Use the PostgreSQL function we created
      const result = await ctx.db.execute(
        sql`SELECT * FROM get_descendant_organizations(${input.organizationId}::UUID)`
      );

      return (result.rows as any[]).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        organizationType: row.organization_type as OrganizationType,
        hierarchyLevel: row.hierarchy_level,
      }));
    }),

  /**
   * Get all ancestor organizations
   */
  getAncestors: protectedProcedure
    .input(organizationIdSchema)
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, input.organizationId),
          eq(organizationMembers.userId, ctx.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const result = await ctx.db.execute(
        sql`SELECT * FROM get_ancestor_organizations(${input.organizationId}::UUID)`
      );

      return (result.rows as any[]).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        organizationType: row.organization_type as OrganizationType,
        hierarchyLevel: row.hierarchy_level,
      }));
    }),

  /**
   * Set or change parent organization
   */
  setParent: protectedProcedure
    .input(setParentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user can modify hierarchy
      const membership = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, input.organizationId),
          eq(organizationMembers.userId, ctx.user.id)
        ),
      });

      if (!membership || !canModifyHierarchy(membership.role as any)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only group owners can modify hierarchy',
        });
      }

      // Validate parent exists (if not null)
      if (input.parentOrganizationId) {
        const parent = await ctx.db.query.organizations.findFirst({
          where: eq(organizations.id, input.parentOrganizationId),
        });

        if (!parent) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Parent organization not found',
          });
        }

        // Prevent circular references
        const org = await ctx.db.query.organizations.findFirst({
          where: eq(organizations.id, input.organizationId),
        });

        if (org?.hierarchyPath && parent.hierarchyPath) {
          // Check if parent is a descendant of this org (would create cycle)
          const parentPath = parent.hierarchyPath as string;
          const orgPath = org.hierarchyPath as string;
          if (parentPath.startsWith(orgPath)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Cannot set a descendant as parent (circular reference)',
            });
          }
        }
      }

      // Update parent (trigger will handle hierarchy_path, level, group_id)
      await ctx.db
        .update(organizations)
        .set({
          parentOrganizationId: input.parentOrganizationId,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, input.organizationId));

      // Get updated organization
      const updated = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, input.organizationId),
      });

      return {
        success: true,
        organization: updated,
      };
    }),

  /**
   * Update data sharing policy
   */
  updateDataSharingPolicy: protectedProcedure
    .input(updateDataSharingPolicySchema)
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, input.organizationId),
          eq(organizationMembers.userId, ctx.user.id)
        ),
      });

      if (!membership || !['owner', 'group_owner'].includes(membership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners can update data sharing policy',
        });
      }

      await ctx.db
        .update(organizations)
        .set({
          dataSharingPolicy: input.policy,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, input.organizationId));

      return { success: true };
    }),

  /**
   * Update organization type
   */
  updateOrganizationType: protectedProcedure
    .input(updateOrganizationTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, input.organizationId),
          eq(organizationMembers.userId, ctx.user.id)
        ),
      });

      if (!membership || !canModifyHierarchy(membership.role as any)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only group owners can change organization type',
        });
      }

      await ctx.db
        .update(organizations)
        .set({
          organizationType: input.organizationType,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, input.organizationId));

      return { success: true };
    }),

  /**
   * Get all organizations accessible to the current user
   */
  getAccessibleOrganizations: protectedProcedure
    .input(
      z.object({
        includeDescendants: z.boolean().default(false),
        includeGroup: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.execute(
        sql`SELECT * FROM get_accessible_organizations(
          ${ctx.user.id}::UUID,
          ${input.includeDescendants}::BOOLEAN,
          ${input.includeGroup}::BOOLEAN
        )`
      );

      return (result.rows as any[]).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        organizationType: row.organization_type as OrganizationType,
        hierarchyLevel: row.hierarchy_level,
        accessType: row.access_type as 'direct' | 'descendant' | 'group',
      }));
    }),

  /**
   * Get group statistics (for group dashboards)
   */
  getGroupStats: protectedProcedure
    .input(organizationIdSchema)
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, input.organizationId),
          eq(organizationMembers.userId, ctx.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, input.organizationId),
      });

      if (!org) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      // Get counts for the group
      const groupId = org.groupId || org.id;

      const [orgCount, holdingCount, subsidiaryCount] = await Promise.all([
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(organizations)
          .where(eq(organizations.groupId, groupId)),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(organizations)
          .where(
            and(
              eq(organizations.groupId, groupId),
              eq(organizations.organizationType, 'holding')
            )
          ),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(organizations)
          .where(
            and(
              eq(organizations.groupId, groupId),
              eq(organizations.organizationType, 'subsidiary')
            )
          ),
      ]);

      return {
        groupId,
        totalOrganizations: Number(orgCount[0]?.count || 0),
        holdingCompanies: Number(holdingCount[0]?.count || 0),
        subsidiaries: Number(subsidiaryCount[0]?.count || 0),
        independentOrgs:
          Number(orgCount[0]?.count || 0) -
          Number(holdingCount[0]?.count || 0) -
          Number(subsidiaryCount[0]?.count || 0),
      };
    }),
});

export type HierarchyRouter = typeof hierarchyRouter;
