/**
 * Webhooks tRPC Router
 *
 * Phase 5.1: Webhook基盤
 */

import { db } from '@/lib/db/client';
import { webhookDeliveries, webhooks } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { generateWebhookSecret, triggerWebhooks } from '../services/webhook-service';
import {
  createWebhookSchema,
  listDeliveriesSchema,
  listWebhooksSchema,
  testWebhookSchema,
  updateWebhookSchema,
  webhookEventTypes,
} from '../types/schemas';

export const webhooksRouter = router({
  /**
   * List webhooks for the organization
   */
  list: organizationProcedure.input(listWebhooksSchema).query(async ({ ctx, input }) => {
    const { status, limit, offset } = input;

    const conditions = [eq(webhooks.organizationId, ctx.organization.id)];
    if (status) {
      conditions.push(eq(webhooks.status, status));
    }

    const results = await db
      .select()
      .from(webhooks)
      .where(and(...conditions))
      .orderBy(desc(webhooks.createdAt))
      .limit(limit)
      .offset(offset);

    // Count total
    const countResult = await db
      .select()
      .from(webhooks)
      .where(and(...conditions));

    return {
      webhooks: results.map((w) => ({
        ...w,
        secret: maskSecret(w.secret), // Don't expose full secret
      })),
      total: countResult.length,
      limit,
      offset,
    };
  }),

  /**
   * Get a single webhook by ID
   */
  get: organizationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const webhook = await db
        .select()
        .from(webhooks)
        .where(and(eq(webhooks.id, input.id), eq(webhooks.organizationId, ctx.organization.id)))
        .limit(1);

      if (!webhook[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        });
      }

      return {
        ...webhook[0],
        secret: maskSecret(webhook[0].secret),
      };
    }),

  /**
   * Create a new webhook
   */
  create: organizationProcedure.input(createWebhookSchema).mutation(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('create', 'Webhook')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to create webhooks',
      });
    }

    const secret = generateWebhookSecret();

    const [webhook] = await db
      .insert(webhooks)
      .values({
        organizationId: ctx.organization.id,
        name: input.name,
        url: input.url,
        secret,
        events: input.events,
        headers: input.headers || {},
        retryConfig: input.retryConfig || { maxRetries: 3, retryDelayMs: 5000 },
      })
      .returning();

    return {
      ...webhook,
      // Return the full secret only on creation
      secret: webhook.secret,
    };
  }),

  /**
   * Update a webhook
   */
  update: organizationProcedure.input(updateWebhookSchema).mutation(async ({ ctx, input }) => {
    // Check permission
    if (!ctx.ability.can('update', 'Webhook')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update webhooks',
      });
    }

    // Verify ownership
    const existing = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, input.id), eq(webhooks.organizationId, ctx.organization.id)))
      .limit(1);

    if (!existing[0]) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Webhook not found',
      });
    }

    const updateData: Partial<typeof webhooks.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name) updateData.name = input.name;
    if (input.url) updateData.url = input.url;
    if (input.events) updateData.events = input.events;
    if (input.status) updateData.status = input.status;
    if (input.headers) updateData.headers = input.headers;
    if (input.retryConfig) updateData.retryConfig = input.retryConfig;

    const [updated] = await db
      .update(webhooks)
      .set(updateData)
      .where(eq(webhooks.id, input.id))
      .returning();

    return {
      ...updated,
      secret: maskSecret(updated.secret),
    };
  }),

  /**
   * Delete a webhook
   */
  delete: organizationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!ctx.ability.can('delete', 'Webhook')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete webhooks',
        });
      }

      // Verify ownership
      const existing = await db
        .select()
        .from(webhooks)
        .where(and(eq(webhooks.id, input.id), eq(webhooks.organizationId, ctx.organization.id)))
        .limit(1);

      if (!existing[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        });
      }

      await db.delete(webhooks).where(eq(webhooks.id, input.id));

      return { success: true };
    }),

  /**
   * Regenerate webhook secret
   */
  regenerateSecret: organizationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check permission
      if (!ctx.ability.can('update', 'Webhook')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update webhooks',
        });
      }

      // Verify ownership
      const existing = await db
        .select()
        .from(webhooks)
        .where(and(eq(webhooks.id, input.id), eq(webhooks.organizationId, ctx.organization.id)))
        .limit(1);

      if (!existing[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        });
      }

      const newSecret = generateWebhookSecret();

      const [updated] = await db
        .update(webhooks)
        .set({
          secret: newSecret,
          updatedAt: new Date(),
        })
        .where(eq(webhooks.id, input.id))
        .returning();

      return {
        ...updated,
        secret: newSecret, // Return full secret on regeneration
      };
    }),

  /**
   * Test a webhook by sending a test event
   */
  test: organizationProcedure.input(testWebhookSchema).mutation(async ({ ctx, input }) => {
    // Verify ownership
    const existing = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, input.id), eq(webhooks.organizationId, ctx.organization.id)))
      .limit(1);

    if (!existing[0]) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Webhook not found',
      });
    }

    // Trigger a test event
    const testData = {
      test: true,
      message: 'This is a test webhook from DiagnoLeads',
      timestamp: new Date().toISOString(),
    };

    // Use the first subscribed event type for testing
    const eventType = existing[0].events[0] || 'lead.created';

    const result = await triggerWebhooks(ctx.organization.id, eventType, testData);

    return {
      success: result.triggered > 0,
      triggered: result.triggered,
      failed: result.failed,
    };
  }),

  /**
   * List webhook deliveries
   */
  deliveries: organizationProcedure.input(listDeliveriesSchema).query(async ({ ctx, input }) => {
    const { webhookId, status, limit, offset } = input;

    // Build query to get deliveries for webhooks owned by this organization
    let query = db
      .select({
        delivery: webhookDeliveries,
        webhookName: webhooks.name,
      })
      .from(webhookDeliveries)
      .innerJoin(webhooks, eq(webhookDeliveries.webhookId, webhooks.id))
      .where(eq(webhooks.organizationId, ctx.organization.id))
      .$dynamic();

    if (webhookId) {
      query = query.where(eq(webhookDeliveries.webhookId, webhookId));
    }

    if (status) {
      query = query.where(eq(webhookDeliveries.status, status));
    }

    const results = await query
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      deliveries: results.map((r) => ({
        ...r.delivery,
        webhookName: r.webhookName,
      })),
      limit,
      offset,
    };
  }),

  /**
   * Get available webhook event types
   */
  eventTypes: organizationProcedure.query(() => {
    return webhookEventTypes.map((type) => ({
      type,
      category: type.split('.')[0],
      action: type.split('.')[1],
    }));
  }),
});

/**
 * Mask webhook secret for display
 */
function maskSecret(secret: string): string {
  if (secret.length <= 12) {
    return '••••••••••••';
  }
  return `${secret.slice(0, 8)}••••••••${secret.slice(-4)}`;
}
