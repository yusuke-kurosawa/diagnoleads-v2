/**
 * Storage Types
 *
 * Type definitions for the file storage system
 */

/**
 * Storage provider type
 */
export type StorageProvider = 's3' | 'r2' | 'local';

/**
 * Storage configuration
 */
export interface StorageConfig {
  provider: StorageProvider;
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrl?: string;
}

/**
 * File metadata
 */
export interface FileMetadata {
  key: string;
  bucket: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag?: string;
  metadata?: Record<string, string>;
}

/**
 * Upload options
 */
export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read';
  cacheControl?: string;
  contentDisposition?: string;
}

/**
 * Download options
 */
export interface DownloadOptions {
  range?: { start: number; end: number };
}

/**
 * Presigned URL options
 */
export interface PresignedUrlOptions {
  expiresIn?: number;
  contentType?: string;
  contentDisposition?: string;
}

/**
 * List options
 */
export interface ListOptions {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
}

/**
 * List result
 */
export interface ListResult {
  files: FileMetadata[];
  prefixes: string[];
  isTruncated: boolean;
  continuationToken?: string;
}

/**
 * Upload result
 */
export interface UploadResult {
  key: string;
  bucket: string;
  etag?: string;
  url: string;
}

/**
 * Storage paths helpers
 */
export const STORAGE_PATHS = {
  // Lead attachments
  leadAttachment: (orgId: string, leadId: string, filename: string) =>
    `organizations/${orgId}/leads/${leadId}/attachments/${filename}`,

  // Organization files
  organizationLogo: (orgId: string, filename: string) =>
    `organizations/${orgId}/branding/${filename}`,

  // User files
  userAvatar: (userId: string, filename: string) => `users/${userId}/avatar/${filename}`,

  // Exports
  exportFile: (orgId: string, type: string, filename: string) =>
    `organizations/${orgId}/exports/${type}/${filename}`,

  // Reports
  reportFile: (orgId: string, reportId: string, filename: string) =>
    `organizations/${orgId}/reports/${reportId}/${filename}`,

  // Diagnostic forms
  diagnosticAsset: (formId: string, filename: string) => `diagnostics/${formId}/assets/${filename}`,

  // Temporary files
  tempFile: (filename: string) => `temp/${filename}`,
} as const;

/**
 * Allowed file types
 */
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
  ],
  all: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'application/zip',
  ],
} as const;

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  avatar: 5 * 1024 * 1024, // 5MB
  logo: 10 * 1024 * 1024, // 10MB
  attachment: 25 * 1024 * 1024, // 25MB
  export: 100 * 1024 * 1024, // 100MB
  default: 50 * 1024 * 1024, // 50MB
} as const;
