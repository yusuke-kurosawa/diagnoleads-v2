/**
 * Storage Client
 *
 * Unified storage client supporting S3, R2, and local filesystem
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  StorageConfig,
  FileMetadata,
  UploadOptions,
  DownloadOptions,
  PresignedUrlOptions,
  ListOptions,
  ListResult,
  UploadResult,
} from './types';

/**
 * Storage client interface
 */
export interface StorageClient {
  upload(
    key: string,
    data: Buffer | Uint8Array | string,
    options?: UploadOptions
  ): Promise<UploadResult>;
  download(key: string, options?: DownloadOptions): Promise<Buffer>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<FileMetadata | null>;
  list(options?: ListOptions): Promise<ListResult>;
  copy(sourceKey: string, destKey: string): Promise<void>;
  move(sourceKey: string, destKey: string): Promise<void>;
  getPresignedUploadUrl(key: string, options?: PresignedUrlOptions): Promise<string>;
  getPresignedDownloadUrl(key: string, options?: PresignedUrlOptions): Promise<string>;
  getPublicUrl(key: string): string;
}

/**
 * S3/R2 storage implementation
 */
class S3Storage implements StorageClient {
  private client: S3Client;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;

    const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region: config.region ?? 'auto',
    };

    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
    }

    if (config.accessKeyId && config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      };
    }

    this.client = new S3Client(clientConfig);
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array | string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: data,
      ContentType: options.contentType,
      Metadata: options.metadata,
      CacheControl: options.cacheControl,
      ContentDisposition: options.contentDisposition,
      ACL: options.acl,
    });

    const result = await this.client.send(command);

    return {
      key,
      bucket: this.config.bucket,
      etag: result.ETag,
      url: this.getPublicUrl(key),
    };
  }

  async download(key: string, _options: DownloadOptions = {}): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`File not found: ${key}`);
    }

    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        key,
        bucket: this.config.bucket,
        size: response.ContentLength ?? 0,
        contentType: response.ContentType ?? 'application/octet-stream',
        lastModified: response.LastModified ?? new Date(),
        etag: response.ETag,
        metadata: response.Metadata,
      };
    } catch {
      return null;
    }
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    const command = new ListObjectsV2Command({
      Bucket: this.config.bucket,
      Prefix: options.prefix,
      Delimiter: options.delimiter,
      MaxKeys: options.maxKeys,
      ContinuationToken: options.continuationToken,
    });

    const response = await this.client.send(command);

    const files: FileMetadata[] = (response.Contents ?? []).map((obj) => ({
      key: obj.Key ?? '',
      bucket: this.config.bucket,
      size: obj.Size ?? 0,
      contentType: 'application/octet-stream',
      lastModified: obj.LastModified ?? new Date(),
      etag: obj.ETag,
    }));

    const prefixes = (response.CommonPrefixes ?? []).map((p) => p.Prefix ?? '');

    return {
      files,
      prefixes,
      isTruncated: response.IsTruncated ?? false,
      continuationToken: response.NextContinuationToken,
    };
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.config.bucket,
      CopySource: `${this.config.bucket}/${sourceKey}`,
      Key: destKey,
    });

    await this.client.send(command);
  }

  async move(sourceKey: string, destKey: string): Promise<void> {
    await this.copy(sourceKey, destKey);
    await this.delete(sourceKey);
  }

  async getPresignedUploadUrl(key: string, options: PresignedUrlOptions = {}): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ContentType: options.contentType,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn ?? 3600,
    });
  }

  async getPresignedDownloadUrl(key: string, options: PresignedUrlOptions = {}): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ResponseContentDisposition: options.contentDisposition,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn ?? 3600,
    });
  }

  getPublicUrl(key: string): string {
    if (this.config.publicUrl) {
      return `${this.config.publicUrl}/${key}`;
    }

    if (this.config.provider === 'r2' && this.config.endpoint) {
      return `${this.config.endpoint}/${this.config.bucket}/${key}`;
    }

    return `https://${this.config.bucket}.s3.${this.config.region ?? 'us-east-1'}.amazonaws.com/${key}`;
  }
}

/**
 * Local storage implementation (for development)
 */
class LocalStorage implements StorageClient {
  private basePath: string;
  private files = new Map<string, { data: Buffer; metadata: FileMetadata }>();

  constructor(basePath = '/tmp/storage') {
    this.basePath = basePath;
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array | string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const buffer = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);

    const metadata: FileMetadata = {
      key,
      bucket: 'local',
      size: buffer.length,
      contentType: options.contentType ?? 'application/octet-stream',
      lastModified: new Date(),
      metadata: options.metadata,
    };

    this.files.set(key, { data: buffer, metadata });

    return {
      key,
      bucket: 'local',
      url: this.getPublicUrl(key),
    };
  }

  async download(key: string): Promise<Buffer> {
    const file = this.files.get(key);
    if (!file) {
      throw new Error(`File not found: ${key}`);
    }
    return file.data;
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.files.delete(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    return this.files.has(key);
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    const file = this.files.get(key);
    return file?.metadata ?? null;
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    let files = Array.from(this.files.values()).map((f) => f.metadata);

    if (options.prefix) {
      files = files.filter((f) => f.key.startsWith(options.prefix!));
    }

    if (options.maxKeys) {
      files = files.slice(0, options.maxKeys);
    }

    return {
      files,
      prefixes: [],
      isTruncated: false,
    };
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    const file = this.files.get(sourceKey);
    if (!file) {
      throw new Error(`File not found: ${sourceKey}`);
    }

    this.files.set(destKey, {
      data: file.data,
      metadata: { ...file.metadata, key: destKey },
    });
  }

  async move(sourceKey: string, destKey: string): Promise<void> {
    await this.copy(sourceKey, destKey);
    await this.delete(sourceKey);
  }

  async getPresignedUploadUrl(key: string): Promise<string> {
    return `${this.basePath}/${key}?upload=true`;
  }

  async getPresignedDownloadUrl(key: string): Promise<string> {
    return `${this.basePath}/${key}`;
  }

  getPublicUrl(key: string): string {
    return `${this.basePath}/${key}`;
  }

  clear(): void {
    this.files.clear();
  }
}

/**
 * Create storage client based on configuration
 */
export function createStorageClient(config?: Partial<StorageConfig>): StorageClient {
  const provider =
    config?.provider ?? (process.env.STORAGE_PROVIDER as StorageConfig['provider']) ?? 'local';

  if (provider === 'local') {
    return new LocalStorage(config?.bucket ?? '/tmp/storage');
  }

  const fullConfig: StorageConfig = {
    provider,
    bucket: config?.bucket ?? process.env.STORAGE_BUCKET ?? '',
    region: config?.region ?? process.env.STORAGE_REGION ?? 'auto',
    endpoint: config?.endpoint ?? process.env.STORAGE_ENDPOINT,
    accessKeyId: config?.accessKeyId ?? process.env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: config?.secretAccessKey ?? process.env.STORAGE_SECRET_ACCESS_KEY,
    publicUrl: config?.publicUrl ?? process.env.STORAGE_PUBLIC_URL,
  };

  if (!fullConfig.bucket) {
    console.warn('[Storage] No bucket configured, using local storage');
    return new LocalStorage();
  }

  return new S3Storage(fullConfig);
}

// Singleton instance
let storageInstance: StorageClient | null = null;

/**
 * Get the storage client instance (singleton)
 */
export function getStorage(): StorageClient {
  if (!storageInstance) {
    storageInstance = createStorageClient();
  }
  return storageInstance;
}

/**
 * Reset storage instance (for testing)
 */
export function resetStorageInstance(): void {
  storageInstance = null;
}

// Export LocalStorage for testing
export { LocalStorage };
