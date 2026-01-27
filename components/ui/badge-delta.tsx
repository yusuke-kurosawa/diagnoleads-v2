'use client';

import { cn } from '@/lib/utils';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type * as React from 'react';

interface BadgeDeltaProps {
  deltaType: 'increase' | 'decrease' | 'unchanged';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function BadgeDelta({ deltaType, size = 'md', children, className }: BadgeDeltaProps) {
  const Icon =
    deltaType === 'increase' ? TrendingUp : deltaType === 'decrease' ? TrendingDown : Minus;

  const colorClasses = {
    increase: 'bg-emerald-100 text-emerald-800',
    decrease: 'bg-red-100 text-red-800',
    unchanged: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeClasses[size],
        colorClasses[deltaType],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {children}
    </span>
  );
}
