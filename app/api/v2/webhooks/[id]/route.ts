/**
 * REST API v2 - Single Webhook Endpoint
 *
 * GET /api/v2/webhooks/[id] - Get a webhook
 * PATCH /api/v2/webhooks/[id] - Update a webhook
 * DELETE /api/v2/webhooks/[id] - Delete a webhook
 */
import { db } from '@/lib/db';
import { webhooks, webhookDeliveries } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

const webhookEventSchema = z.enum([
  'lead.created',
  'lead.updated',
  'lead.deleted',
  'lead.status_changed',
  'lead.scored',
  'diagnostic.submitted',
  'diagnostic.completed',
  'organization.member_added',
  'organization.member_removed',
  'blog.published',
  'blog.updated',
]);

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(webhookEventSchema).min(1).optional(),
  secret: z.string().min(16).max(64).optional(),
  status: z.enum(['active', 'inactive', 'failed']).optional(),
  headers: z.record(z.string()).optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  retryDelayMs: z.number().int().min(1000).max(30000).optional(),
});

// ============================================================================
// Auth Helper
// ============================================================================

async function getAuthenticatedOrganization(request: NextRequest): Promise<{
  organizationId: string;
  userId?: string;
} | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const parts = token.split('_');
    if (parts.length >= 2 && parts[0] === 'org') {
      return { organizationId: parts[1] };
    }
  }

  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.session?.activeOrganizationId) {
    return null;
  }

  return {
    organizationId: session.session.activeOrganizationId,
    userId: session.user?.id,
  };
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * GET /api/v2/webhooks/[id]
 * Get a webhook with recent deliveries
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await getAuthenticatedOrganization(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid webhook ID format' },
        { status: 400 }
      );
    }

    const webhook = await db.query.webhooks.findFirst({
      where: and(eq(webhooks.id, id), eq(webhooks.organizationId, authResult.organizationId)),
      columns: {
        id: true,
        name: true,
        url: true,
        events: true,
        status: true,
        headers: true,
        retryConfig: true,
        lastTriggeredAt: true,
        failureCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Get recent deliveries
    const deliveries = await db.query.webhookDeliveries.findMany({
      where: eq(webhookDeliveries.webhookId, id),
      orderBy: [desc(webhookDeliveries.createdAt)],
      limit: 20,
      columns: {
        id: true,
        eventType: true,
        status: true,
        statusCode: true,
        attempts: true,
        error: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      data: {
        ...webhook,
        recentDeliveries: deliveries,
      },
    });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/webhooks/[id]
 * Update a webhook
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await getAuthenticatedOrganization(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid webhook ID format' },
        { status: 400 }
      );
    }

    const existing = await db.query.webhooks.findFirst({
      where: and(eq(webhooks.id, id), eq(webhooks.organizationId, authResult.organizationId)),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Webhook not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsedBody = updateWebhookSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request body',
          details: parsedBody.error.format(),
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const {
      name,
      url,
      events,
      secret,
      status,
      headers: customHeaders,
      maxRetries,
      retryDelayMs,
    } = parsedBody.data;

    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (events !== undefined) updateData.events = events;
    if (secret !== undefined) updateData.secret = secret;
    if (status !== undefined) updateData.status = status;
    if (customHeaders !== undefined) updateData.headers = customHeaders;
    if (maxRetries !== undefined || retryDelayMs !== undefined) {
      const currentConfig = existing.retryConfig as {
        maxRetries?: number;
        retryDelayMs?: number;
      } | null;
      updateData.retryConfig = {
        maxRetries: maxRetries ?? currentConfig?.maxRetries ?? 3,
        retryDelayMs: retryDelayMs ?? currentConfig?.retryDelayMs ?? 5000,
      };
    }

    const [updated] = await db
      .update(webhooks)
      .set(updateData)
      .where(and(eq(webhooks.id, id), eq(webhooks.organizationId, authResult.organizationId)))
      .returning({
        id: webhooks.id,
        name: webhooks.name,
        url: webhooks.url,
        events: webhooks.events,
        status: webhooks.status,
        headers: webhooks.headers,
        retryConfig: webhooks.retryConfig,
        updatedAt: webhooks.updatedAt,
      });

    return NextResponse.json({
      data: updated,
      message: 'Webhook updated successfully',
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/webhooks/[id]
 * Delete a webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthenticatedOrganization(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid webhook ID format' },
        { status: 400 }
      );
    }

    const existing = await db.query.webhooks.findFirst({
      where: and(eq(webhooks.id, id), eq(webhooks.organizationId, authResult.organizationId)),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Webhook not found' },
        { status: 404 }
      );
    }

    await db
      .delete(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.organizationId, authResult.organizationId)));

    return NextResponse.json({ message: 'Webhook deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
