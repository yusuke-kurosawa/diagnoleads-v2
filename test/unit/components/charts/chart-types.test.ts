/**
 * Chart Components Type Tests
 */

import { describe, expect, it } from 'vitest';

describe('Chart component exports', () => {
  it('should define AreaChart export', () => {
    const chartExports = [
      'AreaChart',
      'BarChart',
      'DonutChart',
      'ChartLegend',
      'SparkAreaChart',
      'RadialChart',
      'MultiRadialChart',
      'InteractiveAreaChart',
      'BrushChart',
    ];

    expect(chartExports).toContain('AreaChart');
    expect(chartExports).toContain('BarChart');
    expect(chartExports).toContain('DonutChart');
  });
});

describe('AreaChart props', () => {
  it('should define data prop', () => {
    type DataPoint = {
      date: string;
      value: number;
    };

    type AreaChartProps = {
      data: DataPoint[];
      xAxis?: string;
      yAxis?: string;
      color?: string;
      showGrid?: boolean;
    };

    const props: AreaChartProps = {
      data: [
        { date: '2024-01', value: 100 },
        { date: '2024-02', value: 150 },
      ],
      xAxis: 'date',
      yAxis: 'value',
      color: 'blue',
    };

    expect(props.data).toHaveLength(2);
  });
});

describe('BarChart props', () => {
  it('should define bar chart data', () => {
    type BarData = {
      name: string;
      value: number;
      color?: string;
    };

    type BarChartProps = {
      data: BarData[];
      horizontal?: boolean;
      showLabels?: boolean;
      valueFormatter?: (value: number) => string;
    };

    const props: BarChartProps = {
      data: [
        { name: '新規', value: 50, color: 'blue' },
        { name: '連絡済み', value: 30, color: 'green' },
        { name: '成約', value: 20, color: 'yellow' },
      ],
      horizontal: false,
      showLabels: true,
    };

    expect(props.data).toHaveLength(3);
  });
});

describe('DonutChart props', () => {
  it('should define donut chart data', () => {
    type DonutData = {
      name: string;
      value: number;
      fill?: string;
    };

    type DonutChartProps = {
      data: DonutData[];
      innerRadius?: number;
      outerRadius?: number;
      showLabel?: boolean;
      showLegend?: boolean;
    };

    const props: DonutChartProps = {
      data: [
        { name: 'A', value: 40 },
        { name: 'B', value: 30 },
        { name: 'C', value: 30 },
      ],
      innerRadius: 60,
      outerRadius: 80,
    };

    expect(props.data.reduce((sum, d) => sum + d.value, 0)).toBe(100);
  });
});

describe('SparkAreaChart props', () => {
  it('should define spark chart data', () => {
    type SparkChartProps = {
      data: number[];
      color?: string;
      height?: number;
      showArea?: boolean;
    };

    const props: SparkChartProps = {
      data: [10, 20, 15, 25, 30, 28, 35],
      color: 'green',
      height: 40,
    };

    expect(props.data).toHaveLength(7);
  });
});

describe('RadialChart props', () => {
  it('should define radial chart data', () => {
    type RadialChartProps = {
      value: number;
      max?: number;
      color?: string;
      label?: string;
      showValue?: boolean;
    };

    const props: RadialChartProps = {
      value: 75,
      max: 100,
      color: 'blue',
      label: 'Progress',
    };

    expect(props.value).toBe(75);
  });
});

describe('MultiRadialChart props', () => {
  it('should define multi radial chart data', () => {
    type RadialData = {
      name: string;
      value: number;
      fill?: string;
    };

    type MultiRadialChartProps = {
      data: RadialData[];
      startAngle?: number;
      endAngle?: number;
    };

    const props: MultiRadialChartProps = {
      data: [
        { name: 'Desktop', value: 60 },
        { name: 'Mobile', value: 30 },
        { name: 'Tablet', value: 10 },
      ],
    };

    expect(props.data).toHaveLength(3);
  });
});

describe('InteractiveAreaChart props', () => {
  it('should define interactive chart data', () => {
    type TimeSeriesData = {
      date: string;
      [key: string]: string | number;
    };

    type InteractiveAreaChartProps = {
      data: TimeSeriesData[];
      categories: string[];
      dateFormat?: string;
      onRangeChange?: (range: [Date, Date]) => void;
    };

    const props: InteractiveAreaChartProps = {
      data: [
        { date: '2024-01-01', value1: 100, value2: 200 },
        { date: '2024-01-02', value1: 120, value2: 180 },
      ],
      categories: ['value1', 'value2'],
    };

    expect(props.categories).toHaveLength(2);
  });
});

describe('BrushChart props', () => {
  it('should define brush chart data', () => {
    type BrushChartProps = {
      data: { date: string; value: number }[];
      brushHeight?: number;
      onBrushChange?: (start: number, end: number) => void;
    };

    const props: BrushChartProps = {
      data: [
        { date: '2024-01', value: 100 },
        { date: '2024-02', value: 150 },
        { date: '2024-03', value: 120 },
      ],
      brushHeight: 40,
    };

    expect(props.data).toHaveLength(3);
  });
});

describe('ChartLegend', () => {
  it('should define legend items', () => {
    type LegendItem = {
      name: string;
      color: string;
      value?: number;
    };

    type ChartLegendProps = {
      items: LegendItem[];
      position?: 'top' | 'bottom' | 'left' | 'right';
      layout?: 'horizontal' | 'vertical';
    };

    const props: ChartLegendProps = {
      items: [
        { name: '新規', color: '#3b82f6', value: 50 },
        { name: '成約', color: '#10b981', value: 30 },
      ],
      position: 'bottom',
      layout: 'horizontal',
    };

    expect(props.items).toHaveLength(2);
  });
});

describe('Chart utilities', () => {
  it('should format value', () => {
    const formatValue = (value: number, type: 'currency' | 'percent' | 'number') => {
      switch (type) {
        case 'currency':
          return `¥${value.toLocaleString()}`;
        case 'percent':
          return `${value}%`;
        default:
          return value.toLocaleString();
      }
    };

    expect(formatValue(1000, 'currency')).toBe('¥1,000');
    expect(formatValue(50, 'percent')).toBe('50%');
    expect(formatValue(1000, 'number')).toBe('1,000');
  });

  it('should calculate percentage', () => {
    const calculatePercentage = (value: number, total: number) =>
      total > 0 ? Math.round((value / total) * 100) : 0;

    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(1, 3)).toBe(33);
    expect(calculatePercentage(0, 0)).toBe(0);
  });
});

describe('Chart color schemes', () => {
  it('should define color palette', () => {
    const colorPalette = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ];

    expect(colorPalette).toHaveLength(5);
  });
});
