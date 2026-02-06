/**
 * Checkbox Component Tests
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox', () => {
  it('should render checkbox', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Checkbox className="custom-checkbox" />);
    expect(screen.getByRole('checkbox')).toHaveClass('custom-checkbox');
  });

  it('should have base styles', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('h-4');
    expect(checkbox).toHaveClass('w-4');
    expect(checkbox).toHaveClass('rounded-sm');
    expect(checkbox).toHaveClass('border');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Checkbox ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe('Checkbox states', () => {
  it('should be unchecked by default', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('should support checked state', () => {
    render(<Checkbox checked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('should support defaultChecked', () => {
    render(<Checkbox defaultChecked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('should handle checked change', () => {
    const handleChange = vi.fn();
    render(<Checkbox onCheckedChange={handleChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(handleChange).toHaveBeenCalled();
  });
});

describe('Checkbox disabled state', () => {
  it('should support disabled attribute', () => {
    render(<Checkbox disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('should have disabled styles', () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('disabled:cursor-not-allowed');
    expect(checkbox).toHaveClass('disabled:opacity-50');
  });

  it('should not trigger change when disabled', () => {
    const handleChange = vi.fn();
    render(<Checkbox disabled onCheckedChange={handleChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(handleChange).not.toHaveBeenCalled();
  });
});

describe('Checkbox indeterminate state', () => {
  it('should support indeterminate state', () => {
    render(<Checkbox checked="indeterminate" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
  });
});

describe('Checkbox attributes', () => {
  it('should support id attribute', () => {
    render(<Checkbox id="accept-terms" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'accept-terms');
  });

  it('should support value attribute', () => {
    render(<Checkbox value="accepted" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('value', 'accepted');
  });

  it('should support required attribute', () => {
    render(<Checkbox required />);
    expect(screen.getByRole('checkbox')).toBeRequired();
  });
});

describe('Checkbox styling', () => {
  it('should have focus ring styles', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('focus-visible:ring-1');
    expect(checkbox).toHaveClass('focus-visible:ring-blue-500');
  });

  it('should have checked state styles', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('data-[state=checked]:bg-blue-600');
  });

  it('should have shadow', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('shadow-sm');
  });
});

describe('Checkbox with label', () => {
  it('should work with label', () => {
    render(
      <div>
        <Checkbox id="terms" />
        <label htmlFor="terms">Accept terms</label>
      </div>
    );

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('should toggle when label clicked', () => {
    const handleChange = vi.fn();
    render(
      <div>
        <Checkbox id="terms" onCheckedChange={handleChange} />
        <label htmlFor="terms">Accept terms</label>
      </div>
    );

    fireEvent.click(screen.getByText('Accept terms'));
    expect(handleChange).toHaveBeenCalled();
  });
});

describe('Checkbox accessibility', () => {
  it('should have checkbox role', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should support aria-label', () => {
    render(<Checkbox aria-label="Accept terms and conditions" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-label',
      'Accept terms and conditions'
    );
  });

  it('should support aria-describedby', () => {
    render(<Checkbox aria-describedby="terms-description" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-describedby',
      'terms-description'
    );
  });
});
