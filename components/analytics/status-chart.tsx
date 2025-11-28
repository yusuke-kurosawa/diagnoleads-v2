'use client';

import { BarChart } from '@/components/charts/bar-chart';
import type { StatusBreakdown } from '@/lib/features/analytics/types/schemas';
import { useLocale, useTranslations } from 'next-intl';

interface StatusChartProps {
  data: StatusBreakdown[];
  isLoading?: boolean;
}

/**
 * StatusChart - Bar chart showing lead status distribution
 * Fully i18n supported
 */
export function StatusChart({ data, isLoading = false }: StatusChartProps) {
  const tStatus = useTranslations('status');
  const tAnalytics = useTranslations('settings.analytics');
  const locale = useLocale();

  // Get localized status label
  const getStatusLabel = (status: string): string => {
    try {
      return tStatus(status);
    } catch {
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-20 h-4 bg-gray-200 animate-pulse rounded" />
            <div className="flex-1 h-8 bg-gray-200 animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">{tAnalytics('noData')}</p>
      </div>
    );
  }

  // Ensure all statuses are present in the correct order with localized labels
  const statusOrder = ['new', 'contacted', 'qualified', 'converted'];
  const chartData = statusOrder.map((status) => {
    const found = data.find((d) => d.status === status);
    return {
      status: getStatusLabel(status),
      count: found?.count || 0,
      percentage: found?.percentage || 0,
    };
  });

  // Locale-aware value formatter
  const valueFormatter = (value: number) => {
    if (locale === 'ja') {
      return `${value.toLocaleString('ja-JP')}件`;
    }
    return value.toLocaleString('en-US');
  };

  return (
    <div className="h-64">
      <BarChart
        className="h-full"
        data={chartData}
        index="status"
        categories={['count']}
        colors={['blue']}
        valueFormatter={valueFormatter}
        showLegend={false}
        showAnimation={true}
        layout="vertical"
      />
    </div>
  );
}
