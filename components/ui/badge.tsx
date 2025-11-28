import { type VariantProps, cva } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gray-900 text-gray-50 hover:bg-gray-900/80',
        secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80',
        destructive: 'border-transparent bg-red-500 text-gray-50 hover:bg-red-500/80',
        outline: 'text-gray-950',
        blue: 'border-transparent bg-blue-100 text-blue-800',
        yellow: 'border-transparent bg-yellow-100 text-yellow-800',
        emerald: 'border-transparent bg-emerald-100 text-emerald-800',
        violet: 'border-transparent bg-violet-100 text-violet-800',
        amber: 'border-transparent bg-amber-100 text-amber-800',
        gray: 'border-transparent bg-gray-100 text-gray-800',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  color?: 'blue' | 'yellow' | 'emerald' | 'violet' | 'amber' | 'gray';
}

function Badge({ className, variant, size, color, ...props }: BadgeProps) {
  const colorVariant = color || variant;
  return (
    <div
      className={cn(badgeVariants({ variant: colorVariant as typeof variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
