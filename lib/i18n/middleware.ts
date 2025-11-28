import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { defaultLocale, getLocaleFromPathname, localeConfig, locales } from './config';

/**
 * next-intl Middleware Factory
 *
 * ロケール検出とルーティングを処理
 */
export const intlMiddleware = createMiddleware({
  // サポートするロケール
  locales: locales as unknown as string[],

  // デフォルトロケール
  defaultLocale,

  // ロケール検出を有効化
  localeDetection: localeConfig.localeDetection,

  // デフォルトロケールの場合もプレフィックスを付与
  localePrefix: 'always' as const,

  // リダイレクト時のステータスコード（308 = Permanent Redirect）
  alternateLinks: false,
});

/**
 * Check if a path should skip i18n middleware
 */
export function shouldSkipI18nMiddleware(pathname: string): boolean {
  // APIルート、静的ファイル、Next.js内部ファイルはスキップ
  const skipPaths = [
    '/api',
    '/_next',
    '/static',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
  ];

  // ファイル拡張子を持つパスをスキップ
  const fileExtensions = /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|json|xml|txt)$/;

  return skipPaths.some((path) => pathname.startsWith(path)) || fileExtensions.test(pathname);
}

/**
 * Get locale from request
 * 優先順位: URL > Cookie > Accept-Language > Default
 */
export function getLocaleFromRequest(request: NextRequest): string {
  const { pathname } = request.nextUrl;

  // 1. URLパスからロケールを取得
  const localeFromPath = getLocaleFromPathname(pathname);
  if (localeFromPath) {
    return localeFromPath;
  }

  // 2. Cookieからロケールを取得
  const localeCookie = request.cookies.get(localeConfig.cookie.name);
  if (localeCookie && locales.includes(localeCookie.value as (typeof locales)[number])) {
    return localeCookie.value;
  }

  // 3. Accept-Languageヘッダーからロケールを取得
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    // Accept-Languageは "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7" のような形式
    const languages = acceptLanguage.split(',').map((lang) => {
      const parts = lang.trim().split(';');
      const locale = parts[0].split('-')[0]; // "ja-JP" -> "ja"
      return locale;
    });

    for (const lang of languages) {
      if (locales.includes(lang as (typeof locales)[number])) {
        return lang;
      }
    }
  }

  // 4. デフォルトロケール
  return defaultLocale;
}

/**
 * Remove locale prefix from pathname
 * Used for checking routes without locale prefix
 */
export function stripLocalePrefix(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (locale) {
    return pathname.replace(`/${locale}`, '') || '/';
  }
  return pathname;
}

/**
 * Add locale prefix to pathname
 */
export function addLocalePrefixToPath(pathname: string, locale: string): string {
  const currentLocale = getLocaleFromPathname(pathname);

  // すでにロケールプレフィックスがある場合は置換
  if (currentLocale) {
    return pathname.replace(`/${currentLocale}`, `/${locale}`);
  }

  // ロケールプレフィックスを追加
  return `/${locale}${pathname}`;
}
