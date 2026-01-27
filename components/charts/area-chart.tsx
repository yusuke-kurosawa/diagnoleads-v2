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
  curveType?: 'smooth' | 'straight' | 'stepline';
  height?: number;
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
  curveType = 'smooth',
  height = 350,
}: AreaChartProps) {
  const isDark = useIsDarkMode();
  const xAxisCategories = data.map((item) => String(item[index]));
  const series = categories.map((category, i) => ({
    name: category,
    data: data.map((item) => Number(item[category]) || 0),
  }));

  const textColor = isDark ? '#d1d5db' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const legendColor = isDark ? '#e5e7eb' : '#374151';

  const options: ApexOptions = {
    colors: colors.map((c) => COLORS[c] || COLORS.blue),
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'area',
      height: height,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: showAnimation,
      },
      foreColor: textColor,
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
    markers: {
      size: 0,
      strokeColors: isDark ? '#1f2937' : '#fff',
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      show: showGridLines,
      borderColor: gridColor,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: showGridLines,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => valueFormatter(val),
      },
    },
    legend: {
      show: showLegend,
      position: 'bottom',
      horizontalAlign: 'center',
      fontFamily: 'Outfit',
      labels: {
        colors: legendColor,
      },
    },
    xaxis: {
      type: 'category',
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
          colors: textColor,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          colors: [textColor],
        },
        formatter: (val: number) => valueFormatter(val),
      },
    },
  };

  return (
    <div className={cn('w-full', className)}>
      <ReactApexChart options={options} series={series} type="area" height={height} />
    </div>
  );
}
