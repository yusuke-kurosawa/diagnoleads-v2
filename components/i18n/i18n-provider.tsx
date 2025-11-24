'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

/**
 * I18n Provider Component
 *
 * クライアントコンポーネント用のi18nプロバイダー
 * next-intlのNextIntlClientProviderをラップして使いやすくする
 */
interface I18nProviderProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
  timeZone?: string;
}

export function I18nProvider({ children, locale, messages, timeZone = 'Asia/Tokyo' }: I18nProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
      now={new Date()}
    >
      {children}
    </NextIntlClientProvider>
  );
}
