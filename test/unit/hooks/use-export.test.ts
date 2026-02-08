import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock export services
vi.mock('@/lib/features/reports/export-service', () => ({
  leadsToCSV: vi.fn(() => 'csv-content'),
  createDownloadBlob: vi.fn(() => new Blob(['test'])),
  generateExportFilename: vi.fn(() => 'test-file.csv'),
  generateFullReportCSV: vi.fn(() => 'full-report-csv'),
  triggerDownload: vi.fn(),
}));

vi.mock('@/lib/features/reports/pdf-export-service', () => ({
  exportLeadsToPDF: vi.fn(() => ({ save: vi.fn() })),
  exportAnalyticsToPDF: vi.fn(() => ({ save: vi.fn() })),
  generatePDFFilename: vi.fn(() => 'test-file.pdf'),
  downloadPDF: vi.fn(),
}));

// Import after mocks
import { useExport } from '@/hooks/use-export';
import {
  createDownloadBlob,
  generateExportFilename,
  generateFullReportCSV,
  leadsToCSV,
  triggerDownload,
} from '@/lib/features/reports/export-service';
import {
  downloadPDF,
  exportAnalyticsToPDF,
  exportLeadsToPDF,
  generatePDFFilename,
} from '@/lib/features/reports/pdf-export-service';

const mockLeads = [
  {
    id: '1',
    email: 'test@example.com',
    name: 'Test Lead',
    status: 'new' as const,
    score: 80,
    source: 'web',
    createdAt: new Date(),
  },
];

const mockAnalyticsData = {
  overview: {
    totalLeads: 100,
    newLeads: 10,
    convertedLeads: 5,
    averageScore: 75,
    conversionRate: 5,
  },
  trend: [{ date: '2024-01-01', count: 5 }],
  sourceBreakdown: [{ source: 'web', count: 50, percentage: 50 }],
  statusBreakdown: [{ status: 'new', count: 30, percentage: 30 }],
  funnel: { stages: [], totalConversionRate: 5 },
  dateRange: '30d',
};

describe('useExport', () => {
  it('should return export methods', () => {
    const { result } = renderHook(() => useExport());

    expect(result.current).toBeDefined();
    expect(result.current.isExporting).toBe(false);
    expect(typeof result.current.exportLeadsCSV).toBe('function');
    expect(typeof result.current.exportLeadsJSON).toBe('function');
    expect(typeof result.current.exportLeadsPDF).toBe('function');
    expect(typeof result.current.exportAnalyticsReport).toBe('function');
    expect(typeof result.current.exportAnalyticsJSON).toBe('function');
    expect(typeof result.current.exportAnalyticsPDF).toBe('function');
  });

  it('should accept options', () => {
    const { result } = renderHook(() =>
      useExport({
        organizationName: 'Test Org',
        locale: 'ja',
      })
    );

    expect(result.current).toBeDefined();
  });

  describe('exportLeadsCSV', () => {
    it('should export leads to CSV', () => {
      const { result } = renderHook(() => useExport());

      act(() => {
        result.current.exportLeadsCSV(mockLeads);
      });

      expect(leadsToCSV).toHaveBeenCalledWith(mockLeads);
      expect(createDownloadBlob).toHaveBeenCalled();
      expect(generateExportFilename).toHaveBeenCalledWith('leads', 'csv');
      expect(triggerDownload).toHaveBeenCalled();
    });
  });

  describe('exportLeadsJSON', () => {
    it('should export leads to JSON', () => {
      const { result } = renderHook(() => useExport());

      act(() => {
        result.current.exportLeadsJSON(mockLeads);
      });

      expect(createDownloadBlob).toHaveBeenCalled();
      expect(generateExportFilename).toHaveBeenCalledWith('leads', 'json');
      expect(triggerDownload).toHaveBeenCalled();
    });
  });

  describe('exportLeadsPDF', () => {
    it('should export leads to PDF', () => {
      const { result } = renderHook(() => useExport({ organizationName: 'Test Org' }));

      act(() => {
        result.current.exportLeadsPDF(mockLeads);
      });

      expect(exportLeadsToPDF).toHaveBeenCalled();
      expect(generatePDFFilename).toHaveBeenCalledWith('leads', undefined);
      expect(downloadPDF).toHaveBeenCalled();
    });

    it('should include date range in PDF filename', () => {
      const { result } = renderHook(() => useExport());

      act(() => {
        result.current.exportLeadsPDF(mockLeads, '30d');
      });

      expect(generatePDFFilename).toHaveBeenCalledWith('leads', '30d');
    });
  });

  describe('exportAnalyticsReport', () => {
    it('should export analytics report to CSV', () => {
      const { result } = renderHook(() => useExport({ organizationName: 'Test Org' }));

      act(() => {
        result.current.exportAnalyticsReport(mockAnalyticsData);
      });

      expect(generateFullReportCSV).toHaveBeenCalled();
      expect(createDownloadBlob).toHaveBeenCalled();
      expect(triggerDownload).toHaveBeenCalled();
    });
  });

  describe('exportAnalyticsJSON', () => {
    it('should export analytics to JSON', () => {
      const { result } = renderHook(() => useExport({ organizationName: 'Test Org' }));

      act(() => {
        result.current.exportAnalyticsJSON(mockAnalyticsData);
      });

      expect(createDownloadBlob).toHaveBeenCalled();
      expect(generateExportFilename).toHaveBeenCalledWith('analytics', 'json', '30d');
      expect(triggerDownload).toHaveBeenCalled();
    });
  });

  describe('exportAnalyticsPDF', () => {
    it('should export analytics to PDF', () => {
      const { result } = renderHook(() => useExport({ organizationName: 'Test Org', locale: 'ja' }));

      act(() => {
        result.current.exportAnalyticsPDF(mockAnalyticsData);
      });

      expect(exportAnalyticsToPDF).toHaveBeenCalled();
      expect(generatePDFFilename).toHaveBeenCalledWith('analytics', '30d');
      expect(downloadPDF).toHaveBeenCalled();
    });
  });
});
