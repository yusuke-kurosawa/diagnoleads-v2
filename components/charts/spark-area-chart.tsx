'use client';

import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

const COLORS = {
  blue: '#3b82f6',
  violet: '#8b5cf6',
  green: '#22c55e',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  gray: '#6b7280',
  yellow: '#eab308',
};

interface SparkAreaChartProps {
  data: { value: number }[];
  categories?: string[];
  colors?: (keyof typeof COLORS)[];
  curveType?: 'monotone' | 'linear';
  className?: string;
}

export function SparkAreaChart({
  data,
  categories = ['value'],
  colors = ['blue'],
  curveType = 'monotone',
  className,
}: SparkAreaChartProps) {
  return (
    <div className={cn('w-full h-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          {categories.map((category, i) => (
            <Area
              key={category}
              type={curveType}
              dataKey={category}
              stroke={COLORS[colors[i] || 'blue']}
              fill={COLORS[colors[i] || 'blue']}
              fillOpacity={0.3}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
