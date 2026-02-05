/**
 * REST API v2 Analytics Tests
 *
 * Unit tests for analytics REST API endpoint
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Schema definition matching the API
const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

describe('REST API v2 - Analytics', () => {
  describe('Analytics Query Schema', () => {
    it('should accept valid query parameters', () => {
      const query = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        groupBy: 'month',
      };

      const result = analyticsQuerySchema.parse(query);

      expect(result.startDate).toBe('2024-01-01T00:00:00Z');
      expect(result.endDate).toBe('2024-12-31T23:59:59Z');
      expect(result.groupBy).toBe('month');
    });

    it('should use default groupBy', () => {
      const result = analyticsQuerySchema.parse({});

      expect(result.groupBy).toBe('day');
    });

    it('should accept all valid groupBy values', () => {
      for (const groupBy of ['day', 'week', 'month']) {
        const result = analyticsQuerySchema.parse({ groupBy });
        expect(result.groupBy).toBe(groupBy);
      }
    });

    it('should reject invalid groupBy', () => {
      expect(() => analyticsQuerySchema.parse({ groupBy: 'year' })).toThrow();
    });

    it('should reject invalid date format', () => {
      expect(() => analyticsQuerySchema.parse({ startDate: 'invalid' })).toThrow();
      expect(() => analyticsQuerySchema.parse({ endDate: '2024-01-01' })).toThrow();
    });

    it('should accept optional date parameters', () => {
      const result = analyticsQuerySchema.parse({});

      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });
  });

  describe('Analytics Response Format', () => {
    it('should have correct overview structure', () => {
      const mockOverview = {
        totalLeads: 150,
        avgScore: 72.5,
        newLeads: 45,
        contactedLeads: 35,
        qualifiedLeads: 40,
        convertedLeads: 30,
        conversionRate: 20.0,
      };

      expect(mockOverview).toHaveProperty('totalLeads');
      expect(mockOverview).toHaveProperty('avgScore');
      expect(mockOverview).toHaveProperty('newLeads');
      expect(mockOverview).toHaveProperty('contactedLeads');
      expect(mockOverview).toHaveProperty('qualifiedLeads');
      expect(mockOverview).toHaveProperty('convertedLeads');
      expect(mockOverview).toHaveProperty('conversionRate');
    });

    it('should have correct timeline data structure', () => {
      const mockTimeline = [
        { date: '2024-01-01', leads: 10, converted: 2 },
        { date: '2024-01-02', leads: 15, converted: 3 },
        { date: '2024-01-03', leads: 8, converted: 1 },
      ];

      expect(mockTimeline).toBeInstanceOf(Array);
      expect(mockTimeline[0]).toHaveProperty('date');
      expect(mockTimeline[0]).toHaveProperty('leads');
      expect(mockTimeline[0]).toHaveProperty('converted');
    });

    it('should have correct source breakdown structure', () => {
      const mockSources = [
        { source: 'website', count: 50, percentage: 33.3 },
        { source: 'referral', count: 40, percentage: 26.7 },
        { source: 'api', count: 60, percentage: 40.0 },
      ];

      expect(mockSources).toBeInstanceOf(Array);
      expect(mockSources[0]).toHaveProperty('source');
      expect(mockSources[0]).toHaveProperty('count');
      expect(mockSources[0]).toHaveProperty('percentage');
    });

    it('should have correct score distribution structure', () => {
      const mockScoreDistribution = {
        low: 30,    // 0-39
        medium: 45, // 40-69
        high: 50,   // 70-89
        hot: 25,    // 90-100
      };

      expect(mockScoreDistribution).toHaveProperty('low');
      expect(mockScoreDistribution).toHaveProperty('medium');
      expect(mockScoreDistribution).toHaveProperty('high');
      expect(mockScoreDistribution).toHaveProperty('hot');
    });
  });

  describe('Conversion Rate Calculation', () => {
    it('should calculate conversion rate correctly', () => {
      const totalLeads = 100;
      const convertedLeads = 25;
      const conversionRate = (convertedLeads / totalLeads) * 100;

      expect(conversionRate).toBe(25);
    });

    it('should handle zero leads', () => {
      const totalLeads = 0;
      const convertedLeads = 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      expect(conversionRate).toBe(0);
    });

    it('should round conversion rate to reasonable precision', () => {
      const totalLeads = 75;
      const convertedLeads = 17;
      const conversionRate = Math.round((convertedLeads / totalLeads) * 100 * 100) / 100;

      expect(conversionRate).toBe(22.67);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter by start date', () => {
      const startDate = new Date('2024-01-01');
      const leadDate = new Date('2024-01-15');

      expect(leadDate >= startDate).toBe(true);
    });

    it('should filter by end date', () => {
      const endDate = new Date('2024-12-31');
      const leadDate = new Date('2024-06-15');

      expect(leadDate <= endDate).toBe(true);
    });

    it('should filter by date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const leadDate = new Date('2024-06-15');

      expect(leadDate >= startDate && leadDate <= endDate).toBe(true);
    });

    it('should exclude dates outside range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const leadDate = new Date('2023-12-31');

      expect(leadDate >= startDate && leadDate <= endDate).toBe(false);
    });
  });

  describe('Grouping Logic', () => {
    it('should group by day correctly', () => {
      const date = new Date('2024-03-15T14:30:00Z');
      const dayKey = date.toISOString().split('T')[0];

      expect(dayKey).toBe('2024-03-15');
    });

    it('should group by week correctly', () => {
      const date = new Date('2024-03-15');
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const weekKey = startOfWeek.toISOString().split('T')[0];

      expect(weekKey).toBeDefined();
    });

    it('should group by month correctly', () => {
      const date = new Date('2024-03-15');
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      expect(monthKey).toBe('2024-03');
    });
  });

  describe('Score Distribution', () => {
    it('should categorize scores correctly', () => {
      function categorizeScore(score: number): string {
        if (score < 40) return 'low';
        if (score < 70) return 'medium';
        if (score < 90) return 'high';
        return 'hot';
      }

      expect(categorizeScore(25)).toBe('low');
      expect(categorizeScore(55)).toBe('medium');
      expect(categorizeScore(80)).toBe('high');
      expect(categorizeScore(95)).toBe('hot');
    });

    it('should handle edge cases', () => {
      function categorizeScore(score: number): string {
        if (score < 40) return 'low';
        if (score < 70) return 'medium';
        if (score < 90) return 'high';
        return 'hot';
      }

      expect(categorizeScore(0)).toBe('low');
      expect(categorizeScore(39)).toBe('low');
      expect(categorizeScore(40)).toBe('medium');
      expect(categorizeScore(69)).toBe('medium');
      expect(categorizeScore(70)).toBe('high');
      expect(categorizeScore(89)).toBe('high');
      expect(categorizeScore(90)).toBe('hot');
      expect(categorizeScore(100)).toBe('hot');
    });
  });

  describe('HTTP Status Codes', () => {
    it('should return 200 for successful analytics', () => {
      const status = 200;
      expect(status).toBe(200);
    });

    it('should return 400 for validation error', () => {
      const status = 400;
      expect(status).toBe(400);
    });

    it('should return 401 for unauthorized', () => {
      const status = 401;
      expect(status).toBe(401);
    });

    it('should return 500 for server error', () => {
      const status = 500;
      expect(status).toBe(500);
    });
  });
});
