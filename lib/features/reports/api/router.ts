/**
 * Scheduled Reports tRPC Router
 * Handles CRUD operations for scheduled reports
 */
import {
  type ReportConfig,
  type ReportDeliveryStatus,
  type ReportFormat,
  type ReportFrequency,
  type ReportStatus,
  type ReportType,
  reportHistory,
  scheduledReports,
} from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { addDays, addMonths, addWeeks, setDay, setHours, startOfDay } from 'date-fns';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

// Schemas
const reportConfigSchema = z.object({
  includeStatusBreakdown: z.boolean().optional(),
  includeSourceAnalysis: z.boolean().optional(),
  includeConversionFunnel: z.boolean().optional(),
  includeScoreDistribution: z.boolean().optional(),
  includeRecentLeads: z.boolean().optional(),
  recentLeadsCount: z.number().min(1).max(100).optional(),
  dateRangeDays: z.number().min(1).max(365).optional(),
  filters: z
    .object({
      status: z.array(z.string()).optional(),
      source: z.array(z.string()).optional(),
      minScore: z.number().min(0).max(100).optional(),
      maxScore: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

const createReportSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  reportType: z.enum([
    'lead_summary',
    'conversion_analysis',
    'source_performance',
    'team_performance',
    'custom',
  ]),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(28).optional(),
  sendHour: z.number().min(0).max(23),
  timezone: z.string().default('Asia/Tokyo'),
  format: z.enum(['pdf', 'csv', 'excel']),
  recipients: z.string().min(1), // comma-separated emails
  config: reportConfigSchema.optional(),
});

const updateReportSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  reportType: z
    .enum([
      'lead_summary',
      'conversion_analysis',
      'source_performance',
      'team_performance',
      'custom',
    ])
    .optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(28).optional(),
  sendHour: z.number().min(0).max(23).optional(),
  timezone: z.string().optional(),
  format: z.enum(['pdf', 'csv', 'excel']).optional(),
  recipients: z.string().min(1).optional(),
  config: reportConfigSchema.optional(),
  status: z.enum(['active', 'paused', 'disabled']).optional(),
});

const listReportsSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(['active', 'paused', 'disabled', 'all']).default('all'),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const getReportSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const deleteReportSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const getHistorySchema = z.object({
  organizationId: z.string().uuid(),
  reportId: z.string().uuid(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

/**
 * Calculate next scheduled date based on frequency
 */
function calculateNextScheduledDate(
  frequency: ReportFrequency,
  sendHour: number,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
  timezone?: string
): Date {
  const now = new Date();
  let nextDate: Date;

  switch (frequency) {
    case 'daily':
      nextDate = setHours(startOfDay(addDays(now, 1)), sendHour);
      break;
    case 'weekly':
      nextDate = setHours(setDay(startOfDay(addWeeks(now, 1)), dayOfWeek ?? 1), sendHour);
      break;
    case 'monthly':
      const nextMonth = addMonths(now, 1);
      nextDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), dayOfMonth ?? 1, sendHour);
      break;
    case 'quarterly':
      const nextQuarter = addMonths(now, 3);
      nextDate = new Date(
        nextQuarter.getFullYear(),
        nextQuarter.getMonth(),
        dayOfMonth ?? 1,
        sendHour
      );
      break;
    default:
      nextDate = addDays(now, 1);
  }

  return nextDate;
}

export const reportsRouter = router({
  /**
   * List scheduled reports for an organization
   */
  list: organizationProcedure.input(listReportsSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'レポートを閲覧する権限がありません',
      });
    }

    const conditions = [eq(scheduledReports.organizationId, input.organizationId)];

    if (input.status !== 'all') {
      conditions.push(eq(scheduledReports.status, input.status));
    }

    const results = await ctx.db.query.scheduledReports.findMany({
      where: and(...conditions),
      orderBy: [desc(scheduledReports.createdAt)],
      limit: input.limit,
      offset: input.offset,
      with: {
        createdBy: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const totalCount = await ctx.db
      .select({ count: scheduledReports.id })
      .from(scheduledReports)
      .where(and(...conditions));

    return {
      items: results,
      total: totalCount.length,
      limit: input.limit,
      offset: input.offset,
    };
  }),

  /**
   * Get a single scheduled report
   */
  get: organizationProcedure.input(getReportSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'レポートを閲覧する権限がありません',
      });
    }

    const report = await ctx.db.query.scheduledReports.findFirst({
      where: and(
        eq(scheduledReports.id, input.id),
        eq(scheduledReports.organizationId, input.organizationId)
      ),
      with: {
        createdBy: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        history: {
          limit: 5,
          orderBy: [desc(reportHistory.createdAt)],
        },
      },
    });

    if (!report) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'レポートが見つかりません',
      });
    }

    return report;
  }),

  /**
   * Create a new scheduled report
   */
  create: organizationProcedure.input(createReportSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('create', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'レポートを作成する権限がありません',
      });
    }

    // Validate email recipients
    const emails = input.recipients.split(',').map((e) => e.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `無効なメールアドレス: ${email}`,
        });
      }
    }

    const nextScheduledAt = calculateNextScheduledDate(
      input.frequency,
      input.sendHour,
      input.dayOfWeek,
      input.dayOfMonth,
      input.timezone
    );

    const [report] = await ctx.db
      .insert(scheduledReports)
      .values({
        organizationId: input.organizationId,
        createdById: ctx.session.user.id,
        name: input.name,
        description: input.description,
        reportType: input.reportType,
        frequency: input.frequency,
        dayOfWeek: input.dayOfWeek,
        dayOfMonth: input.dayOfMonth,
        sendHour: input.sendHour,
        timezone: input.timezone,
        format: input.format,
        recipients: input.recipients,
        config: input.config as ReportConfig,
        nextScheduledAt,
      })
      .returning();

    return report;
  }),

  /**
   * Update a scheduled report
   */
  update: organizationProcedure.input(updateReportSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'レポートを更新する権限がありません',
      });
    }

    const existing = await ctx.db.query.scheduledReports.findFirst({
      where: and(
        eq(scheduledReports.id, input.id),
        eq(scheduledReports.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'レポートが見つかりません',
      });
    }

    // Validate email recipients if provided
    if (input.recipients) {
      const emails = input.recipients.split(',').map((e) => e.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of emails) {
        if (!emailRegex.test(email)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `無効なメールアドレス: ${email}`,
          });
        }
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.reportType !== undefined) updateData.reportType = input.reportType;
    if (input.frequency !== undefined) updateData.frequency = input.frequency;
    if (input.dayOfWeek !== undefined) updateData.dayOfWeek = input.dayOfWeek;
    if (input.dayOfMonth !== undefined) updateData.dayOfMonth = input.dayOfMonth;
    if (input.sendHour !== undefined) updateData.sendHour = input.sendHour;
    if (input.timezone !== undefined) updateData.timezone = input.timezone;
    if (input.format !== undefined) updateData.format = input.format;
    if (input.recipients !== undefined) updateData.recipients = input.recipients;
    if (input.config !== undefined) updateData.config = input.config;
    if (input.status !== undefined) updateData.status = input.status;

    // Recalculate next scheduled date if schedule changed
    if (input.frequency || input.sendHour || input.dayOfWeek || input.dayOfMonth) {
      const frequency = input.frequency ?? existing.frequency;
      const sendHour = input.sendHour ?? existing.sendHour;
      const dayOfWeek = input.dayOfWeek ?? existing.dayOfWeek;
      const dayOfMonth = input.dayOfMonth ?? existing.dayOfMonth;
      const timezone = input.timezone ?? existing.timezone;

      updateData.nextScheduledAt = calculateNextScheduledDate(
        frequency,
        sendHour,
        dayOfWeek,
        dayOfMonth,
        timezone
      );
    }

    const [updated] = await ctx.db
      .update(scheduledReports)
      .set(updateData)
      .where(
        and(
          eq(scheduledReports.id, input.id),
          eq(scheduledReports.organizationId, input.organizationId)
        )
      )
      .returning();

    return updated;
  }),

  /**
   * Delete a scheduled report
   */
  delete: organizationProcedure.input(deleteReportSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('delete', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'レポートを削除する権限がありません',
      });
    }

    const existing = await ctx.db.query.scheduledReports.findFirst({
      where: and(
        eq(scheduledReports.id, input.id),
        eq(scheduledReports.organizationId, input.organizationId)
      ),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'レポートが見つかりません',
      });
    }

    await ctx.db
      .delete(scheduledReports)
      .where(
        and(
          eq(scheduledReports.id, input.id),
          eq(scheduledReports.organizationId, input.organizationId)
        )
      );

    return { success: true };
  }),

  /**
   * Get report history
   */
  getHistory: organizationProcedure.input(getHistorySchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'レポート履歴を閲覧する権限がありません',
      });
    }

    const results = await ctx.db.query.reportHistory.findMany({
      where: and(
        eq(reportHistory.scheduledReportId, input.reportId),
        eq(reportHistory.organizationId, input.organizationId)
      ),
      orderBy: [desc(reportHistory.createdAt)],
      limit: input.limit,
      offset: input.offset,
    });

    const totalCount = await ctx.db
      .select({ count: reportHistory.id })
      .from(reportHistory)
      .where(
        and(
          eq(reportHistory.scheduledReportId, input.reportId),
          eq(reportHistory.organizationId, input.organizationId)
        )
      );

    return {
      items: results,
      total: totalCount.length,
      limit: input.limit,
      offset: input.offset,
    };
  }),

  /**
   * Toggle report status (active/paused)
   */
  toggleStatus: organizationProcedure
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
          message: 'レポートを更新する権限がありません',
        });
      }

      const existing = await ctx.db.query.scheduledReports.findFirst({
        where: and(
          eq(scheduledReports.id, input.id),
          eq(scheduledReports.organizationId, input.organizationId)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'レポートが見つかりません',
        });
      }

      const newStatus: ReportStatus = existing.status === 'active' ? 'paused' : 'active';

      const [updated] = await ctx.db
        .update(scheduledReports)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(scheduledReports.id, input.id),
            eq(scheduledReports.organizationId, input.organizationId)
          )
        )
        .returning();

      return updated;
    }),

  /**
   * Run report manually (for testing)
   */
  runNow: organizationProcedure
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
          message: 'レポートを実行する権限がありません',
        });
      }

      const existing = await ctx.db.query.scheduledReports.findFirst({
        where: and(
          eq(scheduledReports.id, input.id),
          eq(scheduledReports.organizationId, input.organizationId)
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'レポートが見つかりません',
        });
      }

      // Create a history entry (actual report generation would be handled by a background job)
      const now = new Date();
      const config = existing.config as ReportConfig;
      const dateRangeDays = config?.dateRangeDays ?? 30;
      const periodStart = new Date(now.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);

      const [historyEntry] = await ctx.db
        .insert(reportHistory)
        .values({
          scheduledReportId: existing.id,
          organizationId: input.organizationId,
          periodStart,
          periodEnd: now,
          leadCount: 0, // Would be calculated by the report generator
          deliveryStatus: 'pending',
        })
        .returning();

      // Update last sent time
      await ctx.db
        .update(scheduledReports)
        .set({
          lastSentAt: now,
          nextScheduledAt: calculateNextScheduledDate(
            existing.frequency,
            existing.sendHour,
            existing.dayOfWeek,
            existing.dayOfMonth,
            existing.timezone
          ),
          updatedAt: now,
        })
        .where(eq(scheduledReports.id, existing.id));

      return historyEntry;
    }),
});
