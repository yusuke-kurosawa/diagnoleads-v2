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

interface InteractiveAreaChartProps {
  data: Record<string, unknown>[];
  index: string;
  categories: string[];
  colors?: (keyof typeof COLORS)[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showGridLines?: boolean;
  showAnimation?: boolean;
  showToolbar?: boolean;
  enableZoom?: boolean;
  enableDownload?: boolean;
  className?: string;
  curveType?: 'smooth' | 'straight' | 'stepline';
  height?: number;
  title?: string;
  subtitle?: string;
}

/**
 * Interactive Area Chart with zoom, pan, and download capabilities
 */
export function InteractiveAreaChart({
  data,
  index,
  categories,
  colors = ['blue', 'violet'],
  valueFormatter = (v) => v.toLocaleString(),
  showLegend = true,
  showGridLines = true,
  showAnimation = true,
  showToolbar = true,
  enableZoom = true,
  enableDownload = true,
  className,
  curveType = 'smooth',
  height = 350,
  title,
  subtitle,
}: InteractiveAreaChartProps) {
  const isDark = useIsDarkMode();
  const xAxisCategories = data.map((item) => String(item[index]));
  const series = categories.map((category) => ({
    name: category,
    data: data.map((item) => Number(item[category]) || 0),
  }));

  const textColor = isDark ? '#d1d5db' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const legendColor = isDark ? '#e5e7eb' : '#374151';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';

  const options: ApexOptions = {
    colors: colors.map((c) => COLORS[c] || COLORS.blue),
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'area',
      height: height,
      toolbar: {
        show: showToolbar,
        tools: {
          download: enableDownload,
          selection: enableZoom,
          zoom: enableZoom,
          zoomin: enableZoom,
          zoomout: enableZoom,
          pan: enableZoom,
          reset: enableZoom,
        },
        autoSelected: 'zoom',
        export: {
          csv: {
            filename: 'chart-data',
            columnDelimiter: ',',
            headerCategory: 'Date',
            headerValue: 'Value',
          },
          svg: {
            filename: 'chart',
          },
          png: {
            filename: 'chart',
          },
        },
      },
      zoom: {
        enabled: enableZoom,
        type: 'x',
        autoScaleYaxis: true,
      },
      animations: {
        enabled: showAnimation,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
      foreColor: textColor,
      selection: {
        enabled: enableZoom,
        type: 'x',
        fill: {
          color: COLORS.blue,
          opacity: 0.1,
        },
        stroke: {
          width: 1,
          dashArray: 3,
          color: COLORS.blue,
          opacity: 0.4,
        },
      },
    },
    title: title
      ? {
          text: title,
          align: 'left',
          style: {
            fontSize: '16px',
            fontWeight: 600,
            color: isDark ? '#f3f4f6' : '#111827',
          },
        }
      : undefined,
    subtitle: subtitle
      ? {
          text: subtitle,
          align: 'left',
          style: {
            fontSize: '13px',
            color: textColor,
          },
        }
      : undefined,
    stroke: {
      curve: curveType,
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    markers: {
      size: 0,
      strokeColors: isDark ? '#1f2937' : '#fff',
      strokeWidth: 2,
      hover: {
        size: 6,
        sizeOffset: 3,
      },
    },
    grid: {
      show: showGridLines,
      borderColor: gridColor,
      strokeDashArray: 4,
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
      shared: true,
      intersect: false,
      theme: isDark ? 'dark' : 'light',
      style: {
        fontSize: '12px',
      },
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => valueFormatter(val),
      },
      marker: {
        show: true,
      },
    },
    legend: {
      show: showLegend,
      position: 'top',
      horizontalAlign: 'left',
      fontFamily: 'Outfit',
      fontSize: '13px',
      labels: {
        colors: legendColor,
      },
      markers: {
        size: 8,
        strokeWidth: 0,
        offsetX: -2,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 0,
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
        rotate: -45,
        rotateAlways: false,
      },
      crosshairs: {
        show: true,
        position: 'back',
        stroke: {
          color: gridColor,
          width: 1,
          dashArray: 4,
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
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 280,
            toolbar: {
              show: false,
            },
          },
          legend: {
            position: 'bottom',
            horizontalAlign: 'center',
          },
          xaxis: {
            labels: {
              rotate: 0,
              style: {
                fontSize: '10px',
              },
            },
          },
        },
      },
    ],
  };

  return (
    <div className={cn('w-full', className)}>
      <ReactApexChart options={options} series={series} type="area" height={height} />
    </div>
  );
}

interface BrushChartProps {
  data: Record<string, unknown>[];
  index: string;
  category: string;
  color?: keyof typeof COLORS;
  valueFormatter?: (value: number) => string;
  className?: string;
  mainHeight?: number;
  brushHeight?: number;
}

/**
 * Area Chart with brush selector for time range
 */
export function BrushChart({
  data,
  index,
  category,
  color = 'blue',
  valueFormatter = (v) => v.toLocaleString(),
  className,
  mainHeight = 280,
  brushHeight = 100,
}: BrushChartProps) {
  const isDark = useIsDarkMode();
  const xAxisCategories = data.map((item) => String(item[index]));
  const seriesData = data.map((item) => Number(item[category]) || 0);

  const textColor = isDark ? '#d1d5db' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';

  const mainOptions: ApexOptions = {
    colors: [COLORS[color]],
    chart: {
      id: 'chart-main',
      fontFamily: 'Outfit, sans-serif',
      type: 'area',
      height: mainHeight,
      toolbar: {
        show: false,
        autoSelected: 'pan',
      },
      foreColor: textColor,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => valueFormatter(val),
      },
    },
    xaxis: {
      type: 'category',
      categories: xAxisCategories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: textColor },
      },
    },
    yaxis: {
      labels: {
        style: { colors: [textColor] },
        formatter: (val: number) => valueFormatter(val),
      },
    },
  };

  const brushOptions: ApexOptions = {
    colors: [COLORS[color]],
    chart: {
      id: 'chart-brush',
      fontFamily: 'Outfit, sans-serif',
      type: 'area',
      height: brushHeight,
      brush: {
        target: 'chart-main',
        enabled: true,
      },
      selection: {
        enabled: true,
        fill: {
          color: COLORS[color],
          opacity: 0.2,
        },
      },
      foreColor: textColor,
    },
    stroke: {
      curve: 'smooth',
      width: 1,
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.3,
        opacityTo: 0.05,
      },
    },
    grid: {
      borderColor: gridColor,
    },
    xaxis: {
      type: 'category',
      categories: xAxisCategories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { show: false },
    },
    yaxis: {
      labels: { show: false },
    },
  };

  return (
    <div className={cn('w-full', className)}>
      <ReactApexChart
        options={mainOptions}
        series={[{ name: category, data: seriesData }]}
        type="area"
        height={mainHeight}
      />
      <ReactApexChart
        options={brushOptions}
        series={[{ name: category, data: seriesData }]}
        type="area"
        height={brushHeight}
      />
    </div>
  );
}
