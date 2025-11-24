import { AbilityBuilder, PureAbility, createMongoAbility } from '@casl/ability';
import type { User, OrganizationMember } from '@/lib/db/schema';

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
  | 'all';

/**
 * Define the shape of our abilities
 */
export type AppAbility = PureAbility<[Action, Subject]>;

/**
 * Define user roles
 */
export type Role = 'owner' | 'admin' | 'member';

/**
 * Define permissions for each role
 */
export function defineAbilitiesFor(user: User | null, membership?: OrganizationMember) {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (!user || !membership) {
    // Anonymous users - no permissions
    return build();
  }

  const role = membership.role as Role;

  // Owner permissions - full access to everything
  if (role === 'owner') {
    can('manage', 'all');
  }

  // Admin permissions - most things except organization deletion
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

  // Member permissions - read and create leads
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
  subject: Subject
): boolean {
  const ability = defineAbilitiesFor(user, membership);
  return ability.can(action, subject);
}
