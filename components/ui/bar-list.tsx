'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';

interface BarListItem {
  name: string;
  value: number;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BarListProps {
  data: BarListItem[];
  valueFormatter?: (value: number) => string;
  showAnimation?: boolean;
  className?: string;
}

export function BarList({
  data,
  valueFormatter = (v) => v.toLocaleString(),
  showAnimation = true,
  className,
}: BarListProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className={cn('space-y-3', className)}>
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const Icon = item.icon;

        return (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {valueFormatter(item.value)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className={cn(
                  'h-full rounded-full bg-blue-500',
                  showAnimation && 'transition-all duration-500'
                )}
                style={{
                  width: `${percentage}%`,
                  transitionDelay: showAnimation ? `${index * 50}ms` : '0ms',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
