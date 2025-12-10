/**
 * REST API v2 - Single Lead Endpoint
 *
 * GET /api/v2/leads/[id] - Get a lead
 * PATCH /api/v2/leads/[id] - Update a lead
 * DELETE /api/v2/leads/[id] - Delete a lead
 */
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

const updateLeadSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).optional(),
  score: z.number().int().min(0).max(100).optional().nullable(),
  responses: z.record(z.unknown()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

// ============================================================================
// Auth Helper
// ============================================================================

async function getAuthenticatedOrganization(request: NextRequest): Promise<{
  organizationId: string;
  userId?: string;
} | null> {
  // Try Bearer token first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const parts = token.split('_');
    if (parts.length >= 2 && parts[0] === 'org') {
      return { organizationId: parts[1] };
    }
  }

  // Fall back to session auth
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
 * GET /api/v2/leads/[id]
 * Get a single lead by ID
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid lead ID format' },
        { status: 400 }
      );
    }

    const lead = await db.query.leads.findFirst({
      where: and(eq(leads.id, id), eq(leads.organizationId, authResult.organizationId)),
      with: {
        leadTags: {
          with: {
            tag: true,
          },
        },
        comments: {
          limit: 10,
          orderBy: (comments, { desc }) => [desc(comments.createdAt)],
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Not Found', message: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ data: lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/leads/[id]
 * Update a lead
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid lead ID format' },
        { status: 400 }
      );
    }

    // Check if lead exists
    const existing = await db.query.leads.findFirst({
      where: and(eq(leads.id, id), eq(leads.organizationId, authResult.organizationId)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not Found', message: 'Lead not found' }, { status: 404 });
    }

    // Parse body
    const body = await request.json();
    const parsedBody = updateLeadSchema.safeParse(body);

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

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const { email, name, company, phone, source, status, score, responses, customFields } =
      parsedBody.data;

    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (company !== undefined) updateData.company = company;
    if (phone !== undefined) updateData.phone = phone;
    if (source !== undefined) updateData.source = source;
    if (status !== undefined) updateData.status = status;
    if (score !== undefined) updateData.score = score;
    if (responses !== undefined) updateData.responses = responses;
    if (customFields !== undefined) updateData.customFields = customFields;

    // Update lead
    const [updated] = await db
      .update(leads)
      .set(updateData)
      .where(and(eq(leads.id, id), eq(leads.organizationId, authResult.organizationId)))
      .returning();

    return NextResponse.json({
      data: updated,
      message: 'Lead updated successfully',
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/leads/[id]
 * Delete a lead
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid lead ID format' },
        { status: 400 }
      );
    }

    // Check if lead exists
    const existing = await db.query.leads.findFirst({
      where: and(eq(leads.id, id), eq(leads.organizationId, authResult.organizationId)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not Found', message: 'Lead not found' }, { status: 404 });
    }

    // Delete lead
    await db
      .delete(leads)
      .where(and(eq(leads.id, id), eq(leads.organizationId, authResult.organizationId)));

    return NextResponse.json({ message: 'Lead deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
