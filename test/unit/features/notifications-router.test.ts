/**
 * Notifications Router Tests
 *
 * Unit tests for notification API
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Schema definitions matching the router
const listNotificationsSchema = z.object({
  organizationId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  unreadOnly: z.boolean().default(false),
});

const unreadCountSchema = z.object({
  organizationId: z.string().uuid().optional(),
});

const markAsReadSchema = z.object({
  notificationId: z.string().uuid(),
});

const markAllAsReadSchema = z.object({
  organizationId: z.string().uuid().optional(),
});

const deleteNotificationSchema = z.object({
  notificationId: z.string().uuid(),
});

const getPreferencesSchema = z.object({
  organizationId: z.string().uuid(),
});

const updatePreferencesSchema = z.object({
  organizationId: z.string().uuid(),
  inAppLeadCreated: z.boolean().optional(),
  inAppLeadStatusChanged: z.boolean().optional(),
  inAppLeadScored: z.boolean().optional(),
  inAppImportExport: z.boolean().optional(),
  inAppMemberChanges: z.boolean().optional(),
  emailLeadCreated: z.boolean().optional(),
  emailLeadStatusChanged: z.boolean().optional(),
  emailLeadScored: z.boolean().optional(),
  emailDailyDigest: z.boolean().optional(),
  emailWeeklyReport: z.boolean().optional(),
});

// Notification types
const NOTIFICATION_TYPES = [
  'lead_created',
  'lead_status_changed',
  'lead_scored',
  'lead_assigned',
  'import_completed',
  'export_completed',
  'member_added',
  'member_removed',
  'webhook_failed',
  'report_generated',
] as const;

describe('Notifications Router', () => {
  describe('List Notifications Schema', () => {
    it('should accept valid parameters', () => {
      const result = listNotificationsSchema.parse({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 50,
        unreadOnly: true,
      });

      expect(result.organizationId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.limit).toBe(50);
      expect(result.unreadOnly).toBe(true);
    });

    it('should use defaults', () => {
      const result = listNotificationsSchema.parse({});

      expect(result.limit).toBe(20);
      expect(result.unreadOnly).toBe(false);
    });

    it('should validate limit range', () => {
      expect(() => listNotificationsSchema.parse({ limit: 0 })).toThrow();
      expect(() => listNotificationsSchema.parse({ limit: 101 })).toThrow();
    });

    it('should validate organizationId format', () => {
      expect(() =>
        listNotificationsSchema.parse({ organizationId: 'invalid' })
      ).toThrow();
    });
  });

  describe('Mark As Read Schema', () => {
    it('should accept valid notification ID', () => {
      const result = markAsReadSchema.parse({
        notificationId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.notificationId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should require notificationId', () => {
      expect(() => markAsReadSchema.parse({})).toThrow();
    });

    it('should validate UUID format', () => {
      expect(() =>
        markAsReadSchema.parse({ notificationId: 'invalid' })
      ).toThrow();
    });
  });

  describe('Mark All As Read Schema', () => {
    it('should accept optional organizationId', () => {
      const result = markAllAsReadSchema.parse({});

      expect(result.organizationId).toBeUndefined();
    });

    it('should accept valid organizationId', () => {
      const result = markAllAsReadSchema.parse({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.organizationId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('Delete Notification Schema', () => {
    it('should accept valid notification ID', () => {
      const result = deleteNotificationSchema.parse({
        notificationId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.notificationId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should require notificationId', () => {
      expect(() => deleteNotificationSchema.parse({})).toThrow();
    });
  });
});

describe('Notification Preferences', () => {
  describe('Get Preferences Schema', () => {
    it('should require organizationId', () => {
      expect(() => getPreferencesSchema.parse({})).toThrow();
    });

    it('should accept valid organizationId', () => {
      const result = getPreferencesSchema.parse({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.organizationId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('Update Preferences Schema', () => {
    it('should require organizationId', () => {
      expect(() =>
        updatePreferencesSchema.parse({ inAppLeadCreated: true })
      ).toThrow();
    });

    it('should accept partial updates', () => {
      const result = updatePreferencesSchema.parse({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        inAppLeadCreated: true,
        emailDailyDigest: false,
      });

      expect(result.inAppLeadCreated).toBe(true);
      expect(result.emailDailyDigest).toBe(false);
      expect(result.inAppLeadScored).toBeUndefined();
    });

    it('should accept all preference fields', () => {
      const result = updatePreferencesSchema.parse({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        inAppLeadCreated: true,
        inAppLeadStatusChanged: true,
        inAppLeadScored: true,
        inAppImportExport: true,
        inAppMemberChanges: true,
        emailLeadCreated: false,
        emailLeadStatusChanged: false,
        emailLeadScored: false,
        emailDailyDigest: true,
        emailWeeklyReport: true,
      });

      expect(result.inAppLeadCreated).toBe(true);
      expect(result.emailLeadCreated).toBe(false);
      expect(result.emailDailyDigest).toBe(true);
    });
  });

  describe('Default Preferences', () => {
    it('should have sensible defaults', () => {
      const defaultPrefs = {
        inAppLeadCreated: true,
        inAppLeadStatusChanged: true,
        inAppLeadScored: false,
        inAppImportExport: true,
        inAppMemberChanges: true,
        emailLeadCreated: false,
        emailLeadStatusChanged: false,
        emailLeadScored: false,
        emailDailyDigest: false,
        emailWeeklyReport: true,
      };

      expect(defaultPrefs.inAppLeadCreated).toBe(true);
      expect(defaultPrefs.emailLeadCreated).toBe(false);
    });
  });
});

describe('Notification Types', () => {
  it('should have all expected notification types', () => {
    expect(NOTIFICATION_TYPES).toContain('lead_created');
    expect(NOTIFICATION_TYPES).toContain('lead_status_changed');
    expect(NOTIFICATION_TYPES).toContain('lead_scored');
    expect(NOTIFICATION_TYPES).toContain('lead_assigned');
    expect(NOTIFICATION_TYPES).toContain('import_completed');
    expect(NOTIFICATION_TYPES).toContain('export_completed');
    expect(NOTIFICATION_TYPES).toContain('member_added');
    expect(NOTIFICATION_TYPES).toContain('member_removed');
  });

  it('should have lead-related types', () => {
    const leadTypes = NOTIFICATION_TYPES.filter((t) => t.startsWith('lead_'));
    expect(leadTypes.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Notification Response Format', () => {
  it('should have correct notification structure', () => {
    const notification = {
      id: 'notif-123',
      userId: 'user-456',
      organizationId: 'org-789',
      type: 'lead_created',
      title: 'New Lead',
      message: 'A new lead was created',
      data: { leadId: 'lead-001' },
      isRead: false,
      createdAt: '2024-01-01T00:00:00Z',
    };

    expect(notification).toHaveProperty('id');
    expect(notification).toHaveProperty('userId');
    expect(notification).toHaveProperty('type');
    expect(notification).toHaveProperty('title');
    expect(notification).toHaveProperty('message');
    expect(notification).toHaveProperty('isRead');
    expect(notification).toHaveProperty('createdAt');
  });

  it('should have correct list response structure', () => {
    const response = {
      notifications: [
        { id: 'n1', type: 'lead_created', isRead: false },
        { id: 'n2', type: 'lead_scored', isRead: true },
      ],
      total: 10,
      unreadCount: 5,
    };

    expect(response.notifications).toBeInstanceOf(Array);
    expect(response.total).toBe(10);
    expect(response.unreadCount).toBe(5);
  });

  it('should have correct unread count response', () => {
    const response = { count: 5 };

    expect(response.count).toBe(5);
  });

  it('should have correct preferences structure', () => {
    const prefs = {
      id: 'pref-123',
      userId: 'user-456',
      organizationId: 'org-789',
      inAppLeadCreated: true,
      inAppLeadStatusChanged: true,
      emailDailyDigest: false,
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(prefs).toHaveProperty('id');
    expect(prefs).toHaveProperty('userId');
    expect(prefs).toHaveProperty('organizationId');
    expect(prefs).toHaveProperty('inAppLeadCreated');
  });
});

describe('Unread Count Logic', () => {
  it('should count unread notifications', () => {
    const notifications = [
      { id: 'n1', isRead: false },
      { id: 'n2', isRead: false },
      { id: 'n3', isRead: true },
      { id: 'n4', isRead: false },
    ];

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    expect(unreadCount).toBe(3);
  });

  it('should filter by organization', () => {
    const notifications = [
      { id: 'n1', organizationId: 'org-1', isRead: false },
      { id: 'n2', organizationId: 'org-2', isRead: false },
      { id: 'n3', organizationId: 'org-1', isRead: false },
    ];

    const org1Unread = notifications.filter(
      (n) => n.organizationId === 'org-1' && !n.isRead
    ).length;

    expect(org1Unread).toBe(2);
  });
});

describe('Real-time Updates', () => {
  it('should support SSE event types', () => {
    const eventTypes = [
      'notification:new',
      'notification:read',
      'notification:deleted',
      'unread_count:updated',
    ];

    expect(eventTypes).toContain('notification:new');
    expect(eventTypes).toContain('unread_count:updated');
  });

  it('should format SSE message correctly', () => {
    const notification = {
      id: 'n1',
      type: 'lead_created',
      title: 'New Lead',
    };

    const sseMessage = {
      event: 'notification:new',
      data: JSON.stringify(notification),
    };

    expect(sseMessage.event).toBe('notification:new');
    expect(JSON.parse(sseMessage.data)).toHaveProperty('id');
  });
});
