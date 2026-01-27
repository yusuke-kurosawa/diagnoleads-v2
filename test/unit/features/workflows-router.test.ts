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

describe("Workflows Router", () => {
	const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
	const TEST_ORG_ID = "660e8400-e29b-41d4-a716-446655440000";
	const TEST_MEMBER_ID = "770e8400-e29b-41d4-a716-446655440000";
	const TEST_WORKFLOW_ID = "880e8400-e29b-41d4-a716-446655440000";

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

	const mockWorkflow = {
		id: TEST_WORKFLOW_ID,
		organizationId: TEST_ORG_ID,
		createdById: TEST_USER_ID,
		name: "New Lead Welcome",
		description: "Send welcome email when a new lead is created",
		trigger: "lead_created",
		conditions: [],
		actions: [
			{
				type: "send_email",
				params: { template: "welcome", to: "{{lead.email}}" },
			},
			{
				type: "update_status",
				params: { status: "contacted" },
			},
		],
		status: "active",
		priority: 100,
		cronExpression: null,
		executionCount: 150,
		lastExecutedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockExecution = {
		id: "111e8400-e29b-41d4-a716-446655440000",
		organizationId: TEST_ORG_ID,
		workflowId: TEST_WORKFLOW_ID,
		leadId: "222e8400-e29b-41d4-a716-446655440000",
		status: "success",
		executedAt: new Date(),
		durationMs: 150,
		actionsExecuted: 2,
		error: null,
		createdAt: new Date(),
	};

	let mockDb: ReturnType<typeof createMockDb>;
	let mockContext: ReturnType<typeof createMockContext>;

	function createMockDb() {
		return {
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
	});

	describe("list", () => {
		it("should return list of workflows", async () => {
			mockDb.query.workflows.findMany.mockResolvedValue([mockWorkflow]);
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ count: 1 }]),
				}),
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.list({
				organizationId: TEST_ORG_ID,
			});

			expect(result.items).toEqual([mockWorkflow]);
			expect(result.total).toBe(1);
		});

		it("should filter by status", async () => {
			mockDb.query.workflows.findMany.mockResolvedValue([mockWorkflow]);
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ count: 1 }]),
				}),
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.list({
				organizationId: TEST_ORG_ID,
				status: "active",
			});

			expect(result.items[0].status).toBe("active");
		});

		it("should filter by trigger type", async () => {
			mockDb.query.workflows.findMany.mockResolvedValue([mockWorkflow]);
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ count: 1 }]),
				}),
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.list({
				organizationId: TEST_ORG_ID,
				trigger: "lead_created",
			});

			expect(result.items[0].trigger).toBe("lead_created");
		});
	});

	describe("get", () => {
		it("should return a workflow by ID", async () => {
			mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.get({
				organizationId: TEST_ORG_ID,
				id: TEST_WORKFLOW_ID,
			});

			expect(result).toEqual(mockWorkflow);
		});

		it("should throw NOT_FOUND for non-existent workflow", async () => {
			mockDb.query.workflows.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.workflows.get({
					organizationId: TEST_ORG_ID,
					id: TEST_WORKFLOW_ID,
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("create", () => {
		it("should create a new workflow", async () => {
			mockDb.returning.mockResolvedValue([mockWorkflow]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.create({
				organizationId: TEST_ORG_ID,
				name: "New Workflow",
				trigger: "lead_created",
				actions: [{ type: "update_status", params: { status: "contacted" } }],
			});

			expect(result).toEqual(mockWorkflow);
		});

		it("should create workflow with description", async () => {
			const workflowWithDesc = {
				...mockWorkflow,
				description: "Test description",
			};
			mockDb.returning.mockResolvedValue([workflowWithDesc]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.create({
				organizationId: TEST_ORG_ID,
				name: "New Workflow",
				description: "Test description",
				trigger: "lead_created",
				actions: [{ type: "update_status", params: { status: "contacted" } }],
			});

			expect(result.description).toBe("Test description");
		});
	});

	describe("update", () => {
		it("should update a workflow", async () => {
			mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);
			const updatedWorkflow = { ...mockWorkflow, name: "Updated Workflow" };
			mockDb.returning.mockResolvedValue([updatedWorkflow]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.update({
				organizationId: TEST_ORG_ID,
				id: TEST_WORKFLOW_ID,
				name: "Updated Workflow",
			});

			expect(result.name).toBe("Updated Workflow");
		});

		it("should update actions", async () => {
			mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);
			const newActions = [
				{ type: "send_notification", params: { channel: "#leads" } },
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

		it("should throw NOT_FOUND for non-existent workflow", async () => {
			mockDb.query.workflows.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.workflows.update({
					organizationId: TEST_ORG_ID,
					id: TEST_WORKFLOW_ID,
					name: "Updated Workflow",
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("delete", () => {
		it("should delete a workflow", async () => {
			mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.delete({
				organizationId: TEST_ORG_ID,
				id: TEST_WORKFLOW_ID,
			});

			expect(result.success).toBe(true);
		});

		it("should throw NOT_FOUND for non-existent workflow", async () => {
			mockDb.query.workflows.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.workflows.delete({
					organizationId: TEST_ORG_ID,
					id: TEST_WORKFLOW_ID,
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("toggleStatus", () => {
		it("should activate a paused workflow", async () => {
			const pausedWorkflow = { ...mockWorkflow, status: "paused" };
			mockDb.query.workflows.findFirst.mockResolvedValue(pausedWorkflow);
			const activatedWorkflow = { ...mockWorkflow, status: "active" };
			mockDb.returning.mockResolvedValue([activatedWorkflow]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.toggleStatus({
				organizationId: TEST_ORG_ID,
				id: TEST_WORKFLOW_ID,
			});

			expect(result.status).toBe("active");
		});

		it("should pause an active workflow", async () => {
			mockDb.query.workflows.findFirst.mockResolvedValue(mockWorkflow);
			const pausedWorkflow = { ...mockWorkflow, status: "paused" };
			mockDb.returning.mockResolvedValue([pausedWorkflow]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.toggleStatus({
				organizationId: TEST_ORG_ID,
				id: TEST_WORKFLOW_ID,
			});

			expect(result.status).toBe("paused");
		});

		it("should throw NOT_FOUND for non-existent workflow", async () => {
			mockDb.query.workflows.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.workflows.toggleStatus({
					organizationId: TEST_ORG_ID,
					id: TEST_WORKFLOW_ID,
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("getExecutions", () => {
		it("should return workflow executions", async () => {
			mockDb.query.workflowExecutions.findMany.mockResolvedValue([
				mockExecution,
			]);
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ count: 1 }]),
				}),
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.getExecutions({
				organizationId: TEST_ORG_ID,
				workflowId: TEST_WORKFLOW_ID,
			});

			expect(result.items).toHaveLength(1);
			expect(result.items[0].status).toBe("success");
		});

		it("should filter executions by status", async () => {
			mockDb.query.workflowExecutions.findMany.mockResolvedValue([
				mockExecution,
			]);
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ count: 1 }]),
				}),
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.getExecutions({
				organizationId: TEST_ORG_ID,
				workflowId: TEST_WORKFLOW_ID,
				status: "success",
			});

			expect(result.items.every((e) => e.status === "success")).toBe(true);
		});

		it("should paginate executions", async () => {
			mockDb.query.workflowExecutions.findMany.mockResolvedValue([
				mockExecution,
			]);
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ count: 1 }]),
				}),
			});

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

	describe("getStats", () => {
		it("should return workflow statistics", async () => {
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([
						{
							total: 5,
							active: 3,
							paused: 1,
							disabled: 1,
						},
					]),
				}),
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.getStats({
				organizationId: TEST_ORG_ID,
			});

			expect(result.workflows.total).toBe(5);
			expect(result.workflows.active).toBe(3);
		});

		it("should return execution statistics", async () => {
			let callCount = 0;
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockImplementation(() => {
						callCount++;
						if (callCount === 1) {
							return Promise.resolve([
								{ total: 5, active: 3, paused: 1, disabled: 1 },
							]);
						}
						return Promise.resolve([
							{ total: 100, success: 90, failed: 8, skipped: 2 },
						]);
					}),
				}),
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.workflows.getStats({
				organizationId: TEST_ORG_ID,
			});

			expect(result.executions).toBeDefined();
		});
	});
});
