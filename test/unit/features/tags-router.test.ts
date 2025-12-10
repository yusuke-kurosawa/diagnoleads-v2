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

describe("Tags Router", () => {
	const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
	const TEST_ORG_ID = "660e8400-e29b-41d4-a716-446655440000";
	const TEST_MEMBER_ID = "770e8400-e29b-41d4-a716-446655440000";
	const TEST_TAG_ID = "880e8400-e29b-41d4-a716-446655440000";
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

	const mockTag = {
		id: TEST_TAG_ID,
		organizationId: TEST_ORG_ID,
		name: "Hot Lead",
		color: "#EF4444",
		description: "High priority lead",
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
				tags: {
					findFirst: vi.fn(),
					findMany: vi.fn(),
				},
				leadTags: {
					findFirst: vi.fn(),
					findMany: vi.fn(),
				},
				leads: {
					findFirst: vi.fn(),
				},
			},
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			orderBy: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			offset: vi.fn().mockReturnThis(),
			groupBy: vi.fn().mockReturnThis(),
			innerJoin: vi.fn().mockReturnThis(),
			leftJoin: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			values: vi.fn().mockReturnThis(),
			returning: vi.fn(),
			update: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			onConflictDoNothing: vi.fn().mockReturnThis(),
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
		it("should return list of tags", async () => {
			mockDb.query.tags.findMany.mockResolvedValue([mockTag]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.list({
				organizationId: TEST_ORG_ID,
			});

			expect(result).toEqual([mockTag]);
		});

		it("should return empty array when no tags exist", async () => {
			mockDb.query.tags.findMany.mockResolvedValue([]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.list({
				organizationId: TEST_ORG_ID,
			});

			expect(result).toEqual([]);
		});
	});

	describe("get", () => {
		it("should return a tag by ID", async () => {
			mockDb.query.tags.findFirst.mockResolvedValue(mockTag);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.get({
				organizationId: TEST_ORG_ID,
				id: TEST_TAG_ID,
			});

			expect(result).toEqual(mockTag);
		});

		it("should throw NOT_FOUND for non-existent tag", async () => {
			mockDb.query.tags.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.tags.get({
					organizationId: TEST_ORG_ID,
					id: TEST_TAG_ID,
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("create", () => {
		it("should create a new tag", async () => {
			mockDb.returning.mockResolvedValue([mockTag]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.create({
				organizationId: TEST_ORG_ID,
				name: "New Tag",
				color: "#3B82F6",
			});

			expect(result).toEqual(mockTag);
		});

		it("should create tag with description", async () => {
			const tagWithDesc = { ...mockTag, description: "A new tag" };
			mockDb.returning.mockResolvedValue([tagWithDesc]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.create({
				organizationId: TEST_ORG_ID,
				name: "New Tag",
				color: "#3B82F6",
				description: "A new tag",
			});

			expect(result.description).toBe("A new tag");
		});
	});

	describe("update", () => {
		it("should update a tag", async () => {
			mockDb.query.tags.findFirst.mockResolvedValue(mockTag);
			const updatedTag = { ...mockTag, name: "Updated Tag" };
			mockDb.returning.mockResolvedValue([updatedTag]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.update({
				organizationId: TEST_ORG_ID,
				id: TEST_TAG_ID,
				name: "Updated Tag",
			});

			expect(result.name).toBe("Updated Tag");
		});

		it("should update tag color", async () => {
			mockDb.query.tags.findFirst.mockResolvedValue(mockTag);
			const updatedTag = { ...mockTag, color: "#22C55E" };
			mockDb.returning.mockResolvedValue([updatedTag]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.update({
				organizationId: TEST_ORG_ID,
				id: TEST_TAG_ID,
				color: "#22C55E",
			});

			expect(result.color).toBe("#22C55E");
		});
	});

	describe("delete", () => {
		it("should delete a tag", async () => {
			mockDb.query.tags.findFirst.mockResolvedValue(mockTag);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.delete({
				organizationId: TEST_ORG_ID,
				id: TEST_TAG_ID,
			});

			expect(result.success).toBe(true);
		});

		it("should delete associated lead-tag relations", async () => {
			mockDb.query.tags.findFirst.mockResolvedValue(mockTag);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			await caller.tags.delete({
				organizationId: TEST_ORG_ID,
				id: TEST_TAG_ID,
			});

			expect(mockDb.delete).toHaveBeenCalled();
		});
	});

	describe("addToLead", () => {
		it("should add a tag to a lead", async () => {
			mockDb.query.tags.findFirst.mockResolvedValue(mockTag);
			mockDb.query.leads.findFirst.mockResolvedValue({ id: TEST_LEAD_ID });

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.addToLead({
				organizationId: TEST_ORG_ID,
				tagId: TEST_TAG_ID,
				leadId: TEST_LEAD_ID,
			});

			expect(result.success).toBe(true);
		});

		it("should throw NOT_FOUND for non-existent tag", async () => {
			mockDb.query.tags.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.tags.addToLead({
					organizationId: TEST_ORG_ID,
					tagId: TEST_TAG_ID,
					leadId: TEST_LEAD_ID,
				}),
			).rejects.toThrow(TRPCError);
		});

		it("should throw NOT_FOUND for non-existent lead", async () => {
			mockDb.query.tags.findFirst.mockResolvedValue(mockTag);
			mockDb.query.leads.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.tags.addToLead({
					organizationId: TEST_ORG_ID,
					tagId: TEST_TAG_ID,
					leadId: TEST_LEAD_ID,
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("removeFromLead", () => {
		it("should remove a tag from a lead", async () => {
			mockDb.query.tags.findFirst.mockResolvedValue(mockTag);
			mockDb.query.leads.findFirst.mockResolvedValue({ id: TEST_LEAD_ID });

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.removeFromLead({
				organizationId: TEST_ORG_ID,
				tagId: TEST_TAG_ID,
				leadId: TEST_LEAD_ID,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("getLeadTags", () => {
		it("should return tags for a lead", async () => {
			mockDb.query.leads.findFirst.mockResolvedValue({ id: TEST_LEAD_ID });
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([{ tags: mockTag }]),
					}),
				}),
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.getLeadTags({
				organizationId: TEST_ORG_ID,
				leadId: TEST_LEAD_ID,
			});

			expect(Array.isArray(result)).toBe(true);
		});

		it("should return empty array for lead with no tags", async () => {
			mockDb.query.leads.findFirst.mockResolvedValue({ id: TEST_LEAD_ID });
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([]),
					}),
				}),
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.getLeadTags({
				organizationId: TEST_ORG_ID,
				leadId: TEST_LEAD_ID,
			});

			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("bulkAddToLeads", () => {
		it("should add a tag to multiple leads", async () => {
			mockDb.query.tags.findFirst.mockResolvedValue(mockTag);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.bulkAddToLeads({
				organizationId: TEST_ORG_ID,
				tagId: TEST_TAG_ID,
				leadIds: [TEST_LEAD_ID, "222e8400-e29b-41d4-a716-446655440000"],
			});

			expect(result.success).toBe(true);
		});
	});

	describe("bulkRemoveFromLeads", () => {
		it("should remove a tag from multiple leads", async () => {
			mockDb.query.tags.findFirst.mockResolvedValue(mockTag);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.tags.bulkRemoveFromLeads({
				organizationId: TEST_ORG_ID,
				tagId: TEST_TAG_ID,
				leadIds: [TEST_LEAD_ID, "222e8400-e29b-41d4-a716-446655440000"],
			});

			expect(result.success).toBe(true);
		});
	});
});
