'use client';

import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  iconBgClassName?: string;
  format?: 'number' | 'percentage' | 'currency';
  isLoading?: boolean;
}

/**
 * StatsCard component for displaying key metrics
 * Includes number display, change rate badge, and icon integration
 */
export function StatsCard({
  title,
  value,
  change,
  changeLabel = '前月比',
  icon: Icon,
  iconClassName = 'text-blue-600',
  iconBgClassName = 'bg-blue-50',
  format = 'number',
  isLoading = false,
}: StatsCardProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `¥${val.toLocaleString()}`;
      case 'number':
      default:
        return val.toLocaleString();
    }
  };

  const getChangeColor = (changeValue?: number) => {
    if (changeValue === undefined || changeValue === null) return 'text-gray-600';
    if (changeValue > 0) return 'text-green-600';
    if (changeValue < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangePrefix = (changeValue?: number) => {
    if (changeValue === undefined || changeValue === null) return '';
    if (changeValue > 0) return '+';
    return '';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
            <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
          </div>
          {Icon && (
            <div className={cn('p-3 rounded-lg', iconBgClassName)}>
              <div className="h-6 w-6 bg-gray-200 animate-pulse rounded" />
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatValue(value)}
          </p>
          {change !== undefined && change !== null && (
            <div className="flex items-center gap-1">
              <span className={cn('text-xs font-medium', getChangeColor(change))}>
                {getChangePrefix(change)}
                {change.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">{changeLabel}</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn('p-3 rounded-lg', iconBgClassName)}>
            <Icon className={cn('h-6 w-6', iconClassName)} />
          </div>
        )}
      </div>
    </Card>
  );
}
