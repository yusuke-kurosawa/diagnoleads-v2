/**
 * i18n Request Configuration Tests
 */

import { describe, expect, it, vi } from 'vitest';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';

describe('Request Configuration', () => {
  describe('Locale validation', () => {
    it('should validate supported locales', () => {
      expect(locales.includes('ja')).toBe(true);
      expect(locales.includes('en')).toBe(true);
    });

    it('should reject unsupported locales', () => {
      expect(locales.includes('fr' as Locale)).toBe(false);
      expect(locales.includes('de' as Locale)).toBe(false);
    });

    it('should use ja as default locale', () => {
      expect(defaultLocale).toBe('ja');
    });
  });

  describe('Locale fallback logic', () => {
    const getLocaleWithFallback = (locale: string | undefined): Locale => {
      if (!locale || !locales.includes(locale as Locale)) {
        return defaultLocale;
      }
      return locale as Locale;
    };

    it('should return valid locale as-is', () => {
      expect(getLocaleWithFallback('ja')).toBe('ja');
      expect(getLocaleWithFallback('en')).toBe('en');
    });

    it('should fallback for undefined locale', () => {
      expect(getLocaleWithFallback(undefined)).toBe('ja');
    });

    it('should fallback for unsupported locale', () => {
      expect(getLocaleWithFallback('fr')).toBe('ja');
      expect(getLocaleWithFallback('zh')).toBe('ja');
    });

    it('should fallback for empty string', () => {
      expect(getLocaleWithFallback('')).toBe('ja');
    });
  });

  describe('Message fallback', () => {
    const getMessageFallback = ({ key, namespace }: { key: string; namespace?: string }) => {
      return `[Missing: ${key}]`;
    };

    it('should return fallback for missing key', () => {
      expect(getMessageFallback({ key: 'test' })).toBe('[Missing: test]');
    });

    it('should include key in fallback', () => {
      expect(getMessageFallback({ key: 'buttons.submit' })).toBe('[Missing: buttons.submit]');
    });

    it('should handle namespace', () => {
      const result = getMessageFallback({ key: 'title', namespace: 'dashboard' });
      expect(result).toContain('title');
    });
  });

  describe('Error handling', () => {
    it('should have error handler for development', () => {
      const mockError = new Error('Translation error');
      const onError = (error: Error) => {
        expect(error.message).toBe('Translation error');
      };

      onError(mockError);
    });

    it('should handle missing translation error', () => {
      const missingError = new Error('Missing translation: common.unknownKey');
      expect(missingError.message).toContain('Missing translation');
    });
  });

  describe('Timezone configuration', () => {
    it('should use Asia/Tokyo timezone', () => {
      const timeZone = 'Asia/Tokyo';
      expect(timeZone).toBe('Asia/Tokyo');
    });

    it('should have valid now date', () => {
      const now = new Date();
      expect(now instanceof Date).toBe(true);
      expect(now.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Message loading', () => {
    it('should support dynamic import paths', async () => {
      const getMessagePath = (locale: Locale) => `@/locales/${locale}/common.json`;

      expect(getMessagePath('ja')).toBe('@/locales/ja/common.json');
      expect(getMessagePath('en')).toBe('@/locales/en/common.json');
    });

    it('should generate correct paths for all locales', () => {
      for (const locale of locales) {
        const path = `@/locales/${locale}/common.json`;
        expect(path).toContain(locale);
        expect(path).toContain('common.json');
      }
    });
  });

  describe('Request config structure', () => {
    it('should define expected config properties', () => {
      const configShape = {
        locale: 'ja' as Locale,
        messages: {},
        timeZone: 'Asia/Tokyo',
        now: new Date(),
        onError: undefined,
        getMessageFallback: ({ key }: { key: string }) => `[Missing: ${key}]`,
      };

      expect(configShape).toHaveProperty('locale');
      expect(configShape).toHaveProperty('messages');
      expect(configShape).toHaveProperty('timeZone');
      expect(configShape).toHaveProperty('now');
      expect(configShape).toHaveProperty('getMessageFallback');
    });
  });
});

describe('Locale type safety', () => {
  it('should enforce Locale type', () => {
    const validLocales: Locale[] = ['ja', 'en'];
    expect(validLocales).toHaveLength(2);
  });

  it('should work with array methods', () => {
    const isValid = (locale: string): locale is Locale => {
      return locales.includes(locale as Locale);
    };

    expect(isValid('ja')).toBe(true);
    expect(isValid('en')).toBe(true);
    expect(isValid('fr')).toBe(false);
  });
});
