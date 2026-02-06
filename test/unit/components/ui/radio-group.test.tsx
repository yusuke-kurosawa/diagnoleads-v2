/**
 * RadioGroup Component Tests
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

describe('RadioGroup', () => {
  it('should render radio group', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" />
      </RadioGroup>
    );

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <RadioGroup className="custom-radio-group">
        <RadioGroupItem value="option1" />
      </RadioGroup>
    );

    expect(screen.getByRole('radiogroup')).toHaveClass('custom-radio-group');
  });

  it('should have grid layout', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" />
      </RadioGroup>
    );

    expect(screen.getByRole('radiogroup')).toHaveClass('grid');
  });

  it('should have gap between items', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" />
      </RadioGroup>
    );

    expect(screen.getByRole('radiogroup')).toHaveClass('gap-2');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <RadioGroup ref={ref}>
        <RadioGroupItem value="option1" />
      </RadioGroup>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('RadioGroupItem', () => {
  it('should render radio item', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" />
      </RadioGroup>
    );

    expect(screen.getByRole('radio')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" className="custom-radio" />
      </RadioGroup>
    );

    expect(screen.getByRole('radio')).toHaveClass('custom-radio');
  });

  it('should have circular shape', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" />
      </RadioGroup>
    );

    expect(screen.getByRole('radio')).toHaveClass('rounded-full');
  });

  it('should have border', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" />
      </RadioGroup>
    );

    expect(screen.getByRole('radio')).toHaveClass('border');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" ref={ref} />
      </RadioGroup>
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe('RadioGroup selection', () => {
  it('should select item on click', () => {
    render(
      <RadioGroup defaultValue="option1">
        <RadioGroupItem value="option1" />
        <RadioGroupItem value="option2" />
      </RadioGroup>
    );

    const radio1 = screen.getAllByRole('radio')[0];
    expect(radio1).toHaveAttribute('data-state', 'checked');
  });

  it('should call onValueChange when selection changes', () => {
    const handleChange = vi.fn();
    render(
      <RadioGroup onValueChange={handleChange}>
        <RadioGroupItem value="option1" />
        <RadioGroupItem value="option2" />
      </RadioGroup>
    );

    fireEvent.click(screen.getAllByRole('radio')[1]);
    expect(handleChange).toHaveBeenCalledWith('option2');
  });

  it('should support controlled value', () => {
    render(
      <RadioGroup value="option2">
        <RadioGroupItem value="option1" />
        <RadioGroupItem value="option2" />
      </RadioGroup>
    );

    const radio2 = screen.getAllByRole('radio')[1];
    expect(radio2).toHaveAttribute('data-state', 'checked');
  });
});

describe('RadioGroup disabled state', () => {
  it('should support disabled on group', () => {
    render(
      <RadioGroup disabled>
        <RadioGroupItem value="option1" />
      </RadioGroup>
    );

    expect(screen.getByRole('radio')).toBeDisabled();
  });

  it('should support disabled on individual item', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" />
        <RadioGroupItem value="option2" disabled />
      </RadioGroup>
    );

    const radios = screen.getAllByRole('radio');
    expect(radios[0]).not.toBeDisabled();
    expect(radios[1]).toBeDisabled();
  });

  it('should have disabled styles', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" disabled />
      </RadioGroup>
    );

    expect(screen.getByRole('radio')).toHaveClass('disabled:cursor-not-allowed');
    expect(screen.getByRole('radio')).toHaveClass('disabled:opacity-50');
  });
});

describe('RadioGroup with labels', () => {
  it('should work with labels', () => {
    render(
      <RadioGroup>
        <div>
          <RadioGroupItem value="option1" id="option1" />
          <label htmlFor="option1">Option 1</label>
        </div>
        <div>
          <RadioGroupItem value="option2" id="option2" />
          <label htmlFor="option2">Option 2</label>
        </div>
      </RadioGroup>
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should select when label clicked', () => {
    const handleChange = vi.fn();
    render(
      <RadioGroup onValueChange={handleChange}>
        <div>
          <RadioGroupItem value="option1" id="option1" />
          <label htmlFor="option1">Option 1</label>
        </div>
      </RadioGroup>
    );

    fireEvent.click(screen.getByText('Option 1'));
    expect(handleChange).toHaveBeenCalledWith('option1');
  });
});

describe('RadioGroup accessibility', () => {
  it('should have radiogroup role', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" />
      </RadioGroup>
    );

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('should have radio role for items', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" />
      </RadioGroup>
    );

    expect(screen.getByRole('radio')).toBeInTheDocument();
  });

  it('should support keyboard navigation', () => {
    render(
      <RadioGroup defaultValue="option1">
        <RadioGroupItem value="option1" />
        <RadioGroupItem value="option2" />
      </RadioGroup>
    );

    const radio1 = screen.getAllByRole('radio')[0];
    radio1.focus();
    expect(document.activeElement).toBe(radio1);
  });
});

describe('RadioGroup displayName', () => {
  it('should have correct displayName', () => {
    expect(RadioGroup.displayName).toBeDefined();
    expect(RadioGroupItem.displayName).toBeDefined();
  });
});
