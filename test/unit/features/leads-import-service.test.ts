import { describe, expect, it, vi } from 'vitest';
import {
  type ColumnMapping,
  type ImportLeadRow,
  defaultColumnMappings,
  detectColumnMappings,
  generateImportTemplate,
  parseCSV,
  parseExcel,
  processImport,
  validateRow,
} from '@/lib/features/leads/import-service';

// Mock XLSX
vi.mock('xlsx', () => ({
  read: vi.fn((data, options) => ({
    SheetNames: ['Sheet1'],
    Sheets: {
      Sheet1: {},
    },
  })),
  utils: {
    sheet_to_json: vi.fn(() => [
      { email: 'test1@example.com', name: 'Test User 1', company: 'Company A' },
      { email: 'test2@example.com', name: 'Test User 2', company: 'Company B' },
    ]),
  },
}));

describe('leads-import-service', () => {
  describe('defaultColumnMappings', () => {
    it('should have required email mapping', () => {
      expect(defaultColumnMappings.email).toBe('email');
    });

    it('should have optional field mappings', () => {
      expect(defaultColumnMappings.name).toBe('name');
      expect(defaultColumnMappings.company).toBe('company');
      expect(defaultColumnMappings.phone).toBe('phone');
      expect(defaultColumnMappings.status).toBe('status');
      expect(defaultColumnMappings.source).toBe('source');
      expect(defaultColumnMappings.score).toBe('score');
    });
  });

  describe('detectColumnMappings', () => {
    it('should detect standard English column names', () => {
      const headers = ['email', 'name', 'company', 'phone', 'status', 'source', 'score'];
      const mapping = detectColumnMappings(headers);

      expect(mapping.email).toBe('email');
      expect(mapping.name).toBe('name');
      expect(mapping.company).toBe('company');
    });

    it('should detect column name aliases', () => {
      const headers = ['e-mail', 'full_name', 'organization', 'telephone'];
      const mapping = detectColumnMappings(headers);

      expect(mapping.email).toBe('e-mail');
      expect(mapping.name).toBe('full_name');
      expect(mapping.company).toBe('organization');
      expect(mapping.phone).toBe('telephone');
    });

    it('should detect Japanese column names', () => {
      const headers = ['メールアドレス', '氏名', '会社名', '電話番号'];
      const mapping = detectColumnMappings(headers);

      expect(mapping.email).toBe('メールアドレス');
      expect(mapping.name).toBe('氏名');
      expect(mapping.company).toBe('会社名');
      expect(mapping.phone).toBe('電話番号');
    });

    it('should handle case-insensitive matching', () => {
      const headers = ['EMAIL', 'NAME', 'COMPANY'];
      const mapping = detectColumnMappings(headers);

      expect(mapping.email).toBe('EMAIL');
      expect(mapping.name).toBe('NAME');
      expect(mapping.company).toBe('COMPANY');
    });

    it('should return undefined for missing columns', () => {
      const headers = ['email'];
      const mapping = detectColumnMappings(headers);

      expect(mapping.email).toBe('email');
      expect(mapping.name).toBeUndefined();
      expect(mapping.company).toBeUndefined();
    });

    it('should handle empty headers', () => {
      const headers: string[] = [];
      const mapping = detectColumnMappings(headers);

      expect(mapping.email).toBe('email'); // Default fallback
    });
  });

  describe('validateRow', () => {
    const mapping: ColumnMapping = {
      email: 'email',
      name: 'name',
      company: 'company',
      phone: 'phone',
      status: 'status',
      source: 'source',
      score: 'score',
    };

    it('should validate valid row', () => {
      const row = {
        email: 'test@example.com',
        name: 'John Doe',
        company: 'Acme Corp',
      };

      const result = validateRow(row, mapping, 1);

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
      expect(result.data?.name).toBe('John Doe');
    });

    it('should fail for invalid email', () => {
      const row = {
        email: 'invalid-email',
        name: 'Test User',
      };

      const result = validateRow(row, mapping, 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email');
    });

    it('should fail for missing email', () => {
      const row = {
        name: 'Test User',
      };

      const result = validateRow(row, mapping, 1);

      expect(result.success).toBe(false);
    });

    it('should validate status field', () => {
      const validStatuses = ['new', 'contacted', 'qualified', 'converted'];

      for (const status of validStatuses) {
        const row = {
          email: 'test@example.com',
          status,
        };
        const result = validateRow(row, mapping, 1);
        expect(result.success).toBe(true);
        expect(result.data?.status).toBe(status);
      }
    });

    it('should fail for invalid status', () => {
      const row = {
        email: 'test@example.com',
        status: 'invalid_status',
      };

      const result = validateRow(row, mapping, 1);

      expect(result.success).toBe(false);
    });

    it('should validate source field', () => {
      const validSources = ['website', 'embed', 'api'];

      for (const source of validSources) {
        const row = {
          email: 'test@example.com',
          source,
        };
        const result = validateRow(row, mapping, 1);
        expect(result.success).toBe(true);
      }
    });

    it('should validate score range', () => {
      // Valid scores
      const validScores = [0, 50, 100];
      for (const score of validScores) {
        const row = { email: 'test@example.com', score };
        const result = validateRow(row, mapping, 1);
        expect(result.success).toBe(true);
      }
    });

    it('should fail for score out of range', () => {
      const row = {
        email: 'test@example.com',
        score: 150,
      };

      const result = validateRow(row, mapping, 1);

      expect(result.success).toBe(false);
    });

    it('should trim whitespace from string fields', () => {
      const row = {
        email: 'test@example.com',
        name: '  John Doe  ',
        company: '  Acme Corp  ',
      };

      const result = validateRow(row, mapping, 1);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('John Doe');
      expect(result.data?.company).toBe('Acme Corp');
    });

    it('should handle missing optional fields', () => {
      const row = {
        email: 'test@example.com',
      };

      const result = validateRow(row, mapping, 1);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBeUndefined();
      expect(result.data?.company).toBeUndefined();
    });

    it('should include row number in result', () => {
      const row = { email: 'test@example.com' };

      const result = validateRow(row, mapping, 5);

      expect(result.row).toBe(5);
    });
  });

  describe('processImport', () => {
    const mapping: ColumnMapping = {
      email: 'email',
      name: 'name',
      company: 'company',
    };

    it('should process multiple valid rows', () => {
      const rows = [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' },
        { email: 'user3@example.com', name: 'User 3' },
      ];

      const summary = processImport(rows, mapping);

      expect(summary.totalRows).toBe(3);
      expect(summary.successCount).toBe(3);
      expect(summary.errorCount).toBe(0);
    });

    it('should track errors for invalid rows', () => {
      const rows = [
        { email: 'valid@example.com', name: 'Valid User' },
        { email: 'invalid-email', name: 'Invalid User' },
        { email: 'another@example.com', name: 'Another User' },
      ];

      const summary = processImport(rows, mapping);

      expect(summary.totalRows).toBe(3);
      expect(summary.successCount).toBe(2);
      expect(summary.errorCount).toBe(1);
    });

    it('should return results for each row', () => {
      const rows = [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' },
      ];

      const summary = processImport(rows, mapping);

      expect(summary.results.length).toBe(2);
      expect(summary.results[0].row).toBe(1);
      expect(summary.results[1].row).toBe(2);
    });

    it('should handle empty rows array', () => {
      const summary = processImport([], mapping);

      expect(summary.totalRows).toBe(0);
      expect(summary.successCount).toBe(0);
      expect(summary.errorCount).toBe(0);
      expect(summary.results).toEqual([]);
    });

    it('should handle all invalid rows', () => {
      const rows = [
        { email: 'invalid1' },
        { email: 'invalid2' },
      ];

      const summary = processImport(rows, mapping);

      expect(summary.totalRows).toBe(2);
      expect(summary.successCount).toBe(0);
      expect(summary.errorCount).toBe(2);
    });
  });

  describe('parseCSV', () => {
    it('should parse CSV content', () => {
      const result = parseCSV('email,name\ntest@example.com,Test User');

      expect(result.headers).toBeDefined();
      expect(result.rows).toBeDefined();
    });
  });

  describe('parseExcel', () => {
    it('should parse Excel buffer', () => {
      const buffer = new ArrayBuffer(100);
      const result = parseExcel(buffer);

      expect(result.headers).toBeDefined();
      expect(result.rows).toBeDefined();
    });
  });

  describe('generateImportTemplate', () => {
    it('should generate CSV template with headers', () => {
      const template = generateImportTemplate();

      expect(template).toContain('email');
      expect(template).toContain('name');
      expect(template).toContain('company');
      expect(template).toContain('phone');
      expect(template).toContain('status');
      expect(template).toContain('source');
      expect(template).toContain('score');
    });

    it('should include example row', () => {
      const template = generateImportTemplate();

      expect(template).toContain('example@company.com');
      expect(template).toContain('John Doe');
      expect(template).toContain('Acme Corp');
    });

    it('should be valid CSV format', () => {
      const template = generateImportTemplate();
      const lines = template.split('\n');

      expect(lines.length).toBe(2);
      expect(lines[0].split(',').length).toBe(7);
      expect(lines[1].split(',').length).toBe(7);
    });
  });
});
