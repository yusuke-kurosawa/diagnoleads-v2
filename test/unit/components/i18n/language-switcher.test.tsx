/**
 * LanguageSwitcher Component Tests
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => '/ja/dashboard',
}));

// Mock i18n config
vi.mock('@/lib/i18n/config', () => ({
  locales: ['ja', 'en'] as const,
  localeNames: {
    ja: '日本語',
    en: 'English',
  },
}));

import { LanguageSwitcher, LanguageSwitcherButton } from '@/components/i18n/language-switcher';

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('should render select with current locale', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('ja');
  });

  it('should render all locale options', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByText('日本語')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should have aria-label for accessibility', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-label', '言語を選択');
  });

  it('should change locale on select', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'en' } });

    // Should set cookie
    expect(document.cookie).toContain('NEXT_LOCALE=en');

    // Should navigate to new path
    expect(mockPush).toHaveBeenCalledWith('/en/dashboard');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should not change if same locale selected', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'ja' } });

    // Should not navigate
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('LanguageSwitcherButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('should render button with current locale', () => {
    render(<LanguageSwitcherButton />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('日本語')).toBeInTheDocument();
  });

  it('should have aria-label for accessibility', () => {
    render(<LanguageSwitcherButton />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '言語を選択');
  });

  it('should open dropdown on click', () => {
    render(<LanguageSwitcherButton />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    // Menu items should be visible
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should close dropdown when clicking outside', () => {
    render(<LanguageSwitcherButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Click backdrop to close
    const backdrop = document.querySelector('.fixed.inset-0.z-10');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should change locale when menu item clicked', () => {
    render(<LanguageSwitcherButton />);

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Click English option
    const menuItems = screen.getAllByRole('menuitem');
    const englishItem = menuItems.find((item) => item.textContent?.includes('English'));
    if (englishItem) {
      fireEvent.click(englishItem);
    }

    // Should set cookie and navigate
    expect(document.cookie).toContain('NEXT_LOCALE=en');
    expect(mockPush).toHaveBeenCalledWith('/en/dashboard');
  });

  it('should show checkmark for current locale', () => {
    render(<LanguageSwitcherButton />);

    fireEvent.click(screen.getByRole('button'));

    const menuItems = screen.getAllByRole('menuitem');
    const jaItem = menuItems.find((item) => item.textContent?.includes('日本語'));

    expect(jaItem?.textContent).toContain('✓');
  });
});
