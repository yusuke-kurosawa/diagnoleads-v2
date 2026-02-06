/**
 * Analytics Schemas Tests
 *
 * Unit tests for analytics type definitions and validation schemas
 */

import { describe, expect, it } from 'vitest';
import {
  dateRangeSchema,
  trendGranularitySchema,
  getOverviewSchema,
  getLeadTrendSchema,
  getSourceBreakdownSchema,
  getStatusBreakdownSchema,
  getConversionFunnelSchema,
  getScoreDistributionSchema,
  getResponseTimeSchema,
  getROISchema,
  getComparisonSchema,
  type DateRange,
  type TrendGranularity,
  type OverviewStats,
  type TrendDataPoint,
  type SourceBreakdown,
  type StatusBreakdown,
  type FunnelStage,
  type ConversionFunnelData,
  type ScoreDistributionData,
  type ResponseTimeData,
  type SourceROIData,
  type ROISummary,
  type PeriodMetrics,
  type ComparisonResult,
} from '@/lib/features/analytics/types/schemas';

describe('dateRangeSchema', () => {
  it('should accept valid date ranges', () => {
    expect(dateRangeSchema.parse('7d')).toBe('7d');
    expect(dateRangeSchema.parse('30d')).toBe('30d');
    expect(dateRangeSchema.parse('90d')).toBe('90d');
    expect(dateRangeSchema.parse('all')).toBe('all');
  });

  it('should reject invalid date range', () => {
    expect(() => dateRangeSchema.parse('1d')).toThrow();
    expect(() => dateRangeSchema.parse('invalid')).toThrow();
  });
});

describe('trendGranularitySchema', () => {
  it('should accept valid granularities', () => {
    expect(trendGranularitySchema.parse('daily')).toBe('daily');
    expect(trendGranularitySchema.parse('monthly')).toBe('monthly');
  });

  it('should reject invalid granularity', () => {
    expect(() => trendGranularitySchema.parse('weekly')).toThrow();
    expect(() => trendGranularitySchema.parse('hourly')).toThrow();
  });
});

describe('getOverviewSchema', () => {
  it('should accept valid input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = getOverviewSchema.parse(input);
    expect(result.organizationId).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result.dateRange).toBe('30d'); // default
  });

  it('should accept custom date range', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      dateRange: '90d' as const,
    };

    const result = getOverviewSchema.parse(input);
    expect(result.dateRange).toBe('90d');
  });

  it('should reject invalid organizationId', () => {
    expect(() =>
      getOverviewSchema.parse({
        organizationId: 'invalid',
      })
    ).toThrow();
  });
});

describe('getLeadTrendSchema', () => {
  it('should accept valid input with defaults', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = getLeadTrendSchema.parse(input);
    expect(result.dateRange).toBe('30d');
    expect(result.granularity).toBe('daily');
  });

  it('should accept custom granularity', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      granularity: 'monthly' as const,
    };

    const result = getLeadTrendSchema.parse(input);
    expect(result.granularity).toBe('monthly');
  });
});

describe('getSourceBreakdownSchema', () => {
  it('should accept valid input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      dateRange: '7d' as const,
    };

    const result = getSourceBreakdownSchema.parse(input);
    expect(result.dateRange).toBe('7d');
  });
});

describe('getStatusBreakdownSchema', () => {
  it('should accept valid input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = getStatusBreakdownSchema.parse(input);
    expect(result.dateRange).toBe('30d');
  });
});

describe('getConversionFunnelSchema', () => {
  it('should accept valid input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      dateRange: 'all' as const,
    };

    const result = getConversionFunnelSchema.parse(input);
    expect(result.dateRange).toBe('all');
  });
});

describe('getScoreDistributionSchema', () => {
  it('should accept valid input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = getScoreDistributionSchema.parse(input);
    expect(result.organizationId).toBeDefined();
  });
});

describe('getResponseTimeSchema', () => {
  it('should accept valid input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = getResponseTimeSchema.parse(input);
    expect(result.dateRange).toBe('30d');
  });
});

describe('getROISchema', () => {
  it('should accept minimal input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = getROISchema.parse(input);
    expect(result.dateRange).toBe('30d');
    expect(result.costPerLead).toBeUndefined();
  });

  it('should accept full input with costs', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      dateRange: '90d' as const,
      costPerLead: {
        website: 50,
        embed: 30,
        api: 10,
        unknown: 5,
      },
      averageDealValue: 10000,
    };

    const result = getROISchema.parse(input);
    expect(result.costPerLead?.website).toBe(50);
    expect(result.averageDealValue).toBe(10000);
  });

  it('should reject negative costs', () => {
    expect(() =>
      getROISchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        costPerLead: { website: -10 },
      })
    ).toThrow();
  });

  it('should reject negative deal value', () => {
    expect(() =>
      getROISchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        averageDealValue: -100,
      })
    ).toThrow();
  });
});

describe('getComparisonSchema', () => {
  it('should accept valid input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      currentPeriod: {
        start: '2024-02-01T00:00:00Z',
        end: '2024-02-29T23:59:59Z',
      },
      previousPeriod: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z',
      },
    };

    const result = getComparisonSchema.parse(input);
    expect(result.currentPeriod.start).toBe('2024-02-01T00:00:00Z');
    expect(result.previousPeriod.end).toBe('2024-01-31T23:59:59Z');
  });

  it('should reject invalid datetime format', () => {
    expect(() =>
      getComparisonSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        currentPeriod: {
          start: 'invalid-date',
          end: '2024-02-29T23:59:59Z',
        },
        previousPeriod: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
      })
    ).toThrow();
  });
});

describe('Analytics response types', () => {
  describe('OverviewStats', () => {
    it('should create valid overview stats', () => {
      const stats: OverviewStats = {
        totalLeads: 1000,
        newLeadsThisMonth: 150,
        conversionRate: 15.5,
        averageScore: 72.3,
        leadsByStatus: {
          new: 300,
          contacted: 400,
          qualified: 200,
          converted: 100,
        },
      };

      expect(stats.totalLeads).toBe(1000);
      expect(stats.leadsByStatus.converted).toBe(100);
    });
  });

  describe('TrendDataPoint', () => {
    it('should create valid trend data point', () => {
      const point: TrendDataPoint = {
        date: '2024-02-01',
        count: 50,
        converted: 10,
      };

      expect(point.count).toBe(50);
    });
  });

  describe('SourceBreakdown', () => {
    it('should create valid source breakdown', () => {
      const breakdown: SourceBreakdown = {
        source: 'website',
        count: 500,
        percentage: 50,
      };

      expect(breakdown.source).toBe('website');
      expect(breakdown.percentage).toBe(50);
    });
  });

  describe('StatusBreakdown', () => {
    it('should create valid status breakdown', () => {
      const breakdown: StatusBreakdown = {
        status: 'qualified',
        count: 200,
        percentage: 20,
      };

      expect(breakdown.status).toBe('qualified');
    });
  });

  describe('ConversionFunnelData', () => {
    it('should create valid funnel data', () => {
      const funnel: ConversionFunnelData = {
        stages: [
          {
            name: 'New',
            count: 1000,
            cumulativeCount: 1000,
            percentage: 100,
            conversionRate: 100,
          },
          {
            name: 'Contacted',
            count: 800,
            cumulativeCount: 800,
            percentage: 80,
            conversionRate: 80,
          },
        ],
        totalLeads: 1000,
        overallConversionRate: 15,
        averageConversionDays: 14,
      };

      expect(funnel.stages).toHaveLength(2);
      expect(funnel.averageConversionDays).toBe(14);
    });
  });

  describe('ScoreDistributionData', () => {
    it('should create valid score distribution', () => {
      const distribution: ScoreDistributionData = {
        range: '76-100',
        count: 250,
        percentage: 25,
      };

      expect(distribution.range).toBe('76-100');
    });
  });

  describe('ResponseTimeData', () => {
    it('should create valid response time data', () => {
      const data: ResponseTimeData = {
        period: '< 1 hour',
        count: 100,
        percentage: 40,
        averageHours: 0.5,
      };

      expect(data.period).toBe('< 1 hour');
      expect(data.averageHours).toBe(0.5);
    });
  });

  describe('ROISummary', () => {
    it('should create valid ROI summary', () => {
      const summary: ROISummary = {
        totalLeads: 1000,
        totalConverted: 150,
        totalCost: 50000,
        totalRevenue: 1500000,
        overallROI: 2900,
        overallConversionRate: 15,
        averageCostPerLead: 50,
        averageCostPerAcquisition: 333.33,
        averageRevenuePerLead: 1500,
        bySource: [],
        bestPerformingSource: 'website',
        worstPerformingSource: 'api',
      };

      expect(summary.overallROI).toBe(2900);
      expect(summary.bestPerformingSource).toBe('website');
    });
  });

  describe('ComparisonResult', () => {
    it('should create valid comparison result', () => {
      const result: ComparisonResult = {
        currentPeriod: {
          totalLeads: 500,
          convertedLeads: 75,
          conversionRate: 15,
          averageScore: 72,
          bySource: { website: 300, embed: 200 },
          byStatus: { new: 200, contacted: 150, qualified: 75, converted: 75 },
        },
        previousPeriod: {
          totalLeads: 400,
          convertedLeads: 50,
          conversionRate: 12.5,
          averageScore: 68,
          bySource: { website: 250, embed: 150 },
          byStatus: { new: 180, contacted: 120, qualified: 50, converted: 50 },
        },
        changes: {
          totalLeads: 25,
          convertedLeads: 50,
          conversionRate: 20,
          averageScore: 5.88,
        },
        insights: ['Lead volume increased by 25%', 'Conversion rate improved by 20%'],
      };

      expect(result.changes.totalLeads).toBe(25);
      expect(result.insights).toHaveLength(2);
    });
  });
});
