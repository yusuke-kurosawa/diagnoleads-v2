/**
 * Audit Logs Tests
 *
 * Unit tests for the audit logging service
 */

import { describe, expect, it } from 'vitest';
import {
  computeChanges,
  sanitizeForAudit,
  formatAuditAction,
  auditLogsToCSV,
} from '@/lib/features/audit-logs/service';
import type { AuditAction } from '@/lib/features/audit-logs/types';

describe('Audit Logs Service', () => {
  describe('computeChanges', () => {
    it('should detect added fields', () => {
      const before = { name: 'Test' };
      const after = { name: 'Test', email: 'test@example.com' };

      const changes = computeChanges(before, after);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        field: 'email',
        before: undefined,
        after: 'test@example.com',
      });
    });

    it('should detect removed fields', () => {
      const before = { name: 'Test', email: 'test@example.com' };
      const after = { name: 'Test' };

      const changes = computeChanges(before, after);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        field: 'email',
        before: 'test@example.com',
        after: undefined,
      });
    });

    it('should detect modified fields', () => {
      const before = { name: 'Test', status: 'new' };
      const after = { name: 'Test', status: 'contacted' };

      const changes = computeChanges(before, after);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        field: 'status',
        before: 'new',
        after: 'contacted',
      });
    });

    it('should return empty array for identical objects', () => {
      const before = { name: 'Test', status: 'new' };
      const after = { name: 'Test', status: 'new' };

      const changes = computeChanges(before, after);

      expect(changes).toHaveLength(0);
    });

    it('should detect multiple changes', () => {
      const before = { name: 'Old Name', score: 50 };
      const after = { name: 'New Name', score: 75 };

      const changes = computeChanges(before, after);

      expect(changes).toHaveLength(2);
      expect(changes.find((c) => c.field === 'name')).toEqual({
        field: 'name',
        before: 'Old Name',
        after: 'New Name',
      });
      expect(changes.find((c) => c.field === 'score')).toEqual({
        field: 'score',
        before: 50,
        after: 75,
      });
    });

    it('should handle nested objects', () => {
      const before = { settings: { theme: 'light' } };
      const after = { settings: { theme: 'dark' } };

      const changes = computeChanges(before, after);

      expect(changes).toHaveLength(1);
      expect(changes[0].field).toBe('settings');
    });
  });

  describe('sanitizeForAudit', () => {
    it('should redact sensitive fields', () => {
      const data = {
        email: 'test@example.com',
        password: 'secret123',
        name: 'Test User',
      };

      const sanitized = sanitizeForAudit(data);

      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.name).toBe('Test User');
    });

    it('should redact multiple sensitive fields', () => {
      const data = {
        apiKey: 'key123',
        secret: 'secret456',
        token: 'token789',
        name: 'Test',
      };

      const sanitized = sanitizeForAudit(data);

      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.secret).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.name).toBe('Test');
    });

    it('should not modify original object', () => {
      const data = { password: 'secret' };
      sanitizeForAudit(data);

      expect(data.password).toBe('secret');
    });

    it('should handle empty objects', () => {
      const sanitized = sanitizeForAudit({});
      expect(sanitized).toEqual({});
    });

    it('should use custom sensitive fields list', () => {
      const data = {
        customSecret: 'secret123',
        name: 'Test',
      };

      const sanitized = sanitizeForAudit(data, ['customSecret']);

      expect(sanitized.customSecret).toBe('[REDACTED]');
      expect(sanitized.name).toBe('Test');
    });
  });

  describe('formatAuditAction', () => {
    it('should format create action', () => {
      const result = formatAuditAction('create', 'lead');
      expect(result).toBe('Created lead');
    });

    it('should format update action', () => {
      const result = formatAuditAction('update', 'organization');
      expect(result).toBe('Updated organization');
    });

    it('should format delete action', () => {
      const result = formatAuditAction('delete', 'webhook');
      expect(result).toBe('Deleted webhook');
    });

    it('should format read action', () => {
      const result = formatAuditAction('read', 'report');
      expect(result).toBe('Viewed report');
    });

    it('should format login action', () => {
      const result = formatAuditAction('login', 'session');
      expect(result).toBe('Logged in session');
    });

    it('should format logout action', () => {
      const result = formatAuditAction('logout', 'session');
      expect(result).toBe('Logged out session');
    });

    it('should format export action', () => {
      const result = formatAuditAction('export', 'leads');
      expect(result).toBe('Exported leads');
    });
  });

  describe('auditLogsToCSV', () => {
    it('should convert logs to CSV format', () => {
      const logs = [
        {
          id: 'log-1',
          action: 'create',
          resource: 'lead',
          resourceId: 'lead-1',
          userId: 'user-1',
          ipAddress: '192.168.1.1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
      ];

      const csv = auditLogsToCSV(logs);

      expect(csv).toContain('ID,Action,Resource,Resource ID,User ID,IP Address,Timestamp');
      expect(csv).toContain('log-1,create,lead,lead-1,user-1,192.168.1.1');
    });

    it('should handle null values', () => {
      const logs = [
        {
          id: 'log-1',
          action: 'read',
          resource: 'report',
          resourceId: null,
          userId: null,
          ipAddress: null,
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
      ];

      const csv = auditLogsToCSV(logs);

      expect(csv).toContain('log-1,read,report,,,');
    });

    it('should handle multiple logs', () => {
      const logs = [
        {
          id: 'log-1',
          action: 'create',
          resource: 'lead',
          resourceId: 'lead-1',
          userId: 'user-1',
          ipAddress: '192.168.1.1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'log-2',
          action: 'update',
          resource: 'lead',
          resourceId: 'lead-1',
          userId: 'user-1',
          ipAddress: '192.168.1.1',
          createdAt: new Date('2024-01-01T11:00:00Z'),
        },
      ];

      const csv = auditLogsToCSV(logs);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(3); // header + 2 rows
    });

    it('should handle empty logs array', () => {
      const csv = auditLogsToCSV([]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(1); // only header
      expect(lines[0]).toContain('ID,Action,Resource');
    });
  });
});

describe('Audit Logs Types', () => {
  describe('AuditAction type', () => {
    it('should have all expected action types', () => {
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
});
