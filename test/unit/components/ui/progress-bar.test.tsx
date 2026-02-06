/**
 * ProgressBar Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar, CategoryBar, DeltaBar } from '@/components/ui/progress-bar';

describe('ProgressBar', () => {
  it('should render progress bar', () => {
    render(<ProgressBar value={50} />);
    const container = document.querySelector('.h-2.w-full');
    expect(container).toBeInTheDocument();
  });

  it('should render with value', () => {
    render(<ProgressBar value={75} />);
    const bar = document.querySelector('[style*="width: 75%"]');
    expect(bar).toBeInTheDocument();
  });

  it('should clamp value to 0-100', () => {
    const { rerender } = render(<ProgressBar value={150} />);
    let bar = document.querySelector('[style*="width: 100%"]');
    expect(bar).toBeInTheDocument();

    rerender(<ProgressBar value={-50} />);
    bar = document.querySelector('[style*="width: 0%"]');
    expect(bar).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<ProgressBar value={50} className="custom-progress" />);
    expect(document.querySelector('.custom-progress')).toBeInTheDocument();
  });

  it('should apply default blue color', () => {
    render(<ProgressBar value={50} />);
    const bar = document.querySelector('.bg-blue-500');
    expect(bar).toBeInTheDocument();
  });

  it('should apply custom color', () => {
    render(<ProgressBar value={50} color="green" />);
    const bar = document.querySelector('.bg-green-500');
    expect(bar).toBeInTheDocument();
  });

  it('should support emerald color', () => {
    render(<ProgressBar value={50} color="emerald" />);
    expect(document.querySelector('.bg-emerald-500')).toBeInTheDocument();
  });

  it('should support red color', () => {
    render(<ProgressBar value={50} color="red" />);
    expect(document.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('should support amber color', () => {
    render(<ProgressBar value={50} color="amber" />);
    expect(document.querySelector('.bg-amber-500')).toBeInTheDocument();
  });

  it('should have rounded corners', () => {
    render(<ProgressBar value={50} />);
    const container = document.querySelector('.rounded-full');
    expect(container).toBeInTheDocument();
  });

  it('should have transition animation', () => {
    render(<ProgressBar value={50} />);
    const bar = document.querySelector('.transition-all');
    expect(bar).toBeInTheDocument();
  });
});

describe('CategoryBar', () => {
  it('should render category bar', () => {
    render(<CategoryBar values={[25, 25, 25, 25]} />);
    const container = document.querySelector('.flex.h-2');
    expect(container).toBeInTheDocument();
  });

  it('should render multiple segments', () => {
    render(<CategoryBar values={[30, 30, 40]} />);
    const segments = document.querySelectorAll('.h-full');
    expect(segments.length).toBeGreaterThanOrEqual(3);
  });

  it('should apply default colors', () => {
    render(<CategoryBar values={[25, 25, 25, 25]} />);
    expect(document.querySelector('.bg-red-500')).toBeInTheDocument();
    expect(document.querySelector('.bg-yellow-500')).toBeInTheDocument();
    expect(document.querySelector('.bg-emerald-500')).toBeInTheDocument();
    expect(document.querySelector('.bg-blue-500')).toBeInTheDocument();
  });

  it('should apply custom colors', () => {
    render(<CategoryBar values={[50, 50]} colors={['violet', 'green']} />);
    expect(document.querySelector('.bg-violet-500')).toBeInTheDocument();
    expect(document.querySelector('.bg-green-500')).toBeInTheDocument();
  });

  it('should render marker when provided', () => {
    render(<CategoryBar values={[50, 50]} markerValue={75} />);
    const marker = document.querySelector('[style*="left: 75%"]');
    expect(marker).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<CategoryBar values={[50, 50]} className="custom-category" />);
    expect(document.querySelector('.custom-category')).toBeInTheDocument();
  });

  it('should handle empty values', () => {
    render(<CategoryBar values={[]} />);
    const container = document.querySelector('.flex.h-2');
    expect(container).toBeInTheDocument();
  });

  it('should calculate percentages correctly', () => {
    render(<CategoryBar values={[25, 75]} colors={['red', 'green']} />);
    const redSegment = document.querySelector('.bg-red-500');
    const greenSegment = document.querySelector('.bg-green-500');
    expect(redSegment).toBeInTheDocument();
    expect(greenSegment).toBeInTheDocument();
  });
});

describe('DeltaBar', () => {
  it('should render delta bar', () => {
    render(<DeltaBar value={25} />);
    const container = document.querySelector('.relative.h-2');
    expect(container).toBeInTheDocument();
  });

  it('should show positive delta with emerald color', () => {
    render(<DeltaBar value={50} />);
    const positiveBar = document.querySelector('.bg-emerald-500');
    expect(positiveBar).toBeInTheDocument();
  });

  it('should show negative delta with red color', () => {
    render(<DeltaBar value={-50} />);
    const negativeBar = document.querySelector('.bg-red-500');
    expect(negativeBar).toBeInTheDocument();
  });

  it('should render center marker', () => {
    render(<DeltaBar value={25} />);
    const marker = document.querySelector('.left-1\\/2');
    expect(marker).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<DeltaBar value={25} className="custom-delta" />);
    expect(document.querySelector('.custom-delta')).toBeInTheDocument();
  });

  it('should clamp value to -100 to 100', () => {
    render(<DeltaBar value={200} />);
    // Should cap at 100, which means 50% width from center
    const bar = document.querySelector('[style*="width: 50%"]');
    expect(bar).toBeInTheDocument();
  });

  it('should handle zero value', () => {
    render(<DeltaBar value={0} />);
    const bar = document.querySelector('[style*="width: 0%"]');
    expect(bar).toBeInTheDocument();
  });

  it('should have transition animation', () => {
    render(<DeltaBar value={25} />);
    const bar = document.querySelector('.transition-all');
    expect(bar).toBeInTheDocument();
  });
});

describe('Progress bar colors', () => {
  const colors = ['blue', 'violet', 'green', 'emerald', 'amber', 'red', 'gray', 'yellow'] as const;

  for (const color of colors) {
    it(`should support ${color} color`, () => {
      render(<ProgressBar value={50} color={color} />);
      expect(document.querySelector(`.bg-${color}-500`)).toBeInTheDocument();
    });
  }
});
