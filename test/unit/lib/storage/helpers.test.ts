/**
 * Storage Helpers Tests
 */

import { describe, expect, it } from 'vitest';

// Helper functions (matching source)
function generateFileKey(prefix: string, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = getFileExtension(filename);
  const safeName = sanitizeFilename(filename);

  return `${prefix}/${timestamp}-${random}-${safeName}${ext ? `.${ext}` : ''}`;
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function sanitizeFilename(filename: string): string {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  return nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

function getContentType(filename: string): string {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
    zip: 'application/zip',
    json: 'application/json',
  };
  return mimeTypes[ext] ?? 'application/octet-stream';
}

function validateFileType(contentType: string, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(contentType);
}

function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

describe('generateFileKey', () => {
  it('should generate unique key with prefix', () => {
    const key = generateFileKey('uploads', 'test.jpg');
    expect(key).toMatch(/^uploads\/\d+-[a-z0-9]+-test\.jpg$/);
  });

  it('should generate different keys for same file', () => {
    const key1 = generateFileKey('uploads', 'test.jpg');
    const key2 = generateFileKey('uploads', 'test.jpg');
    expect(key1).not.toBe(key2);
  });

  it('should handle files without extension', () => {
    const key = generateFileKey('uploads', 'README');
    expect(key).toMatch(/^uploads\/\d+-[a-z0-9]+-readme$/);
  });

  it('should sanitize filename in key', () => {
    const key = generateFileKey('uploads', 'My File (1).jpg');
    expect(key).not.toContain(' ');
    expect(key).not.toContain('(');
  });
});

describe('getFileExtension', () => {
  it('should get extension from filename', () => {
    expect(getFileExtension('file.jpg')).toBe('jpg');
    expect(getFileExtension('file.PNG')).toBe('png');
    expect(getFileExtension('file.tar.gz')).toBe('gz');
  });

  it('should return empty string for no extension', () => {
    expect(getFileExtension('README')).toBe('');
    expect(getFileExtension('Makefile')).toBe('');
  });

  it('should handle hidden files', () => {
    expect(getFileExtension('.gitignore')).toBe('gitignore');
  });

  it('should lowercase extension', () => {
    expect(getFileExtension('file.JPG')).toBe('jpg');
    expect(getFileExtension('file.PDF')).toBe('pdf');
  });
});

describe('sanitizeFilename', () => {
  it('should lowercase filename', () => {
    expect(sanitizeFilename('MyFile.jpg')).toBe('myfile');
  });

  it('should replace spaces with hyphens', () => {
    expect(sanitizeFilename('my file.jpg')).toBe('my-file');
  });

  it('should remove special characters', () => {
    expect(sanitizeFilename('file@#$%.jpg')).toBe('file');
  });

  it('should collapse multiple hyphens', () => {
    expect(sanitizeFilename('my---file.jpg')).toBe('my-file');
  });

  it('should remove leading/trailing hyphens', () => {
    expect(sanitizeFilename('-file-.jpg')).toBe('file');
  });

  it('should truncate long filenames', () => {
    const longName = 'a'.repeat(150) + '.jpg';
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(100);
  });

  it('should handle Japanese characters', () => {
    const result = sanitizeFilename('テスト画像.jpg');
    expect(result).not.toContain('テ');
  });
});

describe('getContentType', () => {
  it('should return correct MIME type for images', () => {
    expect(getContentType('file.jpg')).toBe('image/jpeg');
    expect(getContentType('file.jpeg')).toBe('image/jpeg');
    expect(getContentType('file.png')).toBe('image/png');
    expect(getContentType('file.gif')).toBe('image/gif');
    expect(getContentType('file.webp')).toBe('image/webp');
    expect(getContentType('file.svg')).toBe('image/svg+xml');
  });

  it('should return correct MIME type for documents', () => {
    expect(getContentType('file.pdf')).toBe('application/pdf');
    expect(getContentType('file.doc')).toBe('application/msword');
    expect(getContentType('file.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(getContentType('file.xls')).toBe('application/vnd.ms-excel');
    expect(getContentType('file.xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('should return correct MIME type for text files', () => {
    expect(getContentType('file.csv')).toBe('text/csv');
    expect(getContentType('file.txt')).toBe('text/plain');
  });

  it('should return correct MIME type for archives', () => {
    expect(getContentType('file.zip')).toBe('application/zip');
  });

  it('should return octet-stream for unknown types', () => {
    expect(getContentType('file.xyz')).toBe('application/octet-stream');
    expect(getContentType('file.unknown')).toBe('application/octet-stream');
  });
});

describe('validateFileType', () => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const documentTypes = ['application/pdf', 'text/csv'];

  it('should return true for allowed type', () => {
    expect(validateFileType('image/jpeg', imageTypes)).toBe(true);
    expect(validateFileType('image/png', imageTypes)).toBe(true);
  });

  it('should return false for disallowed type', () => {
    expect(validateFileType('application/pdf', imageTypes)).toBe(false);
    expect(validateFileType('image/jpeg', documentTypes)).toBe(false);
  });
});

describe('validateFileSize', () => {
  const maxSize = 5 * 1024 * 1024; // 5MB

  it('should return true for size under limit', () => {
    expect(validateFileSize(1024, maxSize)).toBe(true);
    expect(validateFileSize(maxSize - 1, maxSize)).toBe(true);
  });

  it('should return true for size at limit', () => {
    expect(validateFileSize(maxSize, maxSize)).toBe(true);
  });

  it('should return false for size over limit', () => {
    expect(validateFileSize(maxSize + 1, maxSize)).toBe(false);
    expect(validateFileSize(maxSize * 2, maxSize)).toBe(false);
  });
});

describe('File validation combined', () => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  const maxSize = 5 * 1024 * 1024;

  it('should validate valid file', () => {
    const file = { contentType: 'image/jpeg', size: 1024 };
    const isValidType = validateFileType(file.contentType, allowedTypes);
    const isValidSize = validateFileSize(file.size, maxSize);
    expect(isValidType && isValidSize).toBe(true);
  });

  it('should reject invalid type', () => {
    const file = { contentType: 'application/pdf', size: 1024 };
    const isValidType = validateFileType(file.contentType, allowedTypes);
    expect(isValidType).toBe(false);
  });

  it('should reject oversized file', () => {
    const file = { contentType: 'image/jpeg', size: 10 * 1024 * 1024 };
    const isValidSize = validateFileSize(file.size, maxSize);
    expect(isValidSize).toBe(false);
  });
});

describe('URL generation', () => {
  it('should generate presigned URL options', () => {
    type PresignedUrlOptions = {
      expiresIn?: number;
      contentType?: string;
      contentDisposition?: string;
    };

    const options: PresignedUrlOptions = {
      expiresIn: 3600,
      contentType: 'image/jpeg',
      contentDisposition: 'inline',
    };

    expect(options.expiresIn).toBe(3600);
  });

  it('should define public URL structure', () => {
    const publicUrl = (bucket: string, key: string) =>
      `https://${bucket}.s3.amazonaws.com/${key}`;

    expect(publicUrl('my-bucket', 'uploads/test.jpg'))
      .toBe('https://my-bucket.s3.amazonaws.com/uploads/test.jpg');
  });
});

// Integration tests with actual module
import {
  generateFileKey as actualGenerateFileKey,
  getFileExtension as actualGetFileExtension,
  sanitizeFilename as actualSanitizeFilename,
  getContentType as actualGetContentType,
  validateFileType as actualValidateFileType,
  validateFileSize as actualValidateFileSize,
  validateFile,
  formatFileSize,
} from '@/lib/storage/helpers';
import { ALLOWED_FILE_TYPES, FILE_SIZE_LIMITS } from '@/lib/storage/types';

describe('Integration: generateFileKey (actual)', () => {
  it('should generate unique key with timestamp', () => {
    const key = actualGenerateFileKey('uploads', 'document.pdf');
    expect(key).toMatch(/^uploads\/\d+-[a-z0-9]+-document\.pdf$/);
  });

  it('should handle complex filenames', () => {
    const key = actualGenerateFileKey('files', 'My Report (Final) - Copy.xlsx');
    expect(key).toMatch(/^files\/\d+-[a-z0-9]+-my-report-final-copy\.xlsx$/);
  });

  it('should handle files without extension', () => {
    const key = actualGenerateFileKey('docs', 'LICENSE');
    expect(key).toMatch(/^docs\/\d+-[a-z0-9]+-license$/);
  });
});

describe('Integration: getFileExtension (actual)', () => {
  it('should extract extension correctly', () => {
    expect(actualGetFileExtension('image.jpg')).toBe('jpg');
    expect(actualGetFileExtension('document.PDF')).toBe('pdf');
    expect(actualGetFileExtension('archive.tar.gz')).toBe('gz');
  });

  it('should return empty for no extension', () => {
    expect(actualGetFileExtension('README')).toBe('');
  });
});

describe('Integration: sanitizeFilename (actual)', () => {
  it('should sanitize special characters', () => {
    expect(actualSanitizeFilename('My File (1).jpg')).toBe('my-file-1');
    expect(actualSanitizeFilename('日本語ファイル.txt')).toBe('');
    expect(actualSanitizeFilename('file---name.pdf')).toBe('file-name');
  });

  it('should limit length', () => {
    const longName = 'a'.repeat(200) + '.txt';
    expect(actualSanitizeFilename(longName).length).toBeLessThanOrEqual(100);
  });
});

describe('Integration: getContentType (actual)', () => {
  it('should return correct MIME types', () => {
    expect(actualGetContentType('image.jpg')).toBe('image/jpeg');
    expect(actualGetContentType('document.pdf')).toBe('application/pdf');
    expect(actualGetContentType('data.json')).toBe('application/json');
    expect(actualGetContentType('file.csv')).toBe('text/csv');
  });

  it('should return octet-stream for unknown types', () => {
    expect(actualGetContentType('file.xyz')).toBe('application/octet-stream');
  });
});

describe('Integration: validateFileType (actual)', () => {
  it('should validate allowed types', () => {
    expect(actualValidateFileType('image/jpeg', ALLOWED_FILE_TYPES.images)).toBe(true);
    expect(actualValidateFileType('image/png', ALLOWED_FILE_TYPES.images)).toBe(true);
    expect(actualValidateFileType('application/pdf', ALLOWED_FILE_TYPES.images)).toBe(false);
  });

  it('should validate document types', () => {
    expect(actualValidateFileType('application/pdf', ALLOWED_FILE_TYPES.documents)).toBe(true);
    expect(actualValidateFileType('text/csv', ALLOWED_FILE_TYPES.documents)).toBe(true);
  });
});

describe('Integration: validateFileSize (actual)', () => {
  it('should validate size within limits', () => {
    expect(actualValidateFileSize(1024 * 1024, FILE_SIZE_LIMITS.default)).toBe(true);
    expect(actualValidateFileSize(100 * 1024 * 1024, FILE_SIZE_LIMITS.default)).toBe(false);
  });

  it('should use avatar limit', () => {
    expect(actualValidateFileSize(3 * 1024 * 1024, FILE_SIZE_LIMITS.avatar)).toBe(true);
    expect(actualValidateFileSize(10 * 1024 * 1024, FILE_SIZE_LIMITS.avatar)).toBe(false);
  });

  it('should use attachment limit', () => {
    expect(actualValidateFileSize(20 * 1024 * 1024, FILE_SIZE_LIMITS.attachment)).toBe(true);
    expect(actualValidateFileSize(30 * 1024 * 1024, FILE_SIZE_LIMITS.attachment)).toBe(false);
  });
});

describe('Integration: validateFile (actual)', () => {
  it('should validate valid file', () => {
    const result = validateFile(
      { contentType: 'image/jpeg', size: 1024 * 1024 },
      { allowedTypes: ALLOWED_FILE_TYPES.images, maxSize: FILE_SIZE_LIMITS.avatar }
    );
    expect(result.valid).toBe(true);
  });

  it('should reject invalid content type', () => {
    const result = validateFile(
      { contentType: 'application/exe', size: 1024 },
      { allowedTypes: ALLOWED_FILE_TYPES.images }
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('type not allowed');
  });

  it('should reject oversized file', () => {
    const result = validateFile(
      { contentType: 'image/jpeg', size: 100 * 1024 * 1024 },
      { maxSize: FILE_SIZE_LIMITS.avatar }
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too large');
  });
});

describe('Integration: formatFileSize (actual)', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('should format KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(2048)).toBe('2 KB');
  });

  it('should format MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
  });

  it('should format GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

// Integration tests with mocked storage client
import { vi, beforeEach, afterEach } from 'vitest';
import {
  uploadFile,
  downloadFile,
  deleteFile,
  getUploadUrl,
  getDownloadUrl,
  fileExists,
  getFileMetadata,
} from '@/lib/storage/helpers';
import * as storageClient from '@/lib/storage/client';

describe('Integration: Storage operations (mocked)', () => {
  const mockStorage = {
    upload: vi.fn(),
    download: vi.fn(),
    delete: vi.fn(),
    getPresignedUploadUrl: vi.fn(),
    getPresignedDownloadUrl: vi.fn(),
    exists: vi.fn(),
    getMetadata: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(storageClient, 'getStorage').mockReturnValue(mockStorage as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file with buffer data', async () => {
      mockStorage.upload.mockResolvedValue({
        key: 'uploads/test.jpg',
        url: 'https://example.com/uploads/test.jpg',
      });

      const data = Buffer.from('test content');
      const result = await uploadFile('uploads/test.jpg', data, {
        contentType: 'image/jpeg',
      });

      expect(result.key).toBe('uploads/test.jpg');
      expect(result.url).toBe('https://example.com/uploads/test.jpg');
      expect(mockStorage.upload).toHaveBeenCalledWith(
        'uploads/test.jpg',
        expect.any(Buffer),
        expect.objectContaining({ contentType: 'image/jpeg' })
      );
    });

    it('should upload file with string data', async () => {
      mockStorage.upload.mockResolvedValue({
        key: 'uploads/text.txt',
        url: 'https://example.com/uploads/text.txt',
      });

      const result = await uploadFile('uploads/text.txt', 'hello world', {
        contentType: 'text/plain',
      });

      expect(result.key).toBe('uploads/text.txt');
      expect(mockStorage.upload).toHaveBeenCalled();
    });

    it('should validate file type when allowedTypes specified', async () => {
      await expect(
        uploadFile('uploads/test.exe', Buffer.from('data'), {
          contentType: 'application/x-msdownload',
          allowedTypes: ['image/jpeg', 'image/png'],
        })
      ).rejects.toThrow();
    });

    it('should validate file size when maxSize specified', async () => {
      const largeData = Buffer.alloc(10 * 1024 * 1024); // 10MB

      await expect(
        uploadFile('uploads/large.jpg', largeData, {
          contentType: 'image/jpeg',
          maxSize: 5 * 1024 * 1024, // 5MB limit
        })
      ).rejects.toThrow();
    });

    it('should use default content type when not specified', async () => {
      mockStorage.upload.mockResolvedValue({
        key: 'uploads/file',
        url: 'https://example.com/uploads/file',
      });

      // Default content type is 'application/octet-stream', which is always valid
      await uploadFile('uploads/file', Buffer.from('data'), {
        allowedTypes: ['application/octet-stream'],
      });

      expect(mockStorage.upload).toHaveBeenCalledWith(
        'uploads/file',
        expect.any(Buffer),
        expect.objectContaining({})
      );
    });
  });

  describe('downloadFile', () => {
    it('should download file and return buffer', async () => {
      const fileContent = Buffer.from('file content');
      mockStorage.download.mockResolvedValue(fileContent);

      const result = await downloadFile('uploads/test.txt');

      expect(result).toEqual(fileContent);
      expect(mockStorage.download).toHaveBeenCalledWith('uploads/test.txt');
    });
  });

  describe('deleteFile', () => {
    it('should delete file by key', async () => {
      mockStorage.delete.mockResolvedValue(undefined);

      await deleteFile('uploads/test.jpg');

      expect(mockStorage.delete).toHaveBeenCalledWith('uploads/test.jpg');
    });
  });

  describe('getUploadUrl', () => {
    it('should get presigned upload URL', async () => {
      mockStorage.getPresignedUploadUrl.mockResolvedValue(
        'https://example.com/presigned-upload'
      );

      const result = await getUploadUrl('uploads/new-file.jpg', { expiresIn: 3600 });

      expect(result.url).toBe('https://example.com/presigned-upload');
      expect(result.key).toBe('uploads/new-file.jpg');
      expect(mockStorage.getPresignedUploadUrl).toHaveBeenCalledWith(
        'uploads/new-file.jpg',
        { expiresIn: 3600 }
      );
    });
  });

  describe('getDownloadUrl', () => {
    it('should get presigned download URL', async () => {
      mockStorage.getPresignedDownloadUrl.mockResolvedValue(
        'https://example.com/presigned-download'
      );

      const result = await getDownloadUrl('uploads/file.pdf');

      expect(result).toBe('https://example.com/presigned-download');
      expect(mockStorage.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'uploads/file.pdf',
        undefined
      );
    });

    it('should pass options to presigned URL', async () => {
      mockStorage.getPresignedDownloadUrl.mockResolvedValue('https://example.com/url');

      await getDownloadUrl('uploads/file.pdf', { expiresIn: 7200 });

      expect(mockStorage.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'uploads/file.pdf',
        { expiresIn: 7200 }
      );
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      mockStorage.exists.mockResolvedValue(true);

      const result = await fileExists('uploads/existing.jpg');

      expect(result).toBe(true);
      expect(mockStorage.exists).toHaveBeenCalledWith('uploads/existing.jpg');
    });

    it('should return false when file does not exist', async () => {
      mockStorage.exists.mockResolvedValue(false);

      const result = await fileExists('uploads/nonexistent.jpg');

      expect(result).toBe(false);
    });
  });

  describe('getFileMetadata', () => {
    it('should return file metadata', async () => {
      const metadata = {
        contentType: 'image/jpeg',
        size: 1024,
        lastModified: new Date(),
      };
      mockStorage.getMetadata.mockResolvedValue(metadata);

      const result = await getFileMetadata('uploads/image.jpg');

      expect(result).toEqual(metadata);
      expect(mockStorage.getMetadata).toHaveBeenCalledWith('uploads/image.jpg');
    });
  });
});
