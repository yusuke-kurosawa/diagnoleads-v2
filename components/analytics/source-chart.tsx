'use client';

import { DonutChart } from '@tremor/react';
import type { SourceBreakdown } from '@/lib/features/analytics/types/schemas';

interface SourceChartProps {
  data: SourceBreakdown[];
  isLoading?: boolean;
}

const sourceColors: Record<string, string> = {
  diagnostic_form: 'blue',
  website: 'green',
  referral: 'purple',
  social_media: 'orange',
  email_campaign: 'pink',
  event: 'cyan',
  partner: 'yellow',
  cold_outreach: 'red',
  unknown: 'gray',
};

/**
 * SourceChart - Donut chart showing lead source distribution
 */
export function SourceChart({ data, isLoading = false }: SourceChartProps) {
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
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Transform data for Tremor
  const chartData = data.map((item) => ({
    name: formatSourceName(item.source),
    value: item.count,
    percentage: item.percentage,
  }));

  // Get colors based on source names
  const colors = data.map((item) => sourceColors[item.source] || 'gray');

  return (
    <div className="h-64">
      <DonutChart
        className="h-full"
        data={chartData}
        category="value"
        index="name"
        colors={colors}
        valueFormatter={(value) => `${value.toLocaleString()}`}
        showLabel={true}
        showAnimation={true}
      />
    </div>
  );
}

/**
 * Format source name for display
 */
function formatSourceName(source: string): string {
  const names: Record<string, string> = {
    diagnostic_form: 'Diagnostic Form',
    website: 'Website',
    referral: 'Referral',
    social_media: 'Social Media',
    email_campaign: 'Email Campaign',
    event: 'Event',
    partner: 'Partner',
    cold_outreach: 'Cold Outreach',
    unknown: 'Unknown',
  };
  return names[source] || source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
