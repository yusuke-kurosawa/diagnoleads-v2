'use client';

import { Card } from '@/components/ui/card';
import { AreaChart } from '@tremor/react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { TrendDataPoint } from '@/lib/features/analytics/types/schemas';

interface LeadChartProps {
  data: TrendDataPoint[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  granularity?: 'daily' | 'monthly';
}

/**
 * LeadChart component using Tremor AreaChart
 * Displays lead trends over time with total and converted leads
 */
export function LeadChart({
  data,
  isLoading = false,
  title = 'リード推移',
  description = 'リードの獲得数と成約数の推移',
  granularity = 'daily',
}: LeadChartProps) {
  // Format data for Tremor chart
  const chartData = data.map((point) => {
    const date = parseISO(point.date);
    const formattedDate =
      granularity === 'monthly'
        ? format(date, 'yyyy年M月', { locale: ja })
        : format(date, 'M/d', { locale: ja });

    return {
      日付: formattedDate,
      総リード数: point.count,
      成約数: point.converted,
    };
  });

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
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-6">{description}</p>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm">データがありません</p>
            <p className="text-gray-400 text-xs mt-1">
              リードが追加されるとグラフが表示されます
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{description}</p>
      </div>

      <AreaChart
        className="h-64"
        data={chartData}
        index="日付"
        categories={['総リード数', '成約数']}
        colors={['blue', 'green']}
        valueFormatter={(value) => `${value.toLocaleString()}件`}
        showLegend={true}
        showGridLines={true}
        showXAxis={true}
        showYAxis={true}
        startEndOnly={false}
        curveType="monotone"
      />
    </Card>
  );
}
