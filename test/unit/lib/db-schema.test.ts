/**
 * Database Schema Tests
 *
 * Unit tests for database schema type definitions
 */

import { describe, expect, it } from 'vitest';
import type {
  OrganizationType,
  OrganizationRole,
  DataSharingPolicy,
} from '@/lib/db/schema';

describe('OrganizationType', () => {
  it('should accept valid organization types', () => {
    const types: OrganizationType[] = ['holding', 'subsidiary', 'independent'];
    expect(types).toHaveLength(3);
  });

  it('should support holding type for parent companies', () => {
    const type: OrganizationType = 'holding';
    expect(type).toBe('holding');
  });

  it('should support subsidiary type for child companies', () => {
    const type: OrganizationType = 'subsidiary';
    expect(type).toBe('subsidiary');
  });

  it('should support independent type for standalone companies', () => {
    const type: OrganizationType = 'independent';
    expect(type).toBe('independent');
  });
});

describe('OrganizationRole', () => {
  it('should accept valid organization roles', () => {
    const roles: OrganizationRole[] = [
      'owner',
      'admin',
      'member',
      'group_owner',
      'group_admin',
      'parent_viewer',
    ];
    expect(roles).toHaveLength(6);
  });

  it('should have owner role for full organization control', () => {
    const role: OrganizationRole = 'owner';
    expect(role).toBe('owner');
  });

  it('should have admin role for admin access', () => {
    const role: OrganizationRole = 'admin';
    expect(role).toBe('admin');
  });

  it('should have member role for standard access', () => {
    const role: OrganizationRole = 'member';
    expect(role).toBe('member');
  });

  it('should have group_owner role for holding company owners', () => {
    const role: OrganizationRole = 'group_owner';
    expect(role).toBe('group_owner');
  });

  it('should have group_admin role for group-wide read access', () => {
    const role: OrganizationRole = 'group_admin';
    expect(role).toBe('group_admin');
  });

  it('should have parent_viewer role for cross-org read access', () => {
    const role: OrganizationRole = 'parent_viewer';
    expect(role).toBe('parent_viewer');
  });
});

describe('DataSharingPolicy', () => {
  it('should create minimal policy', () => {
    const policy: DataSharingPolicy = {
      allowParentAccess: false,
      allowChildAccess: false,
      allowSiblingAccess: false,
    };

    expect(policy.allowParentAccess).toBe(false);
    expect(policy.allowChildAccess).toBe(false);
    expect(policy.allowSiblingAccess).toBe(false);
  });

  it('should create policy allowing parent access', () => {
    const policy: DataSharingPolicy = {
      allowParentAccess: true,
      allowChildAccess: false,
      allowSiblingAccess: false,
    };

    expect(policy.allowParentAccess).toBe(true);
  });

  it('should create policy allowing child access', () => {
    const policy: DataSharingPolicy = {
      allowParentAccess: false,
      allowChildAccess: true,
      allowSiblingAccess: false,
    };

    expect(policy.allowChildAccess).toBe(true);
  });

  it('should create policy with shared fields', () => {
    const policy: DataSharingPolicy = {
      allowParentAccess: true,
      allowChildAccess: false,
      allowSiblingAccess: false,
      sharedFields: ['name', 'email', 'score'],
    };

    expect(policy.sharedFields).toContain('name');
    expect(policy.sharedFields).toContain('email');
    expect(policy.sharedFields).toContain('score');
  });

  it('should allow full sharing policy', () => {
    const policy: DataSharingPolicy = {
      allowParentAccess: true,
      allowChildAccess: true,
      allowSiblingAccess: true,
    };

    expect(policy.allowParentAccess).toBe(true);
    expect(policy.allowChildAccess).toBe(true);
    expect(policy.allowSiblingAccess).toBe(true);
  });
});

describe('Schema table exports', () => {
  it('should export organizations table', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.organizations).toBeDefined();
  });

  it('should export users table', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.users).toBeDefined();
  });

  it('should export leads table', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.leads).toBeDefined();
  });

  it('should export organizationMembers table', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.organizationMembers).toBeDefined();
  });

  it('should export sessions table', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.sessions).toBeDefined();
  });

  it('should export accounts table', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.accounts).toBeDefined();
  });

  it('should export webhooks table', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.webhooks).toBeDefined();
  });

  it('should export notifications table', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.notifications).toBeDefined();
  });
});

describe('Schema relations exports', () => {
  it('should export organizationsRelations', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.organizationsRelations).toBeDefined();
  });

  it('should export usersRelations', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.usersRelations).toBeDefined();
  });

  it('should export leadsRelations', async () => {
    const schema = await import('@/lib/db/schema');
    expect(schema.leadsRelations).toBeDefined();
  });
});
