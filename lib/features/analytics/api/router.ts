import { router, organizationProcedure } from '@/lib/trpc/init';
import { leads } from '@/lib/db/schema';
import { and, eq, gte, count, sql, desc } from 'drizzle-orm';
import {
  getOverviewSchema,
  getLeadTrendSchema,
  getSourceBreakdownSchema,
  getStatusBreakdownSchema,
  type OverviewStats,
  type TrendDataPoint,
  type SourceBreakdown,
  type StatusBreakdown,
} from '../types/schemas';

/**
 * Analytics Router
 * Provides statistics and analytics for dashboard
 */
export const analyticsRouter = router({
  /**
   * Get Overview Statistics
   * Returns total leads, conversion rate, new leads this month, and average score
   */
  getOverview: organizationProcedure
    .input(getOverviewSchema)
    .query(async ({ ctx, input }): Promise<OverviewStats> => {
      const { organizationId, dateRange } = input;

      // Calculate date threshold based on range
      const now = new Date();
      const dateThreshold = getDateThreshold(dateRange);

      // Get total leads for organization
      const totalLeadsResult = await ctx.db
        .select({ count: count() })
        .from(leads)
        .where(eq(leads.organizationId, organizationId));

      const totalLeads = totalLeadsResult[0]?.count || 0;

      // Get new leads this month
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newLeadsThisMonthResult = await ctx.db
        .select({ count: count() })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            gte(leads.createdAt, firstDayOfMonth)
          )
        );

      const newLeadsThisMonth = newLeadsThisMonthResult[0]?.count || 0;

      // Get converted leads for conversion rate
      const convertedLeadsResult = await ctx.db
        .select({ count: count() })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            eq(leads.status, 'converted')
          )
        );

      const convertedLeads = convertedLeadsResult[0]?.count || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Get average score (excluding null scores)
      const avgScoreResult = await ctx.db
        .select({
          avg: sql<number>`COALESCE(AVG(${leads.score}), 0)`,
        })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            sql`${leads.score} IS NOT NULL`
          )
        );

      const averageScore = Math.round(Number(avgScoreResult[0]?.avg) || 0);

      // Get leads by status
      const leadsByStatusResult = await ctx.db
        .select({
          status: leads.status,
          count: count(),
        })
        .from(leads)
        .where(eq(leads.organizationId, organizationId))
        .groupBy(leads.status);

      const leadsByStatus = {
        new: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
      };

      for (const row of leadsByStatusResult) {
        const status = row.status as keyof typeof leadsByStatus;
        if (status in leadsByStatus) {
          leadsByStatus[status] = row.count;
        }
      }

      return {
        totalLeads,
        newLeadsThisMonth,
        conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
        averageScore,
        leadsByStatus,
      };
    }),

  /**
   * Get Lead Trend
   * Returns time-series data for lead creation and conversion
   */
  getLeadTrend: organizationProcedure
    .input(getLeadTrendSchema)
    .query(async ({ ctx, input }): Promise<TrendDataPoint[]> => {
      const { organizationId, dateRange, granularity } = input;

      const dateThreshold = getDateThreshold(dateRange);

      // SQL format for date truncation
      const dateFormat =
        granularity === 'daily'
          ? sql`DATE(${leads.createdAt})`
          : sql`DATE_TRUNC('month', ${leads.createdAt})`;

      // Get lead counts by date
      const trendData = await ctx.db
        .select({
          date: dateFormat.as('date'),
          count: count().as('count'),
          converted: sql<number>`SUM(CASE WHEN ${leads.status} = 'converted' THEN 1 ELSE 0 END)`.as(
            'converted'
          ),
        })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            gte(leads.createdAt, dateThreshold)
          )
        )
        .groupBy(dateFormat)
        .orderBy(desc(dateFormat));

      return trendData.map((row) => ({
        date: row.date instanceof Date ? row.date.toISOString() : String(row.date),
        count: row.count,
        converted: Number(row.converted) || 0,
      }));
    }),

  /**
   * Get Source Breakdown
   * Returns distribution of leads by source channel
   */
  getSourceBreakdown: organizationProcedure
    .input(getSourceBreakdownSchema)
    .query(async ({ ctx, input }): Promise<SourceBreakdown[]> => {
      const { organizationId, dateRange } = input;

      const dateThreshold = getDateThreshold(dateRange);

      // Get total count for percentage calculation
      const totalResult = await ctx.db
        .select({ count: count() })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            gte(leads.createdAt, dateThreshold)
          )
        );

      const total = totalResult[0]?.count || 0;

      // Get counts by source
      const sourceData = await ctx.db
        .select({
          source: sql<string>`COALESCE(${leads.source}, 'unknown')`.as('source'),
          count: count().as('count'),
        })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            gte(leads.createdAt, dateThreshold)
          )
        )
        .groupBy(sql`COALESCE(${leads.source}, 'unknown')`)
        .orderBy(desc(count()));

      return sourceData.map((row) => ({
        source: row.source,
        count: row.count,
        percentage: total > 0 ? Math.round((row.count / total) * 10000) / 100 : 0,
      }));
    }),

  /**
   * Get Status Breakdown
   * Returns distribution of leads by status
   */
  getStatusBreakdown: organizationProcedure
    .input(getStatusBreakdownSchema)
    .query(async ({ ctx, input }): Promise<StatusBreakdown[]> => {
      const { organizationId, dateRange } = input;

      const dateThreshold = getDateThreshold(dateRange);

      // Get total count for percentage calculation
      const totalResult = await ctx.db
        .select({ count: count() })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            gte(leads.createdAt, dateThreshold)
          )
        );

      const total = totalResult[0]?.count || 0;

      // Get counts by status
      const statusData = await ctx.db
        .select({
          status: leads.status,
          count: count().as('count'),
        })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            gte(leads.createdAt, dateThreshold)
          )
        )
        .groupBy(leads.status)
        .orderBy(desc(count()));

      return statusData.map((row) => ({
        status: row.status,
        count: row.count,
        percentage: total > 0 ? Math.round((row.count / total) * 10000) / 100 : 0,
      }));
    }),
});

/**
 * Helper function to calculate date threshold based on range
 */
function getDateThreshold(dateRange: '7d' | '30d' | '90d' | 'all'): Date {
  const now = new Date();

  switch (dateRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all':
      return new Date(0); // Beginning of time
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
  }
}
