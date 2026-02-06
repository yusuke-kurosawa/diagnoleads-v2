/**
 * tRPC Context Tests
 *
 * Unit tests for tRPC context types
 */

import { describe, expect, it } from 'vitest';
import type {
  Context,
  ProtectedContext,
  OrganizationProtectedContext,
  AuthUser,
} from '@/lib/trpc/context';
import type { OrganizationContext } from '@/lib/multi-tenant/types';

describe('tRPC Context Types', () => {
  describe('Context (base)', () => {
    it('should have correct base shape', () => {
      const context: Partial<Context> = {
        // db would be Drizzle instance
        session: null,
        user: null,
      };

      expect(context.session).toBeNull();
      expect(context.user).toBeNull();
    });

    it('should support unauthenticated state', () => {
      const context: Partial<Context> = {
        session: null,
        user: null,
      };

      expect(context.user).toBeNull();
    });
  });

  describe('AuthUser', () => {
    it('should have user properties', () => {
      const user: AuthUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: true,
        image: 'https://example.com/avatar.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      expect(user.emailVerified).toBe(true);
    });

    it('should support optional fields', () => {
      const user: AuthUser = {
        id: 'user-123',
        name: 'Minimal User',
        email: 'minimal@example.com',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.image).toBeNull();
    });
  });

  describe('ProtectedContext', () => {
    it('should require session and user', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        name: 'Protected User',
        email: 'protected@example.com',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Note: ProtectedContext requires NonNullable session and user
      // This is enforced by tRPC middleware at runtime
      const context: Partial<ProtectedContext> = {
        user: mockUser,
        // session would be BetterAuth session
      };

      expect(context.user?.id).toBe('user-123');
    });
  });

  describe('OrganizationContext', () => {
    it('should include organization and membership', () => {
      const orgContext: Partial<OrganizationContext> = {
        organization: {
          id: 'org-123',
          name: 'Test Org',
          slug: 'test-org',
          parentId: null,
          groupId: null,
          organizationType: 'independent',
          settings: {},
          createdAt: new Date(),
          updatedAt: null,
        },
        membership: {
          id: 'membership-123',
          organizationId: 'org-123',
          userId: 'user-123',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: null,
        },
        // ability would be CASL ability
      };

      expect(orgContext.organization?.name).toBe('Test Org');
      expect(orgContext.membership?.role).toBe('admin');
    });
  });

  describe('OrganizationProtectedContext', () => {
    it('should combine all context properties', () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        name: 'Full Context User',
        email: 'full@example.com',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // This type combines ProtectedContext and OrganizationContext
      const fullContext: Partial<OrganizationProtectedContext> = {
        // Base context
        // db: drizzle instance

        // Protected context
        user: mockUser,
        // session: BetterAuth session

        // Organization context
        organization: {
          id: 'org-123',
          name: 'Full Test Org',
          slug: 'full-test-org',
          parentId: null,
          groupId: null,
          organizationType: 'independent',
          settings: {},
          createdAt: new Date(),
          updatedAt: null,
        },
        membership: {
          id: 'membership-123',
          organizationId: 'org-123',
          userId: 'user-123',
          role: 'owner',
          createdAt: new Date(),
          updatedAt: null,
        },
        // ability: CASL ability
      };

      expect(fullContext.user?.email).toBe('full@example.com');
      expect(fullContext.organization?.slug).toBe('full-test-org');
      expect(fullContext.membership?.role).toBe('owner');
    });
  });
});

describe('Context usage patterns', () => {
  it('should support type narrowing from Context to ProtectedContext', () => {
    function isAuthenticated(ctx: Context): ctx is ProtectedContext {
      return ctx.user !== null && ctx.session !== null;
    }

    const unauthenticatedContext: Context = {
      db: {} as any,
      session: null,
      user: null,
    };

    expect(isAuthenticated(unauthenticatedContext)).toBe(false);
  });

  it('should support organization context enrichment', () => {
    interface EnrichedContext extends OrganizationProtectedContext {
      requestId: string;
      timestamp: Date;
    }

    const enriched: Partial<EnrichedContext> = {
      requestId: 'req-123',
      timestamp: new Date(),
      organization: {
        id: 'org-123',
        name: 'Enriched Org',
        slug: 'enriched-org',
        parentId: null,
        groupId: null,
        organizationType: 'independent',
        settings: {},
        createdAt: new Date(),
        updatedAt: null,
      },
    };

    expect(enriched.requestId).toBe('req-123');
    expect(enriched.organization?.name).toBe('Enriched Org');
  });
});
