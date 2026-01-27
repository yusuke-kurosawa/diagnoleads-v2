/**
 * Notifications tRPC Router
 */
import { protectedProcedure, router } from '@/lib/trpc/init';
import { z } from 'zod';
import {
  deleteNotification,
  getOrCreatePreferences,
  getUnreadCount,
  getUserNotifications,
  markAllAsRead,
  markAsRead,
  updatePreferences,
} from '../notification-service';

export const notificationsRouter = router({
  /**
   * List notifications for current user
   */
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const notifications = await getUserNotifications(ctx.session.user.id, input.organizationId, {
        limit: input.limit,
        unreadOnly: input.unreadOnly,
      });

      return notifications;
    }),

  /**
   * Get unread count
   */
  unreadCount: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const count = await getUnreadCount(ctx.session.user.id, input.organizationId);
      return { count };
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await markAsRead(input.notificationId, ctx.session.user.id);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await markAllAsRead(ctx.session.user.id, input.organizationId);
      return { success: true };
    }),

  /**
   * Delete notification
   */
  delete: protectedProcedure
    .input(
      z.object({
        notificationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await deleteNotification(input.notificationId, ctx.session.user.id);
      return { success: true };
    }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const prefs = await getOrCreatePreferences(ctx.session.user.id, input.organizationId);
      return prefs;
    }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, ...updates } = input;
      const prefs = await updatePreferences(ctx.session.user.id, organizationId, updates);
      return prefs;
    }),
});
