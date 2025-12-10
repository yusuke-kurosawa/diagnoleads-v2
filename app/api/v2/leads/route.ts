/**
 * REST API v2 - Leads Endpoint
 *
 * GET /api/v2/leads - List leads
 * POST /api/v2/leads - Create a new lead
 */
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

const listLeadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).optional(),
  source: z.string().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'score', 'name', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createLeadSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  source: z.string().default('api'),
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).default('new'),
  score: z.number().int().min(0).max(100).optional(),
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
    // For now, we'll use a simple API key format: org_<organizationId>_<secret>
    // In production, use proper JWT or API key validation
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
 * GET /api/v2/leads
 * List leads with pagination and filtering
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsedQuery = listLeadsQuerySchema.safeParse(queryParams);

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: parsedQuery.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      page,
      limit,
      status,
      source,
      minScore,
      maxScore,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = parsedQuery.data;

    // Build conditions
    const conditions = [eq(leads.organizationId, authResult.organizationId)];

    if (status) {
      conditions.push(eq(leads.status, status));
    }

    if (source) {
      conditions.push(eq(leads.source, source));
    }

    if (minScore !== undefined) {
      conditions.push(gte(leads.score, minScore));
    }

    if (maxScore !== undefined) {
      conditions.push(lte(leads.score, maxScore));
    }

    if (search) {
      conditions.push(
        or(
          ilike(leads.email, `%${search}%`),
          ilike(leads.name, `%${search}%`),
          ilike(leads.company, `%${search}%`)
        )!
      );
    }

    if (startDate) {
      conditions.push(gte(leads.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(leads.createdAt, new Date(endDate)));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(and(...conditions));

    const total = countResult[0]?.count ?? 0;

    // Build sort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortColumnMap: Record<string, any> = {
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      score: leads.score,
      name: leads.name,
      email: leads.email,
    };
    const sortColumn = sortColumnMap[sortBy] || leads.createdAt;
    const orderByClause = sortOrder === 'asc' ? sortColumn : desc(sortColumn);

    // Get leads
    const offset = (page - 1) * limit;
    const results = await db.query.leads.findMany({
      where: and(...conditions),
      orderBy: [orderByClause],
      limit,
      offset,
      columns: {
        id: true,
        email: true,
        name: true,
        company: true,
        phone: true,
        status: true,
        score: true,
        source: true,
        responses: true,
        customFields: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Error listing leads:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/leads
 * Create a new lead
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
    const parsedBody = createLeadSchema.safeParse(body);

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

    const { email, name, company, phone, source, status, score, responses, customFields } =
      parsedBody.data;

    // Check for duplicate email
    const existing = await db.query.leads.findFirst({
      where: and(eq(leads.organizationId, authResult.organizationId), eq(leads.email, email)),
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'Lead with this email already exists',
          existingId: existing.id,
        },
        { status: 409 }
      );
    }

    // Create lead
    const [newLead] = await db
      .insert(leads)
      .values({
        organizationId: authResult.organizationId,
        email,
        name,
        company,
        phone,
        source,
        status,
        score,
        responses: responses ?? {},
        customFields: customFields ?? {},
      })
      .returning();

    return NextResponse.json(
      {
        data: newLead,
        message: 'Lead created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create lead' },
      { status: 500 }
    );
  }
}
