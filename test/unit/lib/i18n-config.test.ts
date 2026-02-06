/**
 * i18n Config Tests
 *
 * Unit tests for internationalization configuration
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

describe('locales configuration', () => {
  it('should have ja and en locales', () => {
    expect(locales).toContain('ja');
    expect(locales).toContain('en');
    expect(locales.length).toBe(2);
  });

  it('should have ja as default locale', () => {
    expect(defaultLocale).toBe('ja');
  });

  it('should have locale names for all locales', () => {
    expect(localeNames.ja).toBe('日本語');
    expect(localeNames.en).toBe('English');
  });
});

describe('localeConfig', () => {
  it('should have all required properties', () => {
    expect(localeConfig.locales).toBe(locales);
    expect(localeConfig.defaultLocale).toBe(defaultLocale);
    expect(localeConfig.localeNames).toBe(localeNames);
    expect(localeConfig.localeDetection).toBe(true);
  });

  it('should have cookie configuration', () => {
    expect(localeConfig.cookie.name).toBe('NEXT_LOCALE');
    expect(localeConfig.cookie.maxAge).toBe(60 * 60 * 24 * 365);
    expect(localeConfig.cookie.path).toBe('/');
    expect(localeConfig.cookie.sameSite).toBe('lax');
  });
});

describe('getLocaleFromPathname', () => {
  it('should extract ja locale from pathname', () => {
    expect(getLocaleFromPathname('/ja')).toBe('ja');
    expect(getLocaleFromPathname('/ja/')).toBe('ja');
    expect(getLocaleFromPathname('/ja/dashboard')).toBe('ja');
    expect(getLocaleFromPathname('/ja/settings/profile')).toBe('ja');
  });

  it('should extract en locale from pathname', () => {
    expect(getLocaleFromPathname('/en')).toBe('en');
    expect(getLocaleFromPathname('/en/')).toBe('en');
    expect(getLocaleFromPathname('/en/dashboard')).toBe('en');
    expect(getLocaleFromPathname('/en/settings/profile')).toBe('en');
  });

  it('should return undefined for paths without locale', () => {
    expect(getLocaleFromPathname('/')).toBeUndefined();
    expect(getLocaleFromPathname('/dashboard')).toBeUndefined();
    expect(getLocaleFromPathname('/api/test')).toBeUndefined();
  });

  it('should return undefined for invalid locales', () => {
    expect(getLocaleFromPathname('/fr/dashboard')).toBeUndefined();
    expect(getLocaleFromPathname('/de/settings')).toBeUndefined();
    expect(getLocaleFromPathname('/invalid')).toBeUndefined();
  });
});

describe('addLocalePrefix', () => {
  it('should add locale prefix to path', () => {
    expect(addLocalePrefix('/dashboard', 'ja')).toBe('/ja/dashboard');
    expect(addLocalePrefix('/settings', 'en')).toBe('/en/settings');
    expect(addLocalePrefix('/', 'ja')).toBe('/ja/');
  });

  it('should replace existing locale prefix', () => {
    expect(addLocalePrefix('/ja/dashboard', 'en')).toBe('/en/dashboard');
    expect(addLocalePrefix('/en/settings', 'ja')).toBe('/ja/settings');
  });

  it('should handle nested paths', () => {
    expect(addLocalePrefix('/dashboard/leads/123', 'ja')).toBe('/ja/dashboard/leads/123');
    expect(addLocalePrefix('/ja/dashboard/leads/123', 'en')).toBe('/en/dashboard/leads/123');
  });
});

describe('removeLocalePrefix', () => {
  it('should remove ja locale prefix', () => {
    expect(removeLocalePrefix('/ja/dashboard')).toBe('/dashboard');
    expect(removeLocalePrefix('/ja/settings/profile')).toBe('/settings/profile');
  });

  it('should remove en locale prefix', () => {
    expect(removeLocalePrefix('/en/dashboard')).toBe('/dashboard');
    expect(removeLocalePrefix('/en/settings/profile')).toBe('/settings/profile');
  });

  it('should return root for locale-only paths', () => {
    expect(removeLocalePrefix('/ja')).toBe('/');
    expect(removeLocalePrefix('/en')).toBe('/');
  });

  it('should return original path if no locale prefix', () => {
    expect(removeLocalePrefix('/dashboard')).toBe('/dashboard');
    expect(removeLocalePrefix('/')).toBe('/');
    expect(removeLocalePrefix('/api/test')).toBe('/api/test');
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
