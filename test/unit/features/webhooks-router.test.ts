import type { Organization, OrganizationMember, User } from "@/lib/db/schema";
import { appRouter } from "@/server/routers/_app";
import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/lib/db/rls", () => ({
	setCurrentUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/auth/permissions", () => ({
	defineAbilitiesFor: vi.fn((user, membership) => ({
		can: vi.fn((action: string) => {
			if (
				membership.role === "member" &&
				(action === "create" || action === "delete")
			) {
				return false;
			}
			return true;
		}),
	})),
}));

vi.mock("@/lib/features/webhooks/services/webhook-service", () => ({
	generateWebhookSecret: vi.fn(() => "test-secret-12345678901234567890"),
	triggerWebhooks: vi.fn().mockResolvedValue({ triggered: 1, failed: 0 }),
}));

// Use vi.hoisted to ensure variables are available before vi.mock hoisting
const { createMockWebhook, createMockDbClient, mockDbClientRef } = vi.hoisted(() => {
	const createMockWebhookFn = () => ({
		id: "880e8400-e29b-41d4-a716-446655440000",
		organizationId: "660e8400-e29b-41d4-a716-446655440000",
		name: "Lead Created Webhook",
		url: "https://example.com/webhook",
		events: ["lead.created", "lead.updated"],
		secret: "webhook-secret-123456789012345678",
		status: "active",
		headers: { "X-Custom-Header": "value" },
		retryConfig: { maxRetries: 3, retryDelayMs: 5000 },
		lastTriggeredAt: new Date(),
		failureCount: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	type MockWebhook = ReturnType<typeof createMockWebhookFn>;

	const createMockDbClientFn = (mockWebhook: MockWebhook) => ({
		select: vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockReturnValue({
						limit: vi.fn().mockReturnValue({
							offset: vi.fn().mockResolvedValue([mockWebhook]),
						}),
					}),
					limit: vi.fn().mockResolvedValue([mockWebhook]),
				}),
			}),
		}),
		insert: vi.fn().mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([mockWebhook]),
			}),
		}),
		update: vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockWebhook]),
				}),
			}),
		}),
		delete: vi.fn().mockReturnValue({
			where: vi.fn().mockResolvedValue(undefined),
		}),
		query: {
			organizationMembers: {
				findFirst: vi.fn(),
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
	});

	// Use an object ref so we can swap the value from tests
	const ref: { current: ReturnType<typeof createMockDbClientFn> | undefined } = { current: undefined };

	return {
		createMockWebhook: createMockWebhookFn,
		createMockDbClient: createMockDbClientFn,
		mockDbClientRef: ref,
	};
});

vi.mock("@/lib/db/client", () => ({
	get db() {
		if (!mockDbClientRef.current) {
			mockDbClientRef.current = createMockDbClient(createMockWebhook());
		}
		return mockDbClientRef.current;
	},
}));

describe("Webhooks Router", () => {
	const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
	const TEST_ORG_ID = "660e8400-e29b-41d4-a716-446655440000";
	const TEST_MEMBER_ID = "770e8400-e29b-41d4-a716-446655440000";
	const TEST_WEBHOOK_ID = "880e8400-e29b-41d4-a716-446655440000";

	const mockUser: User = {
		id: TEST_USER_ID,
		email: "test@example.com",
		name: "Test User",
		emailVerified: true,
		image: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockOrganization: Organization = {
		id: TEST_ORG_ID,
		name: "Test Organization",
		slug: "test-org",
		settings: {},
		parentOrganizationId: null,
		organizationType: "independent",
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
		role: "admin",
		createdAt: new Date(),
		updatedAt: new Date(),
		organization: mockOrganization,
	};

	const mockWebhook = createMockWebhook();

	const mockDelivery = {
		id: "111e8400-e29b-41d4-a716-446655440000",
		webhookId: TEST_WEBHOOK_ID,
		eventType: "lead.created",
		payload: { leadId: "lead-123" },
		status: "success",
		statusCode: 200,
		attempts: 1,
		responseBody: '{"status":"ok"}',
		error: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	let mockDb: ReturnType<typeof createMockDb>;
	let mockContext: ReturnType<typeof createMockContext>;

	function createMockDb() {
		return {
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
			innerJoin: vi.fn().mockReturnThis(),
			$dynamic: vi.fn().mockReturnThis(),
		};
	}

	function createMockContext() {
		return {
			db: mockDb,
			session: {
				session: {
					id: "session-id",
					userId: TEST_USER_ID,
					activeOrganizationId: TEST_ORG_ID,
				},
				user: mockUser,
			},
			user: mockUser,
		};
	}

	beforeEach(() => {
		vi.clearAllMocks();
		mockDb = createMockDb();
		mockContext = createMockContext();
		mockDbClientRef.current = createMockDbClient(mockWebhook);
	});

	describe("list", () => {
		it("should return list of webhooks", async () => {
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
			expect(result.webhooks[0].name).toBe("Lead Created Webhook");
		});

		it("should filter by status", async () => {
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
				status: "active",
			});

			expect(result.webhooks[0].status).toBe("active");
		});
	});

	describe("get", () => {
		it("should return a webhook by ID", async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.webhooks.get({
				organizationId: TEST_ORG_ID,
				id: TEST_WEBHOOK_ID,
			});

			expect(result.id).toBe(TEST_WEBHOOK_ID);
		});

		it("should throw NOT_FOUND for non-existent webhook", async () => {
			mockDbClientRef.current!.select.mockReturnValue({
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
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("create", () => {
		it("should create a new webhook", async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.webhooks.create({
				organizationId: TEST_ORG_ID,
				name: "New Webhook",
				url: "https://example.com/new-webhook",
				events: ["lead.created"],
			});

			expect(result).toBeDefined();
		});

		it("should generate secret automatically", async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.webhooks.create({
				organizationId: TEST_ORG_ID,
				name: "New Webhook",
				url: "https://example.com/webhook",
				events: ["lead.created"],
			});

			expect(result.secret).toBeDefined();
		});
	});

	describe("update", () => {
		it("should update a webhook", async () => {
			const updatedWebhook = { ...mockWebhook, name: "Updated Webhook" };
			mockDbClientRef.current!.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockWebhook]),
					}),
				}),
			});
			mockDbClientRef.current!.update.mockReturnValue({
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
				name: "Updated Webhook",
			});

			expect(result.name).toBe("Updated Webhook");
		});

		it("should update events", async () => {
			const updatedWebhook = { ...mockWebhook, events: ["lead.deleted"] };
			mockDbClientRef.current!.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockWebhook]),
					}),
				}),
			});
			mockDbClientRef.current!.update.mockReturnValue({
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
				events: ["lead.deleted"],
			});

			expect(result.events).toEqual(["lead.deleted"]);
		});

		it("should update status", async () => {
			const updatedWebhook = { ...mockWebhook, status: "inactive" };
			mockDbClientRef.current!.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockWebhook]),
					}),
				}),
			});
			mockDbClientRef.current!.update.mockReturnValue({
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
				status: "inactive",
			});

			expect(result.status).toBe("inactive");
		});
	});

	describe("delete", () => {
		it("should delete a webhook", async () => {
			mockDbClientRef.current!.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([mockWebhook]),
					}),
				}),
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.webhooks.delete({
				organizationId: TEST_ORG_ID,
				id: TEST_WEBHOOK_ID,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("test", () => {
		it("should send a test webhook", async () => {
			mockDbClientRef.current!.select.mockReturnValue({
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

	describe("deliveries", () => {
		it("should return delivery history", async () => {
			// Create a chainable mock that returns itself for $dynamic().where() calls
			const resultMock = [{ delivery: mockDelivery, webhookName: "Lead Created Webhook" }];

			const createDynamicChain = () => {
				const chain: Record<string, unknown> = {};
				chain.where = vi.fn().mockReturnValue(chain);
				chain.orderBy = vi.fn().mockReturnValue(chain);
				chain.limit = vi.fn().mockReturnValue(chain);
				chain.offset = vi.fn().mockResolvedValue(resultMock);
				return chain;
			};

			mockDbClientRef.current!.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							$dynamic: vi.fn().mockReturnValue(createDynamicChain()),
						}),
					}),
				}),
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.webhooks.deliveries({
				organizationId: TEST_ORG_ID,
				webhookId: TEST_WEBHOOK_ID,
			});

			expect(result.deliveries).toHaveLength(1);
			expect(result.deliveries[0].status).toBe("success");
		});
	});

	describe("eventTypes", () => {
		it("should return available event types", async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.webhooks.eventTypes({
				organizationId: TEST_ORG_ID,
			});

			expect(Array.isArray(result)).toBe(true);
		});
	});
});
