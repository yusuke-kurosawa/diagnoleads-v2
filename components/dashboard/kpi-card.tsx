'use client';

import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { SparkAreaChart } from '../charts';
import { AnimatedCounter, AnimatedPercentage, AnimatedScore } from '../ui/animated-counter';

const kpiCardVariants = cva(
  'relative overflow-hidden rounded-xl border bg-white p-6 transition-all duration-300 dark:bg-gray-800',
  {
    variants: {
      variant: {
        default: 'border-gray-200 dark:border-gray-700',
        gradient:
          'border-transparent bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900',
        elevated:
          'border-gray-100 shadow-lg hover:shadow-xl dark:border-gray-700 dark:shadow-gray-900/20',
      },
      color: {
        blue: '',
        emerald: '',
        violet: '',
        amber: '',
        rose: '',
        cyan: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      color: 'blue',
    },
  }
);

const iconContainerVariants = cva('flex h-12 w-12 items-center justify-center rounded-xl', {
  variants: {
    color: {
      blue: 'bg-blue-50 dark:bg-blue-900/30',
      emerald: 'bg-emerald-50 dark:bg-emerald-900/30',
      violet: 'bg-violet-50 dark:bg-violet-900/30',
      amber: 'bg-amber-50 dark:bg-amber-900/30',
      rose: 'bg-rose-50 dark:bg-rose-900/30',
      cyan: 'bg-cyan-50 dark:bg-cyan-900/30',
    },
  },
  defaultVariants: {
    color: 'blue',
  },
});

const iconVariants = cva('h-6 w-6', {
  variants: {
    color: {
      blue: 'text-blue-600 dark:text-blue-400',
      emerald: 'text-emerald-600 dark:text-emerald-400',
      violet: 'text-violet-600 dark:text-violet-400',
      amber: 'text-amber-600 dark:text-amber-400',
      rose: 'text-rose-600 dark:text-rose-400',
      cyan: 'text-cyan-600 dark:text-cyan-400',
    },
  },
  defaultVariants: {
    color: 'blue',
  },
});

const decorationVariants = cva(
  'absolute top-0 left-0 h-1 w-full rounded-t-xl transition-all duration-300',
  {
    variants: {
      color: {
        blue: 'bg-blue-500',
        emerald: 'bg-emerald-500',
        violet: 'bg-violet-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
        cyan: 'bg-cyan-500',
      },
    },
    defaultVariants: {
      color: 'blue',
    },
  }
);

interface KPICardProps extends VariantProps<typeof kpiCardVariants> {
  title: string;
  value: number;
  icon: LucideIcon;
  valueType?: 'number' | 'percentage' | 'score' | 'currency';
  maxValue?: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  decimals?: number;
  change?: number;
  changeLabel?: string;
  sparkData?: { value: number }[];
  sparkColor?: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan';
  showDecoration?: boolean;
  isLoading?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * Enhanced KPI Card with animations and TailAdmin styling
 */
export function KPICard({
  title,
  value,
  icon: Icon,
  valueType = 'number',
  maxValue = 100,
  prefix,
  suffix,
  locale = 'en-US',
  decimals = 0,
  change,
  changeLabel,
  sparkData,
  sparkColor,
  variant = 'default',
  color = 'blue',
  showDecoration = true,
  isLoading = false,
  className,
  children,
}: KPICardProps) {
  const renderValue = () => {
    if (isLoading) {
      return (
        <span className="inline-block h-9 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      );
    }

    switch (valueType) {
      case 'percentage':
        return (
          <AnimatedPercentage
            value={value}
            decimals={decimals}
            className="text-3xl font-bold text-gray-900 dark:text-gray-100"
          />
        );
      case 'score':
        return (
          <AnimatedScore
            value={value}
            maxValue={maxValue}
            className="text-3xl font-bold text-gray-900 dark:text-gray-100"
          />
        );
      case 'currency':
        return (
          <AnimatedCounter
            value={value}
            prefix={prefix || '¥'}
            decimals={decimals}
            locale={locale}
            className="text-3xl font-bold text-gray-900 dark:text-gray-100"
          />
        );
      default:
        return (
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            locale={locale}
            className="text-3xl font-bold text-gray-900 dark:text-gray-100"
          />
        );
    }
  };

  const renderChange = () => {
    if (change === undefined || isLoading) return null;

    const isPositive = change >= 0;
    const changeColor = isPositive
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
      : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30';

    return (
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            changeColor
          )}
        >
          <svg
            className={cn('mr-0.5 h-3 w-3', !isPositive && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          {isPositive ? '+' : ''}
          {change.toFixed(1)}%
        </span>
        {changeLabel && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{changeLabel}</span>
        )}
      </div>
    );
  };

  return (
    <div className={cn(kpiCardVariants({ variant, color }), 'group', className)}>
      {showDecoration && <div className={decorationVariants({ color })} />}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <div className="mt-2">{renderValue()}</div>
        </div>
        <div className={iconContainerVariants({ color })}>
          <Icon className={iconVariants({ color })} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {renderChange()}
        {sparkData && sparkData.length > 0 && (
          <SparkAreaChart
            data={sparkData}
            categories={['value']}
            colors={[sparkColor || color || 'blue']}
            className="h-10 w-24"
            curveType="smooth"
          />
        )}
      </div>

      {children}
    </div>
  );
}

interface KPICardGroupProps {
  children: ReactNode;
  className?: string;
}

/**
 * Container for KPI cards with responsive grid
 */
export function KPICardGroup({ children, className }: KPICardGroupProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {children}
    </div>
  );
}
