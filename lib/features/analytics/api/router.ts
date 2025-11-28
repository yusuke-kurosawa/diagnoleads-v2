import { leads } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { and, avg, count, desc, eq, gte, lte, sql } from 'drizzle-orm';
import {
  type ConversionFunnelData,
  type FunnelStage,
  type OverviewStats,
  type ResponseTimeData,
  type ScoreDistributionData,
  type SourceBreakdown,
  type StatusBreakdown,
  type TrendDataPoint,
  getConversionFunnelSchema,
  getLeadTrendSchema,
  getOverviewSchema,
  getResponseTimeSchema,
  getScoreDistributionSchema,
  getSourceBreakdownSchema,
  getStatusBreakdownSchema,
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
          and(eq(leads.organizationId, organizationId), gte(leads.createdAt, firstDayOfMonth))
        );

      const newLeadsThisMonth = newLeadsThisMonthResult[0]?.count || 0;

      // Get converted leads for conversion rate
      const convertedLeadsResult = await ctx.db
        .select({ count: count() })
        .from(leads)
        .where(and(eq(leads.organizationId, organizationId), eq(leads.status, 'converted')));

      const convertedLeads = convertedLeadsResult[0]?.count || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Get average score (excluding null scores)
      const avgScoreResult = await ctx.db
        .select({
          avg: sql<number>`COALESCE(AVG(${leads.score}), 0)`,
        })
        .from(leads)
        .where(and(eq(leads.organizationId, organizationId), sql`${leads.score} IS NOT NULL`));

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
        .where(and(eq(leads.organizationId, organizationId), gte(leads.createdAt, dateThreshold)))
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
        .where(and(eq(leads.organizationId, organizationId), gte(leads.createdAt, dateThreshold)));

      const total = totalResult[0]?.count || 0;

      // Get counts by source
      const sourceData = await ctx.db
        .select({
          source: sql<string>`COALESCE(${leads.source}, 'unknown')`.as('source'),
          count: count().as('count'),
        })
        .from(leads)
        .where(and(eq(leads.organizationId, organizationId), gte(leads.createdAt, dateThreshold)))
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
        .where(and(eq(leads.organizationId, organizationId), gte(leads.createdAt, dateThreshold)));

      const total = totalResult[0]?.count || 0;

      // Get counts by status
      const statusData = await ctx.db
        .select({
          status: leads.status,
          count: count().as('count'),
        })
        .from(leads)
        .where(and(eq(leads.organizationId, organizationId), gte(leads.createdAt, dateThreshold)))
        .groupBy(leads.status)
        .orderBy(desc(count()));

      return statusData.map((row) => ({
        status: row.status,
        count: row.count,
        percentage: total > 0 ? Math.round((row.count / total) * 10000) / 100 : 0,
      }));
    }),

  /**
   * Get Conversion Funnel Data
   * Returns detailed funnel analysis with stage-to-stage conversion rates
   */
  getConversionFunnel: organizationProcedure
    .input(getConversionFunnelSchema)
    .query(async ({ ctx, input }): Promise<ConversionFunnelData> => {
      const { organizationId, dateRange } = input;

      const dateThreshold = getDateThreshold(dateRange);

      // Get counts for each status
      const statusCounts = await ctx.db
        .select({
          status: leads.status,
          count: count().as('count'),
        })
        .from(leads)
        .where(and(eq(leads.organizationId, organizationId), gte(leads.createdAt, dateThreshold)))
        .groupBy(leads.status);

      // Build status map
      const statusMap: Record<string, number> = {};
      for (const row of statusCounts) {
        statusMap[row.status] = row.count;
      }

      const newCount = statusMap.new || 0;
      const contactedCount = statusMap.contacted || 0;
      const qualifiedCount = statusMap.qualified || 0;
      const convertedCount = statusMap.converted || 0;

      const totalLeads = newCount + contactedCount + qualifiedCount + convertedCount;

      // Calculate cumulative values for funnel
      const newTotal = totalLeads;
      const contactedTotal = contactedCount + qualifiedCount + convertedCount;
      const qualifiedTotal = qualifiedCount + convertedCount;
      const convertedTotal = convertedCount;

      // Build funnel stages
      const stages: FunnelStage[] = [
        {
          name: 'new',
          count: newCount,
          cumulativeCount: newTotal,
          percentage: totalLeads > 0 ? Math.round((newTotal / totalLeads) * 10000) / 100 : 100,
          conversionRate: 100, // First stage always 100%
        },
        {
          name: 'contacted',
          count: contactedCount,
          cumulativeCount: contactedTotal,
          percentage: totalLeads > 0 ? Math.round((contactedTotal / totalLeads) * 10000) / 100 : 0,
          conversionRate: newTotal > 0 ? Math.round((contactedTotal / newTotal) * 10000) / 100 : 0,
        },
        {
          name: 'qualified',
          count: qualifiedCount,
          cumulativeCount: qualifiedTotal,
          percentage: totalLeads > 0 ? Math.round((qualifiedTotal / totalLeads) * 10000) / 100 : 0,
          conversionRate:
            contactedTotal > 0 ? Math.round((qualifiedTotal / contactedTotal) * 10000) / 100 : 0,
        },
        {
          name: 'converted',
          count: convertedCount,
          cumulativeCount: convertedTotal,
          percentage: totalLeads > 0 ? Math.round((convertedTotal / totalLeads) * 10000) / 100 : 0,
          conversionRate:
            qualifiedTotal > 0 ? Math.round((convertedTotal / qualifiedTotal) * 10000) / 100 : 0,
        },
      ];

      // Calculate average conversion time (for leads that have been converted)
      const avgTimeResult = await ctx.db
        .select({
          avgDays: sql<number>`COALESCE(
            AVG(EXTRACT(EPOCH FROM (${leads.updatedAt} - ${leads.createdAt})) / 86400),
            0
          )`.as('avgDays'),
        })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            eq(leads.status, 'converted'),
            gte(leads.createdAt, dateThreshold)
          )
        );

      const averageConversionDays = Math.round(Number(avgTimeResult[0]?.avgDays) * 10) / 10 || 0;

      return {
        stages,
        totalLeads,
        overallConversionRate:
          totalLeads > 0 ? Math.round((convertedTotal / totalLeads) * 10000) / 100 : 0,
        averageConversionDays,
      };
    }),

  /**
   * Get Score Distribution
   * Returns distribution of leads by score ranges (0-25, 26-50, 51-75, 76-100)
   */
  getScoreDistribution: organizationProcedure
    .input(getScoreDistributionSchema)
    .query(async ({ ctx, input }): Promise<ScoreDistributionData[]> => {
      const { organizationId, dateRange } = input;

      const dateThreshold = getDateThreshold(dateRange);

      // Get total count of leads with scores
      const totalResult = await ctx.db
        .select({ count: count() })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            gte(leads.createdAt, dateThreshold),
            sql`${leads.score} IS NOT NULL`
          )
        );

      const total = totalResult[0]?.count || 0;

      // Get counts for each score range
      const ranges = [
        { min: 0, max: 25, label: '0-25' },
        { min: 26, max: 50, label: '26-50' },
        { min: 51, max: 75, label: '51-75' },
        { min: 76, max: 100, label: '76-100' },
      ];

      const distribution: ScoreDistributionData[] = [];

      for (const range of ranges) {
        const countResult = await ctx.db
          .select({ count: count() })
          .from(leads)
          .where(
            and(
              eq(leads.organizationId, organizationId),
              gte(leads.createdAt, dateThreshold),
              gte(leads.score, range.min),
              lte(leads.score, range.max)
            )
          );

        const rangeCount = countResult[0]?.count || 0;

        distribution.push({
          range: range.label,
          count: rangeCount,
          percentage: total > 0 ? Math.round((rangeCount / total) * 10000) / 100 : 0,
        });
      }

      return distribution;
    }),

  /**
   * Get Response Time Distribution
   * Returns distribution of leads by response time categories
   */
  getResponseTime: organizationProcedure
    .input(getResponseTimeSchema)
    .query(async ({ ctx, input }): Promise<ResponseTimeData[]> => {
      const { organizationId, dateRange } = input;

      const dateThreshold = getDateThreshold(dateRange);

      // Get leads with both createdAt and updatedAt for response time calculation
      // Response time is calculated as time between creation and first status change (updatedAt)
      const leadsData = await ctx.db
        .select({
          id: leads.id,
          createdAt: leads.createdAt,
          updatedAt: leads.updatedAt,
          status: leads.status,
        })
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            gte(leads.createdAt, dateThreshold),
            // Only count leads that have been updated (status changed)
            sql`${leads.status} != 'new'`
          )
        );

      // Calculate response times in hours
      const responseTimes = leadsData.map((lead) => {
        const created = new Date(lead.createdAt);
        const updated = new Date(lead.updatedAt);
        return (updated.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
      });

      const total = responseTimes.length;

      // Categorize by time periods
      const periods = [
        { min: 0, max: 1, label: '< 1 hour' },
        { min: 1, max: 24, label: '1-24 hours' },
        { min: 24, max: 72, label: '1-3 days' },
        { min: 72, max: Number.POSITIVE_INFINITY, label: '3+ days' },
      ];

      const distribution: ResponseTimeData[] = [];

      for (const period of periods) {
        const periodTimes = responseTimes.filter((time) => time >= period.min && time < period.max);
        const periodCount = periodTimes.length;
        const avgHours =
          periodTimes.length > 0 ? periodTimes.reduce((a, b) => a + b, 0) / periodTimes.length : 0;

        distribution.push({
          period: period.label,
          count: periodCount,
          percentage: total > 0 ? Math.round((periodCount / total) * 10000) / 100 : 0,
          averageHours: Math.round(avgHours * 10) / 10,
        });
      }

      return distribution;
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
