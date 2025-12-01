'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';

const COLORS = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-400',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-300',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-300',
    text: 'text-red-700 dark:text-red-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-800 dark:text-green-300',
    text: 'text-green-700 dark:text-green-400',
  },
};

interface CalloutProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: keyof typeof COLORS;
  children?: React.ReactNode;
  className?: string;
}

export function Callout({ title, icon: Icon, color = 'blue', children, className }: CalloutProps) {
  const colorClasses = COLORS[color];

  return (
    <div className={cn('rounded-lg border p-4', colorClasses.bg, colorClasses.border, className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex-shrink-0 mt-0.5">
            <Icon className={cn('h-5 w-5', colorClasses.icon)} />
          </div>
        )}
        <div className="flex-1">
          <h4 className={cn('font-semibold', colorClasses.title)}>{title}</h4>
          {children && <div className={cn('mt-1 text-sm', colorClasses.text)}>{children}</div>}
        </div>
      </div>
    </div>
  );
}
