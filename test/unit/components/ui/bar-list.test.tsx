/**
 * BarList Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarList } from '@/components/ui/bar-list';
import { Users, ShoppingCart, DollarSign } from 'lucide-react';

describe('BarList', () => {
  const mockData = [
    { name: 'Sales', value: 1000 },
    { name: 'Marketing', value: 750 },
    { name: 'Support', value: 500 },
  ];

  it('should render bar list', () => {
    render(<BarList data={mockData} />);
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('should render values', () => {
    render(<BarList data={mockData} />);
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('750')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<BarList data={mockData} className="custom-barlist" />);
    expect(document.querySelector('.custom-barlist')).toBeInTheDocument();
  });

  it('should have space-y-3 spacing', () => {
    render(<BarList data={mockData} />);
    expect(document.querySelector('.space-y-3')).toBeInTheDocument();
  });
});

describe('BarList valueFormatter', () => {
  const mockData = [
    { name: 'Revenue', value: 50000 },
    { name: 'Costs', value: 30000 },
  ];

  it('should use default formatter', () => {
    render(<BarList data={mockData} />);
    expect(screen.getByText('50,000')).toBeInTheDocument();
  });

  it('should use custom formatter', () => {
    const currencyFormatter = (v: number) => `$${v.toLocaleString()}`;
    render(<BarList data={mockData} valueFormatter={currencyFormatter} />);
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('$30,000')).toBeInTheDocument();
  });

  it('should format with percentage', () => {
    const percentData = [
      { name: 'Complete', value: 75 },
      { name: 'Pending', value: 25 },
    ];
    const percentFormatter = (v: number) => `${v}%`;
    render(<BarList data={percentData} valueFormatter={percentFormatter} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });
});

describe('BarList with icons', () => {
  const dataWithIcons = [
    { name: 'Users', value: 1200, icon: Users },
    { name: 'Orders', value: 850, icon: ShoppingCart },
    { name: 'Revenue', value: 45000, icon: DollarSign },
  ];

  it('should render icons', () => {
    render(<BarList data={dataWithIcons} />);
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBe(3);
  });

  it('should render items with icons', () => {
    render(<BarList data={dataWithIcons} />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });
});

describe('BarList bar widths', () => {
  it('should calculate bar widths based on max value', () => {
    const data = [
      { name: 'Max', value: 100 },
      { name: 'Half', value: 50 },
      { name: 'Quarter', value: 25 },
    ];
    render(<BarList data={data} />);
    
    const bars = document.querySelectorAll('.bg-blue-500');
    expect(bars.length).toBe(3);
    
    // First bar should be 100%
    expect(bars[0]).toHaveStyle({ width: '100%' });
    // Second bar should be 50%
    expect(bars[1]).toHaveStyle({ width: '50%' });
    // Third bar should be 25%
    expect(bars[2]).toHaveStyle({ width: '25%' });
  });

  it('should handle single item', () => {
    const data = [{ name: 'Only', value: 500 }];
    render(<BarList data={data} />);
    
    const bar = document.querySelector('.bg-blue-500');
    expect(bar).toHaveStyle({ width: '100%' });
  });

  it('should handle zero values', () => {
    const data = [
      { name: 'Zero', value: 0 },
      { name: 'Some', value: 100 },
    ];
    render(<BarList data={data} />);
    
    const bars = document.querySelectorAll('.bg-blue-500');
    expect(bars[0]).toHaveStyle({ width: '0%' });
  });
});

describe('BarList animation', () => {
  it('should have animation by default', () => {
    const data = [{ name: 'Test', value: 100 }];
    render(<BarList data={data} />);
    
    const bar = document.querySelector('.bg-blue-500');
    expect(bar).toHaveClass('transition-all');
    expect(bar).toHaveClass('duration-500');
  });

  it('should disable animation when showAnimation is false', () => {
    const data = [{ name: 'Test', value: 100 }];
    render(<BarList data={data} showAnimation={false} />);
    
    const bar = document.querySelector('.bg-blue-500');
    expect(bar).not.toHaveClass('transition-all');
  });
});

describe('BarList empty state', () => {
  it('should handle empty data', () => {
    render(<BarList data={[]} />);
    expect(document.querySelector('.space-y-3')).toBeInTheDocument();
  });
});

describe('BarList styling', () => {
  const data = [{ name: 'Test', value: 100 }];

  it('should have rounded bar container', () => {
    render(<BarList data={data} />);
    expect(document.querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('should have gray background', () => {
    render(<BarList data={data} />);
    expect(document.querySelector('.bg-gray-100')).toBeInTheDocument();
  });

  it('should have blue bar fill', () => {
    render(<BarList data={data} />);
    expect(document.querySelector('.bg-blue-500')).toBeInTheDocument();
  });
});
