/**
 * Diagnostic Templates tRPC Router
 * Handles CRUD operations for diagnostic form templates
 */
import {
  type DiagnosticCompletion,
  type DiagnosticStep,
  type DiagnosticTheme,
  diagnosticTemplates,
} from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

const questionTypeSchema = z.enum([
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'radio',
  'checkbox',
  'select',
  'date',
  'rating',
  'slider',
  'file',
]);

const questionOptionSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  value: z.string().min(1),
  score: z.number().optional(),
  icon: z.string().optional(),
});

const questionConditionSchema = z.object({
  questionId: z.string(),
  operator: z.enum([
    'equals',
    'not_equals',
    'contains',
    'greater_than',
    'less_than',
    'is_empty',
    'is_not_empty',
  ]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

const questionValidationSchema = z.object({
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  patternMessage: z.string().optional(),
});

const questionSchema = z.object({
  id: z.string(),
  type: questionTypeSchema,
  label: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  placeholder: z.string().max(200).optional(),
  required: z.boolean().default(false),
  options: z.array(questionOptionSchema).optional(),
  validation: questionValidationSchema.optional(),
  conditions: z.array(questionConditionSchema).optional(),
  conditionOperator: z.enum(['and', 'or']).optional(),
  mapToLeadField: z.string().optional(),
  scoreWeight: z.number().min(0).max(100).optional(),
  order: z.number().int().min(0),
});

const stepSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  iconColor: z.string().optional(),
  questions: z.array(questionSchema),
  order: z.number().int().min(0),
});

const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  textColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).optional(),
  customCss: z.string().max(10000).optional(),
});

const completionSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  showScore: z.boolean().default(true),
  redirectUrl: z.string().url().optional(),
  redirectDelay: z.number().int().min(0).max(30).optional(),
  ctaText: z.string().max(50).optional(),
  ctaUrl: z.string().url().optional(),
});

const createTemplateSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  steps: z.array(stepSchema).default([]),
  theme: themeSchema.optional(),
  completion: completionSchema.optional(),
  leadSource: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

const updateTemplateSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  steps: z.array(stepSchema).optional(),
  theme: themeSchema.optional().nullable(),
  completion: completionSchema.optional().nullable(),
  leadSource: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

const listTemplatesSchema = z.object({
  organizationId: z.string().uuid(),
  includeInactive: z.boolean().default(false),
  includeVariants: z.boolean().default(false),
});

const getTemplateSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const getTemplateBySlugSchema = z.object({
  organizationId: z.string().uuid(),
  slug: z.string(),
});

const deleteTemplateSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const duplicateTemplateSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  newName: z.string().min(1).max(100),
  newSlug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
});

const createVariantSchema = z.object({
  organizationId: z.string().uuid(),
  parentTemplateId: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  steps: z.array(stepSchema).optional(),
  theme: themeSchema.optional(),
});

// ============================================================================
// Router
// ============================================================================

export const diagnosticTemplatesRouter = router({
  /**
   * List diagnostic templates
   */
  list: organizationProcedure.input(listTemplatesSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '診断テンプレートを閲覧する権限がありません',
      });
    }

    const conditions = [eq(diagnosticTemplates.organizationId, input.organizationId)];

    if (!input.includeInactive) {
      conditions.push(eq(diagnosticTemplates.isActive, true));
    }

    if (!input.includeVariants) {
      conditions.push(isNull(diagnosticTemplates.parentTemplateId));
    }

    const templates = await ctx.db.query.diagnosticTemplates.findMany({
      where: and(...conditions),
      orderBy: [desc(diagnosticTemplates.isDefault), desc(diagnosticTemplates.updatedAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        variants: input.includeVariants
          ? {
              columns: {
                id: true,
                name: true,
                slug: true,
                version: true,
                submissionCount: true,
                conversionCount: true,
              },
            }
          : undefined,
      },
    });

    return templates;
  }),

  /**
   * Get a single template by ID
   */
  get: organizationProcedure.input(getTemplateSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '診断テンプレートを閲覧する権限がありません',
      });
    }

    const template = await ctx.db.query.diagnosticTemplates.findFirst({
      where: and(
        eq(diagnosticTemplates.id, input.id),
        eq(diagnosticTemplates.organizationId, input.organizationId)
      ),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        variants: {
          columns: {
            id: true,
            name: true,
            slug: true,
            version: true,
            isActive: true,
            submissionCount: true,
            conversionCount: true,
          },
        },
        abTests: true,
      },
    });

    if (!template) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '診断テンプレートが見つかりません',
      });
    }

    return template;
  }),

  /**
   * Get a template by slug (for public access)
   */
  getBySlug: organizationProcedure.input(getTemplateBySlugSchema).query(async ({ ctx, input }) => {
    const template = await ctx.db.query.diagnosticTemplates.findFirst({
      where: and(
        eq(diagnosticTemplates.slug, input.slug),
        eq(diagnosticTemplates.organizationId, input.organizationId),
        eq(diagnosticTemplates.isActive, true)
      ),
    });

    if (!template) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '診断テンプレートが見つかりません',
      });
    }

    return template;
  }),

  /**
   * Create a new template
   */
  create: organizationProcedure.input(createTemplateSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('create', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '診断テンプレートを作成する権限がありません',
      });
    }

    // Check slug uniqueness
    const existing = await ctx.db.query.diagnosticTemplates.findFirst({
      where: and(
        eq(diagnosticTemplates.slug, input.slug),
        eq(diagnosticTemplates.organizationId, input.organizationId)
      ),
    });

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'このスラッグは既に使用されています',
      });
    }

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await ctx.db
        .update(diagnosticTemplates)
        .set({ isDefault: false })
        .where(eq(diagnosticTemplates.organizationId, input.organizationId));
    }

    const [template] = await ctx.db
      .insert(diagnosticTemplates)
      .values({
        organizationId: input.organizationId,
        userId: ctx.user?.id,
        name: input.name,
        slug: input.slug,
        title: input.title,
        description: input.description,
        steps: input.steps as DiagnosticStep[],
        theme: input.theme as DiagnosticTheme,
        completion: input.completion as DiagnosticCompletion,
        leadSource: input.leadSource,
        isActive: input.isActive,
        isDefault: input.isDefault,
      })
      .returning();

    return template;
  }),

  /**
   * Update a template
   */
  update: organizationProcedure.input(updateTemplateSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '診断テンプレートを更新する権限がありません',
      });
    }

    const existing = await ctx.db.query.diagnosticTemplates.findFirst({
      where: and(
        eq(diagnosticTemplates.id, input.id),
        eq(diagnosticTemplates.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '診断テンプレートが見つかりません',
      });
    }

    // Check slug uniqueness if changing
    if (input.slug && input.slug !== existing.slug) {
      const slugExists = await ctx.db.query.diagnosticTemplates.findFirst({
        where: and(
          eq(diagnosticTemplates.slug, input.slug),
          eq(diagnosticTemplates.organizationId, input.organizationId)
        ),
      });

      if (slugExists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'このスラッグは既に使用されています',
        });
      }
    }

    // If setting as default, unset other defaults
    if (input.isDefault && !existing.isDefault) {
      await ctx.db
        .update(diagnosticTemplates)
        .set({ isDefault: false })
        .where(eq(diagnosticTemplates.organizationId, input.organizationId));
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.steps !== undefined) updateData.steps = input.steps;
    if (input.theme !== undefined) updateData.theme = input.theme;
    if (input.completion !== undefined) updateData.completion = input.completion;
    if (input.leadSource !== undefined) updateData.leadSource = input.leadSource;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

    const [updated] = await ctx.db
      .update(diagnosticTemplates)
      .set(updateData)
      .where(
        and(
          eq(diagnosticTemplates.id, input.id),
          eq(diagnosticTemplates.organizationId, input.organizationId)
        )
      )
      .returning();

    return updated;
  }),

  /**
   * Delete a template
   */
  delete: organizationProcedure.input(deleteTemplateSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('delete', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '診断テンプレートを削除する権限がありません',
      });
    }

    const existing = await ctx.db.query.diagnosticTemplates.findFirst({
      where: and(
        eq(diagnosticTemplates.id, input.id),
        eq(diagnosticTemplates.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '診断テンプレートが見つかりません',
      });
    }

    await ctx.db
      .delete(diagnosticTemplates)
      .where(
        and(
          eq(diagnosticTemplates.id, input.id),
          eq(diagnosticTemplates.organizationId, input.organizationId)
        )
      );

    return { success: true };
  }),

  /**
   * Duplicate a template
   */
  duplicate: organizationProcedure
    .input(duplicateTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can('create', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '診断テンプレートを作成する権限がありません',
        });
      }

      const existing = await ctx.db.query.diagnosticTemplates.findFirst({
        where: and(
          eq(diagnosticTemplates.id, input.id),
          eq(diagnosticTemplates.organizationId, input.organizationId)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '診断テンプレートが見つかりません',
        });
      }

      // Check new slug uniqueness
      const slugExists = await ctx.db.query.diagnosticTemplates.findFirst({
        where: and(
          eq(diagnosticTemplates.slug, input.newSlug),
          eq(diagnosticTemplates.organizationId, input.organizationId)
        ),
      });

      if (slugExists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'このスラッグは既に使用されています',
        });
      }

      const [duplicated] = await ctx.db
        .insert(diagnosticTemplates)
        .values({
          organizationId: input.organizationId,
          userId: ctx.user?.id,
          name: input.newName,
          slug: input.newSlug,
          title: existing.title,
          description: existing.description,
          steps: existing.steps as DiagnosticStep[],
          theme: existing.theme as DiagnosticTheme,
          completion: existing.completion as DiagnosticCompletion,
          leadSource: existing.leadSource,
          isActive: false, // Start as inactive
          isDefault: false,
        })
        .returning();

      return duplicated;
    }),

  /**
   * Create a variant for A/B testing
   */
  createVariant: organizationProcedure
    .input(createVariantSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can('create', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '診断テンプレートを作成する権限がありません',
        });
      }

      const parent = await ctx.db.query.diagnosticTemplates.findFirst({
        where: and(
          eq(diagnosticTemplates.id, input.parentTemplateId),
          eq(diagnosticTemplates.organizationId, input.organizationId)
        ),
      });

      if (!parent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '親テンプレートが見つかりません',
        });
      }

      // Check slug uniqueness
      const slugExists = await ctx.db.query.diagnosticTemplates.findFirst({
        where: and(
          eq(diagnosticTemplates.slug, input.slug),
          eq(diagnosticTemplates.organizationId, input.organizationId)
        ),
      });

      if (slugExists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'このスラッグは既に使用されています',
        });
      }

      // Get next version number
      const variants = await ctx.db.query.diagnosticTemplates.findMany({
        where: eq(diagnosticTemplates.parentTemplateId, input.parentTemplateId),
        columns: { version: true },
      });
      const nextVersion = Math.max(parent.version, ...variants.map((v) => v.version)) + 1;

      const [variant] = await ctx.db
        .insert(diagnosticTemplates)
        .values({
          organizationId: input.organizationId,
          userId: ctx.user?.id,
          name: input.name,
          slug: input.slug,
          title: parent.title,
          description: parent.description,
          steps: (input.steps || parent.steps) as DiagnosticStep[],
          theme: (input.theme || parent.theme) as DiagnosticTheme,
          completion: parent.completion as DiagnosticCompletion,
          leadSource: parent.leadSource,
          isActive: true,
          isDefault: false,
          parentTemplateId: input.parentTemplateId,
          version: nextVersion,
        })
        .returning();

      return variant;
    }),

  /**
   * Increment submission count
   */
  incrementSubmission: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        id: z.string().uuid(),
        converted: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(diagnosticTemplates)
        .set({
          submissionCount: sql`${diagnosticTemplates.submissionCount} + 1`,
          conversionCount: input.converted
            ? sql`${diagnosticTemplates.conversionCount} + 1`
            : diagnosticTemplates.conversionCount,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(diagnosticTemplates.id, input.id),
            eq(diagnosticTemplates.organizationId, input.organizationId)
          )
        );

      return { success: true };
    }),

  /**
   * Get template stats
   */
  getStats: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.ability.can('read', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '診断テンプレートを閲覧する権限がありません',
        });
      }

      const template = await ctx.db.query.diagnosticTemplates.findFirst({
        where: and(
          eq(diagnosticTemplates.id, input.id),
          eq(diagnosticTemplates.organizationId, input.organizationId)
        ),
        columns: {
          id: true,
          name: true,
          submissionCount: true,
          conversionCount: true,
        },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '診断テンプレートが見つかりません',
        });
      }

      const conversionRate =
        template.submissionCount > 0
          ? (template.conversionCount / template.submissionCount) * 100
          : 0;

      return {
        ...template,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    }),
});
