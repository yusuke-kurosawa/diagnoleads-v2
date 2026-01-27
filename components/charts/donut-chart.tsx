'use client';

import { cn } from '@/lib/utils';
import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

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

interface DonutChartProps {
  data: { name: string; value: number }[];
  index?: string;
  category?: string;
  colors?: (keyof typeof COLORS)[];
  valueFormatter?: (value: number) => string;
  showLabel?: boolean;
  showAnimation?: boolean;
  className?: string;
  height?: number;
}

export function DonutChart({
  data,
  colors = ['blue', 'yellow', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'pink'],
  valueFormatter = (v) => v.toLocaleString(),
  showLabel = true,
  showAnimation = true,
  className,
  height = 350,
}: DonutChartProps) {
  const isDark = useIsDarkMode();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const series = data.map((item) => item.value);
  const labels = data.map((item) => item.name);

  const labelColor = isDark ? '#d1d5db' : '#6b7280';
  const valueColor = isDark ? '#f3f4f6' : '#111827';
  const legendColor = isDark ? '#e5e7eb' : '#374151';
  const strokeColor = isDark ? '#1f2937' : '#fff';

  const options: ApexOptions = {
    colors: colors.slice(0, data.length).map((c) => COLORS[c] || COLORS.blue),
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'donut',
      height: height,
      animations: {
        enabled: showAnimation,
      },
      foreColor: labelColor,
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
    labels: labels,
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontFamily: 'Outfit',
      labels: {
        colors: legendColor,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: showLabel,
            total: {
              show: showLabel,
              label: '合計',
              fontSize: '14px',
              color: labelColor,
              formatter: () => valueFormatter(total),
            },
            value: {
              fontSize: '24px',
              fontWeight: 600,
              color: valueColor,
              formatter: (val) => valueFormatter(Number(val)),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 2,
      colors: [strokeColor],
    },
    tooltip: {
      enabled: true,
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => {
          const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
          return `${valueFormatter(val)} (${percentage}%)`;
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
  };

  return (
    <div className={cn('w-full', className)}>
      <ReactApexChart options={options} series={series} type="donut" height={height} />
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
          <span className="text-sm text-gray-600 dark:text-gray-300">{category}</span>
        </div>
      ))}
    </div>
  );
}
