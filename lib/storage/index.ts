/**
 * Storage Module
 *
 * Provides file storage functionality with support for:
 * - AWS S3
 * - Cloudflare R2
 * - Local filesystem (development)
 *
 * @example
 * ```typescript
 * import {
 *   getStorage,
 *   uploadFile,
 *   downloadFile,
 *   getDownloadUrl,
 *   STORAGE_PATHS,
 *   FILE_SIZE_LIMITS,
 * } from '@/lib/storage';
 *
 * // Upload a file
 * const result = await uploadFile(
 *   STORAGE_PATHS.leadAttachment('org-1', 'lead-1', 'document.pdf'),
 *   fileBuffer,
 *   { contentType: 'application/pdf' }
 * );
 *
 * // Get download URL
 * const url = await getDownloadUrl(result.key, { expiresIn: 3600 });
 *
 * // Direct storage access
 * const storage = getStorage();
 * await storage.delete(result.key);
 *
 * // List files
 * const files = await storage.list({ prefix: 'organizations/org-1/' });
 * ```
 */

export * from './types';
export * from './client';
export * from './helpers';
