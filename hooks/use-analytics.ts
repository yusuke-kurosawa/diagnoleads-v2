import type { DateRange, TrendGranularity } from '@/lib/features/analytics/types/schemas';
import { trpc } from '@/lib/trpc/client';

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Hook to get overview statistics
 * Automatically disabled for invalid organization IDs (demo mode)
 */
export function useOverview(organizationId: string, dateRange: DateRange = '30d') {
  const isValidOrg = isValidUUID(organizationId);

  return trpc.analytics.getOverview.useQuery(
    {
      organizationId,
      dateRange,
    },
    {
      enabled: isValidOrg,
    }
  );
}

/**
 * Hook to get lead trend data
 * Automatically disabled for invalid organization IDs (demo mode)
 */
export function useLeadTrend(
  organizationId: string,
  dateRange: DateRange = '30d',
  granularity: TrendGranularity = 'daily'
) {
  const isValidOrg = isValidUUID(organizationId);

  return trpc.analytics.getLeadTrend.useQuery(
    {
      organizationId,
      dateRange,
      granularity,
    },
    {
      enabled: isValidOrg,
    }
  );
}

/**
 * Hook to get source breakdown
 * Automatically disabled for invalid organization IDs (demo mode)
 */
export function useSourceBreakdown(organizationId: string, dateRange: DateRange = '30d') {
  const isValidOrg = isValidUUID(organizationId);

  return trpc.analytics.getSourceBreakdown.useQuery(
    {
      organizationId,
      dateRange,
    },
    {
      enabled: isValidOrg,
    }
  );
}

/**
 * Hook to get status breakdown
 * Automatically disabled for invalid organization IDs (demo mode)
 */
export function useStatusBreakdown(organizationId: string, dateRange: DateRange = '30d') {
  const isValidOrg = isValidUUID(organizationId);

  return trpc.analytics.getStatusBreakdown.useQuery(
    {
      organizationId,
      dateRange,
    },
    {
      enabled: isValidOrg,
    }
  );
}

/**
 * Hook to get conversion funnel data
 * Automatically disabled for invalid organization IDs (demo mode)
 */
export function useConversionFunnel(organizationId: string, dateRange: DateRange = '30d') {
  const isValidOrg = isValidUUID(organizationId);

  return trpc.analytics.getConversionFunnel.useQuery(
    {
      organizationId,
      dateRange,
    },
    {
      enabled: isValidOrg,
    }
  );
}

/**
 * Hook to get score distribution data
 * Automatically disabled for invalid organization IDs (demo mode)
 */
export function useScoreDistribution(organizationId: string, dateRange: DateRange = '30d') {
  const isValidOrg = isValidUUID(organizationId);

  return trpc.analytics.getScoreDistribution.useQuery(
    {
      organizationId,
      dateRange,
    },
    {
      enabled: isValidOrg,
    }
  );
}

/**
 * Hook to get response time distribution data
 * Automatically disabled for invalid organization IDs (demo mode)
 */
export function useResponseTime(organizationId: string, dateRange: DateRange = '30d') {
  const isValidOrg = isValidUUID(organizationId);

  return trpc.analytics.getResponseTime.useQuery(
    {
      organizationId,
      dateRange,
    },
    {
      enabled: isValidOrg,
    }
  );
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
      overview.isError || leadTrend.isError || sourceBreakdown.isError || statusBreakdown.isError,
  };
}
