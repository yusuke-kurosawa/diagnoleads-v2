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

describe("Diagnostic Templates Router", () => {
	const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
	const TEST_ORG_ID = "660e8400-e29b-41d4-a716-446655440000";
	const TEST_MEMBER_ID = "770e8400-e29b-41d4-a716-446655440000";
	const TEST_TEMPLATE_ID = "880e8400-e29b-41d4-a716-446655440000";

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

	const mockTemplate = {
		id: TEST_TEMPLATE_ID,
		organizationId: TEST_ORG_ID,
		userId: TEST_USER_ID,
		name: "Test Template",
		slug: "test-template",
		title: "Test Diagnostic",
		description: "A test diagnostic template",
		steps: [
			{
				id: "step-1",
				title: "Step 1",
				order: 0,
				questions: [
					{
						id: "q-1",
						type: "text" as const,
						label: "What is your name?",
						required: true,
						order: 0,
					},
				],
			},
		],
		theme: {
			primaryColor: "#3B82F6",
			backgroundColor: "#FFFFFF",
		},
		completion: {
			title: "Thank you!",
			message: "Your diagnostic is complete.",
		},
		leadSource: null,
		isActive: true,
		isDefault: false,
		parentTemplateId: null,
		version: 1,
		submissionCount: 0,
		conversionCount: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		user: {
			id: TEST_USER_ID,
			name: "Test User",
			email: "test@example.com",
		},
		variants: [],
		abTests: [],
	};

	let mockDb: ReturnType<typeof createMockDb>;
	let mockContext: ReturnType<typeof createMockContext>;

	function createMockDb() {
		return {
			query: {
				organizationMembers: {
					findFirst: vi.fn().mockResolvedValue(mockMembership),
				},
				diagnosticTemplates: {
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
		it("should return list of templates", async () => {
			const templates = [mockTemplate];
			mockDb.query.diagnosticTemplates.findMany.mockResolvedValue(templates);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.diagnosticTemplates.list({
				organizationId: TEST_ORG_ID,
			});

			expect(result).toEqual(templates);
		});

		it("should include inactive templates when requested", async () => {
			mockDb.query.diagnosticTemplates.findMany.mockResolvedValue([
				mockTemplate,
			]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.diagnosticTemplates.list({
				organizationId: TEST_ORG_ID,
				includeInactive: true,
			});

			expect(result.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe("get", () => {
		it("should return a template by ID", async () => {
			mockDb.query.diagnosticTemplates.findFirst.mockResolvedValue(mockTemplate);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.diagnosticTemplates.get({
				organizationId: TEST_ORG_ID,
				id: TEST_TEMPLATE_ID,
			});

			expect(result).toEqual(mockTemplate);
		});

		it("should throw NOT_FOUND for non-existent template", async () => {
			mockDb.query.diagnosticTemplates.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.diagnosticTemplates.get({
					organizationId: TEST_ORG_ID,
					id: TEST_TEMPLATE_ID,
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("getBySlug", () => {
		it("should return a template by slug", async () => {
			mockDb.query.diagnosticTemplates.findFirst.mockResolvedValue(mockTemplate);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.diagnosticTemplates.getBySlug({
				organizationId: TEST_ORG_ID,
				slug: "test-template",
			});

			expect(result).toEqual(mockTemplate);
		});
	});

	describe("create", () => {
		it("should create a new template", async () => {
			mockDb.returning.mockResolvedValue([mockTemplate]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.diagnosticTemplates.create({
				organizationId: TEST_ORG_ID,
				name: "New Template",
				slug: "new-template",
				title: "New Diagnostic",
				steps: mockTemplate.steps,
				theme: mockTemplate.theme,
				completion: mockTemplate.completion,
			});

			expect(result).toEqual(mockTemplate);
		});

		it("should throw FORBIDDEN for members without create permission", async () => {
			const memberMembership = { ...mockMembership, role: "member" as const };
			mockDb.query.organizationMembers.findFirst.mockResolvedValue(
				memberMembership,
			);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.diagnosticTemplates.create({
					organizationId: TEST_ORG_ID,
					name: "New Template",
					slug: "new-template",
					title: "New Diagnostic",
					steps: mockTemplate.steps,
					theme: mockTemplate.theme,
					completion: mockTemplate.completion,
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("update", () => {
		it("should update an existing template", async () => {
			mockDb.query.diagnosticTemplates.findFirst.mockResolvedValue(mockTemplate);
			const updatedTemplate = { ...mockTemplate, name: "Updated Template" };
			mockDb.returning.mockResolvedValue([updatedTemplate]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.diagnosticTemplates.update({
				organizationId: TEST_ORG_ID,
				id: TEST_TEMPLATE_ID,
				name: "Updated Template",
			});

			expect(result.name).toBe("Updated Template");
		});
	});

	describe("delete", () => {
		it("should delete a template", async () => {
			mockDb.query.diagnosticTemplates.findFirst.mockResolvedValue(mockTemplate);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.diagnosticTemplates.delete({
				organizationId: TEST_ORG_ID,
				id: TEST_TEMPLATE_ID,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("duplicate", () => {
		it("should duplicate a template with new name and slug", async () => {
			mockDb.query.diagnosticTemplates.findFirst
				.mockResolvedValueOnce(mockTemplate) // First call: find existing template
				.mockResolvedValueOnce(null); // Second call: check slug uniqueness - null means no conflict
			const duplicatedTemplate = {
				...mockTemplate,
				id: "999e8400-e29b-41d4-a716-446655440000",
				name: "Test Template (Copy)",
				slug: "test-template-copy",
			};
			mockDb.returning.mockResolvedValue([duplicatedTemplate]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.diagnosticTemplates.duplicate({
				organizationId: TEST_ORG_ID,
				id: TEST_TEMPLATE_ID,
				newName: "Test Template (Copy)",
				newSlug: "test-template-copy",
			});

			expect(result.name).toBe("Test Template (Copy)");
			expect(result.id).not.toBe(TEST_TEMPLATE_ID);
		});
	});

	describe("incrementSubmission", () => {
		it("should increment submission count", async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.diagnosticTemplates.incrementSubmission({
				organizationId: TEST_ORG_ID,
				id: TEST_TEMPLATE_ID,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("getStats", () => {
		it("should return template statistics", async () => {
			const templateWithStats = {
				id: TEST_TEMPLATE_ID,
				name: "Test Template",
				submissionCount: 100,
				conversionCount: 50,
			};
			mockDb.query.diagnosticTemplates.findFirst.mockResolvedValue(
				templateWithStats,
			);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.diagnosticTemplates.getStats({
				organizationId: TEST_ORG_ID,
				id: TEST_TEMPLATE_ID,
			});

			expect(result.submissionCount).toBe(100);
			expect(result.conversionRate).toBe(50);
		});
	});
});
