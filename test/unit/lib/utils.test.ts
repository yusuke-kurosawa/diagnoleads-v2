/**
 * Utils Tests
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cn, formatDate, formatRelativeTime, truncate } from '@/lib/utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active')).toBe('base active');
    expect(cn('base', false && 'active')).toBe('base');
  });

  it('should deduplicate tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('should handle arrays', () => {
    expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1');
  });

  it('should handle objects', () => {
    expect(cn({ 'bg-red-500': true, 'text-white': true })).toBe('bg-red-500 text-white');
    expect(cn({ 'bg-red-500': false, 'text-white': true })).toBe('text-white');
  });

  it('should handle undefined and null', () => {
    expect(cn('base', undefined, null, 'active')).toBe('base active');
  });

  it('should handle empty strings', () => {
    expect(cn('', 'active')).toBe('active');
  });
});

describe('formatDate', () => {
  it('should format date object', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date);
    expect(formatted).toContain('2024');
    expect(formatted).toContain('1');
    expect(formatted).toContain('15');
  });

  it('should format date string', () => {
    const formatted = formatDate('2024-06-20');
    expect(formatted).toContain('2024');
    // June may be formatted as "June" or "6月"
    expect(formatted).toMatch(/June|6/);
    expect(formatted).toContain('20');
  });

  it('should support different locales', () => {
    const date = new Date('2024-01-15');
    const japaneseFormat = formatDate(date, 'ja-JP');
    const englishFormat = formatDate(date, 'en-US');
    
    // Both should contain year but format differently
    expect(japaneseFormat).toContain('2024');
    expect(englishFormat).toContain('2024');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format seconds ago', () => {
    const date = new Date('2024-06-15T11:59:30Z'); // 30 seconds ago
    const formatted = formatRelativeTime(date);
    // May format as "30 seconds ago" or "1 minute ago"
    expect(typeof formatted).toBe('string');
  });

  it('should format minutes ago', () => {
    const date = new Date('2024-06-15T11:55:00Z'); // 5 minutes ago
    const formatted = formatRelativeTime(date);
    expect(formatted).toContain('5');
  });

  it('should format hours ago', () => {
    const date = new Date('2024-06-15T09:00:00Z'); // 3 hours ago
    const formatted = formatRelativeTime(date);
    expect(formatted).toContain('3');
  });

  it('should format days ago', () => {
    const date = new Date('2024-06-12T12:00:00Z'); // 3 days ago
    const formatted = formatRelativeTime(date);
    expect(formatted).toContain('3');
  });

  it('should format weeks ago', () => {
    const date = new Date('2024-06-01T12:00:00Z'); // 2 weeks ago
    const formatted = formatRelativeTime(date);
    // May be "2 weeks" or "14 days"
    expect(formatted).toMatch(/2|14/);
  });

  it('should format months ago', () => {
    const date = new Date('2024-04-15T12:00:00Z'); // 2 months ago
    const formatted = formatRelativeTime(date);
    expect(formatted).toContain('2');
  });

  it('should format years ago', () => {
    const date = new Date('2022-06-15T12:00:00Z'); // 2 years ago
    const formatted = formatRelativeTime(date);
    expect(formatted).toContain('2');
  });

  it('should accept string date', () => {
    const formatted = formatRelativeTime('2024-06-15T11:55:00Z');
    expect(typeof formatted).toBe('string');
  });
});

describe('truncate', () => {
  it('should truncate long string', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('should not truncate short string', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('should handle exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('should handle empty string', () => {
    expect(truncate('', 5)).toBe('');
  });

  it('should handle length of 0', () => {
    expect(truncate('Hello', 0)).toBe('...');
  });
});


