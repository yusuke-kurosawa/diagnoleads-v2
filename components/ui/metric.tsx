'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';

interface MetricProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function Metric({ children, className, ...props }: MetricProps) {
  return (
    <p className={cn('text-3xl font-bold text-gray-900 dark:text-gray-50', className)} {...props}>
      {children}
    </p>
  );
}

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function Title({ children, className, ...props }: TitleProps) {
  return (
    <h3
      className={cn('text-lg font-semibold text-gray-900 dark:text-gray-50', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function Text({ children, className, ...props }: TextProps) {
  return (
    <p className={cn('text-sm text-gray-600 dark:text-gray-400', className)} {...props}>
      {children}
    </p>
  );
}

interface DividerProps {
  className?: string;
}

export function Divider({ className }: DividerProps) {
  return <hr className={cn('my-4 border-gray-200 dark:border-gray-700', className)} />;
}
