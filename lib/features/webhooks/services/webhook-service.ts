/**
 * Webhook Service
 *
 * Phase 5.1: Webhook基盤
 * Handles webhook delivery, retry logic, and signature generation
 */

import crypto from 'node:crypto';
import { db } from '@/lib/db/client';
import {
  type Webhook,
  type WebhookDeliveryStatus,
  type WebhookEventType,
  webhookDeliveries,
  webhooks,
} from '@/lib/db/schema';
import { and, eq, inArray, lte } from 'drizzle-orm';

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac('sha256', secret).update(signaturePayload).digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

/**
 * Verify webhook signature (for incoming webhooks)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  toleranceSeconds = 300
): boolean {
  try {
    const parts = signature.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const signaturePart = parts.find((p) => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) {
      return false;
    }

    const timestamp = Number.parseInt(timestampPart.slice(2), 10);
    const expectedSignature = signaturePart.slice(3);

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return false;
    }

    // Verify signature
    const signaturePayload = `${timestamp}.${payload}`;
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(signaturePayload)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(computedSignature));
  } catch {
    return false;
  }
}

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Webhook payload structure
 */
interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  organizationId: string;
  data: Record<string, unknown>;
}

/**
 * Deliver a webhook to a specific endpoint
 */
async function deliverWebhook(
  webhook: Webhook,
  payload: WebhookPayload,
  deliveryId: string
): Promise<{ success: boolean; statusCode?: number; error?: string; response?: string }> {
  const payloadString = JSON.stringify(payload);
  const signature = generateWebhookSignature(payloadString, webhook.secret);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature,
    'X-Webhook-ID': deliveryId,
    'X-Webhook-Event': payload.event,
    'User-Agent': 'DiagnoLeads-Webhook/1.0',
    ...(webhook.headers || {}),
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await response.text().catch(() => '');

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        response: responseText.slice(0, 1000), // Limit response size
      };
    }

    return {
      success: false,
      statusCode: response.status,
      error: `HTTP ${response.status}: ${response.statusText}`,
      response: responseText.slice(0, 1000),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Trigger webhooks for a specific event
 */
export async function triggerWebhooks(
  organizationId: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<{ triggered: number; failed: number }> {
  // Find all active webhooks for this organization that are subscribed to this event
  const activeWebhooks = await db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.organizationId, organizationId), eq(webhooks.status, 'active')));

  // Filter webhooks that are subscribed to this event
  const subscribedWebhooks = activeWebhooks.filter((w) => w.events.includes(eventType));

  if (subscribedWebhooks.length === 0) {
    return { triggered: 0, failed: 0 };
  }

  let triggered = 0;
  let failed = 0;

  for (const webhook of subscribedWebhooks) {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      event: eventType,
      timestamp: new Date().toISOString(),
      organizationId,
      data,
    };

    // Create delivery record
    const [delivery] = await db
      .insert(webhookDeliveries)
      .values({
        webhookId: webhook.id,
        eventType,
        payload: payload as unknown as Record<string, unknown>,
        status: 'pending',
        attempts: 0,
      })
      .returning();

    // Attempt delivery
    const result = await deliverWebhook(webhook, payload, delivery.id);

    if (result.success) {
      // Update delivery as success
      await db
        .update(webhookDeliveries)
        .set({
          status: 'success',
          statusCode: result.statusCode,
          response: result.response,
          attempts: 1,
          completedAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      // Update webhook last triggered
      await db
        .update(webhooks)
        .set({
          lastTriggeredAt: new Date(),
          failureCount: 0,
          updatedAt: new Date(),
        })
        .where(eq(webhooks.id, webhook.id));

      triggered++;
    } else {
      // Schedule retry
      const retryConfig = webhook.retryConfig || { maxRetries: 3, retryDelayMs: 5000 };
      const nextRetryAt = new Date(Date.now() + retryConfig.retryDelayMs);

      await db
        .update(webhookDeliveries)
        .set({
          status: 'pending',
          statusCode: result.statusCode,
          error: result.error,
          response: result.response,
          attempts: 1,
          nextRetryAt,
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      // Increment failure count
      await db
        .update(webhooks)
        .set({
          failureCount: webhook.failureCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(webhooks.id, webhook.id));

      failed++;
    }
  }

  return { triggered, failed };
}

/**
 * Process pending webhook retries
 * Should be called by a background job
 */
export async function processWebhookRetries(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  // Find deliveries that need to be retried
  const pendingDeliveries = await db
    .select({
      delivery: webhookDeliveries,
      webhook: webhooks,
    })
    .from(webhookDeliveries)
    .innerJoin(webhooks, eq(webhookDeliveries.webhookId, webhooks.id))
    .where(
      and(eq(webhookDeliveries.status, 'pending'), lte(webhookDeliveries.nextRetryAt, new Date()))
    )
    .limit(100);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const { delivery, webhook } of pendingDeliveries) {
    const retryConfig = webhook.retryConfig || { maxRetries: 3, retryDelayMs: 5000 };

    // Check if max retries exceeded
    if (delivery.attempts >= retryConfig.maxRetries) {
      await db
        .update(webhookDeliveries)
        .set({
          status: 'failed',
          completedAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      // Mark webhook as failed if too many failures
      if (webhook.failureCount >= 10) {
        await db
          .update(webhooks)
          .set({
            status: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(webhooks.id, webhook.id));
      }

      failed++;
      processed++;
      continue;
    }

    // Attempt redelivery
    const payload = delivery.payload as unknown as WebhookPayload;
    const result = await deliverWebhook(webhook, payload, delivery.id);

    if (result.success) {
      await db
        .update(webhookDeliveries)
        .set({
          status: 'success',
          statusCode: result.statusCode,
          response: result.response,
          attempts: delivery.attempts + 1,
          completedAt: new Date(),
          error: null,
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      await db
        .update(webhooks)
        .set({
          lastTriggeredAt: new Date(),
          failureCount: 0,
          status: 'active',
          updatedAt: new Date(),
        })
        .where(eq(webhooks.id, webhook.id));

      succeeded++;
    } else {
      // Calculate exponential backoff
      const backoffMs = retryConfig.retryDelayMs * 2 ** delivery.attempts;
      const nextRetryAt = new Date(Date.now() + backoffMs);

      await db
        .update(webhookDeliveries)
        .set({
          statusCode: result.statusCode,
          error: result.error,
          response: result.response,
          attempts: delivery.attempts + 1,
          nextRetryAt,
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      failed++;
    }

    processed++;
  }

  return { processed, succeeded, failed };
}

/**
 * Clean up old webhook deliveries
 * Keeps deliveries for the last 30 days
 */
export async function cleanupOldDeliveries(daysToKeep = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const deletedRows = await db
    .delete(webhookDeliveries)
    .where(
      and(
        lte(webhookDeliveries.createdAt, cutoffDate),
        inArray(webhookDeliveries.status, ['success', 'failed'])
      )
    )
    .returning({ id: webhookDeliveries.id });

  return deletedRows.length;
}
