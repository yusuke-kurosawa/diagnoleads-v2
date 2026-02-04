/**
 * Audit Logs tRPC Router
 *
 * API endpoints for querying audit logs
 */

import { db } from '@/lib/db/client';
import { auditLogs, users } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { auditLogsToCSV } from '../service';
import { exportAuditLogsSchema, getAuditLogSchema, listAuditLogsSchema } from '../types';

export const auditLogsRouter = router({
  /**
   * List audit logs for the organization
   */
  list: organizationProcedure.input(listAuditLogsSchema).query(async ({ ctx, input }) => {
    // Check permission - only admins can view audit logs
    if (!ctx.ability.can('read', 'Settings')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to view audit logs',
      });
    }

    const { action, resource, resourceId, userId, startDate, endDate, limit, offset } = input;

    const conditions = [eq(auditLogs.organizationId, ctx.organization.id)];

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (resource) {
      conditions.push(eq(auditLogs.resource, resource));
    }

    if (resourceId) {
      conditions.push(eq(auditLogs.resourceId, resourceId));
    }

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
    }

    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        changes: auditLogs.changes,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select()
      .from(auditLogs)
      .where(and(...conditions));

    return {
      logs,
      total: countResult.length,
      limit,
      offset,
    };
  }),

  /**
   * Get a single audit log entry
   */
  get: organizationProcedure.input(getAuditLogSchema).query(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('read', 'Settings')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to view audit logs',
      });
    }

    const [log] = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        changes: auditLogs.changes,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(eq(auditLogs.id, input.id), eq(auditLogs.organizationId, ctx.organization.id)))
      .limit(1);

    if (!log) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Audit log not found',
      });
    }

    return log;
  }),

  /**
   * Export audit logs
   */
  export: organizationProcedure.input(exportAuditLogsSchema).mutation(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('read', 'Settings')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to export audit logs',
      });
    }

    const { startDate, endDate, format } = input;

    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        changes: auditLogs.changes,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.organizationId, ctx.organization.id),
          gte(auditLogs.createdAt, new Date(startDate)),
          lte(auditLogs.createdAt, new Date(endDate))
        )
      )
      .orderBy(desc(auditLogs.createdAt));

    if (format === 'csv') {
      return {
        format: 'csv',
        content: auditLogsToCSV(logs),
        filename: `audit-logs-${startDate}-${endDate}.csv`,
      };
    }

    return {
      format: 'json',
      content: JSON.stringify(logs, null, 2),
      filename: `audit-logs-${startDate}-${endDate}.json`,
    };
  }),

  /**
   * Get audit log summary/stats
   */
  stats: organizationProcedure.query(async ({ ctx }) => {
    // Check permission
    if (!ctx.ability.can('read', 'Settings')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to view audit logs',
      });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Count logs by time period
    const [count24h] = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.organizationId, ctx.organization.id), gte(auditLogs.createdAt, last24h))
      );

    const [count7d] = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.organizationId, ctx.organization.id), gte(auditLogs.createdAt, last7d))
      );

    const [count30d] = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.organizationId, ctx.organization.id), gte(auditLogs.createdAt, last30d))
      );

    // Get recent activity
    const recentLogs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        createdAt: auditLogs.createdAt,
        userName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.organizationId, ctx.organization.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    return {
      counts: {
        last24h: count24h ? 1 : 0,
        last7d: count7d ? 1 : 0,
        last30d: count30d ? 1 : 0,
      },
      recentActivity: recentLogs,
    };
  }),
});
