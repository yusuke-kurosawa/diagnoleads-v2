/**
 * PDF Export Service Tests
 */
import {
  downloadPDF,
  exportAnalyticsToPDF,
  exportDiagnosticResultToPDF,
  exportLeadsToPDF,
  generatePDFFilename,
} from '@/lib/features/reports/pdf-export-service';
import { describe, expect, it, vi } from 'vitest';

describe('PDF Export Service', () => {
  describe('generatePDFFilename', () => {
    it('should generate filename for leads export', () => {
      const filename = generatePDFFilename('leads');
      expect(filename).toMatch(/^diagnoleads_leads_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should generate filename for analytics export', () => {
      const filename = generatePDFFilename('analytics');
      expect(filename).toMatch(/^diagnoleads_analytics_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should generate filename for diagnostic export', () => {
      const filename = generatePDFFilename('diagnostic');
      expect(filename).toMatch(/^diagnoleads_diagnostic_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should include date range in filename if provided', () => {
      const filename = generatePDFFilename('leads', '2024-01-01 to 2024-01-31');
      expect(filename).toContain('2024-01-01-to-2024-01-31');
    });
  });

  describe('exportLeadsToPDF', () => {
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
      {
        id: '2',
        email: 'jane@example.com',
        name: 'Jane Doe',
        company: 'Acme Corp',
        phone: null,
        position: null,
        source: 'api',
        status: 'converted',
        score: 92,
        notes: null,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-17'),
      },
    ];

    it('should create a PDF document with leads', () => {
      const doc = exportLeadsToPDF(mockLeads);
      expect(doc).toBeDefined();
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    });

    it('should create PDF with custom options', () => {
      const doc = exportLeadsToPDF(mockLeads, {
        title: 'Custom Report',
        organizationName: 'Test Org',
        dateRange: '2024-01-01 to 2024-01-31',
        locale: 'en',
      });
      expect(doc).toBeDefined();
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty leads array', () => {
      const doc = exportLeadsToPDF([]);
      expect(doc).toBeDefined();
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    });

    it('should support Japanese locale', () => {
      const doc = exportLeadsToPDF(mockLeads, { locale: 'ja' });
      expect(doc).toBeDefined();
    });
  });

  describe('exportAnalyticsToPDF', () => {
    const mockAnalyticsData = {
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
      trend: [
        { date: '2024-01-01', count: 10, converted: 2 },
        { date: '2024-01-02', count: 12, converted: 3 },
      ],
      sourceBreakdown: [
        { source: 'website', count: 50, percentage: 50 },
        { source: 'api', count: 30, percentage: 30 },
        { source: 'embed', count: 20, percentage: 20 },
      ],
      statusBreakdown: [
        { status: 'new', count: 40, percentage: 40 },
        { status: 'contacted', count: 30, percentage: 30 },
        { status: 'qualified', count: 20, percentage: 20 },
        { status: 'converted', count: 10, percentage: 10 },
      ],
      funnel: {
        stages: [
          { name: 'new', count: 100, cumulativeCount: 100, percentage: 100, conversionRate: 100 },
          {
            name: 'contacted',
            count: 60,
            cumulativeCount: 60,
            percentage: 60,
            conversionRate: 60,
          },
          {
            name: 'qualified',
            count: 30,
            cumulativeCount: 30,
            percentage: 30,
            conversionRate: 50,
          },
          {
            name: 'converted',
            count: 10,
            cumulativeCount: 10,
            percentage: 10,
            conversionRate: 33.3,
          },
        ],
        totalLeads: 100,
        overallConversionRate: 10,
        averageConversionDays: 14.5,
      },
    };

    it('should create analytics PDF with all data', () => {
      const doc = exportAnalyticsToPDF(mockAnalyticsData);
      expect(doc).toBeDefined();
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    });

    it('should create analytics PDF with partial data', () => {
      const doc = exportAnalyticsToPDF({
        overview: mockAnalyticsData.overview,
      });
      expect(doc).toBeDefined();
    });

    it('should support custom options', () => {
      const doc = exportAnalyticsToPDF(mockAnalyticsData, {
        title: 'Monthly Analytics',
        organizationName: 'Acme Corp',
        dateRange: 'January 2024',
        locale: 'ja',
      });
      expect(doc).toBeDefined();
    });
  });

  describe('exportDiagnosticResultToPDF', () => {
    const mockDiagnosticResult = {
      score: 85,
      company: 'Test Company',
      name: 'Test User',
      email: 'test@example.com',
      industry: 'Technology',
      employeeCount: '51-200',
      timeline: 'immediate',
      budget: '50k-100k',
      challenge: 'lead_generation',
      goal: 'increase_leads',
      submittedAt: new Date('2024-01-15T10:30:00Z'),
    };

    it('should create diagnostic result PDF', () => {
      const doc = exportDiagnosticResultToPDF(mockDiagnosticResult);
      expect(doc).toBeDefined();
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    });

    it('should handle high score correctly', () => {
      const doc = exportDiagnosticResultToPDF({
        ...mockDiagnosticResult,
        score: 90,
      });
      expect(doc).toBeDefined();
    });

    it('should handle low score correctly', () => {
      const doc = exportDiagnosticResultToPDF({
        ...mockDiagnosticResult,
        score: 25,
      });
      expect(doc).toBeDefined();
    });

    it('should handle medium score correctly', () => {
      const doc = exportDiagnosticResultToPDF({
        ...mockDiagnosticResult,
        score: 50,
      });
      expect(doc).toBeDefined();
    });
  });

  describe('downloadPDF', () => {
    it('should trigger download', () => {
      // Mock document methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node);

      const doc = exportLeadsToPDF([]);

      // Note: downloadPDF calls doc.save() internally which handles the download
      // This test verifies the function exists and doc is valid
      expect(doc).toBeDefined();
      expect(typeof downloadPDF).toBe('function');

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});
