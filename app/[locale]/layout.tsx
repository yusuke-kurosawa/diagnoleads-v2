import { locales } from '@/lib/i18n/config';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Providers } from '../providers';
import '../globals.css';

/**
 * Viewport configuration for performance
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

/**
 * Generate metadata for locale pages
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.root' });

  return {
    title: {
      default: t('title'),
      template: `%s | ${t('title')}`,
    },
    description: t('description'),
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ja: '/ja',
        en: '/en',
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'ja' ? 'ja_JP' : 'en_US',
      siteName: t('title'),
    },
  };
}

/**
 * Generate static params for all supported locales
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Locale Layout
 *
 * ロケール対応のルートレイアウト
 * - next-intlによるメッセージ提供
 * - HTML lang属性の設定
 * - メタデータの多言語対応
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // サポートされていないロケールは404
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // メッセージをサーバーサイドで取得
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Tokyo">
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
