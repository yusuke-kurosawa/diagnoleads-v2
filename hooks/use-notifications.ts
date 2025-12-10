/**
 * React hooks for notifications
 */
import { trpc } from '@/lib/trpc/client';
import type { RouterOutputs } from '@/lib/trpc/client';

export type Notification = RouterOutputs['notifications']['list'][number];
export type NotificationPreferences = RouterOutputs['notifications']['getPreferences'];

/**
 * Hook to list notifications
 */
export function useNotifications(
  organizationId?: string,
  options: { limit?: number; unreadOnly?: boolean } = {}
) {
  return trpc.notifications.list.useQuery(
    {
      organizationId,
      limit: options.limit ?? 20,
      unreadOnly: options.unreadOnly ?? false,
    },
    {
      refetchInterval: 30000, // Poll every 30 seconds
    }
  );
}

/**
 * Hook to get unread notification count
 */
export function useUnreadCount(organizationId?: string) {
  return trpc.notifications.unreadCount.useQuery(
    { organizationId },
    {
      refetchInterval: 30000, // Poll every 30 seconds
    }
  );
}

/**
 * Hook to mark notification as read
 */
export function useMarkAsRead() {
  const utils = trpc.useUtils();

  return trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const utils = trpc.useUtils();

  return trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });
}

/**
 * Hook to delete notification
 */
export function useDeleteNotification() {
  const utils = trpc.useUtils();

  return trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });
}

/**
 * Hook to get notification preferences
 */
export function useNotificationPreferences(organizationId: string) {
  return trpc.notifications.getPreferences.useQuery(
    { organizationId },
    {
      enabled: !!organizationId,
    }
  );
}

/**
 * Hook to update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const utils = trpc.useUtils();

  return trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      utils.notifications.getPreferences.invalidate();
    },
  });
}
