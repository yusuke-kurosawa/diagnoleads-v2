/**
 * next-intl Configuration
 *
 * 多言語対応のための中央設定
 * Intlayerと連携してルーティングと言語切り替えを最適化
 */

export const locales = ['ja', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ja';

/**
 * ロケール名の表示設定
 */
export const localeNames: Record<Locale, string> = {
  ja: '日本語',
  en: 'English',
};

/**
 * ロケール設定
 */
export const localeConfig = {
  locales,
  defaultLocale,
  localeNames,

  /**
   * ロケール検出の優先順位:
   * 1. URLパス (/ja/*, /en/*)
   * 2. Cookie (NEXT_LOCALE)
   * 3. Accept-Language ヘッダー
   * 4. デフォルトロケール
   */
  localeDetection: true,

  /**
   * Cookieの設定
   */
  cookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365, // 1年
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  },
};

/**
 * URLからロケールを取得
 */
export function getLocaleFromPathname(pathname: string): Locale | undefined {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];

  if (locales.includes(potentialLocale as Locale)) {
    return potentialLocale as Locale;
  }

  return undefined;
}

/**
 * パスにロケールプレフィックスを追加
 */
export function addLocalePrefix(pathname: string, locale: Locale): string {
  // すでにロケールプレフィックスがある場合は置換
  const currentLocale = getLocaleFromPathname(pathname);
  if (currentLocale) {
    return pathname.replace(`/${currentLocale}`, `/${locale}`);
  }

  // ロケールプレフィックスを追加
  return `/${locale}${pathname}`;
}

/**
 * パスからロケールプレフィックスを削除
 */
export function removeLocalePrefix(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (locale) {
    return pathname.replace(`/${locale}`, '') || '/';
  }
  return pathname;
}
