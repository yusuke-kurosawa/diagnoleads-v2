/**
 * BadgeDelta Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeDelta } from '@/components/ui/badge-delta';

describe('BadgeDelta', () => {
  it('should render badge delta', () => {
    render(<BadgeDelta deltaType="increase">+10%</BadgeDelta>);
    expect(screen.getByText('+10%')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <BadgeDelta deltaType="increase" className="custom-badge">
        +5%
      </BadgeDelta>
    );
    expect(document.querySelector('.custom-badge')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    render(<BadgeDelta deltaType="increase">+20%</BadgeDelta>);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should have rounded-full', () => {
    render(<BadgeDelta deltaType="increase">+15%</BadgeDelta>);
    expect(document.querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('should have inline-flex display', () => {
    render(<BadgeDelta deltaType="increase">+25%</BadgeDelta>);
    expect(document.querySelector('.inline-flex')).toBeInTheDocument();
  });
});

describe('BadgeDelta deltaType', () => {
  it('should show increase style', () => {
    render(<BadgeDelta deltaType="increase">+10%</BadgeDelta>);
    expect(document.querySelector('.bg-emerald-100')).toBeInTheDocument();
    expect(document.querySelector('.text-emerald-800')).toBeInTheDocument();
  });

  it('should show decrease style', () => {
    render(<BadgeDelta deltaType="decrease">-10%</BadgeDelta>);
    expect(document.querySelector('.bg-red-100')).toBeInTheDocument();
    expect(document.querySelector('.text-red-800')).toBeInTheDocument();
  });

  it('should show unchanged style', () => {
    render(<BadgeDelta deltaType="unchanged">0%</BadgeDelta>);
    expect(document.querySelector('.bg-gray-100')).toBeInTheDocument();
    expect(document.querySelector('.text-gray-800')).toBeInTheDocument();
  });

  it('should show TrendingUp icon for increase', () => {
    render(<BadgeDelta deltaType="increase">+10%</BadgeDelta>);
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should show TrendingDown icon for decrease', () => {
    render(<BadgeDelta deltaType="decrease">-10%</BadgeDelta>);
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should show Minus icon for unchanged', () => {
    render(<BadgeDelta deltaType="unchanged">0%</BadgeDelta>);
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});

describe('BadgeDelta sizes', () => {
  it('should render small size', () => {
    render(
      <BadgeDelta deltaType="increase" size="sm">
        +5%
      </BadgeDelta>
    );
    expect(document.querySelector('.text-xs')).toBeInTheDocument();
    expect(document.querySelector('.px-2')).toBeInTheDocument();
  });

  it('should render medium size by default', () => {
    render(<BadgeDelta deltaType="increase">+10%</BadgeDelta>);
    expect(document.querySelector('.text-sm')).toBeInTheDocument();
  });

  it('should render large size', () => {
    render(
      <BadgeDelta deltaType="increase" size="lg">
        +15%
      </BadgeDelta>
    );
    expect(document.querySelector('.text-base')).toBeInTheDocument();
    expect(document.querySelector('.px-3')).toBeInTheDocument();
  });

  it('should have small icon for sm size', () => {
    render(
      <BadgeDelta deltaType="increase" size="sm">
        +5%
      </BadgeDelta>
    );
    const icon = document.querySelector('svg');
    expect(icon).toHaveClass('h-3');
    expect(icon).toHaveClass('w-3');
  });

  it('should have medium icon for md size', () => {
    render(
      <BadgeDelta deltaType="increase" size="md">
        +10%
      </BadgeDelta>
    );
    const icon = document.querySelector('svg');
    expect(icon).toHaveClass('h-4');
    expect(icon).toHaveClass('w-4');
  });

  it('should have large icon for lg size', () => {
    render(
      <BadgeDelta deltaType="increase" size="lg">
        +15%
      </BadgeDelta>
    );
    const icon = document.querySelector('svg');
    expect(icon).toHaveClass('h-5');
    expect(icon).toHaveClass('w-5');
  });
});

describe('BadgeDelta content', () => {
  it('should render percentage text', () => {
    render(<BadgeDelta deltaType="increase">+25.5%</BadgeDelta>);
    expect(screen.getByText('+25.5%')).toBeInTheDocument();
  });

  it('should render numeric text', () => {
    render(<BadgeDelta deltaType="decrease">-100</BadgeDelta>);
    expect(screen.getByText('-100')).toBeInTheDocument();
  });

  it('should render currency text', () => {
    render(<BadgeDelta deltaType="increase">+$500</BadgeDelta>);
    expect(screen.getByText('+$500')).toBeInTheDocument();
  });

  it('should render complex children', () => {
    render(
      <BadgeDelta deltaType="increase">
        <span>+10%</span>
      </BadgeDelta>
    );
    expect(screen.getByText('+10%')).toBeInTheDocument();
  });
});

describe('BadgeDelta composition', () => {
  it('should render positive metric change', () => {
    render(
      <div>
        <span>Revenue</span>
        <BadgeDelta deltaType="increase" size="sm">
          +12.5%
        </BadgeDelta>
      </div>
    );

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
  });

  it('should render negative metric change', () => {
    render(
      <div>
        <span>Costs</span>
        <BadgeDelta deltaType="decrease" size="sm">
          -8.3%
        </BadgeDelta>
      </div>
    );

    expect(screen.getByText('Costs')).toBeInTheDocument();
    expect(screen.getByText('-8.3%')).toBeInTheDocument();
  });

  it('should render neutral metric change', () => {
    render(
      <div>
        <span>Conversion Rate</span>
        <BadgeDelta deltaType="unchanged" size="sm">
          0%
        </BadgeDelta>
      </div>
    );

    expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

describe('BadgeDelta styling', () => {
  it('should have font-medium', () => {
    render(<BadgeDelta deltaType="increase">+10%</BadgeDelta>);
    expect(document.querySelector('.font-medium')).toBeInTheDocument();
  });

  it('should have gap between icon and text', () => {
    render(<BadgeDelta deltaType="increase">+10%</BadgeDelta>);
    expect(document.querySelector('.gap-1')).toBeInTheDocument();
  });

  it('should have items-center alignment', () => {
    render(<BadgeDelta deltaType="increase">+10%</BadgeDelta>);
    expect(document.querySelector('.items-center')).toBeInTheDocument();
  });
});
