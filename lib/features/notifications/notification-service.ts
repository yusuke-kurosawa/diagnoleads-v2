/**
 * Notification Service
 *
 * Handles creating and managing notifications
 */
import { db } from '@/lib/db/client';
import {
  type NewNotification,
  type NotificationType,
  notificationPreferences,
  notifications,
} from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';

/**
 * Create a notification for a user
 */
export async function createNotification(data: NewNotification): Promise<void> {
  await db.insert(notifications).values(data);
}

/**
 * Create notifications for all organization members
 */
export async function notifyOrganizationMembers(
  organizationId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  // Get all members of the organization
  const members = await db.query.organizationMembers.findMany({
    where: (members, { eq }) => eq(members.organizationId, organizationId),
    with: {
      user: true,
    },
  });

  // Check preferences and create notifications
  for (const member of members) {
    const prefs = await getOrCreatePreferences(member.userId, organizationId);

    // Check if user wants this notification type
    const shouldNotify = shouldSendInAppNotification(type, prefs);

    if (shouldNotify) {
      await createNotification({
        userId: member.userId,
        organizationId,
        type,
        title,
        message,
        data,
      });
    }
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  organizationId?: string,
  options: { limit?: number; unreadOnly?: boolean } = {}
) {
  const { limit = 20, unreadOnly = false } = options;

  const conditions = [eq(notifications.userId, userId)];

  if (organizationId) {
    conditions.push(eq(notifications.organizationId, organizationId));
  }

  if (unreadOnly) {
    conditions.push(eq(notifications.read, false));
  }

  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string, organizationId?: string): Promise<number> {
  const conditions = [eq(notifications.userId, userId), eq(notifications.read, false)];

  if (organizationId) {
    conditions.push(eq(notifications.organizationId, organizationId));
  }

  const result = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(...conditions));

  return result.length;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({
      read: true,
      readAt: new Date(),
    })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string, organizationId?: string): Promise<void> {
  const conditions = [eq(notifications.userId, userId), eq(notifications.read, false)];

  if (organizationId) {
    conditions.push(eq(notifications.organizationId, organizationId));
  }

  await db
    .update(notifications)
    .set({
      read: true,
      readAt: new Date(),
    })
    .where(and(...conditions));
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  await db
    .delete(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

/**
 * Get or create notification preferences
 */
export async function getOrCreatePreferences(userId: string, organizationId: string) {
  const existing = await db.query.notificationPreferences.findFirst({
    where: and(
      eq(notificationPreferences.userId, userId),
      eq(notificationPreferences.organizationId, organizationId)
    ),
  });

  if (existing) {
    return existing;
  }

  // Create default preferences
  const [created] = await db
    .insert(notificationPreferences)
    .values({
      userId,
      organizationId,
    })
    .returning();

  return created;
}

/**
 * Update notification preferences
 */
export async function updatePreferences(
  userId: string,
  organizationId: string,
  updates: Partial<{
    inAppLeadCreated: boolean;
    inAppLeadStatusChanged: boolean;
    inAppLeadScored: boolean;
    inAppImportExport: boolean;
    inAppMemberChanges: boolean;
    emailLeadCreated: boolean;
    emailLeadStatusChanged: boolean;
    emailLeadScored: boolean;
    emailDailyDigest: boolean;
    emailWeeklyReport: boolean;
  }>
) {
  await getOrCreatePreferences(userId, organizationId);

  const [updated] = await db
    .update(notificationPreferences)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.organizationId, organizationId)
      )
    )
    .returning();

  return updated;
}

/**
 * Check if user should receive in-app notification
 */
function shouldSendInAppNotification(
  type: NotificationType,
  prefs: typeof notificationPreferences.$inferSelect
): boolean {
  switch (type) {
    case 'lead_created':
      return prefs.inAppLeadCreated;
    case 'lead_status_changed':
      return prefs.inAppLeadStatusChanged;
    case 'lead_scored':
      return prefs.inAppLeadScored;
    case 'import_completed':
    case 'export_completed':
      return prefs.inAppImportExport;
    case 'member_invited':
    case 'member_removed':
      return prefs.inAppMemberChanges;
    case 'system':
      return true;
    default:
      return true;
  }
}
