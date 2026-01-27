/**
 * Export Service Tests
 */
import {
  createDownloadBlob,
  funnelToCSV,
  generateExportFilename,
  generateFullReportCSV,
  leadsToCSV,
  overviewToCSV,
  sourceBreakdownToCSV,
  statusBreakdownToCSV,
  trendToCSV,
} from '@/lib/features/reports/export-service';
import { describe, expect, it } from 'vitest';

describe('Export Service', () => {
  describe('leadsToCSV', () => {
    const mockLeads = [
      {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        company: 'Test Company',
        phone: '+1-555-0100',
        position: 'CTO',
        source: 'website',
        status: 'new',
        score: 85,
        notes: 'Test notes',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
    ];

    it('should convert leads to CSV with headers', () => {
      const csv = leadsToCSV(mockLeads, true);
      expect(csv).toContain('ID,Email,Name,Company');
      expect(csv).toContain('test@example.com');
      expect(csv).toContain('Test User');
    });

    it('should convert leads to CSV without headers', () => {
      const csv = leadsToCSV(mockLeads, false);
      expect(csv).not.toContain('ID,Email,Name,Company');
      expect(csv).toContain('test@example.com');
    });

    it('should handle null values', () => {
      const leadsWithNulls = [
        {
          id: '1',
          email: 'test@example.com',
          name: null,
          company: null,
          phone: null,
          position: null,
          source: null,
          status: 'new',
          score: null,
          notes: null,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
      ];
      const csv = leadsToCSV(leadsWithNulls);
      expect(csv).toBeDefined();
      expect(csv).toContain('test@example.com');
    });

    it('should escape CSV special characters', () => {
      const leadsWithCommas = [
        {
          id: '1',
          email: 'test@example.com',
          name: 'User, Test',
          company: 'Company "LLC"',
          phone: null,
          position: null,
          source: null,
          status: 'new',
          score: null,
          notes: 'Note with\nnewline',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
      ];
      const csv = leadsToCSV(leadsWithCommas);
      expect(csv).toContain('"User, Test"');
    });

    it('should handle empty array', () => {
      const csv = leadsToCSV([]);
      expect(csv).toContain('ID,Email,Name,Company');
    });
  });

  describe('overviewToCSV', () => {
    const mockOverview = {
      totalLeads: 100,
      newLeadsThisMonth: 25,
      conversionRate: 15.5,
      averageScore: 72,
      leadsByStatus: {
        new: 40,
        contacted: 30,
        qualified: 20,
        converted: 10,
      },
    };

    it('should convert overview to CSV', () => {
      const csv = overviewToCSV(mockOverview, '2024-01');
      expect(csv).toContain('Metric,Value');
      expect(csv).toContain('Total Leads,100');
      expect(csv).toContain('Conversion Rate (%),15.50');
      expect(csv).toContain('New Status,40');
    });
  });

  describe('trendToCSV', () => {
    const mockTrend = [
      { date: '2024-01-01', count: 10, converted: 2 },
      { date: '2024-01-02', count: 15, converted: 3 },
    ];

    it('should convert trend data to CSV', () => {
      const csv = trendToCSV(mockTrend);
      expect(csv).toContain('Date,Total Leads,Converted Leads');
      expect(csv).toContain('2024-01-01,10,2');
      expect(csv).toContain('2024-01-02,15,3');
    });

    it('should handle empty trend array', () => {
      const csv = trendToCSV([]);
      expect(csv).toContain('Date,Total Leads,Converted Leads');
    });
  });

  describe('sourceBreakdownToCSV', () => {
    const mockSources = [
      { source: 'website', count: 50, percentage: 50 },
      { source: 'api', count: 30, percentage: 30 },
    ];

    it('should convert source breakdown to CSV', () => {
      const csv = sourceBreakdownToCSV(mockSources);
      expect(csv).toContain('Source,Count,Percentage (%)');
      expect(csv).toContain('website,50,50.00');
      expect(csv).toContain('api,30,30.00');
    });
  });

  describe('statusBreakdownToCSV', () => {
    const mockStatuses = [
      { status: 'new', count: 40, percentage: 40 },
      { status: 'converted', count: 10, percentage: 10 },
    ];

    it('should convert status breakdown to CSV', () => {
      const csv = statusBreakdownToCSV(mockStatuses);
      expect(csv).toContain('Status,Count,Percentage (%)');
      expect(csv).toContain('new,40,40.00');
      expect(csv).toContain('converted,10,10.00');
    });
  });

  describe('funnelToCSV', () => {
    const mockFunnel = {
      stages: [
        { name: 'new', count: 100, cumulativeCount: 100, percentage: 100, conversionRate: 100 },
        { name: 'contacted', count: 60, cumulativeCount: 60, percentage: 60, conversionRate: 60 },
      ],
      totalLeads: 100,
      overallConversionRate: 10,
      averageConversionDays: 14.5,
    };

    it('should convert funnel data to CSV', () => {
      const csv = funnelToCSV(mockFunnel);
      expect(csv).toContain('Stage,Count,Cumulative Count,Percentage (%),Conversion Rate (%)');
      expect(csv).toContain('new,100,100,100.00,100.00');
      expect(csv).toContain('Overall Conversion Rate');
      expect(csv).toContain('Average Conversion Days');
    });
  });

  describe('generateFullReportCSV', () => {
    const mockData = {
      overview: {
        totalLeads: 100,
        newLeadsThisMonth: 25,
        conversionRate: 15.5,
        averageScore: 72,
        leadsByStatus: {
          new: 40,
          contacted: 30,
          qualified: 20,
          converted: 10,
        },
      },
      trend: [{ date: '2024-01-01', count: 10, converted: 2 }],
      sourceBreakdown: [{ source: 'website', count: 50, percentage: 50 }],
      statusBreakdown: [{ status: 'new', count: 40, percentage: 40 }],
      funnel: {
        stages: [
          { name: 'new', count: 100, cumulativeCount: 100, percentage: 100, conversionRate: 100 },
        ],
        totalLeads: 100,
        overallConversionRate: 10,
        averageConversionDays: 14.5,
      },
      dateRange: '2024-01',
      organizationName: 'Test Org',
      generatedAt: new Date('2024-01-15T10:00:00Z'),
    };

    it('should generate full report CSV', () => {
      const csv = generateFullReportCSV(mockData);
      expect(csv).toContain('DiagnoLeads Analytics Report');
      expect(csv).toContain('Test Org');
      expect(csv).toContain('=== Overview Statistics ===');
      expect(csv).toContain('=== Source Breakdown ===');
      expect(csv).toContain('=== Status Breakdown ===');
      expect(csv).toContain('=== Conversion Funnel ===');
      expect(csv).toContain('=== Lead Trend ===');
    });
  });

  describe('generateExportFilename', () => {
    it('should generate leads filename', () => {
      const filename = generateExportFilename('leads', 'csv');
      expect(filename).toMatch(/^diagnoleads_leads_\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('should generate analytics filename', () => {
      const filename = generateExportFilename('analytics', 'json');
      expect(filename).toMatch(/^diagnoleads_analytics_\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('should include date range in filename', () => {
      const filename = generateExportFilename('report', 'csv', '2024-01');
      expect(filename).toContain('2024-01');
    });
  });

  describe('createDownloadBlob', () => {
    it('should create CSV blob', () => {
      const blob = createDownloadBlob('test,data', 'csv');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv;charset=utf-8;');
    });

    it('should create JSON blob', () => {
      const blob = createDownloadBlob('{"test":"data"}', 'json');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json;charset=utf-8;');
    });
  });
});
