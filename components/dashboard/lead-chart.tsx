'use client';

import { AreaChart } from '@/components/charts/area-chart';
import { Card } from '@/components/ui/card';
import type { TrendDataPoint } from '@/lib/features/analytics/types/schemas';
import { format, parseISO } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';

interface LeadChartProps {
  data: TrendDataPoint[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  granularity?: 'daily' | 'monthly';
}

/**
 * LeadChart component using recharts AreaChart
 * Displays lead trends over time with total and converted leads
 */
export function LeadChart({
  data,
  isLoading = false,
  title,
  description,
  granularity = 'daily',
}: LeadChartProps) {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const tAnalytics = useTranslations('settings.analytics');

  const dateLocale = locale === 'ja' ? ja : enUS;
  const chartTitle = title ?? t('leadTrend');
  const chartDescription = description ?? tAnalytics('charts.leadTrend');

  // Localized labels for chart categories
  const totalLeadsLabel = t('totalLeads');
  const convertedLabel = t('convertedLeads');

  // Format data for chart
  const chartData = data.map((point) => {
    const date = parseISO(point.date);
    const formattedDate =
      granularity === 'monthly'
        ? locale === 'ja'
          ? format(date, 'yyyy年M月', { locale: dateLocale })
          : format(date, 'MMM yyyy', { locale: dateLocale })
        : format(date, 'M/d', { locale: dateLocale });

    return {
      date: formattedDate,
      [totalLeadsLabel]: point.count,
      [convertedLabel]: point.converted,
    };
  });

  // Value formatter based on locale
  const valueFormatter = (value: number) => {
    if (locale === 'ja') {
      return `${value.toLocaleString()}件`;
    }
    return value.toLocaleString();
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-2" />
            <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="h-64 bg-gray-200 animate-pulse rounded" />
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{chartTitle}</h3>
          <p className="text-sm text-gray-600 mb-6">{chartDescription}</p>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm">{tAnalytics('noData')}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{chartTitle}</h3>
        <p className="text-sm text-gray-600 mb-6">{chartDescription}</p>
      </div>

      <AreaChart
        className="h-64"
        data={chartData}
        index="date"
        categories={[totalLeadsLabel, convertedLabel]}
        colors={['blue', 'green']}
        valueFormatter={valueFormatter}
        showLegend={true}
        showGridLines={true}
        showAnimation={true}
        curveType="smooth"
      />
    </Card>
  );
}
