/**
 * Select Component Tests
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';

describe('Select', () => {
  it('should render select trigger', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should show placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose..." />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByText('Choose...')).toBeInTheDocument();
  });

  it('should apply custom className to trigger', () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveClass('custom-trigger');
  });
});

describe('SelectTrigger', () => {
  it('should render trigger', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should have base styles', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('flex');
    expect(trigger).toHaveClass('h-10');
    expect(trigger).toHaveClass('w-full');
  });

  it('should have border', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveClass('border');
  });

  it('should have rounded corners', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveClass('rounded-md');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Select>
        <SelectTrigger ref={ref}>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe('Select with options', () => {
  it('should open on click', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should show options when open', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectItem value="b">Beta</SelectItem>
        </SelectContent>
      </Select>
    );

    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('should call onValueChange when option selected', () => {
    const handleChange = vi.fn();
    render(
      <Select onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="test">Test</SelectItem>
        </SelectContent>
      </Select>
    );

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Test'));
    expect(handleChange).toHaveBeenCalledWith('test');
  });
});

describe('SelectItem', () => {
  it('should render item', () => {
    render(
      <Select defaultOpen>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="item1">Item 1</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('should support disabled state', () => {
    render(
      <Select defaultOpen>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="disabled" disabled>Disabled</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Disabled').closest('[data-disabled]')).toBeInTheDocument();
  });
});

describe('SelectGroup', () => {
  it('should render group with label', () => {
    render(
      <Select defaultOpen>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Fruits')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });
});

describe('Select controlled', () => {
  it('should show selected value', () => {
    render(
      <Select value="selected">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="selected">Selected Option</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Selected Option')).toBeInTheDocument();
  });

  it('should support defaultValue', () => {
    render(
      <Select defaultValue="default">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default Option</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Default Option')).toBeInTheDocument();
  });
});

describe('Select disabled', () => {
  it('should support disabled state', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('should have disabled styles', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveClass('disabled:cursor-not-allowed');
  });
});

describe('Select accessibility', () => {
  it('should have combobox role', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should have listbox role when open', () => {
    render(
      <Select defaultOpen>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});
