/**
 * Switch Component Tests
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from '@/components/ui/switch';

describe('Switch', () => {
  it('should render switch', () => {
    render(<Switch />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Switch className="custom-switch" />);
    expect(screen.getByRole('switch')).toHaveClass('custom-switch');
  });

  it('should have base styles', () => {
    render(<Switch />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveClass('h-6');
    expect(switchEl).toHaveClass('w-11');
    expect(switchEl).toHaveClass('rounded-full');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Switch ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

describe('Switch states', () => {
  it('should be unchecked by default', () => {
    render(<Switch checked={false} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('should support checked state', () => {
    render(<Switch checked />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('should toggle on click', () => {
    const handleChange = vi.fn();
    render(<Switch onCheckedChange={handleChange} />);
    
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should toggle from checked to unchecked', () => {
    const handleChange = vi.fn();
    render(<Switch checked onCheckedChange={handleChange} />);
    
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(false);
  });
});

describe('Switch styling', () => {
  it('should have unchecked background color', () => {
    render(<Switch checked={false} />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveClass('bg-gray-200');
  });

  it('should have checked background color', () => {
    render(<Switch checked />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveClass('bg-blue-600');
  });

  it('should have focus ring styles', () => {
    render(<Switch />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveClass('focus-visible:ring-2');
  });

  it('should have disabled styles', () => {
    render(<Switch />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveClass('disabled:cursor-not-allowed');
    expect(switchEl).toHaveClass('disabled:opacity-50');
  });
});

describe('Switch thumb', () => {
  it('should have thumb element', () => {
    render(<Switch />);
    const switchEl = screen.getByRole('switch');
    const thumb = switchEl.querySelector('span');
    expect(thumb).toBeInTheDocument();
  });

  it('should move thumb when checked', () => {
    const { rerender } = render(<Switch checked={false} />);
    let thumb = screen.getByRole('switch').querySelector('span');
    expect(thumb).toHaveClass('translate-x-0');

    rerender(<Switch checked />);
    thumb = screen.getByRole('switch').querySelector('span');
    expect(thumb).toHaveClass('translate-x-5');
  });

  it('should have rounded thumb', () => {
    render(<Switch />);
    const thumb = screen.getByRole('switch').querySelector('span');
    expect(thumb).toHaveClass('rounded-full');
  });

  it('should have shadow on thumb', () => {
    render(<Switch />);
    const thumb = screen.getByRole('switch').querySelector('span');
    expect(thumb).toHaveClass('shadow-lg');
  });
});

describe('Switch accessibility', () => {
  it('should have switch role', () => {
    render(<Switch />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should have aria-checked attribute', () => {
    render(<Switch checked />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('should be keyboard accessible', () => {
    const handleChange = vi.fn();
    render(<Switch onCheckedChange={handleChange} />);
    
    const switchEl = screen.getByRole('switch');
    switchEl.focus();
    expect(document.activeElement).toBe(switchEl);
  });

  it('should have hidden input for form submission', () => {
    render(<Switch />);
    const hiddenInput = screen.getByRole('switch').querySelector('input');
    expect(hiddenInput).toHaveClass('sr-only');
  });
});

describe('Switch with label', () => {
  it('should work with external label', () => {
    render(
      <div>
        <Switch id="notifications" />
        <label htmlFor="notifications">Enable notifications</label>
      </div>
    );

    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByText('Enable notifications')).toBeInTheDocument();
  });
});

describe('Switch displayName', () => {
  it('should have correct displayName', () => {
    expect(Switch.displayName).toBe('Switch');
  });
});
