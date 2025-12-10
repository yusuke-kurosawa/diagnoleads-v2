/**
 * Custom Fields tRPC Router
 * Handles CRUD operations for custom field definitions
 */
import { type CustomFieldOption, type CustomFieldType, customFields } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

// Schemas
const fieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  color: z.string().optional(),
});

const createFieldSchema = z.object({
  organizationId: z.string().uuid(),
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z][a-z0-9_]*$/, {
      message: 'キーは小文字英字で始まり、英数字とアンダースコアのみ使用できます',
    }),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  fieldType: z.enum([
    'text',
    'number',
    'date',
    'datetime',
    'boolean',
    'select',
    'multiselect',
    'url',
    'email',
    'phone',
  ]),
  options: z.array(fieldOptionSchema).default([]),
  isRequired: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  validation: z.record(z.unknown()).optional(),
  showInTable: z.boolean().default(false),
  showInForm: z.boolean().default(true),
});

const updateFieldSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  options: z.array(fieldOptionSchema).optional(),
  isRequired: z.boolean().optional(),
  defaultValue: z.unknown().optional().nullable(),
  validation: z.record(z.unknown()).optional().nullable(),
  displayOrder: z.number().min(0).optional(),
  showInTable: z.boolean().optional(),
  showInForm: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const listFieldsSchema = z.object({
  organizationId: z.string().uuid(),
  activeOnly: z.boolean().default(true),
  showInTable: z.boolean().optional(),
  showInForm: z.boolean().optional(),
});

const getFieldSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const deleteFieldSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const reorderFieldsSchema = z.object({
  organizationId: z.string().uuid(),
  fieldIds: z.array(z.string().uuid()),
});

export const customFieldsRouter = router({
  /**
   * List custom fields for an organization
   */
  list: organizationProcedure.input(listFieldsSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'カスタムフィールドを閲覧する権限がありません',
      });
    }

    const conditions = [eq(customFields.organizationId, input.organizationId)];

    if (input.activeOnly) {
      conditions.push(eq(customFields.isActive, true));
    }

    if (input.showInTable !== undefined) {
      conditions.push(eq(customFields.showInTable, input.showInTable));
    }

    if (input.showInForm !== undefined) {
      conditions.push(eq(customFields.showInForm, input.showInForm));
    }

    const results = await ctx.db.query.customFields.findMany({
      where: and(...conditions),
      orderBy: [asc(customFields.displayOrder), asc(customFields.createdAt)],
    });

    return results;
  }),

  /**
   * Get a single custom field
   */
  get: organizationProcedure.input(getFieldSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'カスタムフィールドを閲覧する権限がありません',
      });
    }

    const field = await ctx.db.query.customFields.findFirst({
      where: and(
        eq(customFields.id, input.id),
        eq(customFields.organizationId, input.organizationId)
      ),
    });

    if (!field) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'カスタムフィールドが見つかりません',
      });
    }

    return field;
  }),

  /**
   * Create a new custom field
   */
  create: organizationProcedure.input(createFieldSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('create', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'カスタムフィールドを作成する権限がありません',
      });
    }

    // Check if key already exists
    const existing = await ctx.db.query.customFields.findFirst({
      where: and(
        eq(customFields.organizationId, input.organizationId),
        eq(customFields.key, input.key)
      ),
    });

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: `キー "${input.key}" は既に使用されています`,
      });
    }

    // Validate options for select/multiselect fields
    if (
      (input.fieldType === 'select' || input.fieldType === 'multiselect') &&
      input.options.length === 0
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '選択フィールドには少なくとも1つのオプションが必要です',
      });
    }

    // Get max display order
    const [maxOrder] = await ctx.db
      .select({ max: sql<number>`coalesce(max(display_order), -1)::int` })
      .from(customFields)
      .where(eq(customFields.organizationId, input.organizationId));

    const [field] = await ctx.db
      .insert(customFields)
      .values({
        organizationId: input.organizationId,
        key: input.key,
        name: input.name,
        description: input.description,
        fieldType: input.fieldType,
        options: input.options as CustomFieldOption[],
        isRequired: input.isRequired,
        defaultValue: input.defaultValue,
        validation: input.validation,
        displayOrder: (maxOrder?.max ?? -1) + 1,
        showInTable: input.showInTable,
        showInForm: input.showInForm,
      })
      .returning();

    return field;
  }),

  /**
   * Update a custom field
   */
  update: organizationProcedure.input(updateFieldSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'カスタムフィールドを更新する権限がありません',
      });
    }

    const existing = await ctx.db.query.customFields.findFirst({
      where: and(
        eq(customFields.id, input.id),
        eq(customFields.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'カスタムフィールドが見つかりません',
      });
    }

    // Validate options for select/multiselect fields
    if (input.options !== undefined) {
      const fieldType = existing.fieldType;
      if ((fieldType === 'select' || fieldType === 'multiselect') && input.options.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '選択フィールドには少なくとも1つのオプションが必要です',
        });
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.options !== undefined) updateData.options = input.options;
    if (input.isRequired !== undefined) updateData.isRequired = input.isRequired;
    if (input.defaultValue !== undefined) updateData.defaultValue = input.defaultValue;
    if (input.validation !== undefined) updateData.validation = input.validation;
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
    if (input.showInTable !== undefined) updateData.showInTable = input.showInTable;
    if (input.showInForm !== undefined) updateData.showInForm = input.showInForm;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const [updated] = await ctx.db
      .update(customFields)
      .set(updateData)
      .where(
        and(eq(customFields.id, input.id), eq(customFields.organizationId, input.organizationId))
      )
      .returning();

    return updated;
  }),

  /**
   * Delete a custom field
   */
  delete: organizationProcedure.input(deleteFieldSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('delete', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'カスタムフィールドを削除する権限がありません',
      });
    }

    const existing = await ctx.db.query.customFields.findFirst({
      where: and(
        eq(customFields.id, input.id),
        eq(customFields.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'カスタムフィールドが見つかりません',
      });
    }

    await ctx.db
      .delete(customFields)
      .where(
        and(eq(customFields.id, input.id), eq(customFields.organizationId, input.organizationId))
      );

    return { success: true };
  }),

  /**
   * Reorder custom fields
   */
  reorder: organizationProcedure.input(reorderFieldsSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'カスタムフィールドを並べ替える権限がありません',
      });
    }

    // Update display order for each field
    await Promise.all(
      input.fieldIds.map((id, index) =>
        ctx.db
          .update(customFields)
          .set({ displayOrder: index, updatedAt: new Date() })
          .where(
            and(eq(customFields.id, id), eq(customFields.organizationId, input.organizationId))
          )
      )
    );

    return { success: true };
  }),

  /**
   * Toggle field active status
   */
  toggleActive: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can('update', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'カスタムフィールドを更新する権限がありません',
        });
      }

      const existing = await ctx.db.query.customFields.findFirst({
        where: and(
          eq(customFields.id, input.id),
          eq(customFields.organizationId, input.organizationId)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'カスタムフィールドが見つかりません',
        });
      }

      const [updated] = await ctx.db
        .update(customFields)
        .set({
          isActive: !existing.isActive,
          updatedAt: new Date(),
        })
        .where(
          and(eq(customFields.id, input.id), eq(customFields.organizationId, input.organizationId))
        )
        .returning();

      return updated;
    }),
});
