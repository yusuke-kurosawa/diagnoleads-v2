import { describe, it, expect } from 'vitest';
import { formatDate, formatRelativeTime, truncate } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-15');
      const formatted = formatDate(date);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const longString = 'This is a very long string that needs to be truncated';
      const result = truncate(longString, 20);
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBeLessThanOrEqual(23);
    });

    it('should not truncate short strings', () => {
      const shortString = 'Short';
      const result = truncate(shortString, 20);
      expect(result).toBe('Short');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format recent time correctly', () => {
      const now = new Date();
      const result = formatRelativeTime(now);
      expect(result).toBeDefined();
    });
  });
});
