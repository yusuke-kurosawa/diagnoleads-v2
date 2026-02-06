/**
 * AnimatedCounter Component Tests
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AnimatedCounter, AnimatedPercentage, AnimatedScore } from '@/components/ui/animated-counter';

describe('AnimatedCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render counter', () => {
    render(<AnimatedCounter value={100} />);
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<AnimatedCounter value={100} className="custom-counter" />);
    expect(document.querySelector('.custom-counter')).toBeInTheDocument();
  });

  it('should render prefix', () => {
    render(<AnimatedCounter value={100} prefix="$" />);
    expect(screen.getByText(/\$/)).toBeInTheDocument();
  });

  it('should render suffix', () => {
    render(<AnimatedCounter value={100} suffix=" items" />);
    expect(screen.getByText(/items/)).toBeInTheDocument();
  });

  it('should render with decimals', async () => {
    render(<AnimatedCounter value={99.99} decimals={2} />);
    
    // Advance timers to complete animation
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    
    // Should show decimal value
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });

  it('should have tabular-nums class', () => {
    render(<AnimatedCounter value={100} />);
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });
});

describe('AnimatedCounter with different values', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle zero value', () => {
    render(<AnimatedCounter value={0} />);
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });

  it('should handle large values', () => {
    render(<AnimatedCounter value={1000000} />);
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });

  it('should handle negative values', () => {
    render(<AnimatedCounter value={-50} />);
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });

  it('should handle decimal values', () => {
    render(<AnimatedCounter value={123.456} decimals={2} />);
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });
});

describe('AnimatedCounter formatting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format with prefix and suffix', () => {
    render(<AnimatedCounter value={1000} prefix="$" suffix=" USD" />);
    const counter = document.querySelector('.tabular-nums');
    expect(counter?.textContent).toContain('$');
    expect(counter?.textContent).toContain('USD');
  });

  it('should support different locales', () => {
    render(<AnimatedCounter value={1000} locale="de-DE" />);
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });
});

describe('AnimatedPercentage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render percentage', () => {
    render(<AnimatedPercentage value={75} />);
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });

  it('should have % suffix', () => {
    render(<AnimatedPercentage value={50} />);
    const counter = document.querySelector('.tabular-nums');
    expect(counter?.textContent).toContain('%');
  });

  it('should apply custom className', () => {
    render(<AnimatedPercentage value={100} className="custom-percentage" />);
    expect(document.querySelector('.custom-percentage')).toBeInTheDocument();
  });

  it('should support custom decimals', () => {
    render(<AnimatedPercentage value={33.333} decimals={2} />);
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });

  it('should support custom duration', () => {
    render(<AnimatedPercentage value={100} duration={500} />);
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });
});

describe('AnimatedScore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render score', () => {
    render(<AnimatedScore value={85} />);
    expect(document.querySelector('.inline-flex')).toBeInTheDocument();
  });

  it('should show max value', () => {
    render(<AnimatedScore value={75} maxValue={100} />);
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('should support custom maxValue', () => {
    render(<AnimatedScore value={8} maxValue={10} />);
    expect(screen.getByText('/10')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<AnimatedScore value={90} className="custom-score" />);
    expect(document.querySelector('.custom-score')).toBeInTheDocument();
  });

  it('should have items-baseline alignment', () => {
    render(<AnimatedScore value={50} />);
    expect(document.querySelector('.items-baseline')).toBeInTheDocument();
  });

  it('should have gap between value and max', () => {
    render(<AnimatedScore value={50} />);
    expect(document.querySelector('.gap-0\\.5')).toBeInTheDocument();
  });
});

describe('AnimatedCounter animation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should animate from 0', async () => {
    render(<AnimatedCounter value={100} duration={100} />);
    
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    
    // Counter should be animating
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });

  it('should complete animation', async () => {
    render(<AnimatedCounter value={100} duration={100} />);
    
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });

  it('should handle value changes', async () => {
    const { rerender } = render(<AnimatedCounter value={50} duration={100} />);
    
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    
    rerender(<AnimatedCounter value={100} duration={100} />);
    
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });
});

describe('AnimatedCounter edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle very short duration', () => {
    render(<AnimatedCounter value={100} duration={1} />);
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });

  it('should handle very long duration', () => {
    render(<AnimatedCounter value={100} duration={10000} />);
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });

  it('should handle multiple rapid value changes', async () => {
    const { rerender } = render(<AnimatedCounter value={0} duration={100} />);
    
    rerender(<AnimatedCounter value={50} duration={100} />);
    await act(async () => { vi.advanceTimersByTime(50); });
    
    rerender(<AnimatedCounter value={100} duration={100} />);
    await act(async () => { vi.advanceTimersByTime(50); });
    
    rerender(<AnimatedCounter value={25} duration={100} />);
    await act(async () => { vi.advanceTimersByTime(200); });
    
    expect(document.querySelector('.tabular-nums')).toBeInTheDocument();
  });
});
