'use client';

import { BarChart } from '@/components/charts/bar-chart';
import type { ResponseTimeData } from '@/lib/features/analytics/types/schemas';
import { useLocale, useTranslations } from 'next-intl';

interface ResponseTimeChartProps {
  data: ResponseTimeData[];
  isLoading?: boolean;
}

/**
 * ResponseTimeChart - Bar chart showing response time distribution
 * Displays how quickly leads are being responded to
 */
export function ResponseTimeChart({ data, isLoading = false }: ResponseTimeChartProps) {
  const t = useTranslations('settings.analytics');
  const locale = useLocale();

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
        <p className="text-gray-500">{t('noData')}</p>
      </div>
    );
  }

  // Localize period labels
  const localizeLabel = (period: string): string => {
    if (locale === 'ja') {
      switch (period) {
        case '< 1 hour':
          return '1時間以内';
        case '1-24 hours':
          return '1-24時間';
        case '1-3 days':
          return '1-3日';
        case '3+ days':
          return '3日以上';
        default:
          return period;
      }
    }
    return period;
  };

  // Map data for chart with localized labels
  const chartData = data.map((item) => ({
    period: localizeLabel(item.period),
    count: item.count,
    percentage: item.percentage,
    averageHours: item.averageHours,
  }));

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
        index="period"
        categories={['count']}
        colors={['emerald']}
        valueFormatter={valueFormatter}
        showLegend={false}
        showAnimation={true}
        layout="vertical"
      />
      {/* Summary stats below chart */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {data.map((item, index) => (
          <div key={item.period} className="text-center">
            <div className="text-xs text-gray-500">{chartData[index].period}</div>
            <div className="text-sm font-semibold">{item.percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
