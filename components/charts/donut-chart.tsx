'use client';

import { cn } from '@/lib/utils';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

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

interface DonutChartProps {
  data: { name: string; value: number }[];
  index?: string;
  category?: string;
  colors?: (keyof typeof COLORS)[];
  valueFormatter?: (value: number) => string;
  showLabel?: boolean;
  showAnimation?: boolean;
  className?: string;
}

export function DonutChart({
  data,
  colors = ['blue', 'yellow', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'pink'],
  valueFormatter = (v) => v.toLocaleString(),
  showLabel = true,
  showAnimation = true,
  className,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            isAnimationActive={showAnimation}
            animationDuration={1000}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[colors[index % colors.length] || 'blue']} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0];
              return (
                <div className="rounded-lg border bg-white p-3 shadow-lg">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{valueFormatter(item.value as number)}</p>
                  <p className="text-xs text-gray-400">
                    {total > 0 ? (((item.value as number) / total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              );
            }}
          />
          {showLabel && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-900 text-2xl font-bold"
            >
              {valueFormatter(total)}
            </text>
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface LegendProps {
  categories: string[];
  colors?: (keyof typeof COLORS)[];
  className?: string;
}

export function ChartLegend({
  categories,
  colors = ['blue', 'yellow', 'emerald', 'violet'],
  className,
}: LegendProps) {
  return (
    <div className={cn('flex flex-wrap justify-center gap-4', className)}>
      {categories.map((category, i) => (
        <div key={category} className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: COLORS[colors[i % colors.length] || 'blue'] }}
          />
          <span className="text-sm text-gray-600">{category}</span>
        </div>
      ))}
    </div>
  );
}
