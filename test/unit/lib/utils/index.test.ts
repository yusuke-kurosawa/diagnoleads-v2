/**
 * Utils index tests
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cn, formatDate, formatRelativeTime, truncate, sleep, randomString } from '@/lib/utils/index';

describe('cn export', () => {
  it('should export cn function', () => {
    expect(typeof cn).toBe('function');
  });

  it('should work correctly', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
});

describe('formatDate', () => {
  it('should format date object', () => {
    const date = new Date('2024-01-15T00:00:00Z');
    const formatted = formatDate(date);
    expect(formatted).toContain('2024');
  });

  it('should format date string', () => {
    const formatted = formatDate('2024-06-20');
    expect(formatted).toContain('2024');
  });

  it('should support ja-JP locale by default', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date);
    expect(formatted).toContain('2024');
  });

  it('should support en-US locale', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date, 'en-US');
    expect(formatted).toContain('2024');
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

  it('should format relative time', () => {
    const date = new Date('2024-06-15T11:55:00Z');
    const formatted = formatRelativeTime(date);
    expect(typeof formatted).toBe('string');
  });

  it('should handle date string input', () => {
    const formatted = formatRelativeTime('2024-06-14T12:00:00Z');
    expect(typeof formatted).toBe('string');
  });

  it('should support locale parameter', () => {
    const date = new Date('2024-06-14T12:00:00Z');
    const formatted = formatRelativeTime(date, 'en-US');
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

  it('should handle zero length', () => {
    expect(truncate('Hello', 0)).toBe('...');
  });

  it('should handle Japanese text', () => {
    expect(truncate('こんにちは世界', 5)).toBe('こんにちは...');
  });
});

describe('sleep', () => {
  it('should export sleep function', () => {
    expect(typeof sleep).toBe('function');
  });

  it('should return a promise', () => {
    const result = sleep(0);
    expect(result).toBeInstanceOf(Promise);
  });

  it('should resolve after specified time', async () => {
    const start = Date.now();
    await sleep(10);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(10);
  });
});

describe('randomString', () => {
  it('should export randomString function', () => {
    expect(typeof randomString).toBe('function');
  });

  it('should generate string of default length 10', () => {
    const result = randomString();
    expect(result.length).toBe(10);
  });

  it('should generate string of specified length', () => {
    expect(randomString(5).length).toBe(5);
    expect(randomString(20).length).toBe(20);
    expect(randomString(1).length).toBe(1);
  });

  it('should only contain alphanumeric characters', () => {
    const result = randomString(100);
    expect(/^[A-Za-z0-9]+$/.test(result)).toBe(true);
  });

  it('should generate different strings on each call', () => {
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(randomString(20));
    }
    expect(results.size).toBe(10);
  });
});

describe('formatRelativeTime edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle seconds', () => {
    const date = new Date('2024-06-15T11:59:30Z');
    const formatted = formatRelativeTime(date, 'en-US');
    expect(formatted).toContain('second');
  });

  it('should handle hours', () => {
    const date = new Date('2024-06-15T09:00:00Z');
    const formatted = formatRelativeTime(date, 'en-US');
    expect(formatted).toContain('hour');
  });

  it('should handle days', () => {
    const date = new Date('2024-06-12T12:00:00Z');
    const formatted = formatRelativeTime(date, 'en-US');
    expect(formatted).toContain('day');
  });

  it('should handle weeks', () => {
    const date = new Date('2024-06-01T12:00:00Z');
    const formatted = formatRelativeTime(date, 'en-US');
    expect(formatted).toContain('week');
  });

  it('should handle months', () => {
    const date = new Date('2024-04-15T12:00:00Z');
    const formatted = formatRelativeTime(date, 'en-US');
    expect(formatted).toContain('month');
  });

  it('should handle years', () => {
    const date = new Date('2022-06-15T12:00:00Z');
    const formatted = formatRelativeTime(date, 'en-US');
    expect(formatted).toContain('year');
  });
});
