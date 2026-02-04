/**
 * Storage Helpers
 *
 * Utility functions for file storage operations
 */

import { getStorage } from './client';
import type { UploadOptions, PresignedUrlOptions } from './types';
import { ALLOWED_FILE_TYPES, FILE_SIZE_LIMITS } from './types';

/**
 * Generate a unique file key
 */
export function generateFileKey(prefix: string, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = getFileExtension(filename);
  const safeName = sanitizeFilename(filename);

  return `${prefix}/${timestamp}-${random}-${safeName}${ext ? `.${ext}` : ''}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

  // Replace unsafe characters
  return nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * Get content type from filename
 */
export function getContentType(filename: string): string {
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

/**
 * Validate file type
 */
export function validateFileType(
  contentType: string,
  allowedTypes: readonly string[] = ALLOWED_FILE_TYPES.all
): boolean {
  return allowedTypes.includes(contentType);
}

/**
 * Validate file size
 */
export function validateFileSize(
  size: number,
  maxSize: number = FILE_SIZE_LIMITS.default
): boolean {
  return size <= maxSize;
}

/**
 * Validate file for upload
 */
export function validateFile(
  file: { contentType: string; size: number },
  options: {
    allowedTypes?: readonly string[];
    maxSize?: number;
  } = {}
): { valid: boolean; error?: string } {
  const { allowedTypes = ALLOWED_FILE_TYPES.all, maxSize = FILE_SIZE_LIMITS.default } = options;

  if (!validateFileType(file.contentType, allowedTypes)) {
    return {
      valid: false,
      error: `File type not allowed: ${file.contentType}`,
    };
  }

  if (!validateFileSize(file.size, maxSize)) {
    return {
      valid: false,
      error: `File too large: ${formatFileSize(file.size)} (max: ${formatFileSize(maxSize)})`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Upload a file with validation
 */
export async function uploadFile(
  key: string,
  data: Buffer | Uint8Array | string,
  options: UploadOptions & {
    allowedTypes?: readonly string[];
    maxSize?: number;
  } = {}
): Promise<{ key: string; url: string }> {
  const storage = getStorage();
  const buffer = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);

  const contentType = options.contentType ?? 'application/octet-stream';
  const validation = validateFile(
    { contentType, size: buffer.length },
    { allowedTypes: options.allowedTypes, maxSize: options.maxSize }
  );

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const result = await storage.upload(key, buffer, options);

  return {
    key: result.key,
    url: result.url,
  };
}

/**
 * Download a file
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const storage = getStorage();
  return storage.download(key);
}

/**
 * Delete a file
 */
export async function deleteFile(key: string): Promise<void> {
  const storage = getStorage();
  return storage.delete(key);
}

/**
 * Get presigned upload URL
 */
export async function getUploadUrl(
  key: string,
  options?: PresignedUrlOptions
): Promise<{ url: string; key: string }> {
  const storage = getStorage();
  const url = await storage.getPresignedUploadUrl(key, options);
  return { url, key };
}

/**
 * Get presigned download URL
 */
export async function getDownloadUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
  const storage = getStorage();
  return storage.getPresignedDownloadUrl(key, options);
}

/**
 * Check if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  const storage = getStorage();
  return storage.exists(key);
}

/**
 * Get file metadata
 */
export async function getFileMetadata(key: string) {
  const storage = getStorage();
  return storage.getMetadata(key);
}
