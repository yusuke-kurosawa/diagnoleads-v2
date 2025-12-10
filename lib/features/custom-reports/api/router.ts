/**
 * Custom Reports tRPC Router
 * Handles CRUD operations for custom report templates
 */
import { type ReportWidget, customReports } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, or } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

const reportWidgetTypeSchema = z.enum([
  'kpi_card',
  'line_chart',
  'bar_chart',
  'pie_chart',
  'donut_chart',
  'area_chart',
  'funnel',
  'table',
  'text',
  'gauge',
]);

const reportWidgetSchema = z.object({
  id: z.string(),
  type: reportWidgetTypeSchema,
  title: z.string().min(1).max(100),
  dataSource: z.string(),
  config: z.record(z.unknown()),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1).max(12),
    h: z.number().int().min(1).max(12),
  }),
});

const dateRangeSchema = z.enum(['7d', '30d', '90d', 'all']);

const createReportSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  widgets: z.array(reportWidgetSchema).default([]),
  defaultDateRange: dateRangeSchema.default('30d'),
  isPublic: z.boolean().default(false),
});

const updateReportSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  widgets: z.array(reportWidgetSchema).optional(),
  defaultDateRange: dateRangeSchema.optional(),
  isPublic: z.boolean().optional(),
  thumbnail: z.string().optional().nullable(),
});

const listReportsSchema = z.object({
  organizationId: z.string().uuid(),
  includePublic: z.boolean().default(true),
  includePrivate: z.boolean().default(true),
});

const getReportSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const deleteReportSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const duplicateReportSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  newName: z.string().min(1).max(100),
});

// ============================================================================
// Router
// ============================================================================

export const customReportsRouter = router({
  /**
   * List custom reports for the organization
   */
  list: organizationProcedure.input(listReportsSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'レポートを閲覧する権限がありません',
      });
    }

    const conditions = [eq(customReports.organizationId, input.organizationId)];

    // Filter by ownership and visibility
    const visibilityConditions: ReturnType<typeof eq>[] = [];

    if (input.includePublic) {
      visibilityConditions.push(eq(customReports.isPublic, true));
    }

    if (input.includePrivate && ctx.user?.id) {
      visibilityConditions.push(eq(customReports.userId, ctx.user.id));
    }

    if (visibilityConditions.length > 0) {
      conditions.push(or(...visibilityConditions)!);
    }

    const results = await ctx.db.query.customReports.findMany({
      where: and(...conditions),
      orderBy: [desc(customReports.updatedAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return results;
  }),

  /**
   * Get a single custom report
   */
  get: organizationProcedure.input(getReportSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'レポートを閲覧する権限がありません',
      });
    }

    const report = await ctx.db.query.customReports.findFirst({
      where: and(
        eq(customReports.id, input.id),
        eq(customReports.organizationId, input.organizationId)
      ),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'レポートが見つかりません',
      });
    }

    // Check access: public or owner
    if (!report.isPublic && report.userId !== ctx.user?.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'このレポートにアクセスする権限がありません',
      });
    }

    return report;
  }),

  /**
   * Create a new custom report
   */
  create: organizationProcedure.input(createReportSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('create', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'レポートを作成する権限がありません',
      });
    }

    const [report] = await ctx.db
      .insert(customReports)
      .values({
        organizationId: input.organizationId,
        userId: ctx.user?.id,
        name: input.name,
        description: input.description,
        widgets: input.widgets as ReportWidget[],
        defaultDateRange: input.defaultDateRange,
        isPublic: input.isPublic,
      })
      .returning();

    return report;
  }),

  /**
   * Update a custom report
   */
  update: organizationProcedure.input(updateReportSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'レポートを更新する権限がありません',
      });
    }

    const existing = await ctx.db.query.customReports.findFirst({
      where: and(
        eq(customReports.id, input.id),
        eq(customReports.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'レポートが見つかりません',
      });
    }

    // Check ownership
    if (existing.userId !== ctx.user?.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'このレポートを編集する権限がありません',
      });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.widgets !== undefined) updateData.widgets = input.widgets;
    if (input.defaultDateRange !== undefined) updateData.defaultDateRange = input.defaultDateRange;
    if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;
    if (input.thumbnail !== undefined) updateData.thumbnail = input.thumbnail;

    const [updated] = await ctx.db
      .update(customReports)
      .set(updateData)
      .where(
        and(eq(customReports.id, input.id), eq(customReports.organizationId, input.organizationId))
      )
      .returning();

    return updated;
  }),

  /**
   * Delete a custom report
   */
  delete: organizationProcedure.input(deleteReportSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('delete', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'レポートを削除する権限がありません',
      });
    }

    const existing = await ctx.db.query.customReports.findFirst({
      where: and(
        eq(customReports.id, input.id),
        eq(customReports.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'レポートが見つかりません',
      });
    }

    // Check ownership
    if (existing.userId !== ctx.user?.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'このレポートを削除する権限がありません',
      });
    }

    await ctx.db
      .delete(customReports)
      .where(
        and(eq(customReports.id, input.id), eq(customReports.organizationId, input.organizationId))
      );

    return { success: true };
  }),

  /**
   * Duplicate a custom report
   */
  duplicate: organizationProcedure.input(duplicateReportSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('create', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'レポートを作成する権限がありません',
      });
    }

    const existing = await ctx.db.query.customReports.findFirst({
      where: and(
        eq(customReports.id, input.id),
        eq(customReports.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'レポートが見つかりません',
      });
    }

    // Check access: public or owner
    if (!existing.isPublic && existing.userId !== ctx.user?.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'このレポートを複製する権限がありません',
      });
    }

    const [duplicated] = await ctx.db
      .insert(customReports)
      .values({
        organizationId: input.organizationId,
        userId: ctx.user?.id,
        name: input.newName,
        description: existing.description,
        widgets: existing.widgets as ReportWidget[],
        defaultDateRange: existing.defaultDateRange,
        isPublic: false, // Duplicated reports start as private
      })
      .returning();

    return duplicated;
  }),

  /**
   * Get available widget types and their configurations
   */
  getWidgetTypes: organizationProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async () => {
      const widgetTypes = [
        {
          type: 'kpi_card' as const,
          name: 'KPI Card',
          description: 'Display a single metric value with optional comparison',
          dataSources: ['overview.totalLeads', 'overview.conversionRate', 'overview.averageScore'],
          configSchema: {
            metric: { type: 'string', required: true },
            format: { type: 'string', enum: ['number', 'percent', 'currency'] },
            showChange: { type: 'boolean', default: true },
          },
        },
        {
          type: 'line_chart' as const,
          name: 'Line Chart',
          description: 'Display trends over time',
          dataSources: ['leadTrend'],
          configSchema: {
            showConverted: { type: 'boolean', default: true },
          },
        },
        {
          type: 'bar_chart' as const,
          name: 'Bar Chart',
          description: 'Compare values across categories',
          dataSources: ['sourceBreakdown', 'statusBreakdown'],
          configSchema: {
            orientation: { type: 'string', enum: ['vertical', 'horizontal'], default: 'vertical' },
          },
        },
        {
          type: 'pie_chart' as const,
          name: 'Pie Chart',
          description: 'Show proportions of a whole',
          dataSources: ['sourceBreakdown', 'statusBreakdown'],
          configSchema: {
            showLabels: { type: 'boolean', default: true },
          },
        },
        {
          type: 'donut_chart' as const,
          name: 'Donut Chart',
          description: 'Show proportions with center value',
          dataSources: ['sourceBreakdown', 'statusBreakdown'],
          configSchema: {
            centerValue: { type: 'string' },
          },
        },
        {
          type: 'area_chart' as const,
          name: 'Area Chart',
          description: 'Display trends with filled area',
          dataSources: ['leadTrend'],
          configSchema: {
            stacked: { type: 'boolean', default: false },
          },
        },
        {
          type: 'funnel' as const,
          name: 'Funnel Chart',
          description: 'Show conversion stages',
          dataSources: ['conversionFunnel'],
          configSchema: {},
        },
        {
          type: 'table' as const,
          name: 'Data Table',
          description: 'Display data in tabular format',
          dataSources: ['sourceBreakdown', 'statusBreakdown', 'scoreDistribution', 'roi'],
          configSchema: {
            columns: { type: 'array', items: { type: 'string' } },
            pageSize: { type: 'number', default: 10 },
          },
        },
        {
          type: 'text' as const,
          name: 'Text Block',
          description: 'Display custom text or markdown',
          dataSources: [],
          configSchema: {
            content: { type: 'string', required: true },
            format: { type: 'string', enum: ['plain', 'markdown'], default: 'plain' },
          },
        },
        {
          type: 'gauge' as const,
          name: 'Gauge',
          description: 'Display a value on a scale',
          dataSources: ['overview.conversionRate', 'overview.averageScore'],
          configSchema: {
            min: { type: 'number', default: 0 },
            max: { type: 'number', default: 100 },
            thresholds: { type: 'array', items: { type: 'object' } },
          },
        },
      ];

      return { widgetTypes };
    }),
});
