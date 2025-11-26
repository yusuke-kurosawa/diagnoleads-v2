'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ConversionFunnelData } from '@/lib/features/analytics/types/schemas';

interface ConversionFunnelProps {
  leadsByStatus?: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
  };
  funnelData?: ConversionFunnelData;
  isLoading?: boolean;
}

interface FunnelStageDisplay {
  label: string;
  value: number;
  percentage: number;
  conversionRate: number;
  color: string;
  bgColor: string;
}

/**
 * ConversionFunnel - Visual representation of lead conversion stages
 */
export function ConversionFunnel({ leadsByStatus, funnelData: apiFunnelData, isLoading = false }: ConversionFunnelProps) {
  const displayData = useMemo((): FunnelStageDisplay[] => {
    // Prefer API funnel data if available
    if (apiFunnelData && apiFunnelData.stages.length > 0) {
      const colors: Record<string, { color: string; bgColor: string }> = {
        new: { color: 'bg-blue-500', bgColor: 'bg-blue-100' },
        contacted: { color: 'bg-yellow-500', bgColor: 'bg-yellow-100' },
        qualified: { color: 'bg-green-500', bgColor: 'bg-green-100' },
        converted: { color: 'bg-purple-500', bgColor: 'bg-purple-100' },
      };

      return apiFunnelData.stages.map((stage) => ({
        label: stage.name.charAt(0).toUpperCase() + stage.name.slice(1),
        value: stage.cumulativeCount,
        percentage: stage.percentage,
        conversionRate: stage.conversionRate,
        ...(colors[stage.name] || { color: 'bg-gray-500', bgColor: 'bg-gray-100' }),
      }));
    }

    // Fallback to leadsByStatus if API data not available
    if (!leadsByStatus) return [];

    const total =
      leadsByStatus.new +
      leadsByStatus.contacted +
      leadsByStatus.qualified +
      leadsByStatus.converted;

    if (total === 0) return [];

    // Calculate cumulative totals for funnel
    const stages = [
      {
        label: 'New',
        value: total,
        color: 'bg-blue-500',
        bgColor: 'bg-blue-100',
      },
      {
        label: 'Contacted',
        value: leadsByStatus.contacted + leadsByStatus.qualified + leadsByStatus.converted,
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-100',
      },
      {
        label: 'Qualified',
        value: leadsByStatus.qualified + leadsByStatus.converted,
        color: 'bg-green-500',
        bgColor: 'bg-green-100',
      },
      {
        label: 'Converted',
        value: leadsByStatus.converted,
        color: 'bg-purple-500',
        bgColor: 'bg-purple-100',
      },
    ];

    return stages.map((stage, index) => ({
      ...stage,
      percentage: total > 0 ? (stage.value / total) * 100 : 0,
      conversionRate:
        index > 0 && stages[index - 1].value > 0
          ? (stage.value / stages[index - 1].value) * 100
          : 100,
    }));
  }, [leadsByStatus, apiFunnelData]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded" style={{ width: `${100 - i * 15}%` }} />
          </div>
        ))}
      </div>
    );
  }

  if (displayData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxValue = displayData[0]?.value || 1;

  return (
    <div className="space-y-6">
      {/* Funnel Visualization */}
      <div className="space-y-3">
        {displayData.map((stage, index) => (
          <div key={stage.label} className="relative">
            {/* Stage bar */}
            <div
              className={cn('relative h-16 rounded-lg transition-all duration-500', stage.bgColor)}
              style={{ width: `${Math.max(20, (stage.value / maxValue) * 100)}%` }}
            >
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-lg transition-all duration-500',
                  stage.color
                )}
                style={{ width: `${stage.percentage}%`, minWidth: '4px' }}
              />

              {/* Label and value */}
              <div className="absolute inset-0 flex items-center justify-between px-4">
                <span className="font-medium text-gray-900">{stage.label}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-gray-900">{stage.value.toLocaleString()}</span>
                  <span className="text-gray-600">({stage.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            {/* Conversion rate arrow */}
            {index > 0 && (
              <div className="absolute -top-2 right-4 flex items-center gap-1 text-xs">
                <svg
                  className="w-3 h-3 text-gray-400 rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                <span
                  className={cn(
                    'font-medium',
                    stage.conversionRate >= 50
                      ? 'text-green-600'
                      : stage.conversionRate >= 25
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  )}
                >
                  {stage.conversionRate.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {leadsByStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{leadsByStatus.new}</p>
            <p className="text-xs text-gray-500">New Leads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{leadsByStatus.contacted}</p>
            <p className="text-xs text-gray-500">Contacted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{leadsByStatus.qualified}</p>
            <p className="text-xs text-gray-500">Qualified</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{leadsByStatus.converted}</p>
            <p className="text-xs text-gray-500">Converted</p>
          </div>
        </div>
      )}

      {/* Overall Conversion Rate */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Overall Conversion Rate</span>
          <span className="text-2xl font-bold text-purple-600">
            {apiFunnelData
              ? apiFunnelData.overallConversionRate.toFixed(1)
              : displayData.length > 0 && leadsByStatus
                ? ((leadsByStatus.converted / displayData[0].value) * 100).toFixed(1)
                : '0'}
            %
          </span>
        </div>
        {apiFunnelData && apiFunnelData.averageConversionDays > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Average conversion time: {apiFunnelData.averageConversionDays.toFixed(1)} days
          </p>
        )}
        {(!apiFunnelData || apiFunnelData.averageConversionDays === 0) && (
          <p className="text-xs text-gray-500 mt-1">
            From initial lead to converted customer
          </p>
        )}
      </div>
    </div>
  );
}
