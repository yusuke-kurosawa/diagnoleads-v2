'use client';

import { cn } from '@/lib/utils';
import {
  Area,
  CartesianGrid,
  Legend,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = {
  blue: '#3b82f6',
  violet: '#8b5cf6',
  green: '#22c55e',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  gray: '#6b7280',
  yellow: '#eab308',
  cyan: '#06b6d4',
  pink: '#ec4899',
  rose: '#f43f5e',
};

interface AreaChartProps {
  data: Record<string, unknown>[];
  index: string;
  categories: string[];
  colors?: (keyof typeof COLORS)[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showGridLines?: boolean;
  showAnimation?: boolean;
  className?: string;
  curveType?: 'monotone' | 'linear';
}

export function AreaChart({
  data,
  index,
  categories,
  colors = ['blue', 'violet'],
  valueFormatter = (v) => v.toLocaleString(),
  showLegend = true,
  showGridLines = true,
  showAnimation = true,
  className,
  curveType = 'monotone',
}: AreaChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showGridLines && <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />}
          <XAxis
            dataKey={index}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-gray-500"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => valueFormatter(value)}
            className="text-gray-500"
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border bg-white p-3 shadow-lg">
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  {payload.map((entry, i) => (
                    <p key={i} className="text-sm" style={{ color: entry.color }}>
                      {entry.name}: {valueFormatter(entry.value as number)}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              content={({ payload }) => (
                <div className="flex justify-center gap-4 pt-2">
                  {payload?.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-gray-600">{entry.value}</span>
                    </div>
                  ))}
                </div>
              )}
            />
          )}
          {categories.map((category, i) => (
            <Area
              key={category}
              type={curveType}
              dataKey={category}
              stroke={COLORS[colors[i] || 'blue']}
              fill={COLORS[colors[i] || 'blue']}
              fillOpacity={0.2}
              strokeWidth={2}
              isAnimationActive={showAnimation}
              animationDuration={1000}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
