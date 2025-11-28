import type { Organization, OrganizationMember, User } from '@/lib/db/schema';
import { appRouter } from '@/server/routers/_app';
import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/rls', () => ({
  setCurrentUser: vi.fn().mockResolvedValue(undefined),
}));

// Mock BetterAuth
const mockInviteUser = vi.fn();
vi.mock('@/lib/auth/config', () => ({
  auth: {
    api: {
      inviteUser: mockInviteUser,
    },
  },
}));

describe('Members Router', () => {
  // Use valid UUIDs for testing
  const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
  const TEST_USER_ID_2 = '551e8400-e29b-41d4-a716-446655440000';
  const TEST_USER_ID_3 = '552e8400-e29b-41d4-a716-446655440000';
  const TEST_ORG_ID = '660e8400-e29b-41d4-a716-446655440000';
  const TEST_MEMBER_ID = '880e8400-e29b-41d4-a716-446655440000';
  const TEST_MEMBER_ID_2 = '881e8400-e29b-41d4-a716-446655440000';
  const TEST_MEMBER_ID_3 = '882e8400-e29b-41d4-a716-446655440000';
  const NONEXISTENT_MEMBER_ID = '999e8400-e29b-41d4-a716-446655440000';

  const mockUser: User = {
    id: TEST_USER_ID,
    email: 'owner@example.com',
    name: 'Owner User',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser2: User = {
    id: TEST_USER_ID_2,
    email: 'admin@example.com',
    name: 'Admin User',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser3: User = {
    id: TEST_USER_ID_3,
    email: 'member@example.com',
    name: 'Member User',
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
    parentOrganizationId: null,
    organizationType: 'independent',
    hierarchyPath: TEST_ORG_ID,
    hierarchyLevel: 0,
    groupId: null,
    dataSharingPolicy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOwnerMembership: OrganizationMember & { organization: Organization; user: User } = {
    id: TEST_MEMBER_ID,
    organizationId: TEST_ORG_ID,
    userId: TEST_USER_ID,
    role: 'owner',
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: mockOrganization,
    user: mockUser,
  };

  const mockAdminMembership: OrganizationMember & { organization: Organization; user: User } = {
    id: TEST_MEMBER_ID_2,
    organizationId: TEST_ORG_ID,
    userId: TEST_USER_ID_2,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: mockOrganization,
    user: mockUser2,
  };

  const mockMemberMembership: OrganizationMember & { organization: Organization; user: User } = {
    id: TEST_MEMBER_ID_3,
    organizationId: TEST_ORG_ID,
    userId: TEST_USER_ID_3,
    role: 'member',
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: mockOrganization,
    user: mockUser3,
  };

  let mockDb: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock database
    mockDb = {
      query: {
        organizationMembers: {
          // Default mock for membership verification (used by organizationProcedure middleware)
          findFirst: vi.fn().mockResolvedValue(mockOwnerMembership),
          findMany: vi.fn(),
        },
        user: {
          findFirst: vi.fn(),
        },
      },
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };

    // Mock context (owner by default)
    mockContext = {
      db: mockDb,
      session: { id: 'session-123', token: 'test-token' },
      user: mockUser,
    };
  });

  describe('list', () => {
    it('should return list of members with user info', async () => {
      const mockMembers = [mockOwnerMembership, mockAdminMembership, mockMemberMembership];

      // Mock count query result
      mockDb.where.mockResolvedValueOnce([
        { count: mockMembers.length },
        { count: mockMembers.length },
        { count: mockMembers.length },
      ]);

      // Mock findMany for members list
      mockDb.query.organizationMembers.findMany.mockResolvedValue(mockMembers);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.members.list({
        organizationId: TEST_ORG_ID,
        limit: 50,
        offset: 0,
      });

      expect(result.members).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.members[0].user).toBeDefined();
      expect(result.members[0].user?.email).toBe('owner@example.com');
    });

    it('should support pagination', async () => {
      const mockMembers = [mockAdminMembership];

      // Mock count query (3 total members)
      mockDb.where.mockResolvedValueOnce([{ count: 3 }, { count: 3 }, { count: 3 }]);

      // Mock findMany for paginated results
      mockDb.query.organizationMembers.findMany.mockResolvedValue(mockMembers);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.members.list({
        organizationId: TEST_ORG_ID,
        limit: 1,
        offset: 1,
      });

      expect(result.members).toHaveLength(1);
      expect(result.total).toBe(3);
    });

    it('should return empty list if no members', async () => {
      // Mock count query (0 total members)
      mockDb.where.mockResolvedValueOnce([]);

      // Mock findMany for empty list
      mockDb.query.organizationMembers.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.members.list({
        organizationId: TEST_ORG_ID,
        limit: 50,
        offset: 0,
      });

      expect(result.members).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('invite', () => {
    it('should allow owner to invite a new member', async () => {
      // Mock: no existing user with this email
      mockDb.query.user.findFirst.mockResolvedValue(null);

      const mockInviteResponse = {
        id: 'invite-123',
        email: 'newuser@example.com',
        role: 'member',
      };
      mockInviteUser.mockResolvedValue(mockInviteResponse);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.members.invite({
        organizationId: TEST_ORG_ID,
        email: 'newuser@example.com',
        role: 'member',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('招待');
      expect(mockInviteUser).toHaveBeenCalledWith({
        body: {
          email: 'newuser@example.com',
          role: 'member',
          organizationId: TEST_ORG_ID,
        },
        headers: expect.any(Headers),
      });
    });

    it('should allow admin to invite a new member', async () => {
      // Mock: admin membership verification for middleware
      mockDb.query.organizationMembers.findFirst.mockResolvedValueOnce(mockAdminMembership);

      // Mock: no existing user with this email
      mockDb.query.user.findFirst.mockResolvedValue(null);

      const mockInviteResponse = {
        id: 'invite-123',
        email: 'newuser@example.com',
        role: 'member',
      };
      mockInviteUser.mockResolvedValue(mockInviteResponse);

      // Context as admin
      const adminContext = {
        ...mockContext,
        user: mockUser2,
      };

      const caller = appRouter.createCaller(adminContext);
      const result = await caller.members.invite({
        organizationId: TEST_ORG_ID,
        email: 'newuser@example.com',
        role: 'admin',
      });

      expect(result.success).toBe(true);
      expect(mockInviteUser).toHaveBeenCalled();
    });

    it('should not allow regular member to invite', async () => {
      // Mock: member membership verification for middleware
      mockDb.query.organizationMembers.findFirst.mockResolvedValueOnce(mockMemberMembership);

      // Context as regular member
      const memberContext = {
        ...mockContext,
        user: mockUser3,
      };

      const caller = appRouter.createCaller(memberContext);

      await expect(
        caller.members.invite({
          organizationId: TEST_ORG_ID,
          email: 'newuser@example.com',
          role: 'member',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should not allow inviting an existing member', async () => {
      // Mock: user exists with this email
      mockDb.query.user.findFirst.mockResolvedValue(mockUser2);

      // Mock: user is already a member (called after middleware verification)
      mockDb.query.organizationMembers.findFirst
        .mockResolvedValueOnce(mockOwnerMembership) // Middleware verification
        .mockResolvedValueOnce(mockAdminMembership); // Existing membership check

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.members.invite({
          organizationId: TEST_ORG_ID,
          email: 'admin@example.com',
          role: 'member',
        })
      ).rejects.toThrow('このメールアドレスは既にメンバーです');
    });

    it('should handle invite API errors gracefully', async () => {
      // Mock: no existing user
      mockDb.query.user.findFirst.mockResolvedValue(null);

      // Mock: invite API failure
      mockInviteUser.mockRejectedValue(new Error('API Error'));

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.members.invite({
          organizationId: TEST_ORG_ID,
          email: 'newuser@example.com',
          role: 'member',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateRole', () => {
    it('should allow owner to update member role', async () => {
      // Mock: find the member to update (after middleware verification)
      mockDb.query.organizationMembers.findFirst
        .mockResolvedValueOnce(mockOwnerMembership) // Middleware verification
        .mockResolvedValueOnce(mockMemberMembership); // Target member lookup

      // Mock the update chain: update().set().where().returning()
      const updatedMember = { ...mockMemberMembership, role: 'admin' as const };
      const whereChain = {
        returning: vi.fn().mockResolvedValue([updatedMember]),
      };
      mockDb.where.mockReturnValueOnce(whereChain);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.members.updateRole({
        organizationId: TEST_ORG_ID,
        membershipId: TEST_MEMBER_ID_3,
        role: 'admin',
      });

      expect(result).toBeDefined();
      expect(result.role).toBe('admin');
    });

    it('should allow admin to update member role', async () => {
      // Mock: admin middleware verification then member lookup
      mockDb.query.organizationMembers.findFirst
        .mockResolvedValueOnce(mockAdminMembership) // Middleware verification
        .mockResolvedValueOnce(mockMemberMembership); // Target member lookup

      // Mock the update chain: update().set().where().returning()
      const updatedMember = { ...mockMemberMembership, role: 'admin' as const };
      const whereChain = {
        returning: vi.fn().mockResolvedValue([updatedMember]),
      };
      mockDb.where.mockReturnValueOnce(whereChain);

      // Context as admin
      const adminContext = {
        ...mockContext,
        user: mockUser2,
      };

      const caller = appRouter.createCaller(adminContext);
      const result = await caller.members.updateRole({
        organizationId: TEST_ORG_ID,
        membershipId: TEST_MEMBER_ID_3,
        role: 'admin',
      });

      expect(result).toBeDefined();
      expect(result.role).toBe('admin');
    });

    it('should not allow regular member to update roles', async () => {
      // Mock: member middleware verification
      mockDb.query.organizationMembers.findFirst.mockResolvedValueOnce(mockMemberMembership);

      // Context as regular member
      const memberContext = {
        ...mockContext,
        user: mockUser3,
      };

      const caller = appRouter.createCaller(memberContext);

      await expect(
        caller.members.updateRole({
          organizationId: TEST_ORG_ID,
          membershipId: TEST_MEMBER_ID_2,
          role: 'member',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should not allow changing owner role', async () => {
      // Mock: owner for both middleware and target lookup
      mockDb.query.organizationMembers.findFirst
        .mockResolvedValueOnce(mockOwnerMembership) // Middleware verification
        .mockResolvedValueOnce(mockOwnerMembership); // Target member lookup

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.members.updateRole({
          organizationId: TEST_ORG_ID,
          membershipId: TEST_MEMBER_ID,
          role: 'admin',
        })
      ).rejects.toThrow('オーナーのロールは変更できません');
    });

    it('should throw error if member not found', async () => {
      // Mock: owner middleware verification, then null for target lookup
      mockDb.query.organizationMembers.findFirst
        .mockResolvedValueOnce(mockOwnerMembership) // Middleware verification
        .mockResolvedValueOnce(null); // Target member not found

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.members.updateRole({
          organizationId: TEST_ORG_ID,
          membershipId: NONEXISTENT_MEMBER_ID,
          role: 'admin',
        })
      ).rejects.toThrow('メンバーが見つかりません');
    });
  });

  describe('remove', () => {
    it('should allow owner to remove a member', async () => {
      // Mock: owner middleware verification then member lookup
      mockDb.query.organizationMembers.findFirst
        .mockResolvedValueOnce(mockOwnerMembership) // Middleware verification
        .mockResolvedValueOnce(mockMemberMembership); // Target member lookup

      mockDb.returning.mockResolvedValue([mockMemberMembership]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.members.remove({
        organizationId: TEST_ORG_ID,
        membershipId: TEST_MEMBER_ID_3,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('メンバーを削除しました');
    });

    it('should allow admin to remove a member', async () => {
      // Mock: admin middleware verification then member lookup
      mockDb.query.organizationMembers.findFirst
        .mockResolvedValueOnce(mockAdminMembership) // Middleware verification
        .mockResolvedValueOnce(mockMemberMembership); // Target member lookup

      mockDb.returning.mockResolvedValue([mockMemberMembership]);

      // Context as admin
      const adminContext = {
        ...mockContext,
        user: mockUser2,
      };

      const caller = appRouter.createCaller(adminContext);
      const result = await caller.members.remove({
        organizationId: TEST_ORG_ID,
        membershipId: TEST_MEMBER_ID_3,
      });

      expect(result.success).toBe(true);
    });

    it('should not allow regular member to remove members', async () => {
      // Mock: member middleware verification
      mockDb.query.organizationMembers.findFirst.mockResolvedValueOnce(mockMemberMembership);

      // Context as regular member
      const memberContext = {
        ...mockContext,
        user: mockUser3,
      };

      const caller = appRouter.createCaller(memberContext);

      await expect(
        caller.members.remove({
          organizationId: TEST_ORG_ID,
          membershipId: TEST_MEMBER_ID_2,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should not allow removing owner', async () => {
      mockDb.query.organizationMembers.findFirst
        .mockResolvedValueOnce(mockOwnerMembership) // Middleware verification
        .mockResolvedValueOnce(mockOwnerMembership); // Target member lookup

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.members.remove({
          organizationId: TEST_ORG_ID,
          membershipId: TEST_MEMBER_ID,
        })
      ).rejects.toThrow('オーナーは削除できません');
    });

    it('should not allow removing self', async () => {
      // Same membership ID for both middleware and target means removing self
      mockDb.query.organizationMembers.findFirst
        .mockResolvedValueOnce(mockOwnerMembership) // Middleware verification
        .mockResolvedValueOnce(mockOwnerMembership); // Target member lookup (same as caller)

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.members.remove({
          organizationId: TEST_ORG_ID,
          membershipId: TEST_MEMBER_ID,
        })
      ).rejects.toThrow();
    });

    it('should throw error if member not found', async () => {
      // Mock: owner middleware verification, then null for target lookup
      mockDb.query.organizationMembers.findFirst
        .mockResolvedValueOnce(mockOwnerMembership) // Middleware verification
        .mockResolvedValueOnce(null); // Target member not found

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.members.remove({
          organizationId: TEST_ORG_ID,
          membershipId: NONEXISTENT_MEMBER_ID,
        })
      ).rejects.toThrow('メンバーが見つかりません');
    });
  });
});
