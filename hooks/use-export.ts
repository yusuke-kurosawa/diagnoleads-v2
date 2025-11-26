/**
 * Export Hook
 *
 * React hook for downloading analytics reports and lead exports
 */

import { useState, useCallback } from 'react';
import {
  leadsToCSV,
  generateFullReportCSV,
  generateExportFilename,
  createDownloadBlob,
  triggerDownload,
  type ExportLead,
} from '@/lib/features/reports/export-service';
import type {
  OverviewStats,
  TrendDataPoint,
  SourceBreakdown,
  StatusBreakdown,
  ConversionFunnelData,
} from '@/lib/features/analytics/types/schemas';

interface UseExportOptions {
  organizationName?: string;
}

/**
 * Hook for exporting leads and analytics data
 */
export function useExport(options: UseExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);
  const { organizationName = 'Unknown Organization' } = options;

  /**
   * Export leads to CSV
   */
  const exportLeadsCSV = useCallback(
    (leads: ExportLead[]) => {
      setIsExporting(true);
      try {
        const csv = leadsToCSV(leads);
        const blob = createDownloadBlob(csv, 'csv');
        const filename = generateExportFilename('leads', 'csv');
        triggerDownload(blob, filename);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  /**
   * Export leads to JSON
   */
  const exportLeadsJSON = useCallback(
    (leads: ExportLead[]) => {
      setIsExporting(true);
      try {
        const json = JSON.stringify(leads, null, 2);
        const blob = createDownloadBlob(json, 'json');
        const filename = generateExportFilename('leads', 'json');
        triggerDownload(blob, filename);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  /**
   * Export full analytics report
   */
  const exportAnalyticsReport = useCallback(
    (data: {
      overview: OverviewStats;
      trend: TrendDataPoint[];
      sourceBreakdown: SourceBreakdown[];
      statusBreakdown: StatusBreakdown[];
      funnel: ConversionFunnelData;
      dateRange: string;
    }) => {
      setIsExporting(true);
      try {
        const csv = generateFullReportCSV({
          ...data,
          organizationName,
          generatedAt: new Date(),
        });
        const blob = createDownloadBlob(csv, 'csv');
        const filename = generateExportFilename('report', 'csv', data.dateRange);
        triggerDownload(blob, filename);
      } finally {
        setIsExporting(false);
      }
    },
    [organizationName]
  );

  /**
   * Export analytics data as JSON
   */
  const exportAnalyticsJSON = useCallback(
    (data: {
      overview: OverviewStats;
      trend: TrendDataPoint[];
      sourceBreakdown: SourceBreakdown[];
      statusBreakdown: StatusBreakdown[];
      funnel: ConversionFunnelData;
      dateRange: string;
    }) => {
      setIsExporting(true);
      try {
        const exportData = {
          ...data,
          organizationName,
          generatedAt: new Date().toISOString(),
        };
        const json = JSON.stringify(exportData, null, 2);
        const blob = createDownloadBlob(json, 'json');
        const filename = generateExportFilename('analytics', 'json', data.dateRange);
        triggerDownload(blob, filename);
      } finally {
        setIsExporting(false);
      }
    },
    [organizationName]
  );

  return {
    isExporting,
    exportLeadsCSV,
    exportLeadsJSON,
    exportAnalyticsReport,
    exportAnalyticsJSON,
  };
}
