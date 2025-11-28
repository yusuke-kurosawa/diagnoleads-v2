import type { Organization, OrganizationMember, User } from '@/lib/db/schema';
import { appRouter } from '@/server/routers/_app';
import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/rls', () => ({
  setCurrentUser: vi.fn().mockResolvedValue(undefined),
}));

describe('Organizations Router', () => {
  // Use valid UUIDs for testing
  const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
  const TEST_ORG_ID = '660e8400-e29b-41d4-a716-446655440000';
  const TEST_ORG_ID_2 = '770e8400-e29b-41d4-a716-446655440000';
  const TEST_MEMBER_ID = '880e8400-e29b-41d4-a716-446655440000';

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
    parentOrganizationId: null,
    organizationType: 'independent',
    hierarchyPath: TEST_ORG_ID,
    hierarchyLevel: 0,
    groupId: null,
    dataSharingPolicy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganization2: Organization = {
    id: TEST_ORG_ID_2,
    name: 'Test Organization 2',
    slug: 'test-org-2',
    settings: {},
    parentOrganizationId: null,
    organizationType: 'independent',
    hierarchyPath: TEST_ORG_ID_2,
    hierarchyLevel: 0,
    groupId: null,
    dataSharingPolicy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembership: OrganizationMember & { organization: Organization } = {
    id: TEST_MEMBER_ID,
    organizationId: TEST_ORG_ID,
    userId: TEST_USER_ID,
    role: 'owner',
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: mockOrganization,
  };

  let mockDb: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock database
    mockDb = {
      query: {
        organizationMembers: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        organizations: {
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };

    // Mock context
    mockContext = {
      db: mockDb,
      session: { id: 'session-123' },
      user: mockUser,
    };
  });

  describe('getById', () => {
    it('should return organization if user is a member', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.organizations.getById({ id: TEST_ORG_ID });

      expect(result).toEqual(mockOrganization);
      expect(mockDb.query.organizationMembers.findFirst).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND if user is not a member', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);

      await expect(caller.organizations.getById({ id: TEST_ORG_ID })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: '組織が見つからないか、アクセス権限がありません',
      });
    });
  });

  describe('list', () => {
    it('should return all organizations user is a member of', async () => {
      const memberships = [
        {
          ...mockMembership,
          organization: mockOrganization,
        },
        {
          id: 'member-2',
          organizationId: TEST_ORG_ID_2,
          userId: TEST_USER_ID,
          role: 'admin' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          organization: mockOrganization2,
        },
      ];

      mockDb.query.organizationMembers.findMany.mockResolvedValue(memberships);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.organizations.list({});

      expect(result.organizations).toHaveLength(2);
      expect(result.organizations[0]).toMatchObject({
        id: TEST_ORG_ID,
        name: 'Test Organization',
        role: 'owner',
      });
      expect(result.organizations[1]).toMatchObject({
        id: TEST_ORG_ID_2,
        name: 'Test Organization 2',
        role: 'admin',
      });
    });

    it('should support pagination', async () => {
      mockDb.query.organizationMembers.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller(mockContext);
      await caller.organizations.list({ limit: 10, offset: 5 });

      expect(mockDb.query.organizationMembers.findMany).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should allow owner to update organization', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);
      const updatedOrg = { ...mockOrganization, name: 'Updated Name' };
      mockDb.returning.mockResolvedValue([updatedOrg]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.organizations.update({
        id: TEST_ORG_ID,
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should deny non-owner from updating', async () => {
      const adminMembership = { ...mockMembership, role: 'admin' as const };
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(adminMembership);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.organizations.update({
          id: TEST_ORG_ID,
          name: 'Updated Name',
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: '組織の更新は オーナーのみ可能です',
      });
    });

    it('should throw NOT_FOUND if organization does not exist', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.organizations.update({
          id: TEST_ORG_ID,
          name: 'Updated Name',
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: '組織が見つかりません',
      });
    });
  });

  describe('create', () => {
    it('should create organization and add creator as owner', async () => {
      mockDb.query.organizations.findFirst.mockResolvedValue(null); // No existing slug
      mockDb.returning.mockResolvedValueOnce([mockOrganization]); // Organization insert
      mockDb.values.mockReturnThis();
      mockDb.insert.mockReturnThis();

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.organizations.create({
        name: 'New Organization',
        slug: 'new-org',
      });

      expect(result).toEqual(mockOrganization);
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // Organization + Membership
    });

    it('should throw CONFLICT if slug is already taken', async () => {
      mockDb.query.organizations.findFirst.mockResolvedValue(mockOrganization);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.organizations.create({
          name: 'New Organization',
          slug: 'test-org', // Already exists
        })
      ).rejects.toMatchObject({
        code: 'CONFLICT',
        message: 'このスラッグは既に使用されています',
      });
    });

    it('should validate slug format', async () => {
      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.organizations.create({
          name: 'New Organization',
          slug: 'Invalid Slug!', // Invalid format
        } as any)
      ).rejects.toThrow();
    });
  });
});
