import type { Lead, Organization, OrganizationMember, User } from '@/lib/db/schema';
import { appRouter } from '@/server/routers/_app';
import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/rls', () => ({
  setCurrentUser: vi.fn().mockResolvedValue(undefined),
}));

describe('Analytics Router', () => {
  // Use valid UUIDs for testing
  const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
  const TEST_ORG_ID = '660e8400-e29b-41d4-a716-446655440000';
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

    // Mock database with query builder methods
    mockDb = {
      query: {
        organizationMembers: {
          findFirst: vi.fn(),
        },
      },
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
    };

    // Mock context
    mockContext = {
      db: mockDb,
      session: { id: 'session-123' },
      user: mockUser,
    };
  });

  describe('getOverview', () => {
    it('should return overview statistics', async () => {
      // Mock membership check
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      // Mock total leads count
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 100 }]);

      // Mock new leads this month
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 25 }]);

      // Mock converted leads
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 20 }]);

      // Mock average score
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ avg: 75 }]);

      // Mock leads by status
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockResolvedValueOnce([
        { status: 'new', count: 40 },
        { status: 'contacted', count: 30 },
        { status: 'qualified', count: 10 },
        { status: 'converted', count: 20 },
      ]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.getOverview({
        organizationId: TEST_ORG_ID,
        dateRange: '30d',
      });

      expect(result).toMatchObject({
        totalLeads: 100,
        newLeadsThisMonth: 25,
        conversionRate: expect.any(Number),
        averageScore: expect.any(Number),
        leadsByStatus: {
          new: 40,
          contacted: 30,
          qualified: 10,
          converted: 20,
        },
      });

      expect(result.conversionRate).toBe(20); // 20/100 * 100 = 20%
      expect(result.averageScore).toBe(75);
    });

    it('should handle zero leads gracefully', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      // Mock total leads count (0)
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);

      // Mock new leads this month (0)
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);

      // Mock converted leads (0)
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);

      // Mock average score (0)
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ avg: 0 }]);

      // Mock leads by status (empty)
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockResolvedValueOnce([]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.getOverview({
        organizationId: TEST_ORG_ID,
        dateRange: '30d',
      });

      expect(result.totalLeads).toBe(0);
      expect(result.conversionRate).toBe(0);
      expect(result.averageScore).toBe(0);
    });

    it('should throw FORBIDDEN if user is not a member', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.analytics.getOverview({
          organizationId: TEST_ORG_ID,
          dateRange: '30d',
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });

  describe('getLeadTrend', () => {
    it('should return daily trend data', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      const mockTrendData = [
        {
          date: new Date('2025-11-24'),
          count: 10,
          converted: 2,
        },
        {
          date: new Date('2025-11-23'),
          count: 8,
          converted: 1,
        },
      ];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(mockTrendData);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.getLeadTrend({
        organizationId: TEST_ORG_ID,
        dateRange: '7d',
        granularity: 'daily',
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        date: expect.any(String),
        count: 10,
        converted: 2,
      });
    });

    it('should return monthly trend data', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      const mockTrendData = [
        {
          date: new Date('2025-11-01'),
          count: 100,
          converted: 20,
        },
      ];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(mockTrendData);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.getLeadTrend({
        organizationId: TEST_ORG_ID,
        dateRange: '90d',
        granularity: 'monthly',
      });

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(100);
    });

    it('should handle empty trend data', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce([]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.getLeadTrend({
        organizationId: TEST_ORG_ID,
        dateRange: '30d',
        granularity: 'daily',
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('getSourceBreakdown', () => {
    it('should return source distribution with percentages', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      // Mock total count
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 100 }]);

      // Mock source breakdown
      const mockSourceData = [
        { source: 'website', count: 60 },
        { source: 'embed', count: 30 },
        { source: 'api', count: 10 },
      ];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(mockSourceData);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.getSourceBreakdown({
        organizationId: TEST_ORG_ID,
        dateRange: '30d',
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        source: 'website',
        count: 60,
        percentage: 60,
      });
      expect(result[1].percentage).toBe(30);
      expect(result[2].percentage).toBe(10);
    });

    it('should handle unknown sources', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 50 }]);

      const mockSourceData = [{ source: 'unknown', count: 50 }];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(mockSourceData);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.getSourceBreakdown({
        organizationId: TEST_ORG_ID,
        dateRange: '30d',
      });

      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('unknown');
    });

    it('should handle empty source data', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce([]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.getSourceBreakdown({
        organizationId: TEST_ORG_ID,
        dateRange: '30d',
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('getStatusBreakdown', () => {
    it('should return status distribution with percentages', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      // Mock total count
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 100 }]);

      // Mock status breakdown
      const mockStatusData = [
        { status: 'new', count: 40 },
        { status: 'contacted', count: 30 },
        { status: 'qualified', count: 20 },
        { status: 'converted', count: 10 },
      ];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(mockStatusData);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.getStatusBreakdown({
        organizationId: TEST_ORG_ID,
        dateRange: '30d',
      });

      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({
        status: 'new',
        count: 40,
        percentage: 40,
      });
    });

    it('should calculate percentages correctly', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 150 }]);

      const mockStatusData = [
        { status: 'new', count: 100 },
        { status: 'contacted', count: 50 },
      ];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(mockStatusData);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.getStatusBreakdown({
        organizationId: TEST_ORG_ID,
        dateRange: '30d',
      });

      expect(result[0].percentage).toBeCloseTo(66.67, 1);
      expect(result[1].percentage).toBeCloseTo(33.33, 1);
    });

    it('should handle empty status data', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce([]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.getStatusBreakdown({
        organizationId: TEST_ORG_ID,
        dateRange: '30d',
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('Date Range Handling', () => {
    it('should support different date ranges', async () => {
      mockDb.query.organizationMembers.findFirst.mockResolvedValue(mockMembership);

      // Helper function to setup mocks for one getOverview call
      const setupOverviewMocks = () => {
        // Total leads count
        mockDb.select.mockReturnValueOnce(mockDb);
        mockDb.from.mockReturnValueOnce(mockDb);
        mockDb.where.mockResolvedValueOnce([{ count: 0 }]);

        // New leads this month
        mockDb.select.mockReturnValueOnce(mockDb);
        mockDb.from.mockReturnValueOnce(mockDb);
        mockDb.where.mockResolvedValueOnce([{ count: 0 }]);

        // Converted leads
        mockDb.select.mockReturnValueOnce(mockDb);
        mockDb.from.mockReturnValueOnce(mockDb);
        mockDb.where.mockResolvedValueOnce([{ count: 0 }]);

        // Average score
        mockDb.select.mockReturnValueOnce(mockDb);
        mockDb.from.mockReturnValueOnce(mockDb);
        mockDb.where.mockResolvedValueOnce([{ avg: 0 }]);

        // Leads by status
        mockDb.select.mockReturnValueOnce(mockDb);
        mockDb.from.mockReturnValueOnce(mockDb);
        mockDb.where.mockReturnValueOnce(mockDb);
        mockDb.groupBy.mockResolvedValueOnce([]);
      };

      const caller = appRouter.createCaller(mockContext);

      // Test 7d range
      setupOverviewMocks();
      await caller.analytics.getOverview({
        organizationId: TEST_ORG_ID,
        dateRange: '7d',
      });

      // Test 90d range
      setupOverviewMocks();
      await caller.analytics.getOverview({
        organizationId: TEST_ORG_ID,
        dateRange: '90d',
      });

      // Test all range
      setupOverviewMocks();
      await caller.analytics.getOverview({
        organizationId: TEST_ORG_ID,
        dateRange: 'all',
      });

      // All should execute without errors
      expect(mockDb.query.organizationMembers.findFirst).toHaveBeenCalledTimes(3);
    });
  });
});
