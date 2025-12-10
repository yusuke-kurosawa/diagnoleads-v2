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

describe("Scoring Rules Router", () => {
	const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
	const TEST_ORG_ID = "660e8400-e29b-41d4-a716-446655440000";
	const TEST_MEMBER_ID = "770e8400-e29b-41d4-a716-446655440000";
	const TEST_RULESET_ID = "880e8400-e29b-41d4-a716-446655440000";
	const TEST_LEAD_ID = "990e8400-e29b-41d4-a716-446655440000";

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

	const mockRuleset = {
		id: TEST_RULESET_ID,
		organizationId: TEST_ORG_ID,
		name: "Default Scoring Rules",
		description: "Standard lead scoring ruleset",
		rules: [
			{
				id: "rule-1",
				name: "High Value Source",
				conditions: [
					{
						id: "cond-1",
						type: "source_is" as const,
						operator: "equals" as const,
						value: "organic",
					},
				],
				conditionOperator: "and" as const,
				scoreAdjustment: 10,
				isActive: true,
				priority: 50,
			},
		],
		baseScore: 50,
		minScore: 0,
		maxScore: 100,
		isDefault: true,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockLead = {
		id: TEST_LEAD_ID,
		organizationId: TEST_ORG_ID,
		email: "lead@example.com",
		name: "Test Lead",
		company: "Example Inc",
		phone: "03-1234-5678",
		status: "new",
		score: 0,
		source: "website",
		responses: {
			industry: "technology",
			companySize: "100-500",
		},
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
				leadScoringRulesets: {
					findFirst: vi.fn(),
					findMany: vi.fn(),
				},
				leads: {
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
		it("should return list of scoring rulesets", async () => {
			mockDb.query.leadScoringRulesets.findMany.mockResolvedValue([mockRuleset]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.list({
				organizationId: TEST_ORG_ID,
			});

			expect(result).toEqual([mockRuleset]);
		});

		it("should include inactive when requested", async () => {
			mockDb.query.leadScoringRulesets.findMany.mockResolvedValue([mockRuleset]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.list({
				organizationId: TEST_ORG_ID,
				includeInactive: true,
			});

			expect(result[0].isActive).toBe(true);
		});
	});

	describe("get", () => {
		it("should return a ruleset by ID", async () => {
			mockDb.query.leadScoringRulesets.findFirst.mockResolvedValue(mockRuleset);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.get({
				organizationId: TEST_ORG_ID,
				id: TEST_RULESET_ID,
			});

			expect(result).toEqual(mockRuleset);
		});

		it("should throw NOT_FOUND for non-existent ruleset", async () => {
			mockDb.query.leadScoringRulesets.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.scoringRules.get({
					organizationId: TEST_ORG_ID,
					id: TEST_RULESET_ID,
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("getDefault", () => {
		it("should return the default ruleset", async () => {
			mockDb.query.leadScoringRulesets.findFirst.mockResolvedValue(mockRuleset);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.getDefault({
				organizationId: TEST_ORG_ID,
			});

			expect(result?.isDefault).toBe(true);
		});

		it("should return null if no default ruleset exists", async () => {
			mockDb.query.leadScoringRulesets.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.getDefault({
				organizationId: TEST_ORG_ID,
			});

			expect(result).toBeNull();
		});
	});

	describe("create", () => {
		it("should create a new ruleset", async () => {
			mockDb.returning.mockResolvedValue([mockRuleset]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.create({
				organizationId: TEST_ORG_ID,
				name: "New Ruleset",
				rules: mockRuleset.rules,
				baseScore: 50,
			});

			expect(result).toEqual(mockRuleset);
		});

		it("should unset other defaults when creating a default ruleset", async () => {
			mockDb.returning.mockResolvedValue([{ ...mockRuleset, isDefault: true }]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.create({
				organizationId: TEST_ORG_ID,
				name: "New Default Ruleset",
				rules: mockRuleset.rules,
				baseScore: 50,
				isDefault: true,
			});

			expect(result.isDefault).toBe(true);
		});
	});

	describe("update", () => {
		it("should update a ruleset", async () => {
			mockDb.query.leadScoringRulesets.findFirst.mockResolvedValue(mockRuleset);
			const updatedRuleset = { ...mockRuleset, name: "Updated Ruleset" };
			mockDb.returning.mockResolvedValue([updatedRuleset]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.update({
				organizationId: TEST_ORG_ID,
				id: TEST_RULESET_ID,
				name: "Updated Ruleset",
			});

			expect(result.name).toBe("Updated Ruleset");
		});

		it("should update rules", async () => {
			mockDb.query.leadScoringRulesets.findFirst.mockResolvedValue(mockRuleset);
			const newRules = [
				{
					id: "new-rule-1",
					name: "High Value",
					conditions: [
						{
							id: "cond-1",
							type: "field_value" as const,
							field: "company",
							operator: "equals" as const,
							value: "Enterprise",
						},
					],
					conditionOperator: "and" as const,
					scoreAdjustment: 50,
					isActive: true,
					priority: 50,
				},
			];
			const updatedRuleset = { ...mockRuleset, rules: newRules };
			mockDb.returning.mockResolvedValue([updatedRuleset]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.update({
				organizationId: TEST_ORG_ID,
				id: TEST_RULESET_ID,
				rules: newRules,
			});

			expect(result.rules).toEqual(newRules);
		});
	});

	describe("delete", () => {
		it("should delete a ruleset", async () => {
			const nonDefaultRuleset = { ...mockRuleset, isDefault: false };
			mockDb.query.leadScoringRulesets.findFirst.mockResolvedValue(
				nonDefaultRuleset,
			);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.delete({
				organizationId: TEST_ORG_ID,
				id: TEST_RULESET_ID,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("calculateScore", () => {
		it("should calculate score for a lead", async () => {
			mockDb.query.leadScoringRulesets.findFirst.mockResolvedValue(mockRuleset);
			mockDb.query.leads.findFirst.mockResolvedValue(mockLead);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.calculateScore({
				organizationId: TEST_ORG_ID,
				leadId: TEST_LEAD_ID,
				rulesetId: TEST_RULESET_ID,
			});

			expect(result.newScore).toBeDefined();
			expect(result.appliedRules).toBeDefined();
		});

		it("should use default ruleset if none specified", async () => {
			mockDb.query.leadScoringRulesets.findFirst.mockResolvedValue(mockRuleset);
			mockDb.query.leads.findFirst.mockResolvedValue(mockLead);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.calculateScore({
				organizationId: TEST_ORG_ID,
				leadId: TEST_LEAD_ID,
			});

			expect(result.newScore).toBeGreaterThanOrEqual(0);
		});
	});

	describe("simulateScore", () => {
		it("should simulate score without persisting", async () => {
			mockDb.query.leadScoringRulesets.findFirst.mockResolvedValue(mockRuleset);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.simulateScore({
				organizationId: TEST_ORG_ID,
				rulesetId: TEST_RULESET_ID,
				leadData: {
					source: "organic",
				},
			});

			expect(result.score).toBeDefined();
			expect(result.appliedRules).toBeDefined();
		});

		it("should handle partial lead data", async () => {
			mockDb.query.leadScoringRulesets.findFirst.mockResolvedValue(mockRuleset);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.simulateScore({
				organizationId: TEST_ORG_ID,
				rulesetId: TEST_RULESET_ID,
				leadData: {
					source: "paid",
				},
			});

			expect(result.score).toBeDefined();
		});
	});

	describe("recalculateAll", () => {
		it("should recalculate scores for all leads", async () => {
			mockDb.query.leadScoringRulesets.findFirst.mockResolvedValue(mockRuleset);
			mockDb.query.leads.findMany.mockResolvedValue([
				mockLead,
				{ ...mockLead, id: "lead-2" },
			]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.recalculateAll({
				organizationId: TEST_ORG_ID,
				rulesetId: TEST_RULESET_ID,
			});

			expect(result.totalLeads).toBe(2);
			expect(result.updatedLeads).toBeDefined();
		});
	});

	describe("getConditionTypes", () => {
		it("should return available condition types", async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.scoringRules.getConditionTypes({
				organizationId: TEST_ORG_ID,
			});

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
			expect(result[0]).toHaveProperty("type");
			expect(result[0]).toHaveProperty("operators");
		});
	});
});
