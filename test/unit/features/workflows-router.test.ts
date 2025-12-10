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
      if (membership.role === 'member' && (action === 'create' || action === 'delete')) {
        return false;
      }
      return true;
    }),
  })),
}));

describe('Workflows Router', () => {
  const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
  const TEST_ORG_ID = '660e8400-e29b-41d4-a716-446655440000';
  const TEST_MEMBER_ID = '770e8400-e29b-41d4-a716-446655440000';
  const TEST_WORKFLOW_ID = '880e8400-e29b-41d4-a716-446655440000';

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

  const mockWorkflow = {
    id: TEST_WORKFLOW_ID,
    organizationId: TEST_ORG_ID,
    name: 'New Lead Welcome',
    description: 'Send welcome email when a new lead is created',
    trigger: {
      type: 'lead.created',
      conditions: [],
    },
    actions: [
      {
        id: 'action-1',
        type: 'send_email',
        config: {
          template: 'welcome',
          to: '{{lead.email}}',
        },
      },
      {
        id: 'action-2',
        type: 'update_lead',
        config: {
          status: 'contacted',
        },
      },
    ],
    isActive: true,
    executionCount: 150,
    lastExecutedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExecution = {
    id: '111e8400-e29b-41d4-a716-446655440000',
    workflowId: TEST_WORKFLOW_ID,
    triggerData: { leadId: 'lead-123' },
    status: 'success',
    startedAt: new Date(),
    completedAt: new Date(),
    error: null,
    actionResults: [
      { actionId: 'action-1', status: 'success', result: { sent: true } },
      { actionId: 'action-2', status: 'success', result: { updated: true } },
    ],
    createdAt: new Date(),
  };

  let mockDb: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      query: {
        organizationMembers: {
          findFirst: vi.fn().mockResolvedValue(mockMembership),
        },
        workflows: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        workflowExecutions: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };

    mockContext = {
      db: mockDb,
      session: {
        session: {
          id: 'session-id',
          userId: TEST_USER_ID,
          activeOrganizationId: TEST_ORG_ID,
        },
        user: mockUser,
      },
      user: mockUser,
    };
  });

  describe('list', () => {
    it('should return list of workflows', async () => {
      mockDb.query.workflows.findMany.mockResolvedValue([mockWorkflow]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.list({
        organizationId: TEST_ORG_ID,
      });

      expect(result.workflows).toEqual([mockWorkflow]);
    });

    it('should filter by isActive status', async () => {
      mockDb.query.workflows.findMany.mockResolvedValue([mockWorkflow]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.list({
        organizationId: TEST_ORG_ID,
        isActive: true,
      });

      expect(result.workflows[0].isActive).toBe(true);
    });

    it('should filter by trigger type', async () => {
      mockDb.query.workflows.findMany.mockResolvedValue([mockWorkflow]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.list({
        organizationId: TEST_ORG_ID,
        triggerType: 'lead.created',
      });

      expect(result.workflows[0].trigger.type).toBe('lead.created');
    });
  });

  describe('get', () => {
    it('should return a workflow by ID', async () => {
      mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.get({
        organizationId: TEST_ORG_ID,
        id: TEST_WORKFLOW_ID,
      });

      expect(result).toEqual(mockWorkflow);
    });

    it('should throw NOT_FOUND for non-existent workflow', async () => {
      mockDb.query.workflows.findFirst.mockResolvedValue(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

      await expect(
        caller.workflows.get({
          organizationId: TEST_ORG_ID,
          id: TEST_WORKFLOW_ID,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('create', () => {
    it('should create a new workflow', async () => {
      mockDb.returning.mockResolvedValue([mockWorkflow]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.create({
        organizationId: TEST_ORG_ID,
        name: 'New Workflow',
        trigger: mockWorkflow.trigger,
        actions: mockWorkflow.actions,
      });

      expect(result).toEqual(mockWorkflow);
    });

    it('should create workflow with description', async () => {
      const workflowWithDesc = { ...mockWorkflow, description: 'Test description' };
      mockDb.returning.mockResolvedValue([workflowWithDesc]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.create({
        organizationId: TEST_ORG_ID,
        name: 'New Workflow',
        description: 'Test description',
        trigger: mockWorkflow.trigger,
        actions: mockWorkflow.actions,
      });

      expect(result.description).toBe('Test description');
    });
  });

  describe('update', () => {
    it('should update a workflow', async () => {
      mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);
      const updatedWorkflow = { ...mockWorkflow, name: 'Updated Workflow' };
      mockDb.returning.mockResolvedValue([updatedWorkflow]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.update({
        organizationId: TEST_ORG_ID,
        id: TEST_WORKFLOW_ID,
        name: 'Updated Workflow',
      });

      expect(result.name).toBe('Updated Workflow');
    });

    it('should update actions', async () => {
      mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);
      const newActions = [
        { id: 'new-action', type: 'send_slack', config: { channel: '#leads' } },
      ];
      const updatedWorkflow = { ...mockWorkflow, actions: newActions };
      mockDb.returning.mockResolvedValue([updatedWorkflow]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.update({
        organizationId: TEST_ORG_ID,
        id: TEST_WORKFLOW_ID,
        actions: newActions,
      });

      expect(result.actions).toEqual(newActions);
    });
  });

  describe('delete', () => {
    it('should delete a workflow', async () => {
      mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);
      mockDb.returning.mockResolvedValue([mockWorkflow]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.delete({
        organizationId: TEST_ORG_ID,
        id: TEST_WORKFLOW_ID,
      });

      expect(result.id).toBe(TEST_WORKFLOW_ID);
    });
  });

  describe('toggleStatus', () => {
    it('should activate an inactive workflow', async () => {
      const inactiveWorkflow = { ...mockWorkflow, isActive: false };
      mockDb.query.workflows.findFirst.mockResolvedValue(inactiveWorkflow);
      const activatedWorkflow = { ...mockWorkflow, isActive: true };
      mockDb.returning.mockResolvedValue([activatedWorkflow]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.toggleStatus({
        organizationId: TEST_ORG_ID,
        id: TEST_WORKFLOW_ID,
      });

      expect(result.isActive).toBe(true);
    });

    it('should deactivate an active workflow', async () => {
      mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);
      const deactivatedWorkflow = { ...mockWorkflow, isActive: false };
      mockDb.returning.mockResolvedValue([deactivatedWorkflow]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.toggleStatus({
        organizationId: TEST_ORG_ID,
        id: TEST_WORKFLOW_ID,
      });

      expect(result.isActive).toBe(false);
    });
  });

  describe('getExecutions', () => {
    it('should return workflow executions', async () => {
      mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);
      mockDb.query.workflowExecutions.findMany.mockResolvedValue([mockExecution]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.getExecutions({
        organizationId: TEST_ORG_ID,
        workflowId: TEST_WORKFLOW_ID,
      });

      expect(result.executions).toHaveLength(1);
      expect(result.executions[0].status).toBe('success');
    });

    it('should filter executions by status', async () => {
      mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);
      mockDb.query.workflowExecutions.findMany.mockResolvedValue([mockExecution]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.getExecutions({
        organizationId: TEST_ORG_ID,
        workflowId: TEST_WORKFLOW_ID,
        status: 'success',
      });

      expect(result.executions.every((e: any) => e.status === 'success')).toBe(true);
    });

    it('should paginate executions', async () => {
      mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);
      mockDb.query.workflowExecutions.findMany.mockResolvedValue([mockExecution]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.getExecutions({
        organizationId: TEST_ORG_ID,
        workflowId: TEST_WORKFLOW_ID,
        limit: 10,
        offset: 0,
      });

      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return workflow statistics', async () => {
      mockDb.query.workflows.findMany.mockResolvedValue([mockWorkflow]);
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([
              { status: 'success', count: 100 },
              { status: 'failed', count: 10 },
            ]),
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.getStats({
        organizationId: TEST_ORG_ID,
      });

      expect(result.totalWorkflows).toBe(1);
      expect(result.activeWorkflows).toBe(1);
      expect(result.totalExecutions).toBeGreaterThanOrEqual(0);
    });

    it('should calculate success rate', async () => {
      mockDb.query.workflows.findMany.mockResolvedValue([mockWorkflow]);
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([
              { status: 'success', count: 90 },
              { status: 'failed', count: 10 },
            ]),
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.workflows.getStats({
        organizationId: TEST_ORG_ID,
      });

      // 90/(90+10) = 90%
      expect(result.successRate).toBeCloseTo(0.9, 1);
    });
  });
});
