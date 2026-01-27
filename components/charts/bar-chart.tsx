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

interface BarChartProps {
  data: Record<string, unknown>[];
  index: string;
  categories: string[];
  colors?: (keyof typeof COLORS)[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showGridLines?: boolean;
  showAnimation?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
  height?: number;
}

export function BarChart({
  data,
  index,
  categories,
  colors = ['blue'],
  valueFormatter = (v) => v.toLocaleString(),
  showLegend = false,
  showGridLines = true,
  showAnimation = true,
  layout = 'horizontal',
  className,
  height = 350,
}: BarChartProps) {
  const isVertical = layout === 'vertical';
  const xAxisCategories = data.map((item) => String(item[index]));
  const series = categories.map((category) => ({
    name: category,
    data: data.map((item) => Number(item[category]) || 0),
  }));

  const options: ApexOptions = {
    colors: colors.map((c) => COLORS[c] || COLORS.blue),
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      height: height,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: showAnimation,
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
    plotOptions: {
      bar: {
        horizontal: isVertical,
        columnWidth: '50%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    grid: {
      show: showGridLines,
      borderColor: '#e5e7eb',
      xaxis: {
        lines: {
          show: isVertical,
        },
      },
      yaxis: {
        lines: {
          show: !isVertical && showGridLines,
        },
      },
    },
    xaxis: {
      categories: xAxisCategories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6b7280',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          colors: ['#6b7280'],
        },
        formatter: (val: number) => valueFormatter(val),
      },
    },
    legend: {
      show: showLegend,
      position: 'top',
      horizontalAlign: 'left',
      fontFamily: 'Outfit',
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val: number) => valueFormatter(val),
      },
    },
  };

  return (
    <div className={cn('w-full', className)}>
      <ReactApexChart options={options} series={series} type="bar" height={height} />
    </div>
  );
}
