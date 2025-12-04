/**
 * UI Component Tests
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProgressBar } from '@/components/ui/progress-bar';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('UI Components', () => {
  describe('Badge', () => {
    it('should render with default variant', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should render with color variant', () => {
      render(<Badge color="blue">Blue Badge</Badge>);
      const badge = screen.getByText('Blue Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-blue-100');
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<Badge size="sm">Small</Badge>);
      expect(screen.getByText('Small')).toHaveClass('px-2');

      rerender(<Badge size="lg">Large</Badge>);
      expect(screen.getByText('Large')).toHaveClass('px-3');
    });

    it('should render with custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>);
      expect(screen.getByText('Custom')).toHaveClass('custom-class');
    });
  });

  describe('Button', () => {
    it('should render with default variant', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('should handle click events', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      await userEvent.click(screen.getByRole('button', { name: 'Click' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
    });

    it('should render with different variants', () => {
      const { rerender } = render(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button', { name: 'Outline' })).toHaveClass('border');

      rerender(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button', { name: 'Ghost' })).toHaveClass('hover:bg-gray-100');
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button', { name: 'Small' })).toHaveClass('h-9');

      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button', { name: 'Large' })).toHaveClass('h-11');
    });
  });

  describe('Card', () => {
    it('should render children', () => {
      render(
        <Card>
          <div>Card Content</div>
        </Card>
      );
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should apply decoration styles', () => {
      const { container } = render(
        <Card decoration="top" decorationColor="blue">
          Content
        </Card>
      );
      expect(container.firstChild).toHaveClass('border-t-4');
    });

    it('should apply custom className', () => {
      const { container } = render(<Card className="custom-card">Content</Card>);
      expect(container.firstChild).toHaveClass('custom-card');
    });
  });

  describe('Input', () => {
    it('should render input element', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should handle value changes', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Hello');

      expect(handleChange).toHaveBeenCalled();
    });

    it('should render disabled state', () => {
      render(<Input disabled placeholder="Disabled" />);
      expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
    });

    it('should render with different types', () => {
      render(<Input type="email" placeholder="Email" />);
      expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');
    });
  });

  describe('Label', () => {
    it('should render label text', () => {
      render(<Label>Email Address</Label>);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should associate with input via htmlFor', () => {
      render(
        <>
          <Label htmlFor="test-input">Test Label</Label>
          <Input id="test-input" />
        </>
      );

      const label = screen.getByText('Test Label');
      expect(label).toHaveAttribute('for', 'test-input');
    });
  });

  describe('ProgressBar', () => {
    it('should render progress bar', () => {
      const { container } = render(<ProgressBar value={50} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with different colors', () => {
      const { container: blueContainer } = render(<ProgressBar value={50} color="blue" />);
      expect(blueContainer.querySelector('.bg-blue-500')).toBeInTheDocument();

      const { container: greenContainer } = render(<ProgressBar value={50} color="emerald" />);
      expect(greenContainer.querySelector('.bg-emerald-500')).toBeInTheDocument();
    });

    it('should clamp values between 0 and 100', () => {
      const { container: maxContainer } = render(<ProgressBar value={150} />);
      expect(maxContainer.firstChild).toBeInTheDocument();

      const { container: minContainer } = render(<ProgressBar value={-10} />);
      expect(minContainer.firstChild).toBeInTheDocument();
    });
  });
});
