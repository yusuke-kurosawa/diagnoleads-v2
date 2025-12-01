import * as React from 'react';

import { cn } from '@/lib/utils';

const decorationColors = {
  blue: 'border-t-blue-500',
  violet: 'border-t-violet-500',
  emerald: 'border-t-emerald-500',
  amber: 'border-t-amber-500',
  yellow: 'border-t-yellow-500',
  red: 'border-t-red-500',
  green: 'border-t-green-500',
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  decoration?: 'top' | 'left';
  decorationColor?: keyof typeof decorationColors;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, decoration, decorationColor = 'blue', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-white text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50',
        decoration === 'top' && 'border-t-4',
        decoration === 'left' && 'border-l-4',
        decoration && decorationColors[decorationColor],
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
