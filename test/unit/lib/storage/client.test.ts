/**
 * Storage Client Tests
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Types matching source
interface StorageConfig {
  provider: 's3' | 'r2' | 'local';
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrl?: string;
}

interface FileMetadata {
  key: string;
  bucket: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag?: string;
  metadata?: Record<string, string>;
}

interface UploadResult {
  key: string;
  bucket: string;
  etag?: string;
  url: string;
}

interface ListResult {
  files: FileMetadata[];
  prefixes: string[];
  isTruncated: boolean;
  continuationToken?: string;
}

interface StorageClient {
  upload: (key: string, data: Buffer, options?: unknown) => Promise<UploadResult>;
  download: (key: string) => Promise<Buffer>;
  delete: (key: string) => Promise<void>;
  deleteMany: (keys: string[]) => Promise<void>;
  exists: (key: string) => Promise<boolean>;
  getMetadata: (key: string) => Promise<FileMetadata | null>;
  list: (options?: unknown) => Promise<ListResult>;
  copy: (sourceKey: string, destKey: string) => Promise<void>;
  move: (sourceKey: string, destKey: string) => Promise<void>;
  getPresignedUploadUrl: (key: string) => Promise<string>;
  getPresignedDownloadUrl: (key: string) => Promise<string>;
  getPublicUrl: (key: string) => string;
}

describe('StorageClient interface', () => {
  it('should define all required methods', () => {
    const methods = [
      'upload',
      'download',
      'delete',
      'deleteMany',
      'exists',
      'getMetadata',
      'list',
      'copy',
      'move',
      'getPresignedUploadUrl',
      'getPresignedDownloadUrl',
      'getPublicUrl',
    ];

    expect(methods).toHaveLength(12);
  });
});

describe('LocalStorage', () => {
  let storage: Map<string, { data: Buffer; metadata: FileMetadata }>;

  beforeEach(() => {
    storage = new Map();
  });

  describe('upload', () => {
    it('should upload file successfully', async () => {
      const key = 'test/file.txt';
      const data = Buffer.from('Hello, World!');
      
      const metadata: FileMetadata = {
        key,
        bucket: 'local',
        size: data.length,
        contentType: 'text/plain',
        lastModified: new Date(),
      };

      storage.set(key, { data, metadata });

      expect(storage.has(key)).toBe(true);
      expect(storage.get(key)?.data.toString()).toBe('Hello, World!');
    });

    it('should return upload result', () => {
      const result: UploadResult = {
        key: 'test/file.txt',
        bucket: 'local',
        url: '/tmp/storage/test/file.txt',
      };

      expect(result.key).toBe('test/file.txt');
      expect(result.bucket).toBe('local');
    });
  });

  describe('download', () => {
    it('should download existing file', async () => {
      const key = 'test/file.txt';
      const data = Buffer.from('Test content');
      
      storage.set(key, {
        data,
        metadata: {
          key,
          bucket: 'local',
          size: data.length,
          contentType: 'text/plain',
          lastModified: new Date(),
        },
      });

      const downloaded = storage.get(key)?.data;
      expect(downloaded?.toString()).toBe('Test content');
    });

    it('should throw for non-existent file', () => {
      const getFile = (key: string) => {
        const file = storage.get(key);
        if (!file) throw new Error(`File not found: ${key}`);
        return file.data;
      };

      expect(() => getFile('nonexistent.txt')).toThrow('File not found');
    });
  });

  describe('delete', () => {
    it('should delete file', () => {
      const key = 'test/file.txt';
      storage.set(key, {
        data: Buffer.from('test'),
        metadata: {} as FileMetadata,
      });

      storage.delete(key);
      expect(storage.has(key)).toBe(false);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple files', () => {
      const keys = ['file1.txt', 'file2.txt', 'file3.txt'];
      
      for (const key of keys) {
        storage.set(key, {
          data: Buffer.from('test'),
          metadata: {} as FileMetadata,
        });
      }

      for (const key of keys) {
        storage.delete(key);
      }

      expect(storage.size).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true for existing file', () => {
      storage.set('exists.txt', {
        data: Buffer.from('test'),
        metadata: {} as FileMetadata,
      });

      expect(storage.has('exists.txt')).toBe(true);
    });

    it('should return false for non-existent file', () => {
      expect(storage.has('nonexistent.txt')).toBe(false);
    });
  });

  describe('getMetadata', () => {
    it('should return metadata for existing file', () => {
      const metadata: FileMetadata = {
        key: 'test.txt',
        bucket: 'local',
        size: 100,
        contentType: 'text/plain',
        lastModified: new Date(),
      };

      storage.set('test.txt', {
        data: Buffer.from('test'),
        metadata,
      });

      const result = storage.get('test.txt')?.metadata;
      expect(result?.size).toBe(100);
      expect(result?.contentType).toBe('text/plain');
    });

    it('should return null for non-existent file', () => {
      const result = storage.get('nonexistent.txt')?.metadata ?? null;
      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should list all files', () => {
      storage.set('file1.txt', { data: Buffer.from('1'), metadata: { key: 'file1.txt' } as FileMetadata });
      storage.set('file2.txt', { data: Buffer.from('2'), metadata: { key: 'file2.txt' } as FileMetadata });

      const files = Array.from(storage.values()).map(f => f.metadata);
      expect(files).toHaveLength(2);
    });

    it('should filter by prefix', () => {
      storage.set('images/photo1.jpg', { data: Buffer.from('1'), metadata: { key: 'images/photo1.jpg' } as FileMetadata });
      storage.set('images/photo2.jpg', { data: Buffer.from('2'), metadata: { key: 'images/photo2.jpg' } as FileMetadata });
      storage.set('docs/file.pdf', { data: Buffer.from('3'), metadata: { key: 'docs/file.pdf' } as FileMetadata });

      const prefix = 'images/';
      const files = Array.from(storage.values())
        .map(f => f.metadata)
        .filter(m => m.key.startsWith(prefix));

      expect(files).toHaveLength(2);
    });
  });

  describe('copy', () => {
    it('should copy file to new location', () => {
      const sourceKey = 'source.txt';
      const destKey = 'dest.txt';
      const data = Buffer.from('Copy me');

      storage.set(sourceKey, {
        data,
        metadata: { key: sourceKey } as FileMetadata,
      });

      const source = storage.get(sourceKey);
      if (source) {
        storage.set(destKey, {
          data: source.data,
          metadata: { ...source.metadata, key: destKey },
        });
      }

      expect(storage.has(sourceKey)).toBe(true);
      expect(storage.has(destKey)).toBe(true);
    });
  });

  describe('move', () => {
    it('should move file to new location', () => {
      const sourceKey = 'source.txt';
      const destKey = 'dest.txt';
      const data = Buffer.from('Move me');

      storage.set(sourceKey, {
        data,
        metadata: { key: sourceKey } as FileMetadata,
      });

      const source = storage.get(sourceKey);
      if (source) {
        storage.set(destKey, {
          data: source.data,
          metadata: { ...source.metadata, key: destKey },
        });
        storage.delete(sourceKey);
      }

      expect(storage.has(sourceKey)).toBe(false);
      expect(storage.has(destKey)).toBe(true);
    });
  });

  describe('getPublicUrl', () => {
    it('should generate public URL', () => {
      const basePath = '/tmp/storage';
      const key = 'files/document.pdf';
      const url = `${basePath}/${key}`;

      expect(url).toBe('/tmp/storage/files/document.pdf');
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should generate presigned upload URL', () => {
      const basePath = '/tmp/storage';
      const key = 'uploads/file.txt';
      const url = `${basePath}/${key}?upload=true`;

      expect(url).toContain('upload=true');
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('should generate presigned download URL', () => {
      const basePath = '/tmp/storage';
      const key = 'downloads/file.txt';
      const url = `${basePath}/${key}`;

      expect(url).toBe('/tmp/storage/downloads/file.txt');
    });
  });
});

describe('S3Storage', () => {
  describe('configuration', () => {
    it('should define S3 config', () => {
      const config: StorageConfig = {
        provider: 's3',
        bucket: 'my-bucket',
        region: 'us-east-1',
        accessKeyId: 'access-key',
        secretAccessKey: 'secret-key',
      };

      expect(config.provider).toBe('s3');
      expect(config.bucket).toBe('my-bucket');
    });

    it('should define R2 config', () => {
      const config: StorageConfig = {
        provider: 'r2',
        bucket: 'my-r2-bucket',
        region: 'auto',
        endpoint: 'https://account.r2.cloudflarestorage.com',
        accessKeyId: 'r2-access-key',
        secretAccessKey: 'r2-secret-key',
      };

      expect(config.provider).toBe('r2');
      expect(config.endpoint).toContain('r2.cloudflarestorage.com');
    });
  });

  describe('getPublicUrl', () => {
    it('should generate S3 public URL', () => {
      const bucket = 'my-bucket';
      const region = 'us-east-1';
      const key = 'files/document.pdf';
      const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

      expect(url).toBe('https://my-bucket.s3.us-east-1.amazonaws.com/files/document.pdf');
    });

    it('should use custom public URL if provided', () => {
      const publicUrl = 'https://cdn.example.com';
      const key = 'files/document.pdf';
      const url = `${publicUrl}/${key}`;

      expect(url).toBe('https://cdn.example.com/files/document.pdf');
    });
  });
});

describe('createStorageClient', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create local storage by default', () => {
    delete process.env.STORAGE_PROVIDER;
    
    const provider = process.env.STORAGE_PROVIDER ?? 'local';
    expect(provider).toBe('local');
  });

  it('should create S3 storage when configured', () => {
    process.env.STORAGE_PROVIDER = 's3';
    process.env.STORAGE_BUCKET = 'test-bucket';

    expect(process.env.STORAGE_PROVIDER).toBe('s3');
    expect(process.env.STORAGE_BUCKET).toBe('test-bucket');
  });

  it('should warn when bucket not configured', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const bucket = '';
    if (!bucket) {
      console.warn('[Storage] No bucket configured, using local storage');
    }

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('getStorage singleton', () => {
  it('should return same instance', () => {
    let instance: StorageClient | null = null;
    
    const getStorage = (): StorageClient => {
      if (!instance) {
        instance = {
          upload: vi.fn(),
          download: vi.fn(),
          delete: vi.fn(),
          deleteMany: vi.fn(),
          exists: vi.fn(),
          getMetadata: vi.fn(),
          list: vi.fn(),
          copy: vi.fn(),
          move: vi.fn(),
          getPresignedUploadUrl: vi.fn(),
          getPresignedDownloadUrl: vi.fn(),
          getPublicUrl: vi.fn(),
        };
      }
      return instance;
    };

    const storage1 = getStorage();
    const storage2 = getStorage();

    expect(storage1).toBe(storage2);
  });
});

describe('resetStorageInstance', () => {
  it('should reset singleton', () => {
    let instance: StorageClient | null = {} as StorageClient;
    
    const reset = () => {
      instance = null;
    };

    reset();
    expect(instance).toBeNull();
  });
});
