/**
 * ThemeToggleButton Component Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';

// Mock the ThemeContext
vi.mock('@/context/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from '@/context/ThemeContext';

describe('ThemeToggleButton', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render toggle button', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
    });
    
    render(<ThemeToggleButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should have correct aria-label for light mode', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
    });
    
    render(<ThemeToggleButton />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('should have correct aria-label for dark mode', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      toggleTheme: vi.fn(),
    });
    
    render(<ThemeToggleButton />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('should call toggleTheme on click', () => {
    const toggleTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      toggleTheme,
    });
    
    render(<ThemeToggleButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it('should render sun icon in dark mode', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      toggleTheme: vi.fn(),
    });
    
    render(<ThemeToggleButton />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should render moon icon in light mode', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
    });
    
    render(<ThemeToggleButton />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should have correct button styles', () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
    });
    
    render(<ThemeToggleButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-10');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('rounded-lg');
  });
});
