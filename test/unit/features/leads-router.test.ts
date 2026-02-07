import type { Organization, OrganizationMember, User } from '@/lib/db/schema';
import { appRouter } from '@/server/routers/_app';
import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/rls', () => ({
  setCurrentUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/auth/permissions', () => ({
  defineAbilitiesFor: vi.fn((user, membership) => ({
    can: vi.fn((action: string) => {
      // Mock permission based on role
      if (membership.role === 'member' && action === 'delete') {
        return false;
      }
      return true;
    }),
  })),
}));

describe('Leads Router', () => {
  // Use valid UUIDs for testing
  const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
  const TEST_ORG_ID = '660e8400-e29b-41d4-a716-446655440000';
  const TEST_MEMBER_ID = '770e8400-e29b-41d4-a716-446655440000';
  const TEST_LEAD_ID = '880e8400-e29b-41d4-a716-446655440000';
  const TEST_LEAD_ID_2 = '990e8400-e29b-41d4-a716-446655440000';

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

  const mockMembership: OrganizationMember & { organization: Organization } = {
    id: TEST_MEMBER_ID,
    organizationId: TEST_ORG_ID,
    userId: TEST_USER_ID,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: mockOrganization,
  };

  const mockLead = {
    id: TEST_LEAD_ID,
    organizationId: TEST_ORG_ID,
    email: 'lead@example.com',
    name: 'Test Lead',
    company: 'Test Company',
    phone: '03-1234-5678',
    status: 'new',
    score: 75,
    source: 'website',
    responses: {},
    customFields: {},
    embedding: null,
    searchVector: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    leadTags: [], // Required by router - list of associated tags
  };

  let mockDb: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock database
    mockDb = {
      query: {
        organizationMembers: {
          findFirst: vi.fn().mockResolvedValue(mockMembership),
        },
        leads: {
          findFirst: vi.fn(),
          findMany: vi.fn().mockResolvedValue([mockLead]),
        },
      },
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };

    // Mock context
    mockContext = {
      db: mockDb,
      session: { id: 'session-123' },
      user: mockUser,
    };
  });

  describe('create', () => {
    it('should create a new lead successfully', async () => {
      mockDb.returning.mockResolvedValue([mockLead]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.leads.create({
        organizationId: TEST_ORG_ID,
        email: 'lead@example.com',
        name: 'Test Lead',
        company: 'Test Company',
        phone: '03-1234-5678',
        status: 'new',
        score: 75,
        source: 'website',
        responses: {},
      });

      expect(result).toEqual(mockLead);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should reject invalid email', async () => {
      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.leads.create({
          organizationId: TEST_ORG_ID,
          email: 'invalid-email',
          name: 'Test Lead',
        } as any)
      ).rejects.toThrow();
    });

    it('should use default status "new" if not provided', async () => {
      mockDb.returning.mockResolvedValue([{ ...mockLead, status: 'new' }]);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.create({
        organizationId: TEST_ORG_ID,
        email: 'lead@example.com',
      });

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'new',
        })
      );
    });
  });

  describe('get', () => {
    it('should get lead by ID successfully', async () => {
      mockDb.query.leads.findFirst.mockResolvedValue(mockLead);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.leads.get({
        organizationId: TEST_ORG_ID,
        id: TEST_LEAD_ID,
      });

      // Result includes the lead with tags extracted from leadTags
      expect(result).toEqual({
        ...mockLead,
        tags: [], // Tags are mapped from leadTags
      });
      expect(mockDb.query.leads.findFirst).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND if lead does not exist', async () => {
      mockDb.query.leads.findFirst.mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.leads.get({
          organizationId: TEST_ORG_ID,
          id: TEST_LEAD_ID,
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'リードが見つかりません',
      });
    });
  });

  describe('list', () => {
    it('should list leads with pagination', async () => {
      const mockLeads = [mockLead];
      mockDb.offset.mockResolvedValue(mockLeads);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.leads.list({
        organizationId: TEST_ORG_ID,
        limit: 20,
        offset: 0,
      });

      // Result includes the leads with tags extracted from leadTags
      expect(result.items).toEqual([{ ...mockLead, tags: [] }]);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should filter by status', async () => {
      mockDb.offset.mockResolvedValue([mockLead]);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.list({
        organizationId: TEST_ORG_ID,
        status: 'new',
      });

      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by source', async () => {
      mockDb.offset.mockResolvedValue([mockLead]);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.list({
        organizationId: TEST_ORG_ID,
        source: 'website',
      });

      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should search by name, email, or company', async () => {
      mockDb.offset.mockResolvedValue([mockLead]);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.list({
        organizationId: TEST_ORG_ID,
        search: 'test',
      });

      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update lead successfully', async () => {
      const updatedLead = { ...mockLead, name: 'Updated Name' };
      mockDb.query.leads.findFirst.mockResolvedValue(mockLead);
      mockDb.returning.mockResolvedValue([updatedLead]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.leads.update({
        organizationId: TEST_ORG_ID,
        id: TEST_LEAD_ID,
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND if lead does not exist', async () => {
      mockDb.query.leads.findFirst.mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.leads.update({
          organizationId: TEST_ORG_ID,
          id: TEST_LEAD_ID,
          name: 'Updated Name',
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'リードが見つかりません',
      });
    });

    it('should only update provided fields', async () => {
      mockDb.query.leads.findFirst.mockResolvedValue(mockLead);
      mockDb.returning.mockResolvedValue([mockLead]);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.update({
        organizationId: TEST_ORG_ID,
        id: TEST_LEAD_ID,
        status: 'contacted',
      });

      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'contacted',
          updatedAt: expect.any(Date),
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete lead successfully', async () => {
      mockDb.query.leads.findFirst.mockResolvedValue(mockLead);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.leads.delete({
        organizationId: TEST_ORG_ID,
        id: TEST_LEAD_ID,
      });

      expect(result.success).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND if lead does not exist', async () => {
      mockDb.query.leads.findFirst.mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.leads.delete({
          organizationId: TEST_ORG_ID,
          id: TEST_LEAD_ID,
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'リードが見つかりません',
      });
    });

    it('should throw FORBIDDEN if user does not have delete permission', async () => {
      // Set role to member (no delete permission)
      const memberMembership = { ...mockMembership, role: 'member' };
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(memberMembership);
      mockDb.query.leads.findFirst.mockResolvedValue(mockLead);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.leads.delete({
          organizationId: TEST_ORG_ID,
          id: TEST_LEAD_ID,
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'リードを削除する権限がありません',
      });
    });
  });

  describe('permissions', () => {
    it('should check create permission', async () => {
      mockDb.returning.mockResolvedValue([mockLead]);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.create({
        organizationId: TEST_ORG_ID,
        email: 'lead@example.com',
      });

      const { defineAbilitiesFor } = await import('@/lib/auth/permissions');
      expect(defineAbilitiesFor).toHaveBeenCalled();
    });

    it('should check read permission for get', async () => {
      mockDb.query.leads.findFirst.mockResolvedValue(mockLead);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.get({
        organizationId: TEST_ORG_ID,
        id: TEST_LEAD_ID,
      });

      const { defineAbilitiesFor } = await import('@/lib/auth/permissions');
      expect(defineAbilitiesFor).toHaveBeenCalled();
    });

    it('should check read permission for list', async () => {
      mockDb.offset.mockResolvedValue([mockLead]);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.list({
        organizationId: TEST_ORG_ID,
      });

      const { defineAbilitiesFor } = await import('@/lib/auth/permissions');
      expect(defineAbilitiesFor).toHaveBeenCalled();
    });

    it('should check update permission', async () => {
      mockDb.query.leads.findFirst.mockResolvedValue(mockLead);
      mockDb.returning.mockResolvedValue([mockLead]);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.update({
        organizationId: TEST_ORG_ID,
        id: TEST_LEAD_ID,
        name: 'Updated',
      });

      const { defineAbilitiesFor } = await import('@/lib/auth/permissions');
      expect(defineAbilitiesFor).toHaveBeenCalled();
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update status for multiple leads', async () => {
      mockDb.returning.mockResolvedValue([
        { id: TEST_LEAD_ID },
        { id: TEST_LEAD_ID_2 },
      ]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.leads.bulkUpdateStatus({
        organizationId: TEST_ORG_ID,
        ids: [TEST_LEAD_ID, TEST_LEAD_ID_2],
        status: 'contacted',
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should return count of 0 when no leads match', async () => {
      mockDb.returning.mockResolvedValue([]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.leads.bulkUpdateStatus({
        organizationId: TEST_ORG_ID,
        ids: [TEST_LEAD_ID],
        status: 'contacted',
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(0);
    });

  });

  describe('bulkDelete', () => {
    it('should delete multiple leads', async () => {
      mockDb.returning.mockResolvedValue([
        { id: TEST_LEAD_ID },
        { id: TEST_LEAD_ID_2 },
      ]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.leads.bulkDelete({
        organizationId: TEST_ORG_ID,
        ids: [TEST_LEAD_ID, TEST_LEAD_ID_2],
      });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should return count of 0 when no leads match', async () => {
      mockDb.returning.mockResolvedValue([]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.leads.bulkDelete({
        organizationId: TEST_ORG_ID,
        ids: [TEST_LEAD_ID],
      });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
    });

    it('should throw FORBIDDEN if user does not have delete permission', async () => {
      const memberMembership = { ...mockMembership, role: 'member' };
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(memberMembership);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.leads.bulkDelete({
          organizationId: TEST_ORG_ID,
          ids: [TEST_LEAD_ID],
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple leads from import', async () => {
      mockDb.returning.mockResolvedValue([
        { id: TEST_LEAD_ID },
        { id: TEST_LEAD_ID_2 },
      ]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.leads.bulkCreate({
        organizationId: TEST_ORG_ID,
        leads: [
          { email: 'lead1@example.com', name: 'Lead 1' },
          { email: 'lead2@example.com', name: 'Lead 2' },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.createdCount).toBe(2);
      expect(mockDb.insert).toHaveBeenCalled();
    });

  });

  describe('list with advanced filters', () => {
    it('should filter by score range', async () => {
      mockDb.offset.mockResolvedValue([mockLead]);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.list({
        organizationId: TEST_ORG_ID,
        scoreMin: 50,
        scoreMax: 100,
      });

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should filter by tags', async () => {
      const TAG_ID = 'aa0e8400-e29b-41d4-a716-446655440000';
      mockDb.groupBy = vi.fn().mockResolvedValue([{ leadId: TEST_LEAD_ID }]);
      mockDb.offset.mockResolvedValue([mockLead]);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.list({
        organizationId: TEST_ORG_ID,
        tagIds: [TAG_ID],
      });

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return empty when no leads match tag filter', async () => {
      const TAG_ID = 'aa0e8400-e29b-41d4-a716-446655440000';
      mockDb.groupBy = vi.fn().mockResolvedValue([]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.leads.list({
        organizationId: TEST_ORG_ID,
        tagIds: [TAG_ID],
      });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should apply advanced filter with equals operator', async () => {
      mockDb.offset.mockResolvedValue([mockLead]);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.list({
        organizationId: TEST_ORG_ID,
        advancedFilter: {
          logic: 'and',
          conditions: [
            { field: 'status', operator: 'equals', value: 'new' },
          ],
        },
      });

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should apply advanced filter with contains operator', async () => {
      mockDb.offset.mockResolvedValue([mockLead]);

      const caller = appRouter.createCaller(mockContext);
      await caller.leads.list({
        organizationId: TEST_ORG_ID,
        advancedFilter: {
          logic: 'or',
          conditions: [
            { field: 'name', operator: 'contains', value: 'Test' },
            { field: 'company', operator: 'contains', value: 'Corp' },
          ],
        },
      });

      expect(mockDb.select).toHaveBeenCalled();
    });
  });
});
