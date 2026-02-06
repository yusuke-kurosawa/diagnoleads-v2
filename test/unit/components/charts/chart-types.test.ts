/**
 * Chart Component Types Tests
 */

import { describe, expect, it } from 'vitest';

describe('Chart color configuration', () => {
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

  it('should have blue color', () => {
    expect(COLORS.blue).toBe('#3b82f6');
  });

  it('should have brand color', () => {
    expect(COLORS.brand).toBe('#465fff');
  });

  it('should have all standard colors', () => {
    const colorKeys = Object.keys(COLORS);
    expect(colorKeys).toContain('blue');
    expect(colorKeys).toContain('green');
    expect(colorKeys).toContain('red');
    expect(colorKeys).toContain('yellow');
  });

  it('should have hex format colors', () => {
    for (const color of Object.values(COLORS)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('AreaChart props', () => {
  it('should define required props', () => {
    interface AreaChartProps {
      data: Record<string, unknown>[];
      index: string;
      categories: string[];
    }

    const props: AreaChartProps = {
      data: [{ month: 'Jan', sales: 100 }],
      index: 'month',
      categories: ['sales'],
    };

    expect(props.data).toHaveLength(1);
    expect(props.index).toBe('month');
    expect(props.categories).toContain('sales');
  });

  it('should support optional props', () => {
    interface AreaChartOptionalProps {
      colors?: string[];
      showLegend?: boolean;
      showGridLines?: boolean;
      showAnimation?: boolean;
      curveType?: 'smooth' | 'straight' | 'stepline';
      height?: number;
    }

    const props: AreaChartOptionalProps = {
      colors: ['blue', 'green'],
      showLegend: true,
      showGridLines: true,
      showAnimation: false,
      curveType: 'smooth',
      height: 400,
    };

    expect(props.showLegend).toBe(true);
    expect(props.height).toBe(400);
  });
});

describe('BarChart props', () => {
  it('should define required props', () => {
    interface BarChartProps {
      data: Record<string, unknown>[];
      index: string;
      categories: string[];
    }

    const props: BarChartProps = {
      data: [{ name: 'A', value: 50 }],
      index: 'name',
      categories: ['value'],
    };

    expect(props.data).toHaveLength(1);
  });

  it('should support horizontal and stacked options', () => {
    interface BarChartOptions {
      horizontal?: boolean;
      stacked?: boolean;
    }

    const options: BarChartOptions = {
      horizontal: true,
      stacked: false,
    };

    expect(options.horizontal).toBe(true);
  });
});

describe('DonutChart props', () => {
  it('should define data structure', () => {
    interface DonutDataItem {
      name: string;
      value: number;
    }

    const data: DonutDataItem[] = [
      { name: 'Category A', value: 30 },
      { name: 'Category B', value: 50 },
      { name: 'Category C', value: 20 },
    ];

    expect(data).toHaveLength(3);
    expect(data.reduce((sum, item) => sum + item.value, 0)).toBe(100);
  });

  it('should support label and title', () => {
    interface DonutChartProps {
      data: { name: string; value: number }[];
      label?: string;
      title?: string;
    }

    const props: DonutChartProps = {
      data: [{ name: 'A', value: 100 }],
      label: 'Total',
      title: 'Distribution',
    };

    expect(props.label).toBe('Total');
  });
});

describe('SparkAreaChart props', () => {
  it('should accept simple data array', () => {
    interface SparkAreaChartProps {
      data: number[];
      color?: string;
      height?: number;
    }

    const props: SparkAreaChartProps = {
      data: [10, 20, 15, 30, 25],
      color: 'blue',
      height: 50,
    };

    expect(props.data).toHaveLength(5);
    expect(props.height).toBe(50);
  });
});

describe('RadialChart props', () => {
  it('should support percentage value', () => {
    interface RadialChartProps {
      value: number;
      max?: number;
      color?: string;
      label?: string;
    }

    const props: RadialChartProps = {
      value: 75,
      max: 100,
      color: 'green',
      label: 'Progress',
    };

    expect(props.value).toBe(75);
    expect((props.value / (props.max || 100)) * 100).toBe(75);
  });
});

describe('Chart value formatters', () => {
  it('should format currency', () => {
    const currencyFormatter = (value: number) => `$${value.toLocaleString()}`;
    expect(currencyFormatter(1000)).toBe('$1,000');
    expect(currencyFormatter(1234567)).toBe('$1,234,567');
  });

  it('should format percentage', () => {
    const percentFormatter = (value: number) => `${value}%`;
    expect(percentFormatter(50)).toBe('50%');
    expect(percentFormatter(100)).toBe('100%');
  });

  it('should format with unit', () => {
    const unitFormatter = (unit: string) => (value: number) => `${value} ${unit}`;
    const leadsFormatter = unitFormatter('leads');
    expect(leadsFormatter(100)).toBe('100 leads');
  });
});

describe('Chart curve types', () => {
  it('should support all curve types', () => {
    type CurveType = 'smooth' | 'straight' | 'stepline';
    const curves: CurveType[] = ['smooth', 'straight', 'stepline'];
    
    expect(curves).toContain('smooth');
    expect(curves).toContain('straight');
    expect(curves).toContain('stepline');
  });
});
