'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';

const COLORS = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    text: 'text-blue-700',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-800',
    text: 'text-yellow-700',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    title: 'text-red-800',
    text: 'text-red-700',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    title: 'text-green-800',
    text: 'text-green-700',
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
