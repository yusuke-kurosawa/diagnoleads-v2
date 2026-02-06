/**
 * Textarea Component Tests
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('should render textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Textarea className="custom-textarea" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-textarea');
  });

  it('should have base styles', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('flex');
    expect(textarea).toHaveClass('w-full');
    expect(textarea).toHaveClass('rounded-md');
    expect(textarea).toHaveClass('border');
  });

  it('should have minimum height', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('min-h-[80px]');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});

describe('Textarea interactions', () => {
  it('should handle value change', () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New content' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should display placeholder', () => {
    render(<Textarea placeholder="Enter description..." />);
    expect(screen.getByPlaceholderText('Enter description...')).toBeInTheDocument();
  });

  it('should display value', () => {
    render(<Textarea value="Initial content" readOnly />);
    expect(screen.getByDisplayValue('Initial content')).toBeInTheDocument();
  });

  it('should be focusable', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    
    textarea.focus();
    expect(document.activeElement).toBe(textarea);
  });
});

describe('Textarea disabled state', () => {
  it('should support disabled attribute', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should have disabled styles', () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('disabled:cursor-not-allowed');
    expect(textarea).toHaveClass('disabled:opacity-50');
  });
});

describe('Textarea attributes', () => {
  it('should support rows attribute', () => {
    render(<Textarea rows={5} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
  });

  it('should support name attribute', () => {
    render(<Textarea name="description" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'description');
  });

  it('should support required attribute', () => {
    render(<Textarea required />);
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('should support maxLength attribute', () => {
    render(<Textarea maxLength={500} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '500');
  });

  it('should support readOnly attribute', () => {
    render(<Textarea readOnly />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });
});

describe('Textarea styling', () => {
  it('should have focus ring styles', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('focus-visible:ring-2');
    expect(textarea).toHaveClass('focus-visible:ring-teal-500');
  });

  it('should have dark mode styles', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.className).toContain('dark:');
  });

  it('should have placeholder styles', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.className).toContain('placeholder:');
  });
});

describe('Textarea displayName', () => {
  it('should have correct displayName', () => {
    expect(Textarea.displayName).toBe('Textarea');
  });
});
