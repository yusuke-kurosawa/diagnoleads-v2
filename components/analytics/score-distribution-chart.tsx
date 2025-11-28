'use client';

import { BarChart } from '@/components/charts/bar-chart';
import type { ScoreDistributionData } from '@/lib/features/analytics/types/schemas';
import { useLocale, useTranslations } from 'next-intl';

interface ScoreDistributionChartProps {
  data: ScoreDistributionData[];
  isLoading?: boolean;
}

/**
 * ScoreDistributionChart - Bar chart showing lead score distribution
 * Displays how leads are distributed across score ranges (0-25, 26-50, 51-75, 76-100)
 */
export function ScoreDistributionChart({ data, isLoading = false }: ScoreDistributionChartProps) {
  const t = useTranslations('settings.analytics');
  const locale = useLocale();

  if (isLoading) {
    return (
      <div className="h-64 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-16 h-4 bg-gray-200 animate-pulse rounded" />
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

  // Map data for chart with localized labels
  const chartData = data.map((item) => ({
    range: item.range,
    count: item.count,
    percentage: item.percentage,
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
        index="range"
        categories={['count']}
        colors={['blue']}
        valueFormatter={valueFormatter}
        showLegend={false}
        showAnimation={true}
        layout="vertical"
      />
      {/* Summary stats below chart */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {data.map((item) => (
          <div key={item.range} className="text-center">
            <div className="text-xs text-gray-500">{item.range}</div>
            <div className="text-sm font-semibold">{item.percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
