'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  alignItems?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  flexDirection?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  children: React.ReactNode;
}

const alignItemsMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

const justifyContentMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const flexDirectionMap = {
  row: 'flex-row',
  col: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'col-reverse': 'flex-col-reverse',
};

export function Flex({
  alignItems = 'center',
  justifyContent = 'between',
  flexDirection = 'row',
  children,
  className,
  ...props
}: FlexProps) {
  return (
    <div
      className={cn(
        'flex',
        alignItemsMap[alignItems],
        justifyContentMap[justifyContent],
        flexDirectionMap[flexDirection],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  numItemsSm?: number;
  numItemsLg?: number;
  children: React.ReactNode;
}

export function Grid({ numItemsSm = 1, numItemsLg = 4, children, className, ...props }: GridProps) {
  const smCols = `sm:grid-cols-${numItemsSm}`;
  const lgCols = `lg:grid-cols-${numItemsLg}`;

  return (
    <div
      className={cn('grid grid-cols-1', className)}
      style={{
        gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
      }}
      data-sm-cols={numItemsSm}
      data-lg-cols={numItemsLg}
      {...props}
    >
      {children}
    </div>
  );
}
