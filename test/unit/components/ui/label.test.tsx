/**
 * Label Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/label';

describe('Label', () => {
  it('should render children', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Label className="custom-label">Name</Label>);
    expect(screen.getByText('Name')).toHaveClass('custom-label');
  });

  it('should have base styles', () => {
    render(<Label>Test</Label>);
    const label = screen.getByText('Test');
    expect(label).toHaveClass('text-sm');
    expect(label).toHaveClass('font-medium');
  });

  it('should render with htmlFor attribute', () => {
    render(<Label htmlFor="email-input">Email</Label>);
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'email-input');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Label ref={ref}>Test</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('should support dark mode styles', () => {
    render(<Label>Dark Mode Label</Label>);
    const label = screen.getByText('Dark Mode Label');
    expect(label.className).toContain('dark:');
  });
});

describe('Label with form elements', () => {
  it('should associate with input', () => {
    render(
      <>
        <Label htmlFor="test-input">Test Input</Label>
        <input id="test-input" />
      </>
    );

    const label = screen.getByText('Test Input');
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('should work with disabled peer', () => {
    render(<Label>Disabled Field</Label>);
    const label = screen.getByText('Disabled Field');
    
    // Check for peer-disabled styles
    expect(label.className).toContain('peer-disabled:cursor-not-allowed');
    expect(label.className).toContain('peer-disabled:opacity-70');
  });
});

describe('Label accessibility', () => {
  it('should be a label element', () => {
    render(<Label>Accessible Label</Label>);
    const label = screen.getByText('Accessible Label');
    expect(label.tagName).toBe('LABEL');
  });

  it('should support aria attributes', () => {
    render(<Label aria-describedby="help-text">Field with help</Label>);
    const label = screen.getByText('Field with help');
    expect(label).toHaveAttribute('aria-describedby', 'help-text');
  });
});
