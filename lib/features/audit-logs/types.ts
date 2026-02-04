/**
 * Audit Logs Types
 *
 * Type definitions for the audit logging system
 */

import { z } from 'zod';

/**
 * Audit action types
 */
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export';

/**
 * Resource types that can be audited
 */
export type AuditResource =
  | 'lead'
  | 'organization'
  | 'user'
  | 'member'
  | 'webhook'
  | 'workflow'
  | 'report'
  | 'feature_flag'
  | 'settings'
  | 'api_key'
  | 'diagnostic_template'
  | 'tag'
  | 'filter'
  | 'custom_field';

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  organizationId: string;
  userId: string | null;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  changes: {
    before?: unknown;
    after?: unknown;
  } | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * Audit log context for creating entries
 */
export interface AuditContext {
  organizationId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Input for creating an audit log
 */
export interface CreateAuditLogInput {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  changes?: {
    before?: unknown;
    after?: unknown;
  };
  metadata?: Record<string, unknown>;
}

// Zod schemas
export const auditActionSchema = z.enum([
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'export',
]);

export const listAuditLogsSchema = z.object({
  organizationId: z.string().uuid(),
  action: auditActionSchema.optional(),
  resource: z.string().optional(),
  resourceId: z.string().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const getAuditLogSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

export const exportAuditLogsSchema = z.object({
  organizationId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  format: z.enum(['json', 'csv']).default('json'),
});

export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;
export type GetAuditLogInput = z.infer<typeof getAuditLogSchema>;
export type ExportAuditLogsInput = z.infer<typeof exportAuditLogsSchema>;
