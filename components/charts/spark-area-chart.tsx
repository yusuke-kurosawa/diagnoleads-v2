'use client';

import { cn } from '@/lib/utils';
import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

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
  brand: '#465fff',
};

interface SparkAreaChartProps {
  data: { value: number }[];
  categories?: string[];
  colors?: (keyof typeof COLORS)[];
  curveType?: 'smooth' | 'straight' | 'stepline';
  className?: string;
  height?: number;
}

export function SparkAreaChart({
  data,
  categories = ['value'],
  colors = ['blue'],
  curveType = 'smooth',
  className,
  height = 60,
}: SparkAreaChartProps) {
  const series = categories.map((category) => ({
    name: category,
    data: data.map((item) => (item as Record<string, number>)[category] ?? item.value ?? 0),
  }));

  const options: ApexOptions = {
    colors: colors.map((c) => COLORS[c] || COLORS.blue),
    chart: {
      type: 'area',
      height: height,
      sparkline: {
        enabled: true,
      },
      animations: {
        enabled: false,
      },
    },
    title: {
      text: '',
      offsetX: 0,
      offsetY: 0,
    },
    subtitle: {
      text: '',
      offsetX: 0,
      offsetY: 0,
    },
    stroke: {
      curve: curveType,
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    tooltip: {
      enabled: false,
    },
  };

  return (
    <div className={cn('w-full h-full', className)}>
      <ReactApexChart options={options} series={series} type="area" height={height} />
    </div>
  );
}
