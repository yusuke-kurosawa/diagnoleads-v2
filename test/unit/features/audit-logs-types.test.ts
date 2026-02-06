/**
 * Audit Logs Types Tests
 *
 * Unit tests for audit log type definitions and schemas
 */

import { describe, expect, it } from 'vitest';
import {
  auditActionSchema,
  listAuditLogsSchema,
  getAuditLogSchema,
  exportAuditLogsSchema,
  type AuditAction,
  type AuditResource,
  type AuditLogEntry,
  type AuditContext,
  type CreateAuditLogInput,
} from '@/lib/features/audit-logs/types';

describe('AuditAction type', () => {
  it('should accept valid actions', () => {
    const actions: AuditAction[] = [
      'create',
      'read',
      'update',
      'delete',
      'login',
      'logout',
      'export',
    ];
    expect(actions).toHaveLength(7);
  });
});

describe('AuditResource type', () => {
  it('should accept valid resources', () => {
    const resources: AuditResource[] = [
      'lead',
      'organization',
      'user',
      'member',
      'webhook',
      'workflow',
      'report',
      'feature_flag',
      'settings',
      'api_key',
      'diagnostic_template',
      'tag',
      'filter',
      'custom_field',
    ];
    expect(resources).toHaveLength(14);
  });
});

describe('AuditLogEntry interface', () => {
  it('should create valid audit log entry', () => {
    const entry: AuditLogEntry = {
      id: 'log-123',
      organizationId: 'org-123',
      userId: 'user-123',
      action: 'create',
      resource: 'lead',
      resourceId: 'lead-456',
      changes: {
        before: null,
        after: { name: 'New Lead' },
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      metadata: { source: 'api' },
      createdAt: new Date(),
    };

    expect(entry.action).toBe('create');
    expect(entry.resource).toBe('lead');
    expect(entry.changes?.after).toEqual({ name: 'New Lead' });
  });

  it('should allow null for optional fields', () => {
    const entry: AuditLogEntry = {
      id: 'log-123',
      organizationId: 'org-123',
      userId: null,
      action: 'login',
      resource: 'user',
      resourceId: null,
      changes: null,
      ipAddress: null,
      userAgent: null,
      metadata: null,
      createdAt: new Date(),
    };

    expect(entry.userId).toBeNull();
    expect(entry.changes).toBeNull();
  });
});

describe('AuditContext interface', () => {
  it('should create valid audit context', () => {
    const context: AuditContext = {
      organizationId: 'org-123',
      userId: 'user-123',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    expect(context.organizationId).toBe('org-123');
  });

  it('should allow minimal context', () => {
    const context: AuditContext = {
      organizationId: 'org-123',
    };

    expect(context.userId).toBeUndefined();
  });
});

describe('CreateAuditLogInput interface', () => {
  it('should create valid input', () => {
    const input: CreateAuditLogInput = {
      action: 'update',
      resource: 'lead',
      resourceId: 'lead-123',
      changes: {
        before: { status: 'new' },
        after: { status: 'qualified' },
      },
      metadata: { reason: 'Manual update' },
    };

    expect(input.action).toBe('update');
    expect(input.changes?.before).toEqual({ status: 'new' });
  });
});

describe('auditActionSchema', () => {
  it('should accept valid actions', () => {
    expect(auditActionSchema.parse('create')).toBe('create');
    expect(auditActionSchema.parse('read')).toBe('read');
    expect(auditActionSchema.parse('update')).toBe('update');
    expect(auditActionSchema.parse('delete')).toBe('delete');
    expect(auditActionSchema.parse('login')).toBe('login');
    expect(auditActionSchema.parse('logout')).toBe('logout');
    expect(auditActionSchema.parse('export')).toBe('export');
  });

  it('should reject invalid actions', () => {
    expect(() => auditActionSchema.parse('invalid')).toThrow();
    expect(() => auditActionSchema.parse('')).toThrow();
    expect(() => auditActionSchema.parse('CREATE')).toThrow();
  });
});

describe('listAuditLogsSchema', () => {
  it('should accept minimal input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = listAuditLogsSchema.parse(input);
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
  });

  it('should accept full input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      action: 'create' as const,
      resource: 'lead',
      resourceId: 'lead-123',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
      limit: 25,
      offset: 10,
    };

    const result = listAuditLogsSchema.parse(input);
    expect(result.action).toBe('create');
    expect(result.resource).toBe('lead');
    expect(result.limit).toBe(25);
  });

  it('should validate organizationId', () => {
    const input = {
      organizationId: 'invalid-uuid',
    };

    expect(() => listAuditLogsSchema.parse(input)).toThrow();
  });

  it('should validate limit range', () => {
    const baseInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => listAuditLogsSchema.parse({ ...baseInput, limit: 0 })).toThrow();
    expect(() => listAuditLogsSchema.parse({ ...baseInput, limit: 101 })).toThrow();
  });

  it('should validate offset', () => {
    const baseInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => listAuditLogsSchema.parse({ ...baseInput, offset: -1 })).toThrow();
    expect(listAuditLogsSchema.parse({ ...baseInput, offset: 0 }).offset).toBe(0);
  });
});

describe('getAuditLogSchema', () => {
  it('should accept valid input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      id: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = getAuditLogSchema.parse(input);
    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174001');
  });

  it('should reject invalid UUIDs', () => {
    expect(() =>
      getAuditLogSchema.parse({
        organizationId: 'invalid',
        id: '123e4567-e89b-12d3-a456-426614174001',
      })
    ).toThrow();

    expect(() =>
      getAuditLogSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        id: 'invalid',
      })
    ).toThrow();
  });
});

describe('exportAuditLogsSchema', () => {
  it('should accept valid input with JSON format', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
    };

    const result = exportAuditLogsSchema.parse(input);
    expect(result.format).toBe('json'); // default
  });

  it('should accept CSV format', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
      format: 'csv' as const,
    };

    const result = exportAuditLogsSchema.parse(input);
    expect(result.format).toBe('csv');
  });

  it('should require startDate and endDate', () => {
    expect(() =>
      exportAuditLogsSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
      })
    ).toThrow();
  });

  it('should validate date format', () => {
    expect(() =>
      exportAuditLogsSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        startDate: 'invalid-date',
        endDate: '2024-12-31T23:59:59Z',
      })
    ).toThrow();
  });

  it('should reject invalid format', () => {
    expect(() =>
      exportAuditLogsSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        format: 'xml',
      })
    ).toThrow();
  });
});
