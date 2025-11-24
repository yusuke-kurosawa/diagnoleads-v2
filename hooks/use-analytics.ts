import { trpc } from '@/lib/trpc/client';
import type {
  DateRange,
  TrendGranularity,
} from '@/lib/features/analytics/types/schemas';

/**
 * Hook to get overview statistics
 */
export function useOverview(organizationId: string, dateRange: DateRange = '30d') {
  return trpc.analytics.getOverview.useQuery({
    organizationId,
    dateRange,
  });
}

/**
 * Hook to get lead trend data
 */
export function useLeadTrend(
  organizationId: string,
  dateRange: DateRange = '30d',
  granularity: TrendGranularity = 'daily'
) {
  return trpc.analytics.getLeadTrend.useQuery({
    organizationId,
    dateRange,
    granularity,
  });
}

/**
 * Hook to get source breakdown
 */
export function useSourceBreakdown(
  organizationId: string,
  dateRange: DateRange = '30d'
) {
  return trpc.analytics.getSourceBreakdown.useQuery({
    organizationId,
    dateRange,
  });
}

/**
 * Hook to get status breakdown
 */
export function useStatusBreakdown(
  organizationId: string,
  dateRange: DateRange = '30d'
) {
  return trpc.analytics.getStatusBreakdown.useQuery({
    organizationId,
    dateRange,
  });
}

/**
 * Composite hook for all analytics data
 * Useful when you need multiple analytics queries in a component
 */
export function useAnalytics(organizationId: string, dateRange: DateRange = '30d') {
  const overview = useOverview(organizationId, dateRange);
  const leadTrend = useLeadTrend(organizationId, dateRange);
  const sourceBreakdown = useSourceBreakdown(organizationId, dateRange);
  const statusBreakdown = useStatusBreakdown(organizationId, dateRange);

  return {
    overview,
    leadTrend,
    sourceBreakdown,
    statusBreakdown,
    isLoading:
      overview.isLoading ||
      leadTrend.isLoading ||
      sourceBreakdown.isLoading ||
      statusBreakdown.isLoading,
    isError:
      overview.isError ||
      leadTrend.isError ||
      sourceBreakdown.isError ||
      statusBreakdown.isError,
  };
}
