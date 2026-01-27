import { auth } from '@/lib/auth';
/**
 * REST API v2 - Analytics Endpoint
 *
 * GET /api/v2/analytics - Get analytics overview
 */
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { and, avg, count, eq, gte, lte, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
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
// Handler
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedOrganization(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsedQuery = analyticsQuerySchema.safeParse(queryParams);

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

    const { startDate, endDate } = parsedQuery.data;

    // Build date conditions
    const dateConditions = [eq(leads.organizationId, authResult.organizationId)];
    if (startDate) {
      dateConditions.push(gte(leads.createdAt, new Date(startDate)));
    }
    if (endDate) {
      dateConditions.push(lte(leads.createdAt, new Date(endDate)));
    }

    // Get overview stats
    const [overviewStats] = await db
      .select({
        totalLeads: count(),
        avgScore: avg(leads.score),
      })
      .from(leads)
      .where(and(...dateConditions));

    // Get status breakdown
    const statusBreakdown = await db
      .select({
        status: leads.status,
        count: count(),
      })
      .from(leads)
      .where(and(...dateConditions))
      .groupBy(leads.status);

    // Get source breakdown
    const sourceBreakdown = await db
      .select({
        source: leads.source,
        count: count(),
      })
      .from(leads)
      .where(and(...dateConditions))
      .groupBy(leads.source);

    // Get daily trend (last 30 days if no date range specified)
    const trendStartDate = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trendEndDate = endDate ? new Date(endDate) : new Date();

    const dailyTrend = await db
      .select({
        date: sql<string>`DATE(${leads.createdAt})`,
        count: count(),
        avgScore: avg(leads.score),
      })
      .from(leads)
      .where(
        and(
          eq(leads.organizationId, authResult.organizationId),
          gte(leads.createdAt, trendStartDate),
          lte(leads.createdAt, trendEndDate)
        )
      )
      .groupBy(sql`DATE(${leads.createdAt})`)
      .orderBy(sql`DATE(${leads.createdAt})`);

    // Calculate conversion rate
    const totalLeads = Number(overviewStats?.totalLeads ?? 0);
    const convertedLeads = statusBreakdown.find((s) => s.status === 'converted')?.count ?? 0;
    const conversionRate = totalLeads > 0 ? (Number(convertedLeads) / totalLeads) * 100 : 0;

    return NextResponse.json({
      data: {
        overview: {
          totalLeads,
          averageScore: overviewStats?.avgScore
            ? Math.round(Number(overviewStats.avgScore) * 100) / 100
            : null,
          conversionRate: Math.round(conversionRate * 100) / 100,
        },
        statusBreakdown: statusBreakdown.map((s) => ({
          status: s.status,
          count: Number(s.count),
          percentage: totalLeads > 0 ? Math.round((Number(s.count) / totalLeads) * 10000) / 100 : 0,
        })),
        sourceBreakdown: sourceBreakdown.map((s) => ({
          source: s.source ?? 'unknown',
          count: Number(s.count),
          percentage: totalLeads > 0 ? Math.round((Number(s.count) / totalLeads) * 10000) / 100 : 0,
        })),
        trend: dailyTrend.map((d) => ({
          date: d.date,
          count: Number(d.count),
          avgScore: d.avgScore ? Math.round(Number(d.avgScore) * 100) / 100 : null,
        })),
      },
      meta: {
        dateRange: {
          start: startDate ?? trendStartDate.toISOString(),
          end: endDate ?? trendEndDate.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
