'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type LucideIcon, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

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
 * Includes number display, change rate badge with trend icons, and icon integration
 * Improved visual design with better accessibility
 */
export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconClassName = 'text-blue-600',
  iconBgClassName = 'bg-blue-50',
  format = 'number',
  isLoading = false,
}: StatsCardProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  // Use provided changeLabel or default from i18n
  const displayChangeLabel = changeLabel ?? t('vsLastPeriod');
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        // Use locale-appropriate currency symbol
        return locale === 'ja'
          ? `¥${val.toLocaleString('ja-JP')}`
          : `$${val.toLocaleString('en-US')}`;
      default:
        return val.toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US');
    }
  };

  const getChangeColor = (changeValue?: number) => {
    if (changeValue === undefined || changeValue === null) return 'text-gray-600 bg-gray-50';
    if (changeValue > 0) return 'text-green-700 bg-green-50';
    if (changeValue < 0) return 'text-red-700 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getChangePrefix = (changeValue?: number) => {
    if (changeValue === undefined || changeValue === null) return '';
    if (changeValue > 0) return '+';
    return '';
  };

  const getTrendIcon = (changeValue?: number) => {
    if (changeValue === undefined || changeValue === null) return Minus;
    if (changeValue > 0) return TrendingUp;
    if (changeValue < 0) return TrendingDown;
    return Minus;
  };

  if (isLoading) {
    return (
      <Card className="p-6 border-0 shadow-sm bg-white">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
            <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
            <div className="h-6 w-28 bg-gray-200 animate-pulse rounded-full" />
          </div>
          <div className={cn('p-3 rounded-xl', iconBgClassName, 'opacity-50')}>
            <div className="h-6 w-6 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </Card>
    );
  }

  const TrendIcon = getTrendIcon(change);

  return (
    <Card
      className="p-6 border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-300 group"
      role="region"
      aria-label={`${title}: ${formatValue(value)}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 mb-1 tracking-wide uppercase">
            {title}
          </h3>
          <p className="text-4xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-gray-800 transition-colors">
            {formatValue(value)}
          </p>
          {change !== undefined && change !== null && (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                getChangeColor(change)
              )}
              aria-label={`${getChangePrefix(change)}${change.toFixed(1)}% ${displayChangeLabel}`}
            >
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {getChangePrefix(change)}
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-gray-500 font-normal ml-1 hidden sm:inline">
                {displayChangeLabel}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'p-3 rounded-xl transition-transform duration-300 group-hover:scale-110',
              iconBgClassName
            )}
            aria-hidden="true"
          >
            <Icon className={cn('h-6 w-6', iconClassName)} />
          </div>
        )}
      </div>
    </Card>
  );
}
