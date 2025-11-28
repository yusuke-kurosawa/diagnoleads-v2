'use client';

import { ChartLegend, DonutChart } from '@/components/charts/donut-chart';
import type { SourceBreakdown } from '@/lib/features/analytics/types/schemas';
import { useLocale, useTranslations } from 'next-intl';

interface SourceChartProps {
  data: SourceBreakdown[];
  isLoading?: boolean;
}

/**
 * SourceChart - Donut chart showing lead source distribution
 * Fully i18n supported
 */
export function SourceChart({ data, isLoading = false }: SourceChartProps) {
  const t = useTranslations('leadSource');
  const tAnalytics = useTranslations('settings.analytics');
  const locale = useLocale();

  // Localized source name mapping
  const getSourceName = (source: string): string => {
    const sourceKey = source.replace(/_/g, '') as keyof typeof sourceKeyMap;
    const sourceKeyMap: Record<string, string> = {
      diagnosticform: 'diagnostic_form',
      website: 'website',
      referral: 'referral',
      socialmedia: 'social',
      emailcampaign: 'email',
      event: 'event',
      partner: 'advertisement',
      coldoutreach: 'phone',
      unknown: 'other',
    };

    // Try to get translation from leadSource namespace
    const key = sourceKeyMap[sourceKey] || source;
    try {
      return t(key);
    } catch {
      // Fallback: capitalize and replace underscores
      return source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-48 h-48 rounded-full bg-gray-200 animate-pulse" />
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

  // Transform data for chart with localized names
  const chartData = data.map((item) => ({
    name: getSourceName(item.source),
    value: item.count,
  }));

  // Locale-aware value formatter
  const valueFormatter = (value: number) => {
    if (locale === 'ja') {
      return `${value.toLocaleString('ja-JP')}件`;
    }
    return value.toLocaleString('en-US');
  };

  const colors: ('blue' | 'green' | 'violet' | 'amber' | 'pink' | 'cyan' | 'yellow')[] = [
    'blue',
    'green',
    'violet',
    'amber',
    'pink',
    'cyan',
    'yellow',
  ];

  return (
    <div className="h-64">
      <DonutChart
        className="h-full"
        data={chartData}
        colors={colors}
        valueFormatter={valueFormatter}
        showLabel={true}
        showAnimation={true}
      />
      <ChartLegend className="mt-4" categories={chartData.map((d) => d.name)} colors={colors} />
    </div>
  );
}
