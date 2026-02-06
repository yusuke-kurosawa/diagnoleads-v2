/**
 * Storage Helpers Tests
 *
 * Unit tests for storage utility functions
 */

import { describe, expect, it } from 'vitest';
import {
  generateFileKey,
  getFileExtension,
  sanitizeFilename,
  getContentType,
  validateFileType,
  validateFileSize,
  validateFile,
  formatFileSize,
} from '@/lib/storage/helpers';
import { ALLOWED_FILE_TYPES, FILE_SIZE_LIMITS } from '@/lib/storage/types';

describe('getFileExtension', () => {
  it('should extract extension from filename', () => {
    expect(getFileExtension('document.pdf')).toBe('pdf');
    expect(getFileExtension('image.PNG')).toBe('png');
    expect(getFileExtension('file.test.txt')).toBe('txt');
  });

  it('should return empty string for no extension', () => {
    expect(getFileExtension('noextension')).toBe('');
    expect(getFileExtension('')).toBe('');
  });

  it('should handle edge cases', () => {
    expect(getFileExtension('.gitignore')).toBe('gitignore');
    expect(getFileExtension('file.')).toBe('');
  });
});

describe('sanitizeFilename', () => {
  it('should convert to lowercase', () => {
    expect(sanitizeFilename('MyFile.pdf')).toBe('myfile');
  });

  it('should replace special characters with hyphens', () => {
    expect(sanitizeFilename('my file (1).pdf')).toBe('my-file-1');
    expect(sanitizeFilename('file@name#test.txt')).toBe('file-name-test');
  });

  it('should remove consecutive hyphens', () => {
    expect(sanitizeFilename('my---file.pdf')).toBe('my-file');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(sanitizeFilename('-myfile-.pdf')).toBe('myfile');
  });

  it('should truncate long filenames', () => {
    const longName = 'a'.repeat(150) + '.pdf';
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(100);
  });
});

describe('generateFileKey', () => {
  it('should generate key with prefix', () => {
    const key = generateFileKey('uploads', 'test.pdf');
    expect(key).toMatch(/^uploads\/\d+-[a-z0-9]+-test\.pdf$/);
  });

  it('should include timestamp', () => {
    const before = Date.now();
    const key = generateFileKey('prefix', 'file.txt');
    const after = Date.now();
    
    const timestampMatch = key.match(/^prefix\/(\d+)-/);
    expect(timestampMatch).not.toBeNull();
    
    const timestamp = parseInt(timestampMatch![1], 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('should handle files without extension', () => {
    const key = generateFileKey('uploads', 'noext');
    expect(key).toMatch(/^uploads\/\d+-[a-z0-9]+-noext$/);
  });
});

describe('getContentType', () => {
  it('should return correct MIME types for images', () => {
    expect(getContentType('photo.jpg')).toBe('image/jpeg');
    expect(getContentType('photo.jpeg')).toBe('image/jpeg');
    expect(getContentType('image.png')).toBe('image/png');
    expect(getContentType('animation.gif')).toBe('image/gif');
    expect(getContentType('modern.webp')).toBe('image/webp');
    expect(getContentType('vector.svg')).toBe('image/svg+xml');
  });

  it('should return correct MIME types for documents', () => {
    expect(getContentType('document.pdf')).toBe('application/pdf');
    expect(getContentType('document.doc')).toBe('application/msword');
    expect(getContentType('document.docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(getContentType('spreadsheet.xls')).toBe('application/vnd.ms-excel');
    expect(getContentType('spreadsheet.xlsx')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(getContentType('data.csv')).toBe('text/csv');
    expect(getContentType('readme.txt')).toBe('text/plain');
  });

  it('should return correct MIME types for other files', () => {
    expect(getContentType('archive.zip')).toBe('application/zip');
    expect(getContentType('config.json')).toBe('application/json');
  });

  it('should return octet-stream for unknown types', () => {
    expect(getContentType('unknown.xyz')).toBe('application/octet-stream');
    expect(getContentType('noextension')).toBe('application/octet-stream');
  });
});

describe('validateFileType', () => {
  it('should return true for allowed types', () => {
    expect(validateFileType('image/jpeg', ALLOWED_FILE_TYPES.images)).toBe(true);
    expect(validateFileType('image/png', ALLOWED_FILE_TYPES.images)).toBe(true);
    expect(validateFileType('application/pdf', ALLOWED_FILE_TYPES.documents)).toBe(true);
  });

  it('should return false for disallowed types', () => {
    expect(validateFileType('application/exe', ALLOWED_FILE_TYPES.images)).toBe(false);
    expect(validateFileType('image/jpeg', ALLOWED_FILE_TYPES.documents)).toBe(false);
  });

  it('should use all types by default', () => {
    expect(validateFileType('image/jpeg')).toBe(true);
    expect(validateFileType('application/pdf')).toBe(true);
    expect(validateFileType('application/exe')).toBe(false);
  });
});

describe('validateFileSize', () => {
  it('should return true for files within limit', () => {
    expect(validateFileSize(1024, FILE_SIZE_LIMITS.avatar)).toBe(true);
    expect(validateFileSize(FILE_SIZE_LIMITS.avatar, FILE_SIZE_LIMITS.avatar)).toBe(true);
  });

  it('should return false for files exceeding limit', () => {
    expect(validateFileSize(FILE_SIZE_LIMITS.avatar + 1, FILE_SIZE_LIMITS.avatar)).toBe(false);
    expect(validateFileSize(100 * 1024 * 1024, FILE_SIZE_LIMITS.avatar)).toBe(false);
  });

  it('should use default limit if not specified', () => {
    expect(validateFileSize(FILE_SIZE_LIMITS.default)).toBe(true);
    expect(validateFileSize(FILE_SIZE_LIMITS.default + 1)).toBe(false);
  });
});

describe('validateFile', () => {
  it('should validate valid file', () => {
    const result = validateFile({
      contentType: 'image/jpeg',
      size: 1024,
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject invalid file type', () => {
    const result = validateFile({
      contentType: 'application/exe',
      size: 1024,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('File type not allowed');
  });

  it('should reject file exceeding size limit', () => {
    const result = validateFile(
      {
        contentType: 'image/jpeg',
        size: 100 * 1024 * 1024,
      },
      { maxSize: FILE_SIZE_LIMITS.avatar }
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('File too large');
  });

  it('should use custom allowed types', () => {
    const result = validateFile(
      {
        contentType: 'application/pdf',
        size: 1024,
      },
      { allowedTypes: ALLOWED_FILE_TYPES.images }
    );
    expect(result.valid).toBe(false);
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
  });
});

describe('STORAGE_PATHS', () => {
  it('should be defined', async () => {
    const { STORAGE_PATHS } = await import('@/lib/storage/types');
    expect(STORAGE_PATHS).toBeDefined();
  });

  it('should generate lead attachment path', async () => {
    const { STORAGE_PATHS } = await import('@/lib/storage/types');
    const path = STORAGE_PATHS.leadAttachment('org-1', 'lead-1', 'doc.pdf');
    expect(path).toBe('organizations/org-1/leads/lead-1/attachments/doc.pdf');
  });

  it('should generate organization logo path', async () => {
    const { STORAGE_PATHS } = await import('@/lib/storage/types');
    const path = STORAGE_PATHS.organizationLogo('org-1', 'logo.png');
    expect(path).toBe('organizations/org-1/branding/logo.png');
  });

  it('should generate user avatar path', async () => {
    const { STORAGE_PATHS } = await import('@/lib/storage/types');
    const path = STORAGE_PATHS.userAvatar('user-1', 'avatar.jpg');
    expect(path).toBe('users/user-1/avatar/avatar.jpg');
  });

  it('should generate export file path', async () => {
    const { STORAGE_PATHS } = await import('@/lib/storage/types');
    const path = STORAGE_PATHS.exportFile('org-1', 'leads', 'export.csv');
    expect(path).toBe('organizations/org-1/exports/leads/export.csv');
  });

  it('should generate temp file path', async () => {
    const { STORAGE_PATHS } = await import('@/lib/storage/types');
    const path = STORAGE_PATHS.tempFile('temp.txt');
    expect(path).toBe('temp/temp.txt');
  });
});

describe('ALLOWED_FILE_TYPES', () => {
  it('should have images category', () => {
    expect(ALLOWED_FILE_TYPES.images).toContain('image/jpeg');
    expect(ALLOWED_FILE_TYPES.images).toContain('image/png');
    expect(ALLOWED_FILE_TYPES.images).toContain('image/gif');
    expect(ALLOWED_FILE_TYPES.images).toContain('image/webp');
    expect(ALLOWED_FILE_TYPES.images).toContain('image/svg+xml');
  });

  it('should have documents category', () => {
    expect(ALLOWED_FILE_TYPES.documents).toContain('application/pdf');
    expect(ALLOWED_FILE_TYPES.documents).toContain('text/csv');
    expect(ALLOWED_FILE_TYPES.documents).toContain('text/plain');
  });

  it('should have all category combining images and documents', () => {
    expect(ALLOWED_FILE_TYPES.all).toContain('image/jpeg');
    expect(ALLOWED_FILE_TYPES.all).toContain('application/pdf');
    expect(ALLOWED_FILE_TYPES.all).toContain('application/zip');
  });
});

describe('FILE_SIZE_LIMITS', () => {
  it('should have avatar limit', () => {
    expect(FILE_SIZE_LIMITS.avatar).toBe(5 * 1024 * 1024);
  });

  it('should have logo limit', () => {
    expect(FILE_SIZE_LIMITS.logo).toBe(10 * 1024 * 1024);
  });

  it('should have attachment limit', () => {
    expect(FILE_SIZE_LIMITS.attachment).toBe(25 * 1024 * 1024);
  });

  it('should have export limit', () => {
    expect(FILE_SIZE_LIMITS.export).toBe(100 * 1024 * 1024);
  });

  it('should have default limit', () => {
    expect(FILE_SIZE_LIMITS.default).toBe(50 * 1024 * 1024);
  });
});
