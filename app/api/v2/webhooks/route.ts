/**
 * REST API v2 - Webhooks Endpoint
 *
 * GET /api/v2/webhooks - List webhooks
 * POST /api/v2/webhooks - Create a webhook
 */
import { db } from '@/lib/db';
import { webhooks, type WebhookEventType } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';

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

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(webhookEventSchema).min(1),
  secret: z.string().min(16).max(64).optional(),
  status: z.enum(['active', 'inactive', 'failed']).default('active'),
  headers: z.record(z.string()).optional(),
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryDelayMs: z.number().int().min(1000).max(30000).default(5000),
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
 * GET /api/v2/webhooks
 * List webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedOrganization(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const results = await db.query.webhooks.findMany({
      where: eq(webhooks.organizationId, authResult.organizationId),
      orderBy: [desc(webhooks.createdAt)],
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

    return NextResponse.json({
      data: results.map((w) => ({
        ...w,
        hasSecret: true, // Don't expose the secret itself
      })),
    });
  } catch (error) {
    console.error('Error listing webhooks:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/webhooks
 * Create a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedOrganization(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsedBody = createWebhookSchema.safeParse(body);

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

    // Generate secret if not provided
    const webhookSecret = secret ?? crypto.randomBytes(32).toString('hex');

    const [webhook] = await db
      .insert(webhooks)
      .values({
        organizationId: authResult.organizationId,
        name,
        url,
        events: events as WebhookEventType[],
        secret: webhookSecret,
        status,
        headers: customHeaders ?? {},
        retryConfig: {
          maxRetries,
          retryDelayMs,
        },
      })
      .returning();

    return NextResponse.json(
      {
        data: {
          ...webhook,
          // Only return secret on creation
          secret: webhookSecret,
        },
        message: 'Webhook created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
