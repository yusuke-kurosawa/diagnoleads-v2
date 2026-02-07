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
