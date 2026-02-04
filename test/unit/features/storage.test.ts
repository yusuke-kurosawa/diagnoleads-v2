/**
 * Storage Tests
 *
 * Unit tests for the file storage system
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalStorage, resetStorageInstance } from '@/lib/storage/client';
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
import {
  STORAGE_PATHS,
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
} from '@/lib/storage/types';

describe('Storage Client', () => {
  let storage: LocalStorage;

  beforeEach(() => {
    resetStorageInstance();
    storage = new LocalStorage('/tmp/test-storage');
  });

  afterEach(() => {
    storage.clear();
  });

  describe('upload', () => {
    it('should upload a file', async () => {
      const result = await storage.upload('test/file.txt', 'Hello, World!', {
        contentType: 'text/plain',
      });

      expect(result.key).toBe('test/file.txt');
      expect(result.bucket).toBe('local');
      expect(result.url).toContain('test/file.txt');
    });

    it('should upload binary data', async () => {
      const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const result = await storage.upload('test/binary.bin', buffer);

      expect(result.key).toBe('test/binary.bin');
    });
  });

  describe('download', () => {
    it('should download an uploaded file', async () => {
      await storage.upload('test/file.txt', 'Hello, World!');

      const data = await storage.download('test/file.txt');

      expect(data.toString()).toBe('Hello, World!');
    });

    it('should throw for non-existent file', async () => {
      await expect(storage.download('nonexistent.txt')).rejects.toThrow('File not found');
    });
  });

  describe('delete', () => {
    it('should delete a file', async () => {
      await storage.upload('test/file.txt', 'content');
      await storage.delete('test/file.txt');

      expect(await storage.exists('test/file.txt')).toBe(false);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple files', async () => {
      await storage.upload('test/file1.txt', 'content1');
      await storage.upload('test/file2.txt', 'content2');

      await storage.deleteMany(['test/file1.txt', 'test/file2.txt']);

      expect(await storage.exists('test/file1.txt')).toBe(false);
      expect(await storage.exists('test/file2.txt')).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await storage.upload('test/file.txt', 'content');

      expect(await storage.exists('test/file.txt')).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      expect(await storage.exists('nonexistent.txt')).toBe(false);
    });
  });

  describe('getMetadata', () => {
    it('should return file metadata', async () => {
      await storage.upload('test/file.txt', 'Hello, World!', {
        contentType: 'text/plain',
        metadata: { custom: 'value' },
      });

      const metadata = await storage.getMetadata('test/file.txt');

      expect(metadata).not.toBeNull();
      expect(metadata?.key).toBe('test/file.txt');
      expect(metadata?.size).toBe(13);
      expect(metadata?.contentType).toBe('text/plain');
      expect(metadata?.metadata?.custom).toBe('value');
    });

    it('should return null for non-existent file', async () => {
      const metadata = await storage.getMetadata('nonexistent.txt');
      expect(metadata).toBeNull();
    });
  });

  describe('list', () => {
    it('should list files', async () => {
      await storage.upload('test/file1.txt', 'content1');
      await storage.upload('test/file2.txt', 'content2');
      await storage.upload('other/file.txt', 'content3');

      const result = await storage.list({ prefix: 'test/' });

      expect(result.files).toHaveLength(2);
      expect(result.files.map((f) => f.key)).toContain('test/file1.txt');
      expect(result.files.map((f) => f.key)).toContain('test/file2.txt');
    });

    it('should respect maxKeys', async () => {
      await storage.upload('test/file1.txt', 'content1');
      await storage.upload('test/file2.txt', 'content2');
      await storage.upload('test/file3.txt', 'content3');

      const result = await storage.list({ prefix: 'test/', maxKeys: 2 });

      expect(result.files).toHaveLength(2);
    });
  });

  describe('copy', () => {
    it('should copy a file', async () => {
      await storage.upload('source.txt', 'content');

      await storage.copy('source.txt', 'dest.txt');

      expect(await storage.exists('source.txt')).toBe(true);
      expect(await storage.exists('dest.txt')).toBe(true);
      expect((await storage.download('dest.txt')).toString()).toBe('content');
    });
  });

  describe('move', () => {
    it('should move a file', async () => {
      await storage.upload('source.txt', 'content');

      await storage.move('source.txt', 'dest.txt');

      expect(await storage.exists('source.txt')).toBe(false);
      expect(await storage.exists('dest.txt')).toBe(true);
    });
  });

  describe('presigned URLs', () => {
    it('should generate presigned upload URL', async () => {
      const url = await storage.getPresignedUploadUrl('test/file.txt');

      expect(url).toContain('test/file.txt');
      expect(url).toContain('upload=true');
    });

    it('should generate presigned download URL', async () => {
      const url = await storage.getPresignedDownloadUrl('test/file.txt');

      expect(url).toContain('test/file.txt');
    });
  });
});

describe('Storage Helpers', () => {
  describe('generateFileKey', () => {
    it('should generate unique key', () => {
      const key1 = generateFileKey('uploads', 'document.pdf');
      const key2 = generateFileKey('uploads', 'document.pdf');

      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^uploads\/\d+-[a-z0-9]+-document\.pdf$/);
    });

    it('should handle files without extension', () => {
      const key = generateFileKey('uploads', 'README');

      expect(key).toMatch(/^uploads\/\d+-[a-z0-9]+-readme$/);
    });
  });

  describe('getFileExtension', () => {
    it('should return extension', () => {
      expect(getFileExtension('file.pdf')).toBe('pdf');
      expect(getFileExtension('file.tar.gz')).toBe('gz');
      expect(getFileExtension('file')).toBe('');
    });

    it('should return lowercase extension', () => {
      expect(getFileExtension('file.PDF')).toBe('pdf');
      expect(getFileExtension('file.JPEG')).toBe('jpeg');
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize special characters', () => {
      expect(sanitizeFilename('My Document (1).pdf')).toBe('my-document-1');
      expect(sanitizeFilename('file@#$%.txt')).toBe('file');
    });

    it('should limit length', () => {
      const longName = 'a'.repeat(150) + '.txt';
      const sanitized = sanitizeFilename(longName);

      expect(sanitized.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getContentType', () => {
    it('should return correct content types', () => {
      expect(getContentType('image.jpg')).toBe('image/jpeg');
      expect(getContentType('image.png')).toBe('image/png');
      expect(getContentType('document.pdf')).toBe('application/pdf');
      expect(getContentType('data.json')).toBe('application/json');
    });

    it('should return octet-stream for unknown types', () => {
      expect(getContentType('file.xyz')).toBe('application/octet-stream');
    });
  });

  describe('validateFileType', () => {
    it('should validate allowed types', () => {
      expect(validateFileType('image/jpeg', ALLOWED_FILE_TYPES.images)).toBe(true);
      expect(validateFileType('application/pdf', ALLOWED_FILE_TYPES.images)).toBe(false);
      expect(validateFileType('application/pdf', ALLOWED_FILE_TYPES.documents)).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    it('should validate file size', () => {
      expect(validateFileSize(1024, FILE_SIZE_LIMITS.avatar)).toBe(true);
      expect(validateFileSize(10 * 1024 * 1024, FILE_SIZE_LIMITS.avatar)).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('should validate file', () => {
      const validFile = { contentType: 'image/jpeg', size: 1024 };
      const result = validateFile(validFile, { allowedTypes: ALLOWED_FILE_TYPES.images });

      expect(result.valid).toBe(true);
    });

    it('should reject invalid type', () => {
      const invalidFile = { contentType: 'application/exe', size: 1024 };
      const result = validateFile(invalidFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File type not allowed');
    });

    it('should reject oversized file', () => {
      const largeFile = { contentType: 'image/jpeg', size: 100 * 1024 * 1024 };
      const result = validateFile(largeFile, { maxSize: FILE_SIZE_LIMITS.avatar });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });
  });
});

describe('Storage Paths', () => {
  it('should generate correct paths', () => {
    expect(STORAGE_PATHS.leadAttachment('org-1', 'lead-1', 'doc.pdf')).toBe(
      'organizations/org-1/leads/lead-1/attachments/doc.pdf'
    );

    expect(STORAGE_PATHS.organizationLogo('org-1', 'logo.png')).toBe(
      'organizations/org-1/branding/logo.png'
    );

    expect(STORAGE_PATHS.userAvatar('user-1', 'avatar.jpg')).toBe(
      'users/user-1/avatar/avatar.jpg'
    );

    expect(STORAGE_PATHS.exportFile('org-1', 'leads', 'export.csv')).toBe(
      'organizations/org-1/exports/leads/export.csv'
    );

    expect(STORAGE_PATHS.diagnosticAsset('form-1', 'image.png')).toBe(
      'diagnostics/form-1/assets/image.png'
    );
  });
});

describe('File Constants', () => {
  it('should have correct size limits', () => {
    expect(FILE_SIZE_LIMITS.avatar).toBe(5 * 1024 * 1024);
    expect(FILE_SIZE_LIMITS.logo).toBe(10 * 1024 * 1024);
    expect(FILE_SIZE_LIMITS.attachment).toBe(25 * 1024 * 1024);
    expect(FILE_SIZE_LIMITS.export).toBe(100 * 1024 * 1024);
  });

  it('should have image types', () => {
    expect(ALLOWED_FILE_TYPES.images).toContain('image/jpeg');
    expect(ALLOWED_FILE_TYPES.images).toContain('image/png');
    expect(ALLOWED_FILE_TYPES.images).toContain('image/webp');
  });

  it('should have document types', () => {
    expect(ALLOWED_FILE_TYPES.documents).toContain('application/pdf');
    expect(ALLOWED_FILE_TYPES.documents).toContain('text/csv');
  });
});
