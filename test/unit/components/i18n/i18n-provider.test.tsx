/**
 * I18nProvider Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock next-intl
vi.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children, locale, messages, timeZone }: any) => (
    <div data-testid="i18n-provider" data-locale={locale} data-timezone={timeZone}>
      {children}
    </div>
  ),
}));

import { I18nProvider } from '@/components/i18n/i18n-provider';

describe('I18nProvider', () => {
  const mockMessages = {
    common: {
      hello: 'Hello',
      goodbye: 'Goodbye',
    },
  };

  it('should render children', () => {
    render(
      <I18nProvider locale="en" messages={mockMessages}>
        <div data-testid="child">Child Content</div>
      </I18nProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should pass locale to provider', () => {
    render(
      <I18nProvider locale="ja" messages={mockMessages}>
        <div>Content</div>
      </I18nProvider>
    );

    const provider = screen.getByTestId('i18n-provider');
    expect(provider).toHaveAttribute('data-locale', 'ja');
  });

  it('should use default timezone', () => {
    render(
      <I18nProvider locale="ja" messages={mockMessages}>
        <div>Content</div>
      </I18nProvider>
    );

    const provider = screen.getByTestId('i18n-provider');
    expect(provider).toHaveAttribute('data-timezone', 'Asia/Tokyo');
  });

  it('should accept custom timezone', () => {
    render(
      <I18nProvider locale="en" messages={mockMessages} timeZone="America/New_York">
        <div>Content</div>
      </I18nProvider>
    );

    const provider = screen.getByTestId('i18n-provider');
    expect(provider).toHaveAttribute('data-timezone', 'America/New_York');
  });

  it('should support different locales', () => {
    const { rerender } = render(
      <I18nProvider locale="en" messages={mockMessages}>
        <div>Content</div>
      </I18nProvider>
    );

    expect(screen.getByTestId('i18n-provider')).toHaveAttribute('data-locale', 'en');

    rerender(
      <I18nProvider locale="ja" messages={mockMessages}>
        <div>Content</div>
      </I18nProvider>
    );

    expect(screen.getByTestId('i18n-provider')).toHaveAttribute('data-locale', 'ja');
  });
});
