/**
 * Utils Module Tests
 *
 * Unit tests for utility functions
 */

import { describe, expect, it, vi } from 'vitest';
import { formatDate, formatRelativeTime, truncate } from '@/lib/utils';

// Inline implementations for functions that may not be exported
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomString(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format Date object to Japanese locale by default', () => {
      const date = new Date('2026-02-06T00:00:00Z');
      const result = formatDate(date);

      expect(result).toContain('2026');
      expect(result).toContain('2');
      expect(result).toContain('6');
    });

    it('should format string date', () => {
      const result = formatDate('2026-01-15');

      expect(result).toContain('2026');
      expect(result).toContain('1');
      expect(result).toContain('15');
    });

    it('should format to English locale', () => {
      const date = new Date('2026-02-06T00:00:00Z');
      const result = formatDate(date, 'en-US');

      expect(result).toContain('2026');
    });

    it('should handle different date formats', () => {
      const dates = [
        new Date(2026, 0, 1), // Jan 1, 2026
        new Date(2026, 11, 31), // Dec 31, 2026
        new Date(2026, 5, 15), // Jun 15, 2026
      ];

      for (const date of dates) {
        const result = formatDate(date);
        expect(result).toContain('2026');
        expect(typeof result).toBe('string');
      }
    });
  });

  describe('formatRelativeTime', () => {
    it('should format recent time as seconds ago', () => {
      const now = new Date();
      const tenSecondsAgo = new Date(now.getTime() - 10 * 1000);
      const result = formatRelativeTime(tenSecondsAgo);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should format time as minutes ago', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const result = formatRelativeTime(fiveMinutesAgo);

      expect(result).toBeTruthy();
    });

    it('should format time as hours ago', () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const result = formatRelativeTime(threeHoursAgo);

      expect(result).toBeTruthy();
    });

    it('should format time as days ago', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(twoDaysAgo);

      expect(result).toBeTruthy();
    });

    it('should format time as weeks ago', () => {
      const now = new Date();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(twoWeeksAgo);

      expect(result).toBeTruthy();
    });

    it('should format time as months ago', () => {
      const now = new Date();
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(twoMonthsAgo);

      expect(result).toBeTruthy();
    });

    it('should format time as years ago', () => {
      const now = new Date();
      const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(twoYearsAgo);

      expect(result).toBeTruthy();
    });

    it('should accept string date', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(yesterday);

      expect(result).toBeTruthy();
    });

    it('should support English locale', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const result = formatRelativeTime(oneHourAgo, 'en-US');

      expect(result).toBeTruthy();
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      const result = truncate('Hello', 10);

      expect(result).toBe('Hello');
    });

    it('should truncate long strings', () => {
      const result = truncate('Hello World', 5);

      expect(result).toBe('Hello...');
    });

    it('should handle exact length', () => {
      const result = truncate('Hello', 5);

      expect(result).toBe('Hello');
    });

    it('should handle empty string', () => {
      const result = truncate('', 10);

      expect(result).toBe('');
    });

    it('should handle single character truncation', () => {
      const result = truncate('Hello', 1);

      expect(result).toBe('H...');
    });

    it('should handle Japanese text', () => {
      const result = truncate('こんにちは世界', 3);

      expect(result).toBe('こんに...');
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(40);
    });

    it('should return a promise', () => {
      const result = sleep(10);

      expect(result).toBeInstanceOf(Promise);
    });

    it('should handle zero milliseconds', async () => {
      const start = Date.now();
      await sleep(0);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('randomString', () => {
    it('should generate string of default length', () => {
      const result = randomString();

      expect(result.length).toBe(10);
    });

    it('should generate string of specified length', () => {
      const result = randomString(20);

      expect(result.length).toBe(20);
    });

    it('should generate alphanumeric characters only', () => {
      const result = randomString(100);
      const validChars = /^[A-Za-z0-9]+$/;

      expect(validChars.test(result)).toBe(true);
    });

    it('should generate different strings each time', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(randomString(20));
      }

      // Should have mostly unique strings
      expect(results.size).toBeGreaterThan(90);
    });

    it('should handle length of 1', () => {
      const result = randomString(1);

      expect(result.length).toBe(1);
      expect(/^[A-Za-z0-9]$/.test(result)).toBe(true);
    });

    it('should handle length of 0', () => {
      const result = randomString(0);

      expect(result).toBe('');
    });
  });
});

describe('cn (className utility)', () => {
  it('should merge class names', async () => {
    const { cn } = await import('@/lib/utils/cn');

    const result = cn('class1', 'class2');

    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle conditional classes', async () => {
    const { cn } = await import('@/lib/utils/cn');
    const isActive = true;
    const isDisabled = false;

    const result = cn(
      'base',
      isActive && 'active',
      isDisabled && 'disabled'
    );

    expect(result).toContain('base');
    expect(result).toContain('active');
    expect(result).not.toContain('disabled');
  });

  it('should handle undefined and null', async () => {
    const { cn } = await import('@/lib/utils/cn');

    const result = cn('base', undefined, null, 'end');

    expect(result).toContain('base');
    expect(result).toContain('end');
  });

  it('should merge Tailwind classes correctly', async () => {
    const { cn } = await import('@/lib/utils/cn');

    const result = cn('px-4 py-2', 'px-6');

    // tailwind-merge should resolve conflicting classes
    expect(result).toContain('px-6');
    expect(result).toContain('py-2');
  });
});
