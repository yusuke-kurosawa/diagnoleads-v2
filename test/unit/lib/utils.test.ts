/**
 * Utils Tests
 *
 * Unit tests for utility functions
 */

import { describe, expect, it } from 'vitest';
import { cn, formatDate, formatRelativeTime, truncate } from '@/lib/utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should handle conditional classes', () => {
    const condition = true;
    expect(cn('base', condition && 'active')).toBe('base active');
  });

  it('should handle false conditions', () => {
    const condition = false;
    expect(cn('base', condition && 'active')).toBe('base');
  });

  it('should merge conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle arrays', () => {
    expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1');
  });

  it('should handle objects', () => {
    expect(cn({ 'px-2': true, 'py-1': false })).toBe('px-2');
  });

  it('should handle mixed inputs', () => {
    expect(cn('base', ['array-class'], { 'obj-class': true })).toBe(
      'base array-class obj-class'
    );
  });

  it('should handle undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('should handle empty string', () => {
    expect(cn('base', '', 'end')).toBe('base end');
  });
});

describe('formatDate', () => {
  it('should format date in English locale', () => {
    const date = new Date('2024-02-15');
    const result = formatDate(date, 'en');
    expect(result).toContain('February');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should format date in Japanese locale', () => {
    const date = new Date('2024-02-15');
    const result = formatDate(date, 'ja');
    expect(result).toContain('2024');
  });

  it('should default to English locale', () => {
    const date = new Date('2024-12-25');
    const result = formatDate(date);
    expect(result).toContain('December');
  });

  it('should handle different dates', () => {
    const dates = [
      new Date('2024-01-01'),
      new Date('2024-06-15'),
      new Date('2024-12-31'),
    ];

    for (const date of dates) {
      expect(formatDate(date, 'en')).toBeTruthy();
    }
  });
});

describe('formatRelativeTime', () => {
  it('should format recent time in English', () => {
    const now = new Date();
    const result = formatRelativeTime(now, 'en');
    expect(result).toContain('ago');
  });

  it('should format past date in English', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(pastDate, 'en');
    expect(result).toContain('ago');
  });

  it('should format in Japanese locale', () => {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000);
    const result = formatRelativeTime(pastDate, 'ja');
    expect(result).toBeTruthy();
  });

  it('should default to English locale', () => {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000);
    const result = formatRelativeTime(pastDate);
    expect(result).toContain('ago');
  });

  it('should handle different time intervals', () => {
    const intervals = [
      1000, // 1 second
      60 * 1000, // 1 minute
      60 * 60 * 1000, // 1 hour
      24 * 60 * 60 * 1000, // 1 day
      7 * 24 * 60 * 60 * 1000, // 1 week
    ];

    for (const interval of intervals) {
      const date = new Date(Date.now() - interval);
      const result = formatRelativeTime(date, 'en');
      expect(result).toBeTruthy();
    }
  });
});

describe('truncate', () => {
  it('should not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello');
    expect(truncate('test', 4)).toBe('test');
  });

  it('should truncate long strings', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
    expect(truncate('this is a long text', 7)).toBe('this is...');
  });

  it('should handle exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('should handle empty string', () => {
    expect(truncate('', 10)).toBe('');
  });

  it('should handle maxLength of 0', () => {
    expect(truncate('hello', 0)).toBe('...');
  });

  it('should handle single character truncation', () => {
    expect(truncate('hello', 1)).toBe('h...');
  });

  it('should preserve unicode characters', () => {
    expect(truncate('こんにちは世界', 5)).toBe('こんにちは...');
  });

  it('should handle strings with spaces', () => {
    expect(truncate('a b c d e', 5)).toBe('a b c...');
  });
});
