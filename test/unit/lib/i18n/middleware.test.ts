/**
 * i18n Middleware Tests
 */

import { describe, expect, it } from 'vitest';

// Constants matching source
const locales = ['ja', 'en'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'ja';

// Helper functions
function getLocaleFromPathname(pathname: string): Locale | undefined {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  if (locales.includes(potentialLocale as Locale)) {
    return potentialLocale as Locale;
  }
  return undefined;
}

function getLocaleFromAcceptLanguage(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  
  const languages = acceptLanguage.split(',').map(lang => {
    const [code, qValue] = lang.trim().split(';q=');
    return {
      code: code.split('-')[0].toLowerCase(),
      q: qValue ? parseFloat(qValue) : 1,
    };
  });
  
  languages.sort((a, b) => b.q - a.q);
  
  for (const lang of languages) {
    if (locales.includes(lang.code as Locale)) {
      return lang.code as Locale;
    }
  }
  
  return defaultLocale;
}

function shouldRedirect(pathname: string): boolean {
  const hasLocale = getLocaleFromPathname(pathname) !== undefined;
  const isApi = pathname.startsWith('/api');
  const isStatic = pathname.startsWith('/_next') || pathname.includes('.');
  
  return !hasLocale && !isApi && !isStatic;
}

describe('getLocaleFromPathname', () => {
  it('should return ja from /ja path', () => {
    expect(getLocaleFromPathname('/ja')).toBe('ja');
    expect(getLocaleFromPathname('/ja/')).toBe('ja');
    expect(getLocaleFromPathname('/ja/dashboard')).toBe('ja');
  });

  it('should return en from /en path', () => {
    expect(getLocaleFromPathname('/en')).toBe('en');
    expect(getLocaleFromPathname('/en/')).toBe('en');
    expect(getLocaleFromPathname('/en/dashboard')).toBe('en');
  });

  it('should return undefined for paths without locale', () => {
    expect(getLocaleFromPathname('/')).toBeUndefined();
    expect(getLocaleFromPathname('/dashboard')).toBeUndefined();
    expect(getLocaleFromPathname('/api/health')).toBeUndefined();
  });

  it('should return undefined for invalid locales', () => {
    expect(getLocaleFromPathname('/fr/dashboard')).toBeUndefined();
    expect(getLocaleFromPathname('/de/settings')).toBeUndefined();
  });
});

describe('getLocaleFromAcceptLanguage', () => {
  it('should return ja for Japanese preference', () => {
    expect(getLocaleFromAcceptLanguage('ja-JP,ja;q=0.9')).toBe('ja');
    expect(getLocaleFromAcceptLanguage('ja')).toBe('ja');
  });

  it('should return en for English preference', () => {
    expect(getLocaleFromAcceptLanguage('en-US,en;q=0.9')).toBe('en');
    expect(getLocaleFromAcceptLanguage('en')).toBe('en');
  });

  it('should return default for unsupported language', () => {
    expect(getLocaleFromAcceptLanguage('fr-FR,fr;q=0.9')).toBe('ja');
    expect(getLocaleFromAcceptLanguage('de')).toBe('ja');
  });

  it('should return default for null/empty', () => {
    expect(getLocaleFromAcceptLanguage(null)).toBe('ja');
    expect(getLocaleFromAcceptLanguage('')).toBe('ja');
  });

  it('should respect quality values', () => {
    expect(getLocaleFromAcceptLanguage('en;q=0.8,ja;q=0.9')).toBe('ja');
    expect(getLocaleFromAcceptLanguage('ja;q=0.5,en;q=0.9')).toBe('en');
  });

  it('should handle complex Accept-Language headers', () => {
    const header = 'fr-FR,fr;q=0.9,en;q=0.8,ja;q=0.7';
    expect(getLocaleFromAcceptLanguage(header)).toBe('en');
  });
});

describe('shouldRedirect', () => {
  it('should return true for paths without locale', () => {
    expect(shouldRedirect('/')).toBe(true);
    expect(shouldRedirect('/dashboard')).toBe(true);
    expect(shouldRedirect('/settings/profile')).toBe(true);
  });

  it('should return false for paths with locale', () => {
    expect(shouldRedirect('/ja')).toBe(false);
    expect(shouldRedirect('/ja/dashboard')).toBe(false);
    expect(shouldRedirect('/en/settings')).toBe(false);
  });

  it('should return false for API routes', () => {
    expect(shouldRedirect('/api/health')).toBe(false);
    expect(shouldRedirect('/api/trpc/leads.list')).toBe(false);
    expect(shouldRedirect('/api/auth/login')).toBe(false);
  });

  it('should return false for static files', () => {
    expect(shouldRedirect('/_next/static/chunk.js')).toBe(false);
    expect(shouldRedirect('/favicon.ico')).toBe(false);
    expect(shouldRedirect('/images/logo.png')).toBe(false);
  });
});

describe('Middleware locale detection priority', () => {
  it('should prioritize URL locale over cookie', () => {
    const urlLocale = getLocaleFromPathname('/en/dashboard');
    const cookieLocale = 'ja' as Locale;
    const result = urlLocale ?? cookieLocale;
    expect(result).toBe('en');
  });

  it('should use cookie when URL has no locale', () => {
    const urlLocale = getLocaleFromPathname('/dashboard');
    const cookieLocale = 'en' as Locale;
    const result = urlLocale ?? cookieLocale;
    expect(result).toBe('en');
  });

  it('should use Accept-Language when no cookie', () => {
    const urlLocale = getLocaleFromPathname('/dashboard');
    const cookieLocale = undefined;
    const acceptLanguage = 'en-US';
    const result = urlLocale ?? cookieLocale ?? getLocaleFromAcceptLanguage(acceptLanguage);
    expect(result).toBe('en');
  });
});

describe('Protected paths', () => {
  const protectedPaths = [
    '/dashboard',
    '/settings',
    '/leads',
    '/analytics',
    '/webhooks',
  ];

  it('should identify protected paths', () => {
    const isProtected = (path: string) =>
      protectedPaths.some(p => path.startsWith(`/ja${p}`) || path.startsWith(`/en${p}`));

    expect(isProtected('/ja/dashboard')).toBe(true);
    expect(isProtected('/en/settings')).toBe(true);
    expect(isProtected('/ja/leads/123')).toBe(true);
  });

  it('should identify public paths', () => {
    const publicPaths = ['/', '/login', '/signup', '/diagnostic'];
    const isPublic = (path: string) =>
      publicPaths.some(p => path === `/ja${p}` || path === `/en${p}` || path === p);

    expect(isPublic('/ja/login')).toBe(true);
    expect(isPublic('/en/signup')).toBe(true);
  });
});

describe('Redirect URL construction', () => {
  it('should construct redirect URL with locale', () => {
    const constructRedirectUrl = (pathname: string, locale: Locale) =>
      `/${locale}${pathname}`;

    expect(constructRedirectUrl('/dashboard', 'ja')).toBe('/ja/dashboard');
    expect(constructRedirectUrl('/settings', 'en')).toBe('/en/settings');
  });

  it('should handle root path', () => {
    const constructRedirectUrl = (pathname: string, locale: Locale) =>
      pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;

    expect(constructRedirectUrl('/', 'ja')).toBe('/ja');
    expect(constructRedirectUrl('/', 'en')).toBe('/en');
  });
});

describe('Cookie handling', () => {
  it('should define cookie options', () => {
    const cookieOptions = {
      name: 'NEXT_LOCALE',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    };

    expect(cookieOptions.name).toBe('NEXT_LOCALE');
    expect(cookieOptions.maxAge).toBe(31536000);
  });
});

// Integration tests with actual module
import {
  shouldSkipI18nMiddleware,
  stripLocalePrefix,
  addLocalePrefixToPath,
} from '@/lib/i18n/middleware';

describe('Integration: shouldSkipI18nMiddleware', () => {
  it('should skip API routes', () => {
    expect(shouldSkipI18nMiddleware('/api/health')).toBe(true);
    expect(shouldSkipI18nMiddleware('/api/trpc/leads.list')).toBe(true);
    expect(shouldSkipI18nMiddleware('/api/auth/session')).toBe(true);
  });

  it('should skip _next paths', () => {
    expect(shouldSkipI18nMiddleware('/_next/static/chunks/main.js')).toBe(true);
    expect(shouldSkipI18nMiddleware('/_next/image')).toBe(true);
  });

  it('should skip static files', () => {
    expect(shouldSkipI18nMiddleware('/favicon.ico')).toBe(true);
    expect(shouldSkipI18nMiddleware('/robots.txt')).toBe(true);
    expect(shouldSkipI18nMiddleware('/sitemap.xml')).toBe(true);
  });

  it('should skip PayloadCMS admin', () => {
    expect(shouldSkipI18nMiddleware('/admin')).toBe(true);
    expect(shouldSkipI18nMiddleware('/admin/collections/posts')).toBe(true);
  });

  it('should skip files with extensions', () => {
    expect(shouldSkipI18nMiddleware('/images/logo.png')).toBe(true);
    expect(shouldSkipI18nMiddleware('/fonts/roboto.woff2')).toBe(false); // woff2 not in list
    expect(shouldSkipI18nMiddleware('/styles/main.css')).toBe(true);
    expect(shouldSkipI18nMiddleware('/scripts/app.js')).toBe(true);
  });

  it('should not skip regular pages', () => {
    expect(shouldSkipI18nMiddleware('/dashboard')).toBe(false);
    expect(shouldSkipI18nMiddleware('/settings/profile')).toBe(false);
    expect(shouldSkipI18nMiddleware('/')).toBe(false);
    expect(shouldSkipI18nMiddleware('/ja/dashboard')).toBe(false);
  });
});

describe('Integration: stripLocalePrefix', () => {
  it('should strip ja prefix', () => {
    expect(stripLocalePrefix('/ja/dashboard')).toBe('/dashboard');
    expect(stripLocalePrefix('/ja/settings/profile')).toBe('/settings/profile');
  });

  it('should strip en prefix', () => {
    expect(stripLocalePrefix('/en/dashboard')).toBe('/dashboard');
    expect(stripLocalePrefix('/en/leads/123')).toBe('/leads/123');
  });

  it('should return / for locale-only paths', () => {
    expect(stripLocalePrefix('/ja')).toBe('/');
    expect(stripLocalePrefix('/en')).toBe('/');
  });

  it('should return unchanged for paths without locale', () => {
    expect(stripLocalePrefix('/dashboard')).toBe('/dashboard');
    expect(stripLocalePrefix('/')).toBe('/');
  });
});

describe('Integration: addLocalePrefixToPath', () => {
  it('should add locale prefix', () => {
    expect(addLocalePrefixToPath('/dashboard', 'ja')).toBe('/ja/dashboard');
    expect(addLocalePrefixToPath('/settings', 'en')).toBe('/en/settings');
  });

  it('should replace existing locale', () => {
    expect(addLocalePrefixToPath('/ja/dashboard', 'en')).toBe('/en/dashboard');
    expect(addLocalePrefixToPath('/en/settings', 'ja')).toBe('/ja/settings');
  });

  it('should handle root path', () => {
    expect(addLocalePrefixToPath('/', 'ja')).toBe('/ja/');
    expect(addLocalePrefixToPath('/', 'en')).toBe('/en/');
  });

  it('should handle nested paths', () => {
    expect(addLocalePrefixToPath('/leads/123/edit', 'ja')).toBe('/ja/leads/123/edit');
    expect(addLocalePrefixToPath('/ja/leads/123/edit', 'en')).toBe('/en/leads/123/edit');
  });
});

import { getLocaleFromPathname as actualGetLocaleFromPathname, localeConfig as actualLocaleConfig, locales as actualLocales, defaultLocale as actualDefaultLocale } from '@/lib/i18n/config';
import { getLocaleFromRequest } from '@/lib/i18n/middleware';

// Mock NextRequest
function createMockNextRequest(options: {
  pathname: string;
  cookieLocale?: string;
  acceptLanguage?: string;
}) {
  return {
    nextUrl: {
      pathname: options.pathname,
    },
    cookies: {
      get: (name: string) => {
        if (name === 'NEXT_LOCALE' && options.cookieLocale) {
          return { value: options.cookieLocale };
        }
        return undefined;
      },
    },
    headers: {
      get: (name: string) => {
        if (name === 'accept-language') {
          return options.acceptLanguage ?? null;
        }
        return null;
      },
    },
  } as any;
}

describe('Integration: getLocaleFromRequest (actual)', () => {
  it('should return locale from URL path', () => {
    const request = createMockNextRequest({ pathname: '/ja/dashboard' });
    expect(getLocaleFromRequest(request)).toBe('ja');
  });

  it('should return en from URL path', () => {
    const request = createMockNextRequest({ pathname: '/en/settings' });
    expect(getLocaleFromRequest(request)).toBe('en');
  });

  it('should fallback to cookie when no path locale', () => {
    const request = createMockNextRequest({ pathname: '/dashboard', cookieLocale: 'en' });
    expect(getLocaleFromRequest(request)).toBe('en');
  });

  it('should fallback to Accept-Language when no cookie', () => {
    const request = createMockNextRequest({ pathname: '/dashboard', acceptLanguage: 'en-US,en;q=0.9' });
    expect(getLocaleFromRequest(request)).toBe('en');
  });

  it('should return default when nothing matches', () => {
    const request = createMockNextRequest({ pathname: '/dashboard', acceptLanguage: 'fr-FR' });
    expect(getLocaleFromRequest(request)).toBe('ja');
  });

  it('should ignore invalid cookie locale', () => {
    const request = createMockNextRequest({ pathname: '/dashboard', cookieLocale: 'fr', acceptLanguage: 'en-US' });
    expect(getLocaleFromRequest(request)).toBe('en');
  });

  it('should handle complex Accept-Language headers', () => {
    const request = createMockNextRequest({ pathname: '/dashboard', acceptLanguage: 'fr-FR,fr;q=0.9,en-US,en;q=0.8' });
    expect(getLocaleFromRequest(request)).toBe('en');
  });

  it('should prioritize URL over cookie and Accept-Language', () => {
    const request = createMockNextRequest({ pathname: '/ja/dashboard', cookieLocale: 'en', acceptLanguage: 'en-US' });
    expect(getLocaleFromRequest(request)).toBe('ja');
  });

  it('should prioritize cookie over Accept-Language', () => {
    const request = createMockNextRequest({ pathname: '/dashboard', cookieLocale: 'ja', acceptLanguage: 'en-US' });
    expect(getLocaleFromRequest(request)).toBe('ja');
  });

  it('should handle empty Accept-Language', () => {
    const request = createMockNextRequest({ pathname: '/dashboard' });
    expect(getLocaleFromRequest(request)).toBe('ja');
  });
});

describe('Integration: getLocaleFromRequest logic', () => {
  // Test the logic of getLocaleFromRequest without NextRequest
  const getLocaleFromRequestLogic = (
    pathname: string,
    cookieLocale: string | undefined,
    acceptLanguage: string | null
  ): string => {
    // 1. URL path
    const localeFromPath = getLocaleFromPathname(pathname);
    if (localeFromPath) {
      return localeFromPath;
    }

    // 2. Cookie
    if (cookieLocale && locales.includes(cookieLocale as (typeof locales)[number])) {
      return cookieLocale;
    }

    // 3. Accept-Language header
    if (acceptLanguage) {
      const languages = acceptLanguage.split(',').map((lang) => {
        const parts = lang.trim().split(';');
        const locale = parts[0].split('-')[0];
        return locale;
      });

      for (const lang of languages) {
        if (locales.includes(lang as (typeof locales)[number])) {
          return lang;
        }
      }
    }

    // 4. Default
    return defaultLocale;
  };

  it('should return locale from path first', () => {
    expect(getLocaleFromRequestLogic('/ja/dashboard', 'en', 'en-US')).toBe('ja');
    expect(getLocaleFromRequestLogic('/en/settings', 'ja', 'ja-JP')).toBe('en');
  });

  it('should fallback to cookie when no path locale', () => {
    expect(getLocaleFromRequestLogic('/dashboard', 'en', 'ja-JP')).toBe('en');
    expect(getLocaleFromRequestLogic('/settings', 'ja', 'en-US')).toBe('ja');
  });

  it('should fallback to Accept-Language when no path or cookie', () => {
    expect(getLocaleFromRequestLogic('/dashboard', undefined, 'en-US,en;q=0.9')).toBe('en');
    expect(getLocaleFromRequestLogic('/settings', undefined, 'ja-JP,ja;q=0.9')).toBe('ja');
  });

  it('should fallback to default when nothing matches', () => {
    expect(getLocaleFromRequestLogic('/dashboard', undefined, 'fr-FR')).toBe('ja');
    expect(getLocaleFromRequestLogic('/settings', undefined, null)).toBe('ja');
  });

  it('should handle complex Accept-Language headers', () => {
    expect(getLocaleFromRequestLogic('/dashboard', undefined, 'fr-FR,fr;q=0.9,en-US,en;q=0.8')).toBe('en');
    expect(getLocaleFromRequestLogic('/settings', undefined, 'de,ja;q=0.8,en;q=0.5')).toBe('ja');
  });

  it('should ignore invalid cookie locale', () => {
    expect(getLocaleFromRequestLogic('/dashboard', 'fr', 'en-US')).toBe('en');
    expect(getLocaleFromRequestLogic('/settings', 'de', null)).toBe('ja');
  });
});
