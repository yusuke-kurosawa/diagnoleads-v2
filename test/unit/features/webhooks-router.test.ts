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

vi.mock('@/lib/features/webhooks/services/webhook-service', () => ({
  generateWebhookSecret: vi.fn(() => 'test-secret-12345678901234567890'),
  triggerWebhooks: vi.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

describe('Webhooks Router', () => {
  const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
  const TEST_ORG_ID = '660e8400-e29b-41d4-a716-446655440000';
  const TEST_MEMBER_ID = '770e8400-e29b-41d4-a716-446655440000';
  const TEST_WEBHOOK_ID = '880e8400-e29b-41d4-a716-446655440000';

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

  const mockWebhook = {
    id: TEST_WEBHOOK_ID,
    organizationId: TEST_ORG_ID,
    name: 'Lead Created Webhook',
    url: 'https://example.com/webhook',
    events: ['lead.created', 'lead.updated'],
    secret: 'webhook-secret-123456789012345678',
    status: 'active',
    headers: { 'X-Custom-Header': 'value' },
    retryConfig: { maxRetries: 3, retryDelayMs: 5000 },
    lastTriggeredAt: new Date(),
    failureCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDelivery = {
    id: '111e8400-e29b-41d4-a716-446655440000',
    webhookId: TEST_WEBHOOK_ID,
    eventType: 'lead.created',
    payload: { leadId: 'lead-123' },
    status: 'success',
    statusCode: 200,
    attempts: 1,
    responseBody: '{"status":"ok"}',
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
        webhooks: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        webhookDeliveries: {
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
    it('should return list of webhooks', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([mockWebhook]),
              }),
            }),
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.list({
        organizationId: TEST_ORG_ID,
      });

      expect(result.webhooks).toHaveLength(1);
      expect(result.webhooks[0].name).toBe('Lead Created Webhook');
    });

    it('should filter by status', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([mockWebhook]),
              }),
            }),
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.list({
        organizationId: TEST_ORG_ID,
        status: 'active',
      });

      expect(result.webhooks[0].status).toBe('active');
    });

    it('should mask secret in list response', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([mockWebhook]),
              }),
            }),
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.list({
        organizationId: TEST_ORG_ID,
      });

      // Secret should be masked
      expect(result.webhooks[0].secret).not.toBe(mockWebhook.secret);
      expect(result.webhooks[0].secret).toContain('*');
    });
  });

  describe('get', () => {
    it('should return a webhook by ID', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockWebhook]),
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.get({
        organizationId: TEST_ORG_ID,
        id: TEST_WEBHOOK_ID,
      });

      expect(result.id).toBe(TEST_WEBHOOK_ID);
    });

    it('should throw NOT_FOUND for non-existent webhook', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

      await expect(
        caller.webhooks.get({
          organizationId: TEST_ORG_ID,
          id: TEST_WEBHOOK_ID,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('create', () => {
    it('should create a new webhook', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockWebhook]),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.create({
        organizationId: TEST_ORG_ID,
        name: 'New Webhook',
        url: 'https://example.com/new-webhook',
        events: ['lead.created'],
      });

      expect(result).toEqual(mockWebhook);
    });

    it('should generate secret automatically', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockWebhook]),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.create({
        organizationId: TEST_ORG_ID,
        name: 'New Webhook',
        url: 'https://example.com/webhook',
        events: ['lead.created'],
      });

      expect(result.secret).toBeDefined();
    });

    it('should validate URL format', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

      await expect(
        caller.webhooks.create({
          organizationId: TEST_ORG_ID,
          name: 'Invalid Webhook',
          url: 'not-a-valid-url',
          events: ['lead.created'],
        })
      ).rejects.toThrow();
    });

    it('should require at least one event', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

      await expect(
        caller.webhooks.create({
          organizationId: TEST_ORG_ID,
          name: 'No Events Webhook',
          url: 'https://example.com/webhook',
          events: [],
        })
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a webhook', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockWebhook]),
          }),
        }),
      });
      const updatedWebhook = { ...mockWebhook, name: 'Updated Webhook' };
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedWebhook]),
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.update({
        organizationId: TEST_ORG_ID,
        id: TEST_WEBHOOK_ID,
        name: 'Updated Webhook',
      });

      expect(result.name).toBe('Updated Webhook');
    });

    it('should update events', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockWebhook]),
          }),
        }),
      });
      const updatedWebhook = { ...mockWebhook, events: ['lead.deleted'] };
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedWebhook]),
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.update({
        organizationId: TEST_ORG_ID,
        id: TEST_WEBHOOK_ID,
        events: ['lead.deleted'],
      });

      expect(result.events).toEqual(['lead.deleted']);
    });

    it('should update status', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockWebhook]),
          }),
        }),
      });
      const updatedWebhook = { ...mockWebhook, status: 'inactive' };
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedWebhook]),
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.update({
        organizationId: TEST_ORG_ID,
        id: TEST_WEBHOOK_ID,
        status: 'inactive',
      });

      expect(result.status).toBe('inactive');
    });
  });

  describe('delete', () => {
    it('should delete a webhook', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockWebhook]),
          }),
        }),
      });
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockWebhook]),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.delete({
        organizationId: TEST_ORG_ID,
        id: TEST_WEBHOOK_ID,
      });

      expect(result.id).toBe(TEST_WEBHOOK_ID);
    });
  });

  describe('test', () => {
    it('should send a test webhook', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockWebhook]),
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.test({
        organizationId: TEST_ORG_ID,
        id: TEST_WEBHOOK_ID,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('listDeliveries', () => {
    it('should return delivery history', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockWebhook]),
          }),
        }),
      });
      mockDb.query.webhookDeliveries.findMany.mockResolvedValue([mockDelivery]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.listDeliveries({
        organizationId: TEST_ORG_ID,
        webhookId: TEST_WEBHOOK_ID,
      });

      expect(result.deliveries).toHaveLength(1);
      expect(result.deliveries[0].status).toBe('success');
    });

    it('should filter deliveries by status', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockWebhook]),
          }),
        }),
      });
      mockDb.query.webhookDeliveries.findMany.mockResolvedValue([mockDelivery]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.listDeliveries({
        organizationId: TEST_ORG_ID,
        webhookId: TEST_WEBHOOK_ID,
        status: 'success',
      });

      expect(result.deliveries.every((d: any) => d.status === 'success')).toBe(true);
    });

    it('should filter deliveries by eventType', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockWebhook]),
          }),
        }),
      });
      mockDb.query.webhookDeliveries.findMany.mockResolvedValue([mockDelivery]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.listDeliveries({
        organizationId: TEST_ORG_ID,
        webhookId: TEST_WEBHOOK_ID,
        eventType: 'lead.created',
      });

      expect(result.deliveries.every((d: any) => d.eventType === 'lead.created')).toBe(true);
    });
  });

  describe('retryDelivery', () => {
    it('should retry a failed delivery', async () => {
      const failedDelivery = { ...mockDelivery, status: 'failed', error: 'Connection timeout' };
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockWebhook]),
          }),
        }),
      });
      mockDb.query.webhookDeliveries.findFirst.mockResolvedValue(failedDelivery);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
      const result = await caller.webhooks.retryDelivery({
        organizationId: TEST_ORG_ID,
        webhookId: TEST_WEBHOOK_ID,
        deliveryId: failedDelivery.id,
      });

      expect(result.success).toBe(true);
    });

    it('should throw error for non-failed delivery', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockWebhook]),
          }),
        }),
      });
      mockDb.query.webhookDeliveries.findFirst.mockResolvedValue(mockDelivery); // status: success

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

      await expect(
        caller.webhooks.retryDelivery({
          organizationId: TEST_ORG_ID,
          webhookId: TEST_WEBHOOK_ID,
          deliveryId: mockDelivery.id,
        })
      ).rejects.toThrow(TRPCError);
    });
  });
});
