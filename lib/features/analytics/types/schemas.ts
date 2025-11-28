import { z } from 'zod';

/**
 * Analytics Zod Schemas
 * Type-safe input validation for analytics procedures
 */

/**
 * Date range for analytics queries
 */
export const dateRangeSchema = z.enum(['7d', '30d', '90d', 'all']);
export type DateRange = z.infer<typeof dateRangeSchema>;

/**
 * Trend granularity (daily or monthly)
 */
export const trendGranularitySchema = z.enum(['daily', 'monthly']);
export type TrendGranularity = z.infer<typeof trendGranularitySchema>;

/**
 * Get Overview Schema
 */
export const getOverviewSchema = z.object({
  organizationId: z.string().uuid(),
  dateRange: dateRangeSchema.default('30d'),
});
export type GetOverviewInput = z.infer<typeof getOverviewSchema>;

/**
 * Get Lead Trend Schema
 */
export const getLeadTrendSchema = z.object({
  organizationId: z.string().uuid(),
  dateRange: dateRangeSchema.default('30d'),
  granularity: trendGranularitySchema.default('daily'),
});
export type GetLeadTrendInput = z.infer<typeof getLeadTrendSchema>;

/**
 * Get Source Breakdown Schema
 */
export const getSourceBreakdownSchema = z.object({
  organizationId: z.string().uuid(),
  dateRange: dateRangeSchema.default('30d'),
});
export type GetSourceBreakdownInput = z.infer<typeof getSourceBreakdownSchema>;

/**
 * Get Status Breakdown Schema
 */
export const getStatusBreakdownSchema = z.object({
  organizationId: z.string().uuid(),
  dateRange: dateRangeSchema.default('30d'),
});
export type GetStatusBreakdownInput = z.infer<typeof getStatusBreakdownSchema>;

/**
 * Get Conversion Funnel Schema
 */
export const getConversionFunnelSchema = z.object({
  organizationId: z.string().uuid(),
  dateRange: dateRangeSchema.default('30d'),
});
export type GetConversionFunnelInput = z.infer<typeof getConversionFunnelSchema>;

/**
 * Get Score Distribution Schema
 */
export const getScoreDistributionSchema = z.object({
  organizationId: z.string().uuid(),
  dateRange: dateRangeSchema.default('30d'),
});
export type GetScoreDistributionInput = z.infer<typeof getScoreDistributionSchema>;

/**
 * Get Response Time Schema
 */
export const getResponseTimeSchema = z.object({
  organizationId: z.string().uuid(),
  dateRange: dateRangeSchema.default('30d'),
});

/**
 * Response Types
 */

export interface OverviewStats {
  totalLeads: number;
  newLeadsThisMonth: number;
  conversionRate: number;
  averageScore: number;
  leadsByStatus: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
  };
}

export interface TrendDataPoint {
  date: string; // ISO 8601 date string
  count: number;
  converted: number;
}

export interface SourceBreakdown {
  source: string;
  count: number;
  percentage: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface FunnelStage {
  name: string;
  count: number;
  cumulativeCount: number;
  percentage: number;
  conversionRate: number;
}

export interface ConversionFunnelData {
  stages: FunnelStage[];
  totalLeads: number;
  overallConversionRate: number;
  averageConversionDays: number;
}

export interface ScoreDistributionData {
  range: string; // e.g., "0-25", "26-50", "51-75", "76-100"
  count: number;
  percentage: number;
}

export interface ResponseTimeData {
  period: string; // e.g., "< 1 hour", "1-24 hours", "1-3 days", "3+ days"
  count: number;
  percentage: number;
  averageHours: number;
}
