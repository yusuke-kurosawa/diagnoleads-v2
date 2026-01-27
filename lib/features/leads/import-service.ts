/**
 * Lead Import Service
 *
 * Handles CSV/Excel import for bulk lead creation
 */
import * as XLSX from 'xlsx';
import { z } from 'zod';

/**
 * Imported lead row schema
 */
const importLeadRowSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).default('new'),
  source: z.enum(['website', 'embed', 'api']).optional(),
  score: z.coerce.number().int().min(0).max(100).optional(),
});

export type ImportLeadRow = z.infer<typeof importLeadRowSchema>;

/**
 * Import result for a single row
 */
export interface ImportRowResult {
  row: number;
  success: boolean;
  data?: ImportLeadRow;
  error?: string;
}

/**
 * Import summary
 */
export interface ImportSummary {
  totalRows: number;
  successCount: number;
  errorCount: number;
  results: ImportRowResult[];
}

/**
 * Column mapping configuration
 */
export interface ColumnMapping {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  status?: string;
  source?: string;
  score?: string;
}

/**
 * Default column mappings for common CSV formats
 */
export const defaultColumnMappings: ColumnMapping = {
  email: 'email',
  name: 'name',
  company: 'company',
  phone: 'phone',
  status: 'status',
  source: 'source',
  score: 'score',
};

/**
 * Alias mappings for common column name variations
 */
const columnAliases: Record<string, string[]> = {
  email: ['email', 'e-mail', 'mail', 'email_address', 'メールアドレス', 'メール'],
  name: ['name', 'full_name', 'fullname', 'contact_name', '名前', '氏名'],
  company: ['company', 'company_name', 'organization', '会社名', '会社', '企業名'],
  phone: ['phone', 'phone_number', 'tel', 'telephone', '電話番号', '電話'],
  status: ['status', 'lead_status', 'ステータス'],
  source: ['source', 'lead_source', 'channel', 'ソース', '流入元'],
  score: ['score', 'lead_score', 'rating', 'スコア'],
};

/**
 * Find matching column name from headers
 */
function findColumnName(headers: string[], field: string): string | undefined {
  const aliases = columnAliases[field] || [field];
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const alias of aliases) {
    const index = normalizedHeaders.indexOf(alias.toLowerCase());
    if (index !== -1) {
      return headers[index];
    }
  }
  return undefined;
}

/**
 * Auto-detect column mappings from headers
 */
export function detectColumnMappings(headers: string[]): ColumnMapping {
  return {
    email: findColumnName(headers, 'email') || 'email',
    name: findColumnName(headers, 'name'),
    company: findColumnName(headers, 'company'),
    phone: findColumnName(headers, 'phone'),
    status: findColumnName(headers, 'status'),
    source: findColumnName(headers, 'source'),
    score: findColumnName(headers, 'score'),
  };
}

/**
 * Parse CSV content
 */
export function parseCSV(content: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const workbook = XLSX.read(content, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
  });

  const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

  return { headers, rows: jsonData };
}

/**
 * Parse Excel file
 */
export function parseExcel(buffer: ArrayBuffer): {
  headers: string[];
  rows: Record<string, unknown>[];
} {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
  });

  const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

  return { headers, rows: jsonData };
}

/**
 * Validate and transform a single row
 */
export function validateRow(
  row: Record<string, unknown>,
  mapping: ColumnMapping,
  rowIndex: number
): ImportRowResult {
  try {
    const data: Record<string, unknown> = {
      email: row[mapping.email],
    };

    if (mapping.name && row[mapping.name]) {
      data.name = String(row[mapping.name]).trim();
    }
    if (mapping.company && row[mapping.company]) {
      data.company = String(row[mapping.company]).trim();
    }
    if (mapping.phone && row[mapping.phone]) {
      data.phone = String(row[mapping.phone]).trim();
    }
    if (mapping.status && row[mapping.status]) {
      data.status = String(row[mapping.status]).toLowerCase().trim();
    }
    if (mapping.source && row[mapping.source]) {
      data.source = String(row[mapping.source]).toLowerCase().trim();
    }
    if (mapping.score && row[mapping.score]) {
      data.score = row[mapping.score];
    }

    const validated = importLeadRowSchema.parse(data);

    return {
      row: rowIndex,
      success: true,
      data: validated,
    };
  } catch (error) {
    const message = error instanceof z.ZodError ? error.errors[0]?.message : String(error);
    return {
      row: rowIndex,
      success: false,
      error: message || 'Validation failed',
    };
  }
}

/**
 * Process import data
 */
export function processImport(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping
): ImportSummary {
  const results: ImportRowResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const result = validateRow(rows[i], mapping, i + 1);
    results.push(result);

    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  return {
    totalRows: rows.length,
    successCount,
    errorCount,
    results,
  };
}

/**
 * Generate CSV template for import
 */
export function generateImportTemplate(): string {
  const headers = ['email', 'name', 'company', 'phone', 'status', 'source', 'score'];
  const exampleRow = [
    'example@company.com',
    'John Doe',
    'Acme Corp',
    '+1-555-0100',
    'new',
    'website',
    '75',
  ];

  return [headers.join(','), exampleRow.join(',')].join('\n');
}

/**
 * Download CSV template
 */
export function downloadTemplate(): void {
  const template = generateImportTemplate();
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leads_import_template.csv';
  link.click();
}
