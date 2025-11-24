import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { router, organizationProcedure } from '@/lib/trpc/init';
import { z } from 'zod';
import type { Organization, OrganizationMember, User } from '@/lib/db/schema';

// Mock dependencies
vi.mock('@/lib/db/rls', () => ({
  setCurrentUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/auth/permissions', () => ({
  defineAbilitiesFor: vi.fn((user, membership) => ({
    can: vi.fn(() => true),
  })),
}));

describe('organizationProcedure', () => {
  // Use valid UUIDs for testing
  const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
  const TEST_ORG_ID = '660e8400-e29b-41d4-a716-446655440000';
  const TEST_MEMBER_ID = '770e8400-e29b-41d4-a716-446655440000';
  const TEST_OTHER_ORG_ID = '880e8400-e29b-41d4-a716-446655440000';

  const mockUser: User = {
    id: TEST_USER_ID,
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganization: Organization = {
    id: TEST_ORG_ID,
    name: 'Test Organization',
    slug: 'test-org',
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembership: OrganizationMember & { organization: Organization } = {
    id: TEST_MEMBER_ID,
    organizationId: TEST_ORG_ID,
    userId: TEST_USER_ID,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: mockOrganization,
  };

  let mockDb: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock database query
    mockDb = {
      query: {
        organizationMembers: {
          findFirst: vi.fn(),
        },
      },
    };

    // Mock context
    mockContext = {
      db: mockDb,
      session: { id: 'session-123' },
      user: mockUser,
    };
  });

  describe('when user is a member of the organization', () => {
    beforeEach(() => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);
    });

    it('should allow access and add organization context', async () => {
      // Create a test procedure using organizationProcedure
      const testRouter = router({
        test: organizationProcedure
          .input(z.object({ organizationId: z.string().uuid() }))
          .query(({ ctx }) => {
            return {
              success: true,
              organizationId: ctx.organization.id,
              membershipRole: ctx.membership.role,
              hasAbility: ctx.ability !== undefined,
            };
          }),
      });

      // Create a caller with our mock context
      const caller = testRouter.createCaller(mockContext);

      // Call the procedure
      const result = await caller.test({ organizationId: TEST_ORG_ID });

      // Verify the result
      expect(result).toEqual({
        success: true,
        organizationId: TEST_ORG_ID,
        membershipRole: 'admin',
        hasAbility: true,
      });

      // Verify database was queried
      expect(mockDb.query.organizationMembers.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
        with: {
          organization: true,
        },
      });
    });

    it('should call setCurrentUser with correct userId', async () => {
      const { setCurrentUser } = await import('@/lib/db/rls');

      const testRouter = router({
        test: organizationProcedure
          .input(z.object({ organizationId: z.string().uuid() }))
          .query(() => ({ success: true })),
      });

      const caller = testRouter.createCaller(mockContext);
      await caller.test({ organizationId: TEST_ORG_ID });

      // Verify RLS was set up
      expect(setCurrentUser).toHaveBeenCalledWith(mockDb, TEST_USER_ID);
    });

    it('should calculate CASL permissions', async () => {
      const { defineAbilitiesFor } = await import('@/lib/auth/permissions');

      const testRouter = router({
        test: organizationProcedure
          .input(z.object({ organizationId: z.string().uuid() }))
          .query(() => ({ success: true })),
      });

      const caller = testRouter.createCaller(mockContext);
      await caller.test({ organizationId: TEST_ORG_ID });

      // Verify permissions were calculated
      expect(defineAbilitiesFor).toHaveBeenCalledWith(mockUser, mockMembership);
    });
  });

  describe('when user is not a member of the organization', () => {
    beforeEach(() => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(null);
    });

    it('should throw FORBIDDEN error', async () => {
      const testRouter = router({
        test: organizationProcedure
          .input(z.object({ organizationId: z.string().uuid() }))
          .query(() => ({ success: true })),
      });

      const caller = testRouter.createCaller(mockContext);

      // Expect the procedure to throw a FORBIDDEN error
      await expect(
        caller.test({ organizationId: TEST_OTHER_ORG_ID })
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.test({ organizationId: TEST_OTHER_ORG_ID })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'この組織にアクセスする権限がありません',
      });
    });

    it('should not call setCurrentUser if membership is not found', async () => {
      const { setCurrentUser } = await import('@/lib/db/rls');

      const testRouter = router({
        test: organizationProcedure
          .input(z.object({ organizationId: z.string().uuid() }))
          .query(() => ({ success: true })),
      });

      const caller = testRouter.createCaller(mockContext);

      try {
        await caller.test({ organizationId: TEST_OTHER_ORG_ID });
      } catch (error) {
        // Expected error
      }

      // Verify RLS was not set up
      expect(setCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);
    });

    it('should accept valid UUID organizationId', async () => {
      const testRouter = router({
        test: organizationProcedure
          .input(z.object({ organizationId: z.string().uuid() }))
          .query(() => ({ success: true })),
      });

      const caller = testRouter.createCaller(mockContext);

      await expect(
        caller.test({ organizationId: '550e8400-e29b-41d4-a716-446655440000' })
      ).resolves.toEqual({ success: true });
    });

    it('should reject invalid UUID organizationId', async () => {
      const testRouter = router({
        test: organizationProcedure
          .input(z.object({ organizationId: z.string().uuid() }))
          .query(() => ({ success: true })),
      });

      const caller = testRouter.createCaller(mockContext);

      await expect(
        caller.test({ organizationId: 'not-a-uuid' } as any)
      ).rejects.toThrow();
    });

    it('should pass through additional input fields', async () => {
      const testRouter = router({
        test: organizationProcedure
          .input(
            z.object({
              organizationId: z.string().uuid(),
              customField: z.string(),
            })
          )
          .query(({ input }) => ({
            success: true,
            customField: input.customField,
          })),
      });

      const caller = testRouter.createCaller(mockContext);

      const result = await caller.test({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        customField: 'test-value',
      });

      expect(result).toEqual({
        success: true,
        customField: 'test-value',
      });
    });
  });

  describe('context enrichment', () => {
    beforeEach(() => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);
    });

    it('should include organization in context', async () => {
      const testRouter = router({
        test: organizationProcedure
          .input(z.object({ organizationId: z.string().uuid() }))
          .query(({ ctx }) => ctx.organization),
      });

      const caller = testRouter.createCaller(mockContext);
      const result = await caller.test({ organizationId: TEST_ORG_ID });

      expect(result).toEqual(mockOrganization);
    });

    it('should include membership in context', async () => {
      const testRouter = router({
        test: organizationProcedure
          .input(z.object({ organizationId: z.string().uuid() }))
          .query(({ ctx }) => ({
            membershipId: ctx.membership.id,
            role: ctx.membership.role,
          })),
      });

      const caller = testRouter.createCaller(mockContext);
      const result = await caller.test({ organizationId: TEST_ORG_ID });

      expect(result).toEqual({
        membershipId: TEST_MEMBER_ID,
        role: 'admin',
      });
    });

    it('should include ability in context', async () => {
      const testRouter = router({
        test: organizationProcedure
          .input(z.object({ organizationId: z.string().uuid() }))
          .query(({ ctx }) => ({
            hasAbility: ctx.ability !== undefined,
            canCreate: ctx.ability.can('create', 'Lead'),
          })),
      });

      const caller = testRouter.createCaller(mockContext);
      const result = await caller.test({ organizationId: TEST_ORG_ID });

      expect(result).toEqual({
        hasAbility: true,
        canCreate: true,
      });
    });

    it('should preserve original context properties', async () => {
      const testRouter = router({
        test: organizationProcedure
          .input(z.object({ organizationId: z.string().uuid() }))
          .query(({ ctx }) => ({
            hasDb: ctx.db !== undefined,
            hasUser: ctx.user !== undefined,
            hasSession: ctx.session !== undefined,
            userId: ctx.user.id,
          })),
      });

      const caller = testRouter.createCaller(mockContext);
      const result = await caller.test({ organizationId: TEST_ORG_ID });

      expect(result).toEqual({
        hasDb: true,
        hasUser: true,
        hasSession: true,
        userId: TEST_USER_ID,
      });
    });
  });
});
