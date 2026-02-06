/**
 * i18n Config Tests
 */

import { describe, expect, it } from 'vitest';
import {
  locales,
  defaultLocale,
  localeNames,
  localeConfig,
  getLocaleFromPathname,
  addLocalePrefix,
  removeLocalePrefix,
  type Locale,
} from '@/lib/i18n/config';

describe('locales', () => {
  it('should include ja and en', () => {
    expect(locales).toContain('ja');
    expect(locales).toContain('en');
  });

  it('should have 2 locales', () => {
    expect(locales).toHaveLength(2);
  });
});

describe('defaultLocale', () => {
  it('should be ja', () => {
    expect(defaultLocale).toBe('ja');
  });

  it('should be included in locales', () => {
    expect(locales).toContain(defaultLocale);
  });
});

describe('localeNames', () => {
  it('should have Japanese name', () => {
    expect(localeNames.ja).toBe('日本語');
  });

  it('should have English name', () => {
    expect(localeNames.en).toBe('English');
  });

  it('should have name for each locale', () => {
    for (const locale of locales) {
      expect(localeNames[locale]).toBeDefined();
    }
  });
});

describe('localeConfig', () => {
  it('should export locales', () => {
    expect(localeConfig.locales).toEqual(locales);
  });

  it('should export defaultLocale', () => {
    expect(localeConfig.defaultLocale).toBe(defaultLocale);
  });

  it('should enable locale detection', () => {
    expect(localeConfig.localeDetection).toBe(true);
  });

  it('should have cookie config', () => {
    expect(localeConfig.cookie).toBeDefined();
    expect(localeConfig.cookie.name).toBe('NEXT_LOCALE');
    expect(localeConfig.cookie.maxAge).toBe(60 * 60 * 24 * 365);
    expect(localeConfig.cookie.path).toBe('/');
    expect(localeConfig.cookie.sameSite).toBe('lax');
  });
});

describe('getLocaleFromPathname', () => {
  it('should return ja from /ja/dashboard', () => {
    expect(getLocaleFromPathname('/ja/dashboard')).toBe('ja');
  });

  it('should return en from /en/dashboard', () => {
    expect(getLocaleFromPathname('/en/dashboard')).toBe('en');
  });

  it('should return ja from /ja/', () => {
    expect(getLocaleFromPathname('/ja/')).toBe('ja');
  });

  it('should return undefined for /dashboard', () => {
    expect(getLocaleFromPathname('/dashboard')).toBeUndefined();
  });

  it('should return undefined for /', () => {
    expect(getLocaleFromPathname('/')).toBeUndefined();
  });

  it('should return undefined for invalid locale', () => {
    expect(getLocaleFromPathname('/fr/dashboard')).toBeUndefined();
  });

  it('should handle nested paths', () => {
    expect(getLocaleFromPathname('/ja/dashboard/leads/123')).toBe('ja');
    expect(getLocaleFromPathname('/en/settings/profile')).toBe('en');
  });
});

describe('addLocalePrefix', () => {
  it('should add ja prefix', () => {
    expect(addLocalePrefix('/dashboard', 'ja')).toBe('/ja/dashboard');
  });

  it('should add en prefix', () => {
    expect(addLocalePrefix('/dashboard', 'en')).toBe('/en/dashboard');
  });

  it('should replace existing locale prefix', () => {
    expect(addLocalePrefix('/ja/dashboard', 'en')).toBe('/en/dashboard');
    expect(addLocalePrefix('/en/settings', 'ja')).toBe('/ja/settings');
  });

  it('should handle root path', () => {
    expect(addLocalePrefix('/', 'ja')).toBe('/ja/');
    expect(addLocalePrefix('/', 'en')).toBe('/en/');
  });

  it('should handle nested paths', () => {
    expect(addLocalePrefix('/dashboard/leads/new', 'ja')).toBe('/ja/dashboard/leads/new');
  });
});

describe('removeLocalePrefix', () => {
  it('should remove ja prefix', () => {
    expect(removeLocalePrefix('/ja/dashboard')).toBe('/dashboard');
  });

  it('should remove en prefix', () => {
    expect(removeLocalePrefix('/en/dashboard')).toBe('/dashboard');
  });

  it('should return path unchanged if no locale', () => {
    expect(removeLocalePrefix('/dashboard')).toBe('/dashboard');
  });

  it('should return / for locale-only path', () => {
    expect(removeLocalePrefix('/ja')).toBe('/');
    expect(removeLocalePrefix('/en')).toBe('/');
  });

  it('should handle nested paths', () => {
    expect(removeLocalePrefix('/ja/dashboard/leads/123')).toBe('/dashboard/leads/123');
  });

  it('should not remove non-locale prefixes', () => {
    expect(removeLocalePrefix('/fr/dashboard')).toBe('/fr/dashboard');
  });
});

describe('Locale type', () => {
  it('should accept valid locales', () => {
    const ja: Locale = 'ja';
    const en: Locale = 'en';
    
    expect(ja).toBe('ja');
    expect(en).toBe('en');
  });
});

describe('Cookie configuration', () => {
  it('should have secure flag in production', () => {
    // This test checks the config structure
    expect(localeConfig.cookie).toHaveProperty('secure');
  });

  it('should have 1 year expiration', () => {
    const oneYearInSeconds = 60 * 60 * 24 * 365;
    expect(localeConfig.cookie.maxAge).toBe(oneYearInSeconds);
  });
});
