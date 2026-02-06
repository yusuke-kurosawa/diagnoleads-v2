/**
 * Multi-Tenant Module Tests
 *
 * Unit tests for multi-tenant middleware and types
 */

import { describe, expect, it } from 'vitest';
import { organizationInputSchema } from '@/lib/multi-tenant/middleware/organization';
import type { OrganizationContext, MembershipWithOrganization } from '@/lib/multi-tenant/types';
import type { Organization, OrganizationMember } from '@/lib/db/schema';

describe('organizationInputSchema', () => {
  it('should accept valid organizationId', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = organizationInputSchema.parse(input);
    expect(result.organizationId).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should reject invalid organizationId', () => {
    expect(() =>
      organizationInputSchema.parse({ organizationId: 'invalid' })
    ).toThrow();

    expect(() =>
      organizationInputSchema.parse({ organizationId: '' })
    ).toThrow();
  });

  it('should pass through additional fields', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      extraField: 'value',
      anotherField: 123,
    };

    const result = organizationInputSchema.parse(input);
    expect(result.organizationId).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect((result as any).extraField).toBe('value');
    expect((result as any).anotherField).toBe(123);
  });

  it('should require organizationId', () => {
    expect(() =>
      organizationInputSchema.parse({})
    ).toThrow();

    expect(() =>
      organizationInputSchema.parse({ extraField: 'value' })
    ).toThrow();
  });
});

describe('Multi-tenant types', () => {
  describe('OrganizationContext', () => {
    it('should have correct shape', () => {
      const mockOrganization: Organization = {
        id: 'org-123',
        name: 'Test Org',
        slug: 'test-org',
        parentId: null,
        groupId: null,
        organizationType: 'independent',
        settings: {},
        createdAt: new Date(),
        updatedAt: null,
      };

      const mockMembership: OrganizationMember = {
        id: 'membership-123',
        organizationId: 'org-123',
        userId: 'user-123',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: null,
      };

      const context: Partial<OrganizationContext> = {
        organization: mockOrganization,
        membership: mockMembership,
        // ability would be a CASL Ability instance
      };

      expect(context.organization?.id).toBe('org-123');
      expect(context.membership?.role).toBe('admin');
    });
  });

  describe('MembershipWithOrganization', () => {
    it('should include organization details', () => {
      const membership: MembershipWithOrganization = {
        id: 'membership-123',
        organizationId: 'org-123',
        userId: 'user-123',
        role: 'member',
        createdAt: new Date(),
        updatedAt: null,
        organization: {
          id: 'org-123',
          name: 'Test Organization',
          slug: 'test-organization',
          parentId: null,
          groupId: null,
          organizationType: 'independent',
          settings: { theme: 'dark' },
          createdAt: new Date(),
          updatedAt: null,
        },
      };

      expect(membership.organization.name).toBe('Test Organization');
      expect(membership.organization.settings).toEqual({ theme: 'dark' });
    });

    it('should support different organization types', () => {
      const types: Organization['organizationType'][] = [
        'independent',
        'holding',
        'subsidiary',
      ];

      for (const orgType of types) {
        const membership: MembershipWithOrganization = {
          id: 'membership-123',
          organizationId: 'org-123',
          userId: 'user-123',
          role: 'owner',
          createdAt: new Date(),
          updatedAt: null,
          organization: {
            id: 'org-123',
            name: 'Test',
            slug: 'test',
            parentId: null,
            groupId: null,
            organizationType: orgType,
            settings: {},
            createdAt: new Date(),
            updatedAt: null,
          },
        };

        expect(membership.organization.organizationType).toBe(orgType);
      }
    });

    it('should support hierarchy relationships', () => {
      const childMembership: MembershipWithOrganization = {
        id: 'membership-456',
        organizationId: 'child-org',
        userId: 'user-123',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: null,
        organization: {
          id: 'child-org',
          name: 'Child Organization',
          slug: 'child-org',
          parentId: 'parent-org',
          groupId: 'group-123',
          organizationType: 'subsidiary',
          settings: {},
          createdAt: new Date(),
          updatedAt: null,
        },
      };

      expect(childMembership.organization.parentId).toBe('parent-org');
      expect(childMembership.organization.groupId).toBe('group-123');
    });

    it('should support all role types', () => {
      const roles: OrganizationMember['role'][] = [
        'owner',
        'admin',
        'member',
        'group_owner',
        'group_admin',
        'parent_viewer',
      ];

      for (const role of roles) {
        const membership: MembershipWithOrganization = {
          id: 'membership-123',
          organizationId: 'org-123',
          userId: 'user-123',
          role,
          createdAt: new Date(),
          updatedAt: null,
          organization: {
            id: 'org-123',
            name: 'Test',
            slug: 'test',
            parentId: null,
            groupId: null,
            organizationType: 'independent',
            settings: {},
            createdAt: new Date(),
            updatedAt: null,
          },
        };

        expect(membership.role).toBe(role);
      }
    });
  });
});
