/**
 * Audit Logs Module
 *
 * Provides audit logging functionality for compliance and debugging
 *
 * @example
 * ```typescript
 * import { logCreate, logUpdate, logDelete } from '@/lib/features/audit-logs';
 *
 * // Log a create action
 * await logCreate(
 *   { organizationId: 'org-123', userId: 'user-456' },
 *   'lead',
 *   'lead-789',
 *   { email: 'test@example.com', name: 'Test' }
 * );
 *
 * // Log an update action
 * await logUpdate(
 *   { organizationId: 'org-123', userId: 'user-456' },
 *   'lead',
 *   'lead-789',
 *   { status: 'new' },
 *   { status: 'contacted' }
 * );
 * ```
 */

export * from './types';
export * from './service';
export { auditLogsRouter } from './api/router';
