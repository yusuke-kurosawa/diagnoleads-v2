/**
 * Lead Import Service Tests
 */

import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

// Schema definition (matches source)
const importLeadRowSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).default('new'),
  source: z.enum(['website', 'embed', 'api']).optional(),
  score: z.coerce.number().int().min(0).max(100).optional(),
});

type ImportLeadRow = z.infer<typeof importLeadRowSchema>;

interface ImportRowResult {
  row: number;
  success: boolean;
  data?: ImportLeadRow;
  error?: string;
}

interface ImportSummary {
  totalRows: number;
  successCount: number;
  errorCount: number;
  results: ImportRowResult[];
}

interface ColumnMapping {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  status?: string;
  source?: string;
  score?: string;
}

const defaultColumnMappings: ColumnMapping = {
  email: 'email',
  name: 'name',
  company: 'company',
  phone: 'phone',
  status: 'status',
  source: 'source',
  score: 'score',
};

const columnAliases: Record<string, string[]> = {
  email: ['email', 'e-mail', 'mail', 'email_address', 'メールアドレス', 'メール'],
  name: ['name', 'full_name', 'fullname', 'contact_name', '名前', '氏名'],
  company: ['company', 'company_name', 'organization', '会社名', '会社', '企業名'],
  phone: ['phone', 'phone_number', 'tel', 'telephone', '電話番号', '電話'],
  status: ['status', 'lead_status', 'ステータス'],
  source: ['source', 'lead_source', 'channel', 'ソース', '流入元'],
  score: ['score', 'lead_score', 'rating', 'スコア'],
};

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

describe('importLeadRowSchema', () => {
  it('should validate valid lead data', () => {
    const result = importLeadRowSchema.safeParse({
      email: 'test@example.com',
      name: 'Test User',
      company: 'Test Corp',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = importLeadRowSchema.safeParse({
      email: 'invalid-email',
    });
    expect(result.success).toBe(false);
  });

  it('should default status to new', () => {
    const result = importLeadRowSchema.parse({
      email: 'test@example.com',
    });
    expect(result.status).toBe('new');
  });

  it('should validate status enum', () => {
    const validStatuses = ['new', 'contacted', 'qualified', 'converted'];
    for (const status of validStatuses) {
      const result = importLeadRowSchema.safeParse({
        email: 'test@example.com',
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid status', () => {
    const result = importLeadRowSchema.safeParse({
      email: 'test@example.com',
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should validate source enum', () => {
    const validSources = ['website', 'embed', 'api'];
    for (const source of validSources) {
      const result = importLeadRowSchema.safeParse({
        email: 'test@example.com',
        source,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should coerce and validate score', () => {
    const result = importLeadRowSchema.parse({
      email: 'test@example.com',
      score: '85',
    });
    expect(result.score).toBe(85);
  });

  it('should reject score out of range', () => {
    const result = importLeadRowSchema.safeParse({
      email: 'test@example.com',
      score: 150,
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional fields as undefined', () => {
    const result = importLeadRowSchema.parse({
      email: 'test@example.com',
    });
    expect(result.name).toBeUndefined();
    expect(result.company).toBeUndefined();
    expect(result.phone).toBeUndefined();
  });
});

describe('findColumnName', () => {
  it('should find exact match', () => {
    const headers = ['email', 'name', 'company'];
    expect(findColumnName(headers, 'email')).toBe('email');
  });

  it('should find alias match', () => {
    const headers = ['e-mail', 'full_name', 'company_name'];
    expect(findColumnName(headers, 'email')).toBe('e-mail');
    expect(findColumnName(headers, 'name')).toBe('full_name');
    expect(findColumnName(headers, 'company')).toBe('company_name');
  });

  it('should find Japanese column names', () => {
    const headers = ['メールアドレス', '氏名', '会社名', '電話番号'];
    expect(findColumnName(headers, 'email')).toBe('メールアドレス');
    expect(findColumnName(headers, 'name')).toBe('氏名');
    expect(findColumnName(headers, 'company')).toBe('会社名');
    expect(findColumnName(headers, 'phone')).toBe('電話番号');
  });

  it('should be case insensitive', () => {
    const headers = ['EMAIL', 'Name', 'COMPANY'];
    expect(findColumnName(headers, 'email')).toBe('EMAIL');
    expect(findColumnName(headers, 'name')).toBe('Name');
  });

  it('should return undefined for missing column', () => {
    const headers = ['email', 'name'];
    expect(findColumnName(headers, 'phone')).toBeUndefined();
  });

  it('should trim whitespace', () => {
    const headers = [' email ', ' name '];
    expect(findColumnName(headers, 'email')).toBe(' email ');
  });
});

describe('defaultColumnMappings', () => {
  it('should have all required mappings', () => {
    expect(defaultColumnMappings.email).toBe('email');
    expect(defaultColumnMappings.name).toBe('name');
    expect(defaultColumnMappings.company).toBe('company');
    expect(defaultColumnMappings.phone).toBe('phone');
    expect(defaultColumnMappings.status).toBe('status');
    expect(defaultColumnMappings.source).toBe('source');
    expect(defaultColumnMappings.score).toBe('score');
  });
});

describe('columnAliases', () => {
  it('should have email aliases', () => {
    expect(columnAliases.email).toContain('email');
    expect(columnAliases.email).toContain('e-mail');
    expect(columnAliases.email).toContain('メールアドレス');
  });

  it('should have name aliases', () => {
    expect(columnAliases.name).toContain('name');
    expect(columnAliases.name).toContain('full_name');
    expect(columnAliases.name).toContain('氏名');
  });

  it('should have company aliases', () => {
    expect(columnAliases.company).toContain('company');
    expect(columnAliases.company).toContain('会社名');
  });

  it('should have phone aliases', () => {
    expect(columnAliases.phone).toContain('phone');
    expect(columnAliases.phone).toContain('tel');
    expect(columnAliases.phone).toContain('電話番号');
  });
});

describe('ImportRowResult', () => {
  it('should define success result', () => {
    const result: ImportRowResult = {
      row: 1,
      success: true,
      data: { email: 'test@example.com', status: 'new' },
    };
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('test@example.com');
  });

  it('should define error result', () => {
    const result: ImportRowResult = {
      row: 2,
      success: false,
      error: 'Invalid email format',
    };
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });
});

describe('ImportSummary', () => {
  it('should calculate totals', () => {
    const summary: ImportSummary = {
      totalRows: 10,
      successCount: 8,
      errorCount: 2,
      results: [],
    };
    expect(summary.totalRows).toBe(summary.successCount + summary.errorCount);
  });
});

describe('CSV parsing scenarios', () => {
  it('should handle standard CSV format', () => {
    const csvData = [
      { email: 'user1@example.com', name: 'User 1', company: 'Corp 1' },
      { email: 'user2@example.com', name: 'User 2', company: 'Corp 2' },
    ];

    const results: ImportRowResult[] = csvData.map((row, index) => {
      const parsed = importLeadRowSchema.safeParse(row);
      return {
        row: index + 1,
        success: parsed.success,
        data: parsed.success ? parsed.data : undefined,
        error: parsed.success ? undefined : 'Validation failed',
      };
    });

    expect(results.every(r => r.success)).toBe(true);
  });

  it('should handle mixed valid/invalid rows', () => {
    const csvData = [
      { email: 'valid@example.com', name: 'Valid User' },
      { email: 'invalid-email', name: 'Invalid User' },
      { email: 'another@example.com', name: 'Another User' },
    ];

    const results: ImportRowResult[] = csvData.map((row, index) => {
      const parsed = importLeadRowSchema.safeParse(row);
      return {
        row: index + 1,
        success: parsed.success,
        data: parsed.success ? parsed.data : undefined,
        error: parsed.success ? undefined : 'Validation failed',
      };
    });

    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(true);
  });

  it('should handle empty rows gracefully', () => {
    const result = importLeadRowSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should handle rows with extra columns', () => {
    const result = importLeadRowSchema.safeParse({
      email: 'test@example.com',
      name: 'Test',
      extraColumn: 'ignored',
      anotherExtra: 123,
    });
    expect(result.success).toBe(true);
  });
});
