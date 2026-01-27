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

interface RadialChartProps {
  value: number;
  maxValue?: number;
  label?: string;
  color?: keyof typeof COLORS;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
  className?: string;
  valueFormatter?: (value: number) => string;
}

export function RadialChart({
  value,
  maxValue = 100,
  label,
  color = 'blue',
  size = 'md',
  showAnimation = true,
  className,
  valueFormatter,
}: RadialChartProps) {
  const isDark = useIsDarkMode();
  const percentage = Math.min((value / maxValue) * 100, 100);

  const sizeMap = {
    sm: { height: 150, fontSize: '16px', labelSize: '12px' },
    md: { height: 200, fontSize: '20px', labelSize: '14px' },
    lg: { height: 280, fontSize: '28px', labelSize: '16px' },
  };

  const { height, fontSize, labelSize } = sizeMap[size];
  const trackColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#f3f4f6' : '#111827';
  const labelColor = isDark ? '#9ca3af' : '#6b7280';

  const options: ApexOptions = {
    colors: [COLORS[color]],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'radialBar',
      height: height,
      sparkline: {
        enabled: true,
      },
      animations: {
        enabled: showAnimation,
        speed: 800,
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
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          size: '65%',
        },
        track: {
          background: trackColor,
          strokeWidth: '100%',
          margin: 0,
        },
        dataLabels: {
          name: {
            show: !!label,
            fontSize: labelSize,
            color: labelColor,
            offsetY: 20,
          },
          value: {
            show: true,
            fontSize: fontSize,
            fontWeight: 600,
            color: textColor,
            offsetY: -10,
            formatter: () => {
              return valueFormatter ? valueFormatter(value) : `${value}`;
            },
          },
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: [COLORS[color]],
        opacityFrom: 1,
        opacityTo: 0.8,
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: 'round',
    },
    labels: label ? [label] : [],
  };

  return (
    <div className={cn('w-full', className)}>
      <ReactApexChart options={options} series={[percentage]} type="radialBar" height={height} />
    </div>
  );
}

interface MultiRadialChartProps {
  data: { name: string; value: number; color?: keyof typeof COLORS }[];
  maxValue?: number;
  showLabels?: boolean;
  showAnimation?: boolean;
  className?: string;
  height?: number;
}

export function MultiRadialChart({
  data,
  maxValue = 100,
  showLabels = true,
  showAnimation = true,
  className,
  height = 350,
}: MultiRadialChartProps) {
  const isDark = useIsDarkMode();
  const defaultColors: (keyof typeof COLORS)[] = ['blue', 'emerald', 'amber', 'violet', 'pink'];
  const series = data.map((item) => Math.min((item.value / maxValue) * 100, 100));
  const labels = data.map((item) => item.name);
  const colors = data.map(
    (item, i) => COLORS[item.color || defaultColors[i % defaultColors.length]]
  );

  const trackColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#f3f4f6' : '#111827';
  const labelColor = isDark ? '#9ca3af' : '#6b7280';

  const options: ApexOptions = {
    colors: colors,
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'radialBar',
      height: height,
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
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: {
          margin: 5,
          size: '30%',
          background: 'transparent',
        },
        track: {
          background: trackColor,
          strokeWidth: '100%',
        },
        dataLabels: {
          name: {
            show: showLabels,
            fontSize: '14px',
            color: labelColor,
          },
          value: {
            show: showLabels,
            fontSize: '16px',
            fontWeight: 600,
            color: textColor,
            formatter: (val) => `${Math.round(val)}%`,
          },
        },
        barLabels: {
          enabled: true,
          useSeriesColors: true,
          offsetX: -8,
          fontSize: '14px',
          formatter: (name, opts) => {
            return `${name}: ${data[opts.seriesIndex].value}`;
          },
        },
      },
    },
    labels: labels,
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: labelColor,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            show: false,
          },
        },
      },
    ],
  };

  return (
    <div className={cn('w-full', className)}>
      <ReactApexChart options={options} series={series} type="radialBar" height={height} />
    </div>
  );
}
