/**
 * Report Export Service
 *
 * Phase 6.3: CSV/JSON export functionality for analytics and leads
 */

import type {
  ConversionFunnelData,
  OverviewStats,
  SourceBreakdown,
  StatusBreakdown,
  TrendDataPoint,
} from '../analytics/types/schemas';

/**
 * Lead data for export
 */
export interface ExportLead {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  position: string | null;
  source: string | null;
  status: string;
  score: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Report export options
 */
export interface ExportOptions {
  format: 'csv' | 'json';
  dateRange?: string;
  includeHeaders?: boolean;
}

/**
 * Convert leads to CSV string
 */
export function leadsToCSV(leads: ExportLead[], includeHeaders = true): string {
  const headers = [
    'ID',
    'Email',
    'Name',
    'Company',
    'Phone',
    'Position',
    'Source',
    'Status',
    'Score',
    'Notes',
    'Created At',
    'Updated At',
  ];

  const rows = leads.map((lead) => [
    lead.id,
    lead.email,
    lead.name || '',
    lead.company || '',
    lead.phone || '',
    lead.position || '',
    lead.source || '',
    lead.status,
    lead.score?.toString() || '',
    escapeCSV(lead.notes || ''),
    lead.createdAt.toISOString(),
    lead.updatedAt.toISOString(),
  ]);

  if (includeHeaders) {
    return [headers.join(','), ...rows.map((row) => row.map(escapeCSV).join(','))].join('\n');
  }

  return rows.map((row) => row.map(escapeCSV).join(',')).join('\n');
}

/**
 * Convert analytics overview to CSV
 */
export function overviewToCSV(overview: OverviewStats, dateRange: string): string {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Date Range', dateRange],
    ['Total Leads', overview.totalLeads.toString()],
    ['New Leads This Month', overview.newLeadsThisMonth.toString()],
    ['Conversion Rate (%)', overview.conversionRate.toFixed(2)],
    ['Average Score', overview.averageScore.toString()],
    ['New Status', overview.leadsByStatus.new.toString()],
    ['Contacted Status', overview.leadsByStatus.contacted.toString()],
    ['Qualified Status', overview.leadsByStatus.qualified.toString()],
    ['Converted Status', overview.leadsByStatus.converted.toString()],
  ];

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Convert lead trend to CSV
 */
export function trendToCSV(trend: TrendDataPoint[]): string {
  const headers = ['Date', 'Total Leads', 'Converted Leads'];
  const rows = trend.map((point) => [
    point.date,
    point.count.toString(),
    point.converted.toString(),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Convert source breakdown to CSV
 */
export function sourceBreakdownToCSV(sources: SourceBreakdown[]): string {
  const headers = ['Source', 'Count', 'Percentage (%)'];
  const rows = sources.map((source) => [
    source.source,
    source.count.toString(),
    source.percentage.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Convert status breakdown to CSV
 */
export function statusBreakdownToCSV(statuses: StatusBreakdown[]): string {
  const headers = ['Status', 'Count', 'Percentage (%)'];
  const rows = statuses.map((status) => [
    status.status,
    status.count.toString(),
    status.percentage.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Convert conversion funnel to CSV
 */
export function funnelToCSV(funnel: ConversionFunnelData): string {
  const headers = ['Stage', 'Count', 'Cumulative Count', 'Percentage (%)', 'Conversion Rate (%)'];
  const rows = funnel.stages.map((stage) => [
    stage.name,
    stage.count.toString(),
    stage.cumulativeCount.toString(),
    stage.percentage.toFixed(2),
    stage.conversionRate.toFixed(2),
  ]);

  // Add summary row
  rows.push(['', '', '', '', '']);
  rows.push(['Overall Conversion Rate', '', '', '', funnel.overallConversionRate.toFixed(2)]);
  rows.push(['Average Conversion Days', '', '', '', funnel.averageConversionDays.toFixed(1)]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Generate full analytics report CSV
 */
export function generateFullReportCSV(data: {
  overview: OverviewStats;
  trend: TrendDataPoint[];
  sourceBreakdown: SourceBreakdown[];
  statusBreakdown: StatusBreakdown[];
  funnel: ConversionFunnelData;
  dateRange: string;
  organizationName: string;
  generatedAt: Date;
}): string {
  const sections: string[] = [];

  // Header section
  sections.push('DiagnoLeads Analytics Report');
  sections.push(`Organization,${escapeCSV(data.organizationName)}`);
  sections.push(`Date Range,${data.dateRange}`);
  sections.push(`Generated At,${data.generatedAt.toISOString()}`);
  sections.push('');

  // Overview section
  sections.push('=== Overview Statistics ===');
  sections.push(overviewToCSV(data.overview, data.dateRange));
  sections.push('');

  // Source breakdown section
  sections.push('=== Source Breakdown ===');
  sections.push(sourceBreakdownToCSV(data.sourceBreakdown));
  sections.push('');

  // Status breakdown section
  sections.push('=== Status Breakdown ===');
  sections.push(statusBreakdownToCSV(data.statusBreakdown));
  sections.push('');

  // Funnel section
  sections.push('=== Conversion Funnel ===');
  sections.push(funnelToCSV(data.funnel));
  sections.push('');

  // Trend section
  sections.push('=== Lead Trend ===');
  sections.push(trendToCSV(data.trend));

  return sections.join('\n');
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  type: 'leads' | 'analytics' | 'report',
  format: 'csv' | 'json',
  dateRange?: string
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const rangeStr = dateRange ? `_${dateRange}` : '';
  return `diagnoleads_${type}${rangeStr}_${timestamp}.${format}`;
}

/**
 * Create downloadable blob from content
 */
export function createDownloadBlob(content: string, format: 'csv' | 'json'): Blob {
  const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;';
  return new Blob([content], { type: mimeType });
}

/**
 * Trigger browser download
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
