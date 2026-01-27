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

describe("A/B Tests Router", () => {
	const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
	const TEST_ORG_ID = "660e8400-e29b-41d4-a716-446655440000";
	const TEST_MEMBER_ID = "770e8400-e29b-41d4-a716-446655440000";
	const TEST_ABTEST_ID = "880e8400-e29b-41d4-a716-446655440000";
	const TEST_TEMPLATE_ID = "990e8400-e29b-41d4-a716-446655440000";
	const TEST_VARIANT_TEMPLATE_ID = "aa0e8400-e29b-41d4-a716-446655440000";

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

	const mockAbTest = {
		id: TEST_ABTEST_ID,
		organizationId: TEST_ORG_ID,
		name: "Button Color Test",
		description: "Testing red vs blue CTA buttons",
		baseTemplateId: TEST_TEMPLATE_ID,
		variants: [
			{
				templateId: TEST_TEMPLATE_ID,
				name: "Control",
				trafficPercent: 50,
				impressions: 1000,
				submissions: 500,
				conversions: 100,
			},
			{
				templateId: TEST_VARIANT_TEMPLATE_ID,
				name: "Red Button",
				trafficPercent: 50,
				impressions: 1000,
				submissions: 500,
				conversions: 120,
			},
		],
		status: "running" as const,
		goalType: "conversion_rate" as const,
		minSampleSize: 100,
		confidenceLevel: 95,
		winnerId: null,
		startedAt: new Date(),
		endedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		baseTemplate: {
			id: TEST_TEMPLATE_ID,
			name: "Default Template",
			slug: "default-template",
		},
	};

	let mockDb: ReturnType<typeof createMockDb>;
	let mockContext: ReturnType<typeof createMockContext>;

	function createMockDb() {
		return {
			query: {
				organizationMembers: {
					findFirst: vi.fn().mockResolvedValue(mockMembership),
				},
				diagnosticAbTests: {
					findFirst: vi.fn(),
					findMany: vi.fn(),
				},
				diagnosticTemplates: {
					findFirst: vi.fn(),
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
		it("should return list of A/B tests", async () => {
			mockDb.query.diagnosticAbTests.findMany.mockResolvedValue([mockAbTest]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.list({
				organizationId: TEST_ORG_ID,
			});

			expect(result).toEqual([mockAbTest]);
		});

		it("should filter by status", async () => {
			mockDb.query.diagnosticAbTests.findMany.mockResolvedValue([mockAbTest]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.list({
				organizationId: TEST_ORG_ID,
				status: "running",
			});

			expect(result[0].status).toBe("running");
		});
	});

	describe("get", () => {
		it("should return an A/B test by ID", async () => {
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(mockAbTest);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.get({
				organizationId: TEST_ORG_ID,
				id: TEST_ABTEST_ID,
			});

			expect(result).toEqual(mockAbTest);
		});

		it("should throw NOT_FOUND for non-existent test", async () => {
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.abTests.get({
					organizationId: TEST_ORG_ID,
					id: TEST_ABTEST_ID,
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("create", () => {
		it("should create a new A/B test", async () => {
			mockDb.query.diagnosticTemplates.findFirst.mockResolvedValue({
				id: TEST_TEMPLATE_ID,
			});
			mockDb.returning.mockResolvedValue([mockAbTest]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.create({
				organizationId: TEST_ORG_ID,
				name: "New Test",
				baseTemplateId: TEST_TEMPLATE_ID,
				variants: [
					{
						templateId: TEST_TEMPLATE_ID,
						name: "Control",
						trafficPercent: 50,
					},
					{
						templateId: TEST_VARIANT_TEMPLATE_ID,
						name: "Variant B",
						trafficPercent: 50,
					},
				],
				goalType: "conversion_rate",
			});

			expect(result).toEqual(mockAbTest);
		});
	});

	describe("update", () => {
		it("should update an A/B test", async () => {
			const draftTest = { ...mockAbTest, status: "draft" as const };
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(draftTest);
			const updatedTest = { ...draftTest, name: "Updated Test Name" };
			mockDb.returning.mockResolvedValue([updatedTest]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.update({
				organizationId: TEST_ORG_ID,
				id: TEST_ABTEST_ID,
				name: "Updated Test Name",
			});

			expect(result.name).toBe("Updated Test Name");
		});
	});

	describe("delete", () => {
		it("should delete an A/B test", async () => {
			const draftTest = { ...mockAbTest, status: "draft" as const };
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(draftTest);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.delete({
				organizationId: TEST_ORG_ID,
				id: TEST_ABTEST_ID,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("start", () => {
		it("should start a draft A/B test", async () => {
			const draftTest = {
				...mockAbTest,
				status: "draft" as const,
				startedAt: null,
			};
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(draftTest);
			const startedTest = {
				...draftTest,
				status: "running" as const,
				startedAt: new Date(),
			};
			mockDb.returning.mockResolvedValue([startedTest]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.start({
				organizationId: TEST_ORG_ID,
				id: TEST_ABTEST_ID,
			});

			expect(result.status).toBe("running");
			expect(result.startedAt).toBeDefined();
		});

		it("should throw error if test is not in draft status", async () => {
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(mockAbTest); // already running

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.abTests.start({
					organizationId: TEST_ORG_ID,
					id: TEST_ABTEST_ID,
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("pause", () => {
		it("should pause a running A/B test", async () => {
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(mockAbTest);
			const pausedTest = { ...mockAbTest, status: "paused" as const };
			mockDb.returning.mockResolvedValue([pausedTest]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.pause({
				organizationId: TEST_ORG_ID,
				id: TEST_ABTEST_ID,
			});

			expect(result.status).toBe("paused");
		});
	});

	describe("complete", () => {
		it("should complete a test and determine winner", async () => {
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(mockAbTest);
			const completedTest = {
				...mockAbTest,
				status: "completed" as const,
				endedAt: new Date(),
				winnerId: TEST_VARIANT_TEMPLATE_ID,
			};
			mockDb.returning.mockResolvedValue([completedTest]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.complete({
				organizationId: TEST_ORG_ID,
				id: TEST_ABTEST_ID,
			});

			expect(result.status).toBe("completed");
			expect(result.winnerId).toBe(TEST_VARIANT_TEMPLATE_ID);
		});
	});

	describe("recordEvent", () => {
		it("should record an impression event", async () => {
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(mockAbTest);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.recordEvent({
				organizationId: TEST_ORG_ID,
				testId: TEST_ABTEST_ID,
				variantTemplateId: TEST_TEMPLATE_ID,
				eventType: "impression",
			});

			expect(result.success).toBe(true);
		});

		it("should record a conversion event", async () => {
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(mockAbTest);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.recordEvent({
				organizationId: TEST_ORG_ID,
				testId: TEST_ABTEST_ID,
				variantTemplateId: TEST_VARIANT_TEMPLATE_ID,
				eventType: "conversion",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("getResults", () => {
		it("should return test results with statistical analysis", async () => {
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(mockAbTest);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.getResults({
				organizationId: TEST_ORG_ID,
				id: TEST_ABTEST_ID,
			});

			expect(result.results).toHaveLength(2);
			expect(result.results[0]).toHaveProperty("conversionRate");
			expect(result).toHaveProperty("isSignificant");
		});

		it("should calculate conversion rates correctly", async () => {
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(mockAbTest);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.getResults({
				organizationId: TEST_ORG_ID,
				id: TEST_ABTEST_ID,
			});

			// variant-a: 100/500 = 20%
			expect(result.results[0].conversionRate).toBeCloseTo(20, 0);
			// variant-b: 120/500 = 24%
			expect(result.results[1].conversionRate).toBeCloseTo(24, 0);
		});
	});

	describe("selectVariant", () => {
		it("should select a variant based on weight distribution", async () => {
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(mockAbTest);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.selectVariant({
				organizationId: TEST_ORG_ID,
				testId: TEST_ABTEST_ID,
			});

			expect([TEST_TEMPLATE_ID, TEST_VARIANT_TEMPLATE_ID, null]).toContain(
				result,
			);
		});

		it("should return null if test is not running", async () => {
			const draftTest = { ...mockAbTest, status: "draft" as const };
			mockDb.query.diagnosticAbTests.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.abTests.selectVariant({
				organizationId: TEST_ORG_ID,
				testId: TEST_ABTEST_ID,
			});

			expect(result).toBeNull();
		});
	});
});
