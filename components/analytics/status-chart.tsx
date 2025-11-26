'use client';

import { BarChart } from '@tremor/react';
import type { StatusBreakdown } from '@/lib/features/analytics/types/schemas';

interface StatusChartProps {
  data: StatusBreakdown[];
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  new: 'blue',
  contacted: 'yellow',
  qualified: 'green',
  converted: 'purple',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
};

/**
 * StatusChart - Bar chart showing lead status distribution
 */
export function StatusChart({ data, isLoading = false }: StatusChartProps) {
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
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Ensure all statuses are present in the correct order
  const statusOrder = ['new', 'contacted', 'qualified', 'converted'];
  const chartData = statusOrder.map((status) => {
    const found = data.find((d) => d.status === status);
    return {
      status: statusLabels[status] || status,
      count: found?.count || 0,
      percentage: found?.percentage || 0,
    };
  });

  return (
    <div className="h-64">
      <BarChart
        className="h-full"
        data={chartData}
        index="status"
        categories={['count']}
        colors={['blue']}
        valueFormatter={(value) => `${value.toLocaleString()}`}
        showLegend={false}
        showAnimation={true}
        layout="vertical"
      />
    </div>
  );
}
