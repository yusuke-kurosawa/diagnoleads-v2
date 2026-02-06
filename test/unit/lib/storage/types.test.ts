/**
 * Storage Types Tests
 */

import { describe, expect, it } from 'vitest';
import {
  STORAGE_PATHS,
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  type StorageProvider,
  type StorageConfig,
  type FileMetadata,
  type UploadOptions,
  type DownloadOptions,
  type PresignedUrlOptions,
  type ListOptions,
  type ListResult,
  type UploadResult,
} from '@/lib/storage/types';

describe('STORAGE_PATHS', () => {
  describe('leadAttachment', () => {
    it('should generate correct path', () => {
      const path = STORAGE_PATHS.leadAttachment('org-123', 'lead-456', 'document.pdf');
      expect(path).toBe('organizations/org-123/leads/lead-456/attachments/document.pdf');
    });
  });

  describe('organizationLogo', () => {
    it('should generate correct path', () => {
      const path = STORAGE_PATHS.organizationLogo('org-123', 'logo.png');
      expect(path).toBe('organizations/org-123/branding/logo.png');
    });
  });

  describe('userAvatar', () => {
    it('should generate correct path', () => {
      const path = STORAGE_PATHS.userAvatar('user-123', 'avatar.jpg');
      expect(path).toBe('users/user-123/avatar/avatar.jpg');
    });
  });

  describe('exportFile', () => {
    it('should generate correct path', () => {
      const path = STORAGE_PATHS.exportFile('org-123', 'csv', 'leads-export.csv');
      expect(path).toBe('organizations/org-123/exports/csv/leads-export.csv');
    });
  });

  describe('reportFile', () => {
    it('should generate correct path', () => {
      const path = STORAGE_PATHS.reportFile('org-123', 'report-789', 'summary.pdf');
      expect(path).toBe('organizations/org-123/reports/report-789/summary.pdf');
    });
  });

  describe('diagnosticAsset', () => {
    it('should generate correct path', () => {
      const path = STORAGE_PATHS.diagnosticAsset('form-123', 'image.png');
      expect(path).toBe('diagnostics/form-123/assets/image.png');
    });
  });

  describe('tempFile', () => {
    it('should generate correct path', () => {
      const path = STORAGE_PATHS.tempFile('temp-file.txt');
      expect(path).toBe('temp/temp-file.txt');
    });
  });
});

describe('ALLOWED_FILE_TYPES', () => {
  describe('images', () => {
    it('should include common image types', () => {
      expect(ALLOWED_FILE_TYPES.images).toContain('image/jpeg');
      expect(ALLOWED_FILE_TYPES.images).toContain('image/png');
      expect(ALLOWED_FILE_TYPES.images).toContain('image/gif');
      expect(ALLOWED_FILE_TYPES.images).toContain('image/webp');
      expect(ALLOWED_FILE_TYPES.images).toContain('image/svg+xml');
    });

    it('should have 5 image types', () => {
      expect(ALLOWED_FILE_TYPES.images.length).toBe(5);
    });
  });

  describe('documents', () => {
    it('should include PDF', () => {
      expect(ALLOWED_FILE_TYPES.documents).toContain('application/pdf');
    });

    it('should include Word documents', () => {
      expect(ALLOWED_FILE_TYPES.documents).toContain('application/msword');
      expect(ALLOWED_FILE_TYPES.documents).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('should include Excel documents', () => {
      expect(ALLOWED_FILE_TYPES.documents).toContain('application/vnd.ms-excel');
      expect(ALLOWED_FILE_TYPES.documents).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should include CSV and plain text', () => {
      expect(ALLOWED_FILE_TYPES.documents).toContain('text/csv');
      expect(ALLOWED_FILE_TYPES.documents).toContain('text/plain');
    });
  });

  describe('all', () => {
    it('should include all images', () => {
      for (const imageType of ALLOWED_FILE_TYPES.images) {
        expect(ALLOWED_FILE_TYPES.all).toContain(imageType);
      }
    });

    it('should include all documents', () => {
      for (const docType of ALLOWED_FILE_TYPES.documents) {
        expect(ALLOWED_FILE_TYPES.all).toContain(docType);
      }
    });

    it('should include zip files', () => {
      expect(ALLOWED_FILE_TYPES.all).toContain('application/zip');
    });
  });
});

describe('FILE_SIZE_LIMITS', () => {
  it('should have avatar limit of 5MB', () => {
    expect(FILE_SIZE_LIMITS.avatar).toBe(5 * 1024 * 1024);
  });

  it('should have logo limit of 10MB', () => {
    expect(FILE_SIZE_LIMITS.logo).toBe(10 * 1024 * 1024);
  });

  it('should have attachment limit of 25MB', () => {
    expect(FILE_SIZE_LIMITS.attachment).toBe(25 * 1024 * 1024);
  });

  it('should have export limit of 100MB', () => {
    expect(FILE_SIZE_LIMITS.export).toBe(100 * 1024 * 1024);
  });

  it('should have default limit of 50MB', () => {
    expect(FILE_SIZE_LIMITS.default).toBe(50 * 1024 * 1024);
  });
});

describe('Storage Types', () => {
  describe('StorageProvider', () => {
    it('should accept valid providers', () => {
      const providers: StorageProvider[] = ['s3', 'r2', 'local'];
      expect(providers).toHaveLength(3);
    });
  });

  describe('StorageConfig', () => {
    it('should have required properties', () => {
      const config: StorageConfig = {
        provider: 's3',
        bucket: 'my-bucket',
        region: 'us-east-1',
      };
      expect(config.provider).toBe('s3');
      expect(config.bucket).toBe('my-bucket');
    });

    it('should support optional properties', () => {
      const config: StorageConfig = {
        provider: 'r2',
        bucket: 'my-bucket',
        endpoint: 'https://r2.example.com',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        publicUrl: 'https://public.example.com',
      };
      expect(config.endpoint).toBeDefined();
      expect(config.publicUrl).toBeDefined();
    });
  });

  describe('FileMetadata', () => {
    it('should have required properties', () => {
      const metadata: FileMetadata = {
        key: 'path/to/file.txt',
        bucket: 'my-bucket',
        size: 1024,
        contentType: 'text/plain',
        lastModified: new Date(),
      };
      expect(metadata.key).toBe('path/to/file.txt');
      expect(metadata.size).toBe(1024);
    });

    it('should support optional metadata', () => {
      const metadata: FileMetadata = {
        key: 'file.txt',
        bucket: 'bucket',
        size: 100,
        contentType: 'text/plain',
        lastModified: new Date(),
        etag: '"abc123"',
        metadata: { 'x-custom': 'value' },
      };
      expect(metadata.etag).toBe('"abc123"');
      expect(metadata.metadata?.['x-custom']).toBe('value');
    });
  });

  describe('UploadOptions', () => {
    it('should support all options', () => {
      const options: UploadOptions = {
        contentType: 'image/png',
        metadata: { 'x-uploaded-by': 'user-123' },
        acl: 'public-read',
        cacheControl: 'max-age=31536000',
        contentDisposition: 'attachment; filename="image.png"',
      };
      expect(options.acl).toBe('public-read');
    });
  });

  describe('DownloadOptions', () => {
    it('should support range downloads', () => {
      const options: DownloadOptions = {
        range: { start: 0, end: 1024 },
      };
      expect(options.range?.start).toBe(0);
      expect(options.range?.end).toBe(1024);
    });
  });

  describe('PresignedUrlOptions', () => {
    it('should support expiration', () => {
      const options: PresignedUrlOptions = {
        expiresIn: 3600,
        contentType: 'application/pdf',
      };
      expect(options.expiresIn).toBe(3600);
    });
  });

  describe('ListOptions', () => {
    it('should support pagination', () => {
      const options: ListOptions = {
        prefix: 'organizations/',
        delimiter: '/',
        maxKeys: 100,
        continuationToken: 'token123',
      };
      expect(options.maxKeys).toBe(100);
    });
  });

  describe('ListResult', () => {
    it('should return files and prefixes', () => {
      const result: ListResult = {
        files: [],
        prefixes: ['folder1/', 'folder2/'],
        isTruncated: false,
      };
      expect(result.prefixes).toHaveLength(2);
    });
  });

  describe('UploadResult', () => {
    it('should return upload info', () => {
      const result: UploadResult = {
        key: 'path/to/file.txt',
        bucket: 'my-bucket',
        etag: '"abc123"',
        url: 'https://cdn.example.com/path/to/file.txt',
      };
      expect(result.url).toContain('https://');
    });
  });
});
