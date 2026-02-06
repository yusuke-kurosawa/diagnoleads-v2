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
  type HierarchyContext,
} from '@/lib/auth/permissions';
import type { OrganizationMember, User } from '@/lib/db/schema';

const mockUser: User = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createMembership(role: string): OrganizationMember {
  return {
    id: 'membership-123',
    organizationId: 'org-123',
    userId: 'user-123',
    role: role as OrganizationMember['role'],
    createdAt: new Date(),
    updatedAt: null,
  };
}

describe('defineAbilitiesFor', () => {
  describe('anonymous user', () => {
    it('should have no permissions', () => {
      const ability = defineAbilitiesFor(null);
      expect(ability.can('read', 'Lead')).toBe(false);
      expect(ability.can('create', 'Lead')).toBe(false);
    });

    it('should have no permissions with undefined membership', () => {
      const ability = defineAbilitiesFor(mockUser, undefined);
      expect(ability.can('read', 'Lead')).toBe(false);
    });
  });

  describe('member role', () => {
    const membership = createMembership('member');

    it('should be able to read leads', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('read', 'Lead')).toBe(true);
    });

    it('should be able to create leads', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('create', 'Lead')).toBe(true);
    });

    it('should be able to update leads', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('update', 'Lead')).toBe(true);
    });

    it('should not be able to delete leads', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('delete', 'Lead')).toBe(false);
    });

    it('should be able to read organization', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('read', 'Organization')).toBe(true);
    });

    it('should not be able to manage organization', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('manage', 'Organization')).toBe(false);
    });

    it('should be able to read webhooks', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('read', 'Webhook')).toBe(true);
      expect(ability.can('manage', 'Webhook')).toBe(false);
    });
  });

  describe('admin role', () => {
    const membership = createMembership('admin');

    it('should be able to manage leads', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('manage', 'Lead')).toBe(true);
    });

    it('should be able to manage users', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('manage', 'User')).toBe(true);
    });

    it('should be able to update organization', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('update', 'Organization')).toBe(true);
    });

    it('should not be able to delete organization', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('delete', 'Organization')).toBe(false);
    });

    it('should be able to manage webhooks', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('manage', 'Webhook')).toBe(true);
    });

    it('should be able to manage integrations', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('manage', 'Integration')).toBe(true);
    });
  });

  describe('owner role', () => {
    const membership = createMembership('owner');

    it('should be able to manage all', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('manage', 'all')).toBe(true);
    });

    it('should not be able to manage hierarchy without context', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('manage', 'Hierarchy')).toBe(false);
    });

    it('should have manage all ability with child orgs', () => {
      const hierarchyContext: HierarchyContext = {
        childOrganizationIds: ['child-org-1'],
      };
      const ability = defineAbilitiesFor(mockUser, membership, hierarchyContext);
      // owner can manage all, which includes read access to most subjects
      expect(ability.can('manage', 'all')).toBe(true);
      expect(ability.can('manage', 'Lead')).toBe(true);
    });
  });

  describe('group_owner role', () => {
    const membership = createMembership('group_owner');

    it('should be able to manage all', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('manage', 'all')).toBe(true);
    });

    it('should be able to manage hierarchy', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('manage', 'Hierarchy')).toBe(true);
    });

    it('should be able to manage group reports', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('manage', 'GroupReport')).toBe(true);
    });
  });

  describe('group_admin role', () => {
    const membership = createMembership('group_admin');

    it('should be able to manage leads', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('manage', 'Lead')).toBe(true);
    });

    it('should be able to read group reports', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('read', 'GroupReport')).toBe(true);
    });

    it('should be able to read hierarchy', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('read', 'Hierarchy')).toBe(true);
    });

    it('should not be able to create organization', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('create', 'Organization')).toBe(false);
    });

    it('should not be able to delete organization', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('delete', 'Organization')).toBe(false);
    });
  });

  describe('parent_viewer role', () => {
    const membership = createMembership('parent_viewer');

    it('should be able to read leads', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('read', 'Lead')).toBe(true);
    });

    it('should not be able to create leads', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('create', 'Lead')).toBe(false);
    });

    it('should not be able to update leads', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('update', 'Lead')).toBe(false);
    });

    it('should be able to read hierarchy', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('read', 'Hierarchy')).toBe(true);
    });

    it('should be able to read group reports', () => {
      const ability = defineAbilitiesFor(mockUser, membership);
      expect(ability.can('read', 'GroupReport')).toBe(true);
    });
  });
});

describe('canPerformAction', () => {
  it('should return true for allowed actions', () => {
    const membership = createMembership('admin');
    expect(canPerformAction(mockUser, membership, 'manage', 'Lead')).toBe(true);
  });

  it('should return false for disallowed actions', () => {
    const membership = createMembership('member');
    expect(canPerformAction(mockUser, membership, 'delete', 'Lead')).toBe(false);
  });

  it('should return false for null user', () => {
    const membership = createMembership('admin');
    expect(canPerformAction(null, membership, 'read', 'Lead')).toBe(false);
  });

  it('should return false for undefined membership', () => {
    expect(canPerformAction(mockUser, undefined, 'read', 'Lead')).toBe(false);
  });
});

describe('isGroupRole', () => {
  it('should return true for group_owner', () => {
    expect(isGroupRole('group_owner')).toBe(true);
  });

  it('should return true for group_admin', () => {
    expect(isGroupRole('group_admin')).toBe(true);
  });

  it('should return false for owner', () => {
    expect(isGroupRole('owner')).toBe(false);
  });

  it('should return false for admin', () => {
    expect(isGroupRole('admin')).toBe(false);
  });

  it('should return false for member', () => {
    expect(isGroupRole('member')).toBe(false);
  });
});

describe('canAccessChildOrganizations', () => {
  it('should return true for group_owner', () => {
    expect(canAccessChildOrganizations('group_owner')).toBe(true);
  });

  it('should return true for group_admin', () => {
    expect(canAccessChildOrganizations('group_admin')).toBe(true);
  });

  it('should return true for parent_viewer', () => {
    expect(canAccessChildOrganizations('parent_viewer')).toBe(true);
  });

  it('should return true for owner', () => {
    expect(canAccessChildOrganizations('owner')).toBe(true);
  });

  it('should return false for admin', () => {
    expect(canAccessChildOrganizations('admin')).toBe(false);
  });

  it('should return false for member', () => {
    expect(canAccessChildOrganizations('member')).toBe(false);
  });
});

describe('canModifyHierarchy', () => {
  it('should return true only for group_owner', () => {
    expect(canModifyHierarchy('group_owner')).toBe(true);
  });

  it('should return false for group_admin', () => {
    expect(canModifyHierarchy('group_admin')).toBe(false);
  });

  it('should return false for owner', () => {
    expect(canModifyHierarchy('owner')).toBe(false);
  });

  it('should return false for admin', () => {
    expect(canModifyHierarchy('admin')).toBe(false);
  });

  it('should return false for member', () => {
    expect(canModifyHierarchy('member')).toBe(false);
  });
});

describe('getAccessScope', () => {
  it('should return group for group_owner', () => {
    expect(getAccessScope('group_owner')).toBe('group');
  });

  it('should return group for group_admin', () => {
    expect(getAccessScope('group_admin')).toBe('group');
  });

  it('should return children for parent_viewer', () => {
    expect(getAccessScope('parent_viewer')).toBe('children');
  });

  it('should return children for owner', () => {
    expect(getAccessScope('owner')).toBe('children');
  });

  it('should return self for admin', () => {
    expect(getAccessScope('admin')).toBe('self');
  });

  it('should return self for member', () => {
    expect(getAccessScope('member')).toBe('self');
  });
});
