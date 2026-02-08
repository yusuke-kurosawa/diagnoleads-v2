import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database
vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'pref-1' }]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    query: {
      organizationMembers: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      notificationPreferences: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  },
}));

import { db } from '@/lib/db/client';
import {
  createNotification,
  deleteNotification,
  getOrCreatePreferences,
  getUnreadCount,
  getUserNotifications,
  markAllAsRead,
  markAsRead,
  notifyOrganizationMembers,
  updatePreferences,
} from '@/lib/features/notifications/notification-service';

describe('notification-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const mockInsert = vi.fn().mockReturnThis();
      const mockValues = vi.fn().mockResolvedValue(undefined);
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        values: mockValues,
      });

      await createNotification({
        userId: 'user-1',
        organizationId: 'org-1',
        type: 'lead_created',
        title: 'New Lead',
        message: 'A new lead was created',
      });

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('notifyOrganizationMembers', () => {
    it('should notify all organization members with matching preferences', async () => {
      const mockMembers = [
        {
          userId: 'user-1',
          organizationId: 'org-1',
          user: { id: 'user-1', name: 'User 1' },
        },
        {
          userId: 'user-2',
          organizationId: 'org-1',
          user: { id: 'user-2', name: 'User 2' },
        },
      ];

      (db.query.organizationMembers.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockMembers
      );
      (db.query.notificationPreferences.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        inAppLeadCreated: true,
        inAppLeadStatusChanged: true,
        inAppLeadScored: true,
        inAppImportExport: true,
        inAppMemberChanges: true,
      });

      const mockInsert = vi.fn().mockReturnThis();
      const mockValues = vi.fn().mockResolvedValue(undefined);
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        values: mockValues,
      });

      await notifyOrganizationMembers('org-1', 'lead_created', 'New Lead', 'A lead was created');

      expect(db.query.organizationMembers.findMany).toHaveBeenCalled();
    });

    it('should skip notifications for users with disabled preferences', async () => {
      const mockMembers = [
        {
          userId: 'user-1',
          organizationId: 'org-1',
          user: { id: 'user-1', name: 'User 1' },
        },
      ];

      (db.query.organizationMembers.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockMembers
      );
      (db.query.notificationPreferences.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        inAppLeadCreated: false,
        inAppLeadStatusChanged: false,
        inAppLeadScored: false,
        inAppImportExport: false,
        inAppMemberChanges: false,
      });

      await notifyOrganizationMembers('org-1', 'lead_created', 'New Lead', 'A lead was created');

      expect(db.query.organizationMembers.findMany).toHaveBeenCalled();
    });

    it('should handle different notification types', async () => {
      const mockMembers = [
        {
          userId: 'user-1',
          organizationId: 'org-1',
          user: { id: 'user-1', name: 'User 1' },
        },
      ];

      (db.query.organizationMembers.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockMembers
      );
      (db.query.notificationPreferences.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        inAppLeadCreated: true,
        inAppLeadStatusChanged: true,
        inAppLeadScored: true,
        inAppImportExport: true,
        inAppMemberChanges: true,
      });

      const mockInsert = vi.fn().mockReturnThis();
      const mockValues = vi.fn().mockResolvedValue(undefined);
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        values: mockValues,
      });

      // Test different notification types
      await notifyOrganizationMembers(
        'org-1',
        'lead_status_changed',
        'Status Changed',
        'Lead status updated'
      );
      await notifyOrganizationMembers('org-1', 'lead_scored', 'Lead Scored', 'Lead was scored');
      await notifyOrganizationMembers(
        'org-1',
        'import_completed',
        'Import Done',
        'Import completed'
      );
      await notifyOrganizationMembers(
        'org-1',
        'export_completed',
        'Export Done',
        'Export completed'
      );
      await notifyOrganizationMembers(
        'org-1',
        'member_invited',
        'Member Invited',
        'New member invited'
      );
      await notifyOrganizationMembers(
        'org-1',
        'member_removed',
        'Member Removed',
        'Member was removed'
      );
      await notifyOrganizationMembers('org-1', 'system', 'System', 'System notification');

      expect(db.query.organizationMembers.findMany).toHaveBeenCalledTimes(7);
    });
  });

  describe('getUserNotifications', () => {
    it('should get notifications for a user', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'Notification 1' },
        { id: 'notif-2', title: 'Notification 2' },
      ];

      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotifications);

      const result = await getUserNotifications('user-1');

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockNotifications);
    });

    it('should filter by organization', async () => {
      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await getUserNotifications('user-1', 'org-1');

      expect(db.select).toHaveBeenCalled();
    });

    it('should filter unread only', async () => {
      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await getUserNotifications('user-1', undefined, { unreadOnly: true });

      expect(db.select).toHaveBeenCalled();
    });

    it('should respect limit option', async () => {
      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await getUserNotifications('user-1', undefined, { limit: 10 });

      expect(db.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      const mockResult = [{ id: '1' }, { id: '2' }, { id: '3' }];
      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const count = await getUnreadCount('user-1');

      expect(count).toBe(3);
    });

    it('should filter by organization', async () => {
      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const count = await getUnreadCount('user-1', 'org-1');

      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      });

      await markAsRead('notif-1', 'user-1');

      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      });

      await markAllAsRead('user-1');

      expect(db.update).toHaveBeenCalled();
    });

    it('should filter by organization', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      });

      await markAllAsRead('user-1', 'org-1');

      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      (db.delete as ReturnType<typeof vi.fn>).mockReturnValue({
        where: mockWhere,
      });

      await deleteNotification('notif-1', 'user-1');

      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('getOrCreatePreferences', () => {
    it('should return existing preferences', async () => {
      const existingPrefs = {
        id: 'pref-1',
        userId: 'user-1',
        organizationId: 'org-1',
        inAppLeadCreated: true,
      };

      (db.query.notificationPreferences.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        existingPrefs
      );

      const result = await getOrCreatePreferences('user-1', 'org-1');

      expect(result).toEqual(existingPrefs);
    });

    it('should create default preferences if none exist', async () => {
      (db.query.notificationPreferences.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        null
      );

      const mockReturning = vi.fn().mockResolvedValue([{ id: 'new-pref-1' }]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        values: mockValues,
      });

      const result = await getOrCreatePreferences('user-1', 'org-1');

      expect(db.insert).toHaveBeenCalled();
      expect(result).toEqual({ id: 'new-pref-1' });
    });
  });

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      (db.query.notificationPreferences.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'pref-1',
      });

      const mockReturning = vi.fn().mockResolvedValue([{ id: 'pref-1', inAppLeadCreated: false }]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
        set: mockSet,
      });

      const result = await updatePreferences('user-1', 'org-1', {
        inAppLeadCreated: false,
        emailDailyDigest: true,
      });

      expect(db.update).toHaveBeenCalled();
      expect(result).toEqual({ id: 'pref-1', inAppLeadCreated: false });
    });
  });
});
