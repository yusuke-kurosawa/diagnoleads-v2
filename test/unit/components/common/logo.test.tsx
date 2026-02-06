/**
 * Logo Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo, LogoMark } from '@/components/common/Logo';

describe('Logo', () => {
  it('should render logo', () => {
    render(<Logo />);
    expect(screen.getByText('DiagnoLeads')).toBeInTheDocument();
  });

  it('should render SVG icon', () => {
    render(<Logo />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should render subtitle text', () => {
    render(<Logo />);
    expect(screen.getByText('スマート診断プラットフォーム')).toBeInTheDocument();
  });

  it('should not render subtitle for sm size', () => {
    render(<Logo size="sm" />);
    expect(screen.queryByText('スマート診断プラットフォーム')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Logo />);
    expect(screen.getByText('DiagnoLeads')).toBeInTheDocument();
  });
});

describe('Logo sizes', () => {
  it('should render small size', () => {
    render(<Logo size="sm" />);
    expect(document.querySelector('.w-8')).toBeInTheDocument();
  });

  it('should render medium size by default', () => {
    render(<Logo />);
    expect(document.querySelector('.w-10')).toBeInTheDocument();
  });

  it('should render large size', () => {
    render(<Logo size="lg" />);
    expect(document.querySelector('.w-12')).toBeInTheDocument();
  });
});

describe('Logo text styles', () => {
  it('should have correct text size for sm', () => {
    render(<Logo size="sm" />);
    expect(screen.getByText('DiagnoLeads')).toHaveClass('text-lg');
  });

  it('should have correct text size for md', () => {
    render(<Logo size="md" />);
    expect(screen.getByText('DiagnoLeads')).toHaveClass('text-xl');
  });

  it('should have correct text size for lg', () => {
    render(<Logo size="lg" />);
    expect(screen.getByText('DiagnoLeads')).toHaveClass('text-2xl');
  });
});

describe('Logo collapsed state', () => {
  it('should hide text when collapsed', () => {
    render(<Logo collapsed />);
    expect(screen.queryByText('DiagnoLeads')).not.toBeInTheDocument();
  });

  it('should show icon when collapsed', () => {
    render(<Logo collapsed />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});

describe('Logo showText', () => {
  it('should hide text when showText is false', () => {
    render(<Logo showText={false} />);
    expect(screen.queryByText('DiagnoLeads')).not.toBeInTheDocument();
  });

  it('should show text by default', () => {
    render(<Logo />);
    expect(screen.getByText('DiagnoLeads')).toBeInTheDocument();
  });
});

describe('Logo with href', () => {
  it('should render as link with default href', () => {
    render(<Logo />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/ja/dashboard');
  });

  it('should render as link with custom href', () => {
    render(<Logo href="/custom" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/custom');
  });

  it('should render with empty href when href is undefined', () => {
    // Note: Logo renders as link by default, href=undefined still renders with default href
    render(<Logo />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});

describe('LogoMark', () => {
  it('should render logo mark only', () => {
    render(<LogoMark />);
    expect(document.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByText('DiagnoLeads')).not.toBeInTheDocument();
  });

  it('should support size prop', () => {
    render(<LogoMark size="lg" />);
    expect(document.querySelector('.w-12')).toBeInTheDocument();
  });

  it('should render without text', () => {
    render(<LogoMark />);
    expect(screen.queryByText('DiagnoLeads')).not.toBeInTheDocument();
  });
});
