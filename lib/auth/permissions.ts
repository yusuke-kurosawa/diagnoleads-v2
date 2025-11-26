import { AbilityBuilder, PureAbility, createMongoAbility } from '@casl/ability';
import type { User, OrganizationMember, Organization, OrganizationRole } from '@/lib/db/schema';

/**
 * Define actions that can be performed
 */
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

/**
 * Define subjects (resources) that can be accessed
 */
export type Subject =
  | 'Lead'
  | 'Organization'
  | 'User'
  | 'Assessment'
  | 'Analytics'
  | 'Settings'
  | 'Hierarchy'  // 🆕 Hierarchy management
  | 'GroupReport' // 🆕 Group-wide reports
  | 'all';

/**
 * Define the shape of our abilities
 */
export type AppAbility = PureAbility<[Action, Subject]>;

/**
 * Define user roles (extended for hierarchy)
 * @deprecated Use OrganizationRole from schema instead
 */
export type Role = OrganizationRole;

/**
 * Hierarchy context for permission calculation
 */
export interface HierarchyContext {
  /** IDs of child organizations */
  childOrganizationIds?: string[];
  /** IDs of all descendant organizations */
  descendantOrganizationIds?: string[];
  /** ID of the group (root organization) */
  groupId?: string;
  /** Whether data sharing is allowed from this org */
  dataSharingPolicy?: {
    allowParentAccess: boolean;
    allowChildAccess: boolean;
    allowSiblingAccess: boolean;
  };
}

/**
 * Define permissions for each role
 *
 * Role Hierarchy (Phase 2.7):
 * - owner: Full control of single organization
 * - admin: Admin access to single organization
 * - member: Standard member access
 * - group_owner: Full control of entire group (all descendant orgs)
 * - group_admin: Read access to entire group
 * - parent_viewer: Read-only access to child organizations
 */
export function defineAbilitiesFor(
  user: User | null,
  membership?: OrganizationMember,
  hierarchyContext?: HierarchyContext
) {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (!user || !membership) {
    // Anonymous users - no permissions
    return build();
  }

  const role = membership.role as OrganizationRole;

  // =========================================================================
  // Group Owner - Full control of entire group
  // =========================================================================
  if (role === 'group_owner') {
    can('manage', 'all');
    can('manage', 'Hierarchy');
    can('manage', 'GroupReport');
  }

  // =========================================================================
  // Group Admin - Read access to entire group, manage own org
  // =========================================================================
  if (role === 'group_admin') {
    // Full access to own organization
    can('manage', 'Lead');
    can('manage', 'Assessment');
    can('manage', 'Analytics');
    can('manage', 'User');
    can('read', 'Organization');
    can('update', 'Organization');
    can('read', 'Settings');
    can('update', 'Settings');

    // Group-wide read access
    can('read', 'GroupReport');
    can('read', 'Hierarchy');

    // Cannot create/delete organizations in group
    cannot('create', 'Organization');
    cannot('delete', 'Organization');
  }

  // =========================================================================
  // Owner - Full access to single organization
  // =========================================================================
  if (role === 'owner') {
    can('manage', 'all');

    // Can manage hierarchy if they have child orgs
    if (hierarchyContext?.childOrganizationIds?.length) {
      can('read', 'Hierarchy');
      can('read', 'GroupReport');
    }

    // Cannot manage group-level settings unless group_owner
    cannot('manage', 'Hierarchy');
  }

  // =========================================================================
  // Parent Viewer - Read-only access to child organizations
  // =========================================================================
  if (role === 'parent_viewer') {
    // Read access to own organization
    can('read', 'Lead');
    can('read', 'Assessment');
    can('read', 'Analytics');
    can('read', 'Organization');
    can('read', 'User');

    // Can view hierarchy and group reports
    can('read', 'Hierarchy');
    can('read', 'GroupReport');

    // No write access
    cannot('create', 'Lead');
    cannot('update', 'Lead');
    cannot('delete', 'Lead');
  }

  // =========================================================================
  // Admin - Most things except organization deletion
  // =========================================================================
  if (role === 'admin') {
    can('manage', 'Lead');
    can('manage', 'Assessment');
    can('manage', 'Analytics');
    can('manage', 'User');
    can('read', 'Organization');
    can('update', 'Organization');
    can('read', 'Settings');
    can('update', 'Settings');
  }

  // =========================================================================
  // Member - Read and create leads
  // =========================================================================
  if (role === 'member') {
    can('read', 'Lead');
    can('create', 'Lead');
    can('update', 'Lead'); // Can update own leads
    can('read', 'Assessment');
    can('read', 'Analytics');
    can('read', 'Organization');
    can('read', 'User');
  }

  return build();
}

/**
 * Helper function to check if user can perform action
 */
export function canPerformAction(
  user: User | null,
  membership: OrganizationMember | undefined,
  action: Action,
  subject: Subject,
  hierarchyContext?: HierarchyContext
): boolean {
  const ability = defineAbilitiesFor(user, membership, hierarchyContext);
  return ability.can(action, subject);
}

/**
 * Check if a role has group-level access
 */
export function isGroupRole(role: OrganizationRole): boolean {
  return role === 'group_owner' || role === 'group_admin';
}

/**
 * Check if a role can access child organizations
 */
export function canAccessChildOrganizations(role: OrganizationRole): boolean {
  return role === 'group_owner' || role === 'group_admin' || role === 'parent_viewer' || role === 'owner';
}

/**
 * Check if a role can modify organization hierarchy
 */
export function canModifyHierarchy(role: OrganizationRole): boolean {
  return role === 'group_owner';
}

/**
 * Get the effective access scope for a role
 */
export function getAccessScope(role: OrganizationRole): 'self' | 'children' | 'group' {
  switch (role) {
    case 'group_owner':
    case 'group_admin':
      return 'group';
    case 'parent_viewer':
    case 'owner':
      return 'children';
    default:
      return 'self';
  }
}
