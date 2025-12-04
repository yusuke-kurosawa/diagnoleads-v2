/**
 * PDF Export Service
 *
 * Phase 9: PDF export functionality for analytics and leads
 * Uses jsPDF and jspdf-autotable for professional PDF generation
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  ConversionFunnelData,
  OverviewStats,
  SourceBreakdown,
  StatusBreakdown,
  TrendDataPoint,
} from '../analytics/types/schemas';
import type { ExportLead } from './export-service';

/**
 * PDF export options
 */
export interface PDFExportOptions {
  title?: string;
  organizationName?: string;
  dateRange?: string;
  generatedAt?: Date;
  locale?: 'en' | 'ja';
}

/**
 * Color scheme for PDF
 */
const colors = {
  primary: [59, 130, 246] as [number, number, number], // Blue
  secondary: [107, 114, 128] as [number, number, number], // Gray
  success: [34, 197, 94] as [number, number, number], // Green
  warning: [234, 179, 8] as [number, number, number], // Yellow
  danger: [239, 68, 68] as [number, number, number], // Red
  text: [31, 41, 55] as [number, number, number], // Dark gray
  lightGray: [243, 244, 246] as [number, number, number],
};

/**
 * Add header to PDF
 */
function addHeader(doc: jsPDF, options: PDFExportOptions): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(24);
  doc.setTextColor(...colors.primary);
  doc.text(options.title || 'DiagnoLeads Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // Organization name
  if (options.organizationName) {
    doc.setFontSize(14);
    doc.setTextColor(...colors.text);
    doc.text(options.organizationName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  // Date range and generation time
  doc.setFontSize(10);
  doc.setTextColor(...colors.secondary);
  const dateInfo = [
    options.dateRange ? `Period: ${options.dateRange}` : '',
    `Generated: ${(options.generatedAt || new Date()).toLocaleString(options.locale === 'ja' ? 'ja-JP' : 'en-US')}`,
  ]
    .filter(Boolean)
    .join(' | ');
  doc.text(dateInfo, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Horizontal line
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);

  return yPos + 10;
}

/**
 * Add section title
 */
function addSectionTitle(doc: jsPDF, title: string, yPos: number): number {
  doc.setFontSize(14);
  doc.setTextColor(...colors.primary);
  doc.text(title, 20, yPos);
  return yPos + 8;
}

/**
 * Add KPI cards row
 */
function addKPICards(
  doc: jsPDF,
  kpis: { label: string; value: string | number; color?: [number, number, number] }[],
  yPos: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const cardWidth = (pageWidth - 50) / kpis.length;
  const cardHeight = 25;

  kpis.forEach((kpi, index) => {
    const x = 20 + index * (cardWidth + 5);

    // Card background
    doc.setFillColor(...colors.lightGray);
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'F');

    // Value
    doc.setFontSize(16);
    doc.setTextColor(...(kpi.color || colors.text));
    doc.text(String(kpi.value), x + cardWidth / 2, yPos + 10, { align: 'center' });

    // Label
    doc.setFontSize(9);
    doc.setTextColor(...colors.secondary);
    doc.text(kpi.label, x + cardWidth / 2, yPos + 19, { align: 'center' });
  });

  return yPos + cardHeight + 10;
}

/**
 * Export leads to PDF
 */
export function exportLeadsToPDF(leads: ExportLead[], options: PDFExportOptions = {}): jsPDF {
  const doc = new jsPDF('landscape');
  let yPos = addHeader(doc, { title: 'Leads Report', ...options });

  // Summary KPIs
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const convertedLeads = leads.filter((l) => l.status === 'converted').length;
  const avgScore = leads.reduce((sum, l) => sum + (l.score || 0), 0) / totalLeads || 0;

  yPos = addSectionTitle(doc, 'Summary', yPos);
  yPos = addKPICards(
    doc,
    [
      { label: 'Total Leads', value: totalLeads, color: colors.primary },
      { label: 'New', value: newLeads, color: colors.success },
      { label: 'Converted', value: convertedLeads, color: colors.primary },
      { label: 'Avg Score', value: avgScore.toFixed(1), color: colors.warning },
    ],
    yPos
  );

  // Leads table
  yPos = addSectionTitle(doc, 'Lead Details', yPos);

  const tableData = leads.map((lead) => [
    lead.email,
    lead.name || '-',
    lead.company || '-',
    lead.status,
    lead.score?.toString() || '-',
    lead.source || '-',
    new Date(lead.createdAt).toLocaleDateString(),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Email', 'Name', 'Company', 'Status', 'Score', 'Source', 'Created']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: colors.lightGray,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 25 },
      6: { cellWidth: 30 },
    },
  });

  // Footer
  addFooter(doc);

  return doc;
}

/**
 * Export analytics report to PDF
 */
export function exportAnalyticsToPDF(
  data: {
    overview: OverviewStats;
    trend?: TrendDataPoint[];
    sourceBreakdown?: SourceBreakdown[];
    statusBreakdown?: StatusBreakdown[];
    funnel?: ConversionFunnelData;
  },
  options: PDFExportOptions = {}
): jsPDF {
  const doc = new jsPDF();
  let yPos = addHeader(doc, { title: 'Analytics Report', ...options });

  // Overview KPIs
  yPos = addSectionTitle(doc, 'Overview', yPos);
  yPos = addKPICards(
    doc,
    [
      { label: 'Total Leads', value: data.overview.totalLeads, color: colors.primary },
      { label: 'New This Month', value: data.overview.newLeadsThisMonth, color: colors.success },
      {
        label: 'Conversion Rate',
        value: `${data.overview.conversionRate.toFixed(1)}%`,
        color: colors.primary,
      },
      { label: 'Avg Score', value: data.overview.averageScore.toFixed(1), color: colors.warning },
    ],
    yPos
  );

  // Status breakdown table
  if (data.statusBreakdown && data.statusBreakdown.length > 0) {
    yPos = addSectionTitle(doc, 'Status Distribution', yPos);

    autoTable(doc, {
      startY: yPos,
      head: [['Status', 'Count', 'Percentage']],
      body: data.statusBreakdown.map((s) => [
        s.status.charAt(0).toUpperCase() + s.status.slice(1),
        s.count,
        `${s.percentage.toFixed(1)}%`,
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
      },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
    });

    yPos =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos + 50;
    yPos += 10;
  }

  // Source breakdown table
  if (data.sourceBreakdown && data.sourceBreakdown.length > 0) {
    yPos = addSectionTitle(doc, 'Source Distribution', yPos);

    autoTable(doc, {
      startY: yPos,
      head: [['Source', 'Count', 'Percentage']],
      body: data.sourceBreakdown.map((s) => [
        s.source.charAt(0).toUpperCase() + s.source.slice(1),
        s.count,
        `${s.percentage.toFixed(1)}%`,
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
      },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
    });

    yPos =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos + 50;
    yPos += 10;
  }

  // Conversion funnel
  if (data.funnel) {
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    yPos = addSectionTitle(doc, 'Conversion Funnel', yPos);

    autoTable(doc, {
      startY: yPos,
      head: [['Stage', 'Count', 'Cumulative', 'Percentage', 'Conversion Rate']],
      body: data.funnel.stages.map((s) => [
        s.name.charAt(0).toUpperCase() + s.name.slice(1),
        s.count,
        s.cumulativeCount,
        `${s.percentage.toFixed(1)}%`,
        `${s.conversionRate.toFixed(1)}%`,
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
      },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });

    yPos =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos + 50;
    yPos += 10;

    // Funnel summary
    doc.setFontSize(11);
    doc.setTextColor(...colors.text);
    doc.text(`Overall Conversion Rate: ${data.funnel.overallConversionRate.toFixed(1)}%`, 20, yPos);
    yPos += 6;
    doc.text(
      `Average Conversion Time: ${data.funnel.averageConversionDays.toFixed(1)} days`,
      20,
      yPos
    );
  }

  // Footer
  addFooter(doc);

  return doc;
}

/**
 * Export diagnostic result to PDF
 */
export function exportDiagnosticResultToPDF(
  result: {
    score: number;
    company: string;
    name: string;
    email: string;
    industry: string;
    employeeCount: string;
    timeline: string;
    budget: string;
    challenge: string;
    goal: string;
    submittedAt: Date;
  },
  options: PDFExportOptions = {}
): jsPDF {
  const doc = new jsPDF();
  let yPos = addHeader(doc, { title: 'Diagnostic Result', ...options });

  // Score display
  const scoreColor =
    result.score >= 70 ? colors.success : result.score >= 40 ? colors.warning : colors.danger;

  doc.setFillColor(...colors.lightGray);
  doc.roundedRect(60, yPos, 90, 50, 5, 5, 'F');

  doc.setFontSize(48);
  doc.setTextColor(...scoreColor);
  doc.text(result.score.toString(), 105, yPos + 32, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(...colors.secondary);
  doc.text('Lead Score', 105, yPos + 45, { align: 'center' });

  yPos += 65;

  // Contact information
  yPos = addSectionTitle(doc, 'Contact Information', yPos);

  const contactInfo = [
    ['Name', result.name],
    ['Email', result.email],
    ['Company', result.company],
  ];

  autoTable(doc, {
    startY: yPos,
    body: contactInfo,
    theme: 'plain',
    styles: { fontSize: 11 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
    },
  });

  yPos = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos + 30;
  yPos += 10;

  // Business profile
  yPos = addSectionTitle(doc, 'Business Profile', yPos);

  const businessInfo = [
    ['Industry', result.industry],
    ['Company Size', result.employeeCount],
    ['Timeline', result.timeline],
    ['Budget', result.budget],
    ['Current Challenge', result.challenge],
    ['Primary Goal', result.goal],
  ];

  autoTable(doc, {
    startY: yPos,
    body: businessInfo,
    theme: 'plain',
    styles: { fontSize: 11 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
    },
  });

  yPos = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos + 50;
  yPos += 10;

  // Submission info
  doc.setFontSize(10);
  doc.setTextColor(...colors.secondary);
  doc.text(`Submitted: ${result.submittedAt.toLocaleString()}`, 20, yPos);

  // Footer
  addFooter(doc);

  return doc;
}

/**
 * Add footer to PDF
 */
function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...colors.secondary);

    // Page number
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Branding
    doc.text('Generated by DiagnoLeads', 20, pageHeight - 10);

    // Timestamp
    doc.text(new Date().toISOString().split('T')[0], pageWidth - 20, pageHeight - 10, {
      align: 'right',
    });
  }
}

/**
 * Download PDF
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

/**
 * Generate filename for PDF export
 */
export function generatePDFFilename(
  type: 'leads' | 'analytics' | 'diagnostic',
  dateRange?: string
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const rangeStr = dateRange ? `_${dateRange.replace(/\s/g, '-')}` : '';
  return `diagnoleads_${type}${rangeStr}_${timestamp}.pdf`;
}
