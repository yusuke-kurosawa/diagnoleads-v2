/**
 * Audit Logs Service
 *
 * Service for recording and querying audit logs
 */

import { db } from '@/lib/db/client';
import { auditLogs } from '@/lib/db/schema';
import type { AuditAction, AuditContext, CreateAuditLogInput } from './types';

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  context: AuditContext,
  input: CreateAuditLogInput
): Promise<void> {
  await db.insert(auditLogs).values({
    organizationId: context.organizationId,
    userId: context.userId,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId,
    changes: input.changes,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: input.metadata,
  });
}

/**
 * Log a create action
 */
export async function logCreate(
  context: AuditContext,
  resource: string,
  resourceId: string,
  data: unknown
): Promise<void> {
  await createAuditLog(context, {
    action: 'create',
    resource,
    resourceId,
    changes: { after: data },
  });
}

/**
 * Log an update action
 */
export async function logUpdate(
  context: AuditContext,
  resource: string,
  resourceId: string,
  before: unknown,
  after: unknown
): Promise<void> {
  await createAuditLog(context, {
    action: 'update',
    resource,
    resourceId,
    changes: { before, after },
  });
}

/**
 * Log a delete action
 */
export async function logDelete(
  context: AuditContext,
  resource: string,
  resourceId: string,
  data: unknown
): Promise<void> {
  await createAuditLog(context, {
    action: 'delete',
    resource,
    resourceId,
    changes: { before: data },
  });
}

/**
 * Log a read/view action (for sensitive data access)
 */
export async function logRead(
  context: AuditContext,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog(context, {
    action: 'read',
    resource,
    resourceId,
    metadata,
  });
}

/**
 * Log an export action
 */
export async function logExport(
  context: AuditContext,
  resource: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await createAuditLog(context, {
    action: 'export',
    resource,
    metadata,
  });
}

/**
 * Log a login action
 */
export async function logLogin(
  context: AuditContext,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog(context, {
    action: 'login',
    resource: 'session',
    metadata,
  });
}

/**
 * Log a logout action
 */
export async function logLogout(
  context: AuditContext,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog(context, {
    action: 'logout',
    resource: 'session',
    metadata,
  });
}

/**
 * Compute diff between two objects (for audit changes)
 */
export function computeChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): { field: string; before: unknown; after: unknown }[] {
  const changes: { field: string; before: unknown; after: unknown }[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const beforeVal = before[key];
    const afterVal = after[key];

    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changes.push({
        field: key,
        before: beforeVal,
        after: afterVal,
      });
    }
  }

  return changes;
}

/**
 * Sanitize sensitive fields from audit data
 */
export function sanitizeForAudit(
  data: Record<string, unknown>,
  sensitiveFields: string[] = [
    'password',
    'secret',
    'token',
    'apiKey',
    'accessToken',
    'refreshToken',
  ]
): Record<string, unknown> {
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Format audit log for display
 */
export function formatAuditAction(action: AuditAction, resource: string): string {
  const actionLabels: Record<AuditAction, string> = {
    create: 'Created',
    read: 'Viewed',
    update: 'Updated',
    delete: 'Deleted',
    login: 'Logged in',
    logout: 'Logged out',
    export: 'Exported',
  };

  return `${actionLabels[action]} ${resource}`;
}

/**
 * Convert audit logs to CSV format
 */
export function auditLogsToCSV(
  logs: Array<{
    id: string;
    action: string;
    resource: string;
    resourceId: string | null;
    userId: string | null;
    ipAddress: string | null;
    createdAt: Date;
  }>
): string {
  const headers = ['ID', 'Action', 'Resource', 'Resource ID', 'User ID', 'IP Address', 'Timestamp'];
  const rows = logs.map((log) => [
    log.id,
    log.action,
    log.resource,
    log.resourceId || '',
    log.userId || '',
    log.ipAddress || '',
    log.createdAt.toISOString(),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return csvContent;
}
