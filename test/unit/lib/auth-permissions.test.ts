/**
 * Auth Permissions Tests
 *
 * Unit tests for CASL-based permission system
 */

import { describe, expect, it } from 'vitest';
import {
  defineAbilitiesFor,
  canPerformAction,
  isGroupRole,
  canAccessChildOrganizations,
  canModifyHierarchy,
  getAccessScope,
  type Action,
  type Subject,
} from '@/lib/auth/permissions';
import type { User, OrganizationMember, OrganizationRole } from '@/lib/db/schema';

// Mock user factory
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

// Mock membership factory
function createMockMembership(
  role: OrganizationRole,
  overrides: Partial<OrganizationMember> = {}
): OrganizationMember {
  return {
    id: 'member-1',
    userId: 'user-1',
    organizationId: 'org-1',
    role,
    createdAt: new Date(),
    ...overrides,
  } as OrganizationMember;
}

describe('defineAbilitiesFor', () => {
  describe('Anonymous users', () => {
    it('should have no permissions without user', () => {
      const ability = defineAbilitiesFor(null, undefined);

      expect(ability.can('read', 'Lead')).toBe(false);
      expect(ability.can('create', 'Lead')).toBe(false);
      expect(ability.can('manage', 'all')).toBe(false);
    });

    it('should have no permissions without membership', () => {
      const user = createMockUser();
      const ability = defineAbilitiesFor(user, undefined);

      expect(ability.can('read', 'Lead')).toBe(false);
      expect(ability.can('create', 'Lead')).toBe(false);
    });
  });

  describe('group_owner role', () => {
    it('should have full access to everything', () => {
      const user = createMockUser();
      const membership = createMockMembership('group_owner');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('manage', 'all')).toBe(true);
      expect(ability.can('manage', 'Hierarchy')).toBe(true);
      expect(ability.can('manage', 'GroupReport')).toBe(true);
    });

    it('should be able to perform any action on any subject', () => {
      const user = createMockUser();
      const membership = createMockMembership('group_owner');
      const ability = defineAbilitiesFor(user, membership);

      const actions: Action[] = ['create', 'read', 'update', 'delete', 'manage'];
      const subjects: Subject[] = ['Lead', 'Organization', 'User', 'Assessment', 'Analytics'];

      for (const action of actions) {
        for (const subject of subjects) {
          expect(ability.can(action, subject)).toBe(true);
        }
      }
    });
  });

  describe('group_admin role', () => {
    it('should have full access to own organization resources', () => {
      const user = createMockUser();
      const membership = createMockMembership('group_admin');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('manage', 'Lead')).toBe(true);
      expect(ability.can('manage', 'Assessment')).toBe(true);
      expect(ability.can('manage', 'Analytics')).toBe(true);
      expect(ability.can('manage', 'User')).toBe(true);
    });

    it('should have read access to group resources', () => {
      const user = createMockUser();
      const membership = createMockMembership('group_admin');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('read', 'GroupReport')).toBe(true);
      expect(ability.can('read', 'Hierarchy')).toBe(true);
    });

    it('should not be able to create or delete organizations', () => {
      const user = createMockUser();
      const membership = createMockMembership('group_admin');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('create', 'Organization')).toBe(false);
      expect(ability.can('delete', 'Organization')).toBe(false);
    });
  });

  describe('owner role', () => {
    it('should have manage access to all resources', () => {
      const user = createMockUser();
      const membership = createMockMembership('owner');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('manage', 'all')).toBe(true);
      expect(ability.can('manage', 'Lead')).toBe(true);
      expect(ability.can('manage', 'Organization')).toBe(true);
    });

    it('should not be able to manage hierarchy', () => {
      const user = createMockUser();
      const membership = createMockMembership('owner');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('manage', 'Hierarchy')).toBe(false);
    });

    it('should have limited hierarchy access with child organizations', () => {
      const user = createMockUser();
      const membership = createMockMembership('owner');
      const hierarchyContext = {
        childOrganizationIds: ['child-org-1', 'child-org-2'],
      };
      const ability = defineAbilitiesFor(user, membership, hierarchyContext);

      // CASL: 'cannot manage Hierarchy' overrides 'can manage all' for Hierarchy
      // Owner cannot manage hierarchy even with child orgs (only group_owner can)
      expect(ability.can('manage', 'Hierarchy')).toBe(false);
      // GroupReport is allowed via 'manage all' (no cannot rule)
      expect(ability.can('read', 'GroupReport')).toBe(true);
    });
  });

  describe('admin role', () => {
    it('should have manage access to leads and assessments', () => {
      const user = createMockUser();
      const membership = createMockMembership('admin');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('manage', 'Lead')).toBe(true);
      expect(ability.can('manage', 'Assessment')).toBe(true);
      expect(ability.can('manage', 'Analytics')).toBe(true);
      expect(ability.can('manage', 'User')).toBe(true);
    });

    it('should have read/update access to organization', () => {
      const user = createMockUser();
      const membership = createMockMembership('admin');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('read', 'Organization')).toBe(true);
      expect(ability.can('update', 'Organization')).toBe(true);
      expect(ability.can('delete', 'Organization')).toBe(false);
    });

    it('should have manage access to webhooks and integrations', () => {
      const user = createMockUser();
      const membership = createMockMembership('admin');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('manage', 'Webhook')).toBe(true);
      expect(ability.can('manage', 'Integration')).toBe(true);
    });
  });

  describe('member role', () => {
    it('should have read and create access to leads', () => {
      const user = createMockUser();
      const membership = createMockMembership('member');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('read', 'Lead')).toBe(true);
      expect(ability.can('create', 'Lead')).toBe(true);
      expect(ability.can('update', 'Lead')).toBe(true);
    });

    it('should have read access to assessments and analytics', () => {
      const user = createMockUser();
      const membership = createMockMembership('member');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('read', 'Assessment')).toBe(true);
      expect(ability.can('read', 'Analytics')).toBe(true);
    });

    it('should not have manage access', () => {
      const user = createMockUser();
      const membership = createMockMembership('member');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('manage', 'Lead')).toBe(false);
      expect(ability.can('manage', 'Organization')).toBe(false);
      expect(ability.can('delete', 'Lead')).toBe(false);
    });

    it('should have read-only access to webhooks', () => {
      const user = createMockUser();
      const membership = createMockMembership('member');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('read', 'Webhook')).toBe(true);
      expect(ability.can('create', 'Webhook')).toBe(false);
      expect(ability.can('manage', 'Webhook')).toBe(false);
    });
  });

  describe('parent_viewer role', () => {
    it('should have read access to resources', () => {
      const user = createMockUser();
      const membership = createMockMembership('parent_viewer');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('read', 'Lead')).toBe(true);
      expect(ability.can('read', 'Assessment')).toBe(true);
      expect(ability.can('read', 'Analytics')).toBe(true);
      expect(ability.can('read', 'Organization')).toBe(true);
    });

    it('should have read access to hierarchy and group reports', () => {
      const user = createMockUser();
      const membership = createMockMembership('parent_viewer');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('read', 'Hierarchy')).toBe(true);
      expect(ability.can('read', 'GroupReport')).toBe(true);
    });

    it('should not have write access', () => {
      const user = createMockUser();
      const membership = createMockMembership('parent_viewer');
      const ability = defineAbilitiesFor(user, membership);

      expect(ability.can('create', 'Lead')).toBe(false);
      expect(ability.can('update', 'Lead')).toBe(false);
      expect(ability.can('delete', 'Lead')).toBe(false);
    });
  });
});

describe('canPerformAction', () => {
  it('should return true for allowed actions', () => {
    const user = createMockUser();
    const membership = createMockMembership('admin');

    expect(canPerformAction(user, membership, 'read', 'Lead')).toBe(true);
    expect(canPerformAction(user, membership, 'create', 'Lead')).toBe(true);
  });

  it('should return false for disallowed actions', () => {
    const user = createMockUser();
    const membership = createMockMembership('member');

    expect(canPerformAction(user, membership, 'delete', 'Organization')).toBe(false);
  });

  it('should return false for anonymous users', () => {
    expect(canPerformAction(null, undefined, 'read', 'Lead')).toBe(false);
  });
});

describe('isGroupRole', () => {
  it('should return true for group roles', () => {
    expect(isGroupRole('group_owner')).toBe(true);
    expect(isGroupRole('group_admin')).toBe(true);
  });

  it('should return false for non-group roles', () => {
    expect(isGroupRole('owner')).toBe(false);
    expect(isGroupRole('admin')).toBe(false);
    expect(isGroupRole('member')).toBe(false);
    expect(isGroupRole('parent_viewer')).toBe(false);
  });
});

describe('canAccessChildOrganizations', () => {
  it('should return true for roles with child access', () => {
    expect(canAccessChildOrganizations('group_owner')).toBe(true);
    expect(canAccessChildOrganizations('group_admin')).toBe(true);
    expect(canAccessChildOrganizations('parent_viewer')).toBe(true);
    expect(canAccessChildOrganizations('owner')).toBe(true);
  });

  it('should return false for roles without child access', () => {
    expect(canAccessChildOrganizations('admin')).toBe(false);
    expect(canAccessChildOrganizations('member')).toBe(false);
  });
});

describe('canModifyHierarchy', () => {
  it('should return true only for group_owner', () => {
    expect(canModifyHierarchy('group_owner')).toBe(true);
  });

  it('should return false for all other roles', () => {
    expect(canModifyHierarchy('group_admin')).toBe(false);
    expect(canModifyHierarchy('owner')).toBe(false);
    expect(canModifyHierarchy('admin')).toBe(false);
    expect(canModifyHierarchy('member')).toBe(false);
    expect(canModifyHierarchy('parent_viewer')).toBe(false);
  });
});

describe('getAccessScope', () => {
  it('should return "group" for group roles', () => {
    expect(getAccessScope('group_owner')).toBe('group');
    expect(getAccessScope('group_admin')).toBe('group');
  });

  it('should return "children" for parent roles', () => {
    expect(getAccessScope('parent_viewer')).toBe('children');
    expect(getAccessScope('owner')).toBe('children');
  });

  it('should return "self" for regular roles', () => {
    expect(getAccessScope('admin')).toBe('self');
    expect(getAccessScope('member')).toBe('self');
  });
});
