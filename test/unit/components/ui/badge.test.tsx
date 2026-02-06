/**
 * Badge Component Tests
 *
 * Unit tests for the Badge UI component
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, badgeVariants } from '@/components/ui/badge';

describe('Badge', () => {
  describe('rendering', () => {
    it('should render badge with text', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render badge with children', () => {
      render(
        <Badge>
          <span data-testid="icon">✓</span>
          Verified
        </Badge>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('should render default variant', () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-gray-900');
    });

    it('should render secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-gray-100');
    });

    it('should render destructive variant', () => {
      render(<Badge variant="destructive">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-red-500');
    });

    it('should render outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('text-gray-950');
    });

    it('should render blue variant', () => {
      render(<Badge variant="blue">Info</Badge>);
      const badge = screen.getByText('Info');
      expect(badge).toHaveClass('bg-blue-100');
      expect(badge).toHaveClass('text-blue-800');
    });

    it('should render yellow variant', () => {
      render(<Badge variant="yellow">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-yellow-100');
      expect(badge).toHaveClass('text-yellow-800');
    });

    it('should render emerald variant', () => {
      render(<Badge variant="emerald">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-emerald-100');
      expect(badge).toHaveClass('text-emerald-800');
    });

    it('should render violet variant', () => {
      render(<Badge variant="violet">Premium</Badge>);
      const badge = screen.getByText('Premium');
      expect(badge).toHaveClass('bg-violet-100');
      expect(badge).toHaveClass('text-violet-800');
    });

    it('should render amber variant', () => {
      render(<Badge variant="amber">Pending</Badge>);
      const badge = screen.getByText('Pending');
      expect(badge).toHaveClass('bg-amber-100');
      expect(badge).toHaveClass('text-amber-800');
    });

    it('should render gray variant', () => {
      render(<Badge variant="gray">Inactive</Badge>);
      const badge = screen.getByText('Inactive');
      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('text-gray-800');
    });
  });

  describe('color prop', () => {
    it('should use color prop as variant', () => {
      render(<Badge color="blue">Blue Badge</Badge>);
      const badge = screen.getByText('Blue Badge');
      expect(badge).toHaveClass('bg-blue-100');
    });

    it('should override variant with color', () => {
      render(<Badge variant="default" color="emerald">Green</Badge>);
      const badge = screen.getByText('Green');
      expect(badge).toHaveClass('bg-emerald-100');
    });
  });

  describe('sizes', () => {
    it('should render default size (md)', () => {
      render(<Badge size="md">Medium</Badge>);
      const badge = screen.getByText('Medium');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('text-xs');
    });

    it('should render sm size', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('text-xs');
    });

    it('should render lg size', () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText('Large');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-sm');
    });
  });

  describe('custom className', () => {
    it('should merge custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('rounded-full'); // base class
    });
  });

  describe('HTML attributes', () => {
    it('should pass through data attributes', () => {
      render(<Badge data-testid="custom-badge">Test</Badge>);
      expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
    });

    it('should pass through aria attributes', () => {
      render(<Badge aria-label="Status: Active">Active</Badge>);
      const badge = screen.getByText('Active');
      expect(badge).toHaveAttribute('aria-label', 'Status: Active');
    });
  });

  describe('base styles', () => {
    it('should have rounded-full class', () => {
      render(<Badge>Rounded</Badge>);
      expect(screen.getByText('Rounded')).toHaveClass('rounded-full');
    });

    it('should have border class', () => {
      render(<Badge>Bordered</Badge>);
      expect(screen.getByText('Bordered')).toHaveClass('border');
    });

    it('should have font-semibold class', () => {
      render(<Badge>Bold</Badge>);
      expect(screen.getByText('Bold')).toHaveClass('font-semibold');
    });

    it('should have inline-flex class', () => {
      render(<Badge>Flex</Badge>);
      expect(screen.getByText('Flex')).toHaveClass('inline-flex');
    });
  });
});

describe('badgeVariants', () => {
  it('should generate default classes', () => {
    const classes = badgeVariants();
    expect(classes).toContain('bg-gray-900');
    expect(classes).toContain('px-2.5');
  });

  it('should generate variant classes', () => {
    const classes = badgeVariants({ variant: 'destructive' });
    expect(classes).toContain('bg-red-500');
  });

  it('should generate size classes', () => {
    const classes = badgeVariants({ size: 'lg' });
    expect(classes).toContain('px-3');
    expect(classes).toContain('py-1');
  });

  it('should combine variant and size', () => {
    const classes = badgeVariants({ variant: 'blue', size: 'sm' });
    expect(classes).toContain('bg-blue-100');
    expect(classes).toContain('px-2');
  });
});
