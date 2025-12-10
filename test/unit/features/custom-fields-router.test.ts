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

describe("Custom Fields Router", () => {
	const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
	const TEST_ORG_ID = "660e8400-e29b-41d4-a716-446655440000";
	const TEST_MEMBER_ID = "770e8400-e29b-41d4-a716-446655440000";
	const TEST_FIELD_ID = "880e8400-e29b-41d4-a716-446655440000";

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

	const mockCustomField = {
		id: TEST_FIELD_ID,
		organizationId: TEST_ORG_ID,
		name: "Industry",
		key: "industry",
		fieldType: "select" as const,
		description: "The industry of the lead",
		options: [
			{ value: "tech", label: "Technology" },
			{ value: "finance", label: "Finance" },
			{ value: "healthcare", label: "Healthcare" },
		],
		defaultValue: null,
		validation: null,
		isRequired: false,
		isActive: true,
		displayOrder: 1,
		showInTable: false,
		showInForm: true,
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
				customFields: {
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
		it("should return list of custom fields", async () => {
			mockDb.query.customFields.findMany.mockResolvedValue([mockCustomField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.list({
				organizationId: TEST_ORG_ID,
			});

			expect(result).toEqual([mockCustomField]);
		});

		it("should filter by activeOnly status", async () => {
			mockDb.query.customFields.findMany.mockResolvedValue([mockCustomField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.list({
				organizationId: TEST_ORG_ID,
				activeOnly: true,
			});

			expect(result[0].isActive).toBe(true);
		});

		it("should return fields ordered by displayOrder", async () => {
			const fields = [
				{ ...mockCustomField, displayOrder: 2 },
				{ ...mockCustomField, id: "field-2", displayOrder: 1 },
			];
			mockDb.query.customFields.findMany.mockResolvedValue(fields);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.list({
				organizationId: TEST_ORG_ID,
			});

			expect(result).toHaveLength(2);
		});
	});

	describe("get", () => {
		it("should return a custom field by ID", async () => {
			mockDb.query.customFields.findFirst.mockResolvedValue(mockCustomField);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.get({
				organizationId: TEST_ORG_ID,
				id: TEST_FIELD_ID,
			});

			expect(result).toEqual(mockCustomField);
		});

		it("should throw NOT_FOUND for non-existent field", async () => {
			mockDb.query.customFields.findFirst.mockResolvedValue(null);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.customFields.get({
					organizationId: TEST_ORG_ID,
					id: TEST_FIELD_ID,
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("create", () => {
		it("should create a text field", async () => {
			const textField = {
				...mockCustomField,
				fieldType: "text" as const,
				options: [],
			};
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ max: 0 }]),
				}),
			});
			mockDb.returning.mockResolvedValue([textField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.create({
				organizationId: TEST_ORG_ID,
				name: "Notes",
				key: "notes",
				fieldType: "text",
			});

			expect(result.fieldType).toBe("text");
		});

		it("should create a number field", async () => {
			const numberField = {
				...mockCustomField,
				fieldType: "number" as const,
				options: [],
			};
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ max: 0 }]),
				}),
			});
			mockDb.returning.mockResolvedValue([numberField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.create({
				organizationId: TEST_ORG_ID,
				name: "Budget",
				key: "budget",
				fieldType: "number",
			});

			expect(result.fieldType).toBe("number");
		});

		it("should create a select field with options", async () => {
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ max: 0 }]),
				}),
			});
			mockDb.returning.mockResolvedValue([mockCustomField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.create({
				organizationId: TEST_ORG_ID,
				name: "Industry",
				key: "industry",
				fieldType: "select",
				options: mockCustomField.options,
			});

			expect(result.fieldType).toBe("select");
			expect(result.options).toHaveLength(3);
		});

		it("should create a date field", async () => {
			const dateField = {
				...mockCustomField,
				fieldType: "date" as const,
				options: [],
			};
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ max: 0 }]),
				}),
			});
			mockDb.returning.mockResolvedValue([dateField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.create({
				organizationId: TEST_ORG_ID,
				name: "Contract Date",
				key: "contract_date",
				fieldType: "date",
			});

			expect(result.fieldType).toBe("date");
		});

		it("should create a boolean field", async () => {
			const booleanField = {
				...mockCustomField,
				fieldType: "boolean" as const,
				options: [],
			};
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ max: 0 }]),
				}),
			});
			mockDb.returning.mockResolvedValue([booleanField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.create({
				organizationId: TEST_ORG_ID,
				name: "Is Enterprise",
				key: "is_enterprise",
				fieldType: "boolean",
			});

			expect(result.fieldType).toBe("boolean");
		});

		it("should reject duplicate key within organization", async () => {
			mockDb.query.customFields.findFirst.mockResolvedValue(mockCustomField);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);

			await expect(
				caller.customFields.create({
					organizationId: TEST_ORG_ID,
					name: "Another Industry",
					key: "industry", // duplicate key
					fieldType: "text",
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("update", () => {
		it("should update a custom field", async () => {
			mockDb.query.customFields.findFirst.mockResolvedValue(mockCustomField);
			const updatedField = { ...mockCustomField, name: "Updated Field" };
			mockDb.returning.mockResolvedValue([updatedField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.update({
				organizationId: TEST_ORG_ID,
				id: TEST_FIELD_ID,
				name: "Updated Field",
			});

			expect(result.name).toBe("Updated Field");
		});

		it("should update options for select field", async () => {
			mockDb.query.customFields.findFirst.mockResolvedValue(mockCustomField);
			const newOptions = [
				{ value: "retail", label: "Retail" },
				{ value: "manufacturing", label: "Manufacturing" },
			];
			const updatedField = { ...mockCustomField, options: newOptions };
			mockDb.returning.mockResolvedValue([updatedField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.update({
				organizationId: TEST_ORG_ID,
				id: TEST_FIELD_ID,
				options: newOptions,
			});

			expect(result.options).toEqual(newOptions);
		});

		it("should update isRequired", async () => {
			mockDb.query.customFields.findFirst.mockResolvedValue(mockCustomField);
			const updatedField = { ...mockCustomField, isRequired: true };
			mockDb.returning.mockResolvedValue([updatedField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.update({
				organizationId: TEST_ORG_ID,
				id: TEST_FIELD_ID,
				isRequired: true,
			});

			expect(result.isRequired).toBe(true);
		});
	});

	describe("delete", () => {
		it("should delete a custom field", async () => {
			mockDb.query.customFields.findFirst.mockResolvedValue(mockCustomField);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.delete({
				organizationId: TEST_ORG_ID,
				id: TEST_FIELD_ID,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("reorder", () => {
		it("should reorder custom fields", async () => {
			const fieldIds = [
				"111e8400-e29b-41d4-a716-446655440000",
				TEST_FIELD_ID,
				"222e8400-e29b-41d4-a716-446655440000",
			];

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.reorder({
				organizationId: TEST_ORG_ID,
				fieldIds,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("toggleActive", () => {
		it("should activate an inactive field", async () => {
			const inactiveField = { ...mockCustomField, isActive: false };
			mockDb.query.customFields.findFirst.mockResolvedValue(inactiveField);
			const activatedField = { ...mockCustomField, isActive: true };
			mockDb.returning.mockResolvedValue([activatedField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.toggleActive({
				organizationId: TEST_ORG_ID,
				id: TEST_FIELD_ID,
			});

			expect(result.isActive).toBe(true);
		});

		it("should deactivate an active field", async () => {
			mockDb.query.customFields.findFirst.mockResolvedValue(mockCustomField);
			const deactivatedField = { ...mockCustomField, isActive: false };
			mockDb.returning.mockResolvedValue([deactivatedField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.toggleActive({
				organizationId: TEST_ORG_ID,
				id: TEST_FIELD_ID,
			});

			expect(result.isActive).toBe(false);
		});
	});

	describe("field type validation", () => {
		it("should validate text field max length", async () => {
			const textField = {
				...mockCustomField,
				fieldType: "text" as const,
				options: [],
				validation: { maxLength: 100 },
			};
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ max: 0 }]),
				}),
			});
			mockDb.returning.mockResolvedValue([textField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.create({
				organizationId: TEST_ORG_ID,
				name: "Short Text",
				key: "short_text",
				fieldType: "text",
				validation: { maxLength: 100 },
			});

			expect(result.validation?.maxLength).toBe(100);
		});

		it("should validate number field min/max", async () => {
			const numberField = {
				...mockCustomField,
				fieldType: "number" as const,
				options: [],
				validation: { min: 0, max: 1000000 },
			};
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([{ max: 0 }]),
				}),
			});
			mockDb.returning.mockResolvedValue([numberField]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const caller = appRouter.createCaller(mockContext as any);
			const result = await caller.customFields.create({
				organizationId: TEST_ORG_ID,
				name: "Budget",
				key: "budget_field",
				fieldType: "number",
				validation: { min: 0, max: 1000000 },
			});

			expect(result.validation?.min).toBe(0);
			expect(result.validation?.max).toBe(1000000);
		});
	});
});
