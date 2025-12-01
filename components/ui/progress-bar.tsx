'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

const COLORS = {
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  gray: 'bg-gray-500',
  yellow: 'bg-yellow-500',
};

interface ProgressBarProps {
  value: number;
  color?: keyof typeof COLORS;
  className?: string;
}

export function ProgressBar({ value, color = 'blue', className }: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
        className
      )}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500', COLORS[color])}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

interface CategoryBarProps {
  values: number[];
  colors?: (keyof typeof COLORS)[];
  markerValue?: number;
  className?: string;
}

export function CategoryBar({
  values,
  colors = ['red', 'yellow', 'emerald', 'blue'],
  markerValue,
  className,
}: CategoryBarProps) {
  const total = values.reduce((sum, v) => sum + v, 0);
  const percentages = values.map((v) => (total > 0 ? (v / total) * 100 : 0));

  return (
    <div className={cn('relative', className)}>
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        {percentages.map((pct, i) => (
          <div
            key={i}
            className={cn('h-full', COLORS[colors[i] || 'gray'])}
            style={{ width: `${pct}%` }}
          />
        ))}
      </div>
      {markerValue !== undefined && (
        <div
          className="absolute top-0 h-4 w-0.5 -translate-x-1/2 -translate-y-1 bg-gray-900 dark:bg-gray-100"
          style={{ left: `${markerValue}%` }}
        />
      )}
    </div>
  );
}

interface DeltaBarProps {
  value: number;
  className?: string;
}

export function DeltaBar({ value, className }: DeltaBarProps) {
  const isPositive = value >= 0;
  const absValue = Math.min(Math.abs(value), 100);

  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
        className
      )}
    >
      <div
        className={cn(
          'absolute h-full transition-all duration-500',
          isPositive ? 'bg-emerald-500 left-1/2' : 'bg-red-500 right-1/2'
        )}
        style={{ width: `${absValue / 2}%` }}
      />
      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gray-400 dark:bg-gray-500" />
    </div>
  );
}
