import { db } from '@/lib/db';
import { embedAccessLogs, embedConfigs, leads } from '@/lib/db/schema';
import {
  checkRateLimit,
  getRateLimitHeaders,
  getSecurityHeaders,
  hashIpAddress,
  isOriginAllowed,
  sanitizeHtml,
  validateCsrfToken,
} from '@/lib/features/embed/security';
import { publicLeadSubmissionSchema } from '@/lib/features/embed/types';
import type { EmbedAccessLogEntry, PublicLeadSubmissionResponse } from '@/lib/features/embed/types';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: getSecurityHeaders(origin),
  });
}

/**
 * POST /api/embed/v1/lead
 * Submit a lead from the embedded widget
 *
 * Required headers:
 * - X-DiagnoLeads-Key: API key for authentication
 *
 * Body:
 * - email: string (required)
 * - name: string (optional)
 * - company: string (optional)
 * - phone: string (optional)
 * - responses: object (optional)
 * - csrfToken: string (required)
 *
 * Security:
 * - API key validation
 * - Origin whitelist check
 * - CSRF token validation
 * - Input sanitization
 * - Rate limiting
 * - Access logging
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const userAgent = request.headers.get('user-agent');
  const apiKey = request.headers.get('x-diagnoleads-key');
  const csrfToken = request.headers.get('x-csrf-token');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  const logEntry: EmbedAccessLogEntry = {
    embedConfigId: null,
    organizationId: null,
    origin,
    ipAddressHash: hashIpAddress(ip),
    userAgent,
    endpoint: '/api/embed/v1/lead',
    method: 'POST',
    statusCode: 200,
  };

  try {
    // 1. Validate API key presence
    if (!apiKey) {
      logEntry.statusCode = 401;
      logEntry.errorCode = 'MISSING_API_KEY';
      logEntry.errorMessage = 'X-DiagnoLeads-Key header is required';
      await logAccess(logEntry, startTime);
      return NextResponse.json(
        { error: 'Unauthorized', code: 'MISSING_API_KEY' },
        { status: 401, headers: getSecurityHeaders(origin) }
      );
    }

    // 2. Find embed config by API key
    const config = await db.query.embedConfigs.findFirst({
      where: eq(embedConfigs.apiKey, apiKey),
    });

    if (!config) {
      logEntry.statusCode = 403;
      logEntry.errorCode = 'INVALID_API_KEY';
      logEntry.errorMessage = 'Invalid API key';
      await logAccess(logEntry, startTime);
      return NextResponse.json(
        { error: 'Forbidden', code: 'INVALID_API_KEY' },
        { status: 403, headers: getSecurityHeaders(origin) }
      );
    }

    logEntry.embedConfigId = config.id;
    logEntry.organizationId = config.organizationId;

    // 3. Check if config is active
    if (!config.isActive) {
      logEntry.statusCode = 403;
      logEntry.errorCode = 'CONFIG_INACTIVE';
      await logAccess(logEntry, startTime);
      return NextResponse.json(
        { error: 'Forbidden', code: 'CONFIG_INACTIVE' },
        { status: 403, headers: getSecurityHeaders(origin) }
      );
    }

    // 4. Check expiration
    if (config.expiresAt && new Date(config.expiresAt) < new Date()) {
      logEntry.statusCode = 403;
      logEntry.errorCode = 'CONFIG_EXPIRED';
      await logAccess(logEntry, startTime);
      return NextResponse.json(
        { error: 'Forbidden', code: 'CONFIG_EXPIRED' },
        { status: 403, headers: getSecurityHeaders(origin) }
      );
    }

    // 5. Validate origin
    const requestOrigin = origin || (referer ? new URL(referer).origin : null);
    if (!isOriginAllowed(requestOrigin, config.allowedOrigins)) {
      logEntry.statusCode = 403;
      logEntry.errorCode = 'ORIGIN_NOT_ALLOWED';
      await logAccess(logEntry, startTime);
      return NextResponse.json(
        { error: 'Forbidden', code: 'ORIGIN_NOT_ALLOWED' },
        { status: 403, headers: getSecurityHeaders(origin) }
      );
    }

    // 6. Check rate limit
    const rateLimitResult = checkRateLimit(
      config.id,
      config.rateLimitPerMinute,
      config.rateLimitPerDay
    );

    if (!rateLimitResult.allowed) {
      logEntry.statusCode = 429;
      logEntry.errorCode = 'RATE_LIMIT_EXCEEDED';
      logEntry.errorMessage = `Rate limit exceeded (${rateLimitResult.type})`;
      await logAccess(logEntry, startTime);
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(origin),
            ...getRateLimitHeaders(rateLimitResult),
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 7. Validate CSRF token
    if (!validateCsrfToken(csrfToken, apiKey)) {
      logEntry.statusCode = 403;
      logEntry.errorCode = 'INVALID_CSRF_TOKEN';
      logEntry.errorMessage = 'CSRF token is missing, expired, or invalid';
      await logAccess(logEntry, startTime);
      return NextResponse.json(
        { error: 'Forbidden', code: 'INVALID_CSRF_TOKEN' },
        { status: 403, headers: getSecurityHeaders(origin) }
      );
    }

    // 8. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      logEntry.statusCode = 400;
      logEntry.errorCode = 'INVALID_JSON';
      await logAccess(logEntry, startTime);
      return NextResponse.json(
        { error: 'Bad Request', code: 'INVALID_JSON' },
        { status: 400, headers: getSecurityHeaders(origin) }
      );
    }

    const validationResult = publicLeadSubmissionSchema.safeParse(body);
    if (!validationResult.success) {
      logEntry.statusCode = 400;
      logEntry.errorCode = 'VALIDATION_ERROR';
      logEntry.errorMessage = validationResult.error.message;
      await logAccess(logEntry, startTime);
      return NextResponse.json(
        { error: 'Bad Request', code: 'VALIDATION_ERROR', details: validationResult.error.errors },
        { status: 400, headers: getSecurityHeaders(origin) }
      );
    }

    const data = validationResult.data;

    // 9. Sanitize input data
    const sanitizedData = {
      email: data.email.toLowerCase().trim(),
      name: data.name ? sanitizeHtml(data.name.trim()) : null,
      company: data.company ? sanitizeHtml(data.company.trim()) : null,
      phone: data.phone ? sanitizeHtml(data.phone.trim()) : null,
      responses: data.responses || {},
    };

    // 10. Create lead
    const [lead] = await db
      .insert(leads)
      .values({
        organizationId: config.organizationId,
        email: sanitizedData.email,
        name: sanitizedData.name,
        company: sanitizedData.company,
        phone: sanitizedData.phone,
        source: config.leadSource,
        status: 'new',
        responses: sanitizedData.responses,
      })
      .returning({ id: leads.id });

    logEntry.leadId = lead.id;

    // 11. Update usage statistics
    await db
      .update(embedConfigs)
      .set({
        lastUsedAt: new Date(),
        usageCount: (config.usageCount || 0) + 1,
      })
      .where(eq(embedConfigs.id, config.id));

    // 12. Log successful access
    await logAccess(logEntry, startTime);

    const response: PublicLeadSubmissionResponse = {
      success: true,
      message: 'Lead submitted successfully',
      leadId: lead.id,
    };

    return NextResponse.json(response, {
      status: 201,
      headers: getSecurityHeaders(origin),
    });
  } catch (error) {
    console.error('Embed API error:', error);
    logEntry.statusCode = 500;
    logEntry.errorCode = 'INTERNAL_ERROR';
    logEntry.errorMessage = 'Internal server error';
    await logAccess(logEntry, startTime);
    return NextResponse.json(
      { error: 'Internal Server Error', code: 'INTERNAL_ERROR' },
      { status: 500, headers: getSecurityHeaders(origin) }
    );
  }
}

/**
 * Log access to database for audit trail
 */
async function logAccess(entry: EmbedAccessLogEntry, startTime: number) {
  try {
    await db.insert(embedAccessLogs).values({
      embedConfigId: entry.embedConfigId,
      organizationId: entry.organizationId,
      origin: entry.origin,
      ipAddressHash: entry.ipAddressHash,
      userAgent: entry.userAgent?.substring(0, 500),
      endpoint: entry.endpoint,
      method: entry.method,
      statusCode: entry.statusCode,
      errorCode: entry.errorCode,
      errorMessage: entry.errorMessage,
      leadId: entry.leadId,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Failed to log embed access:', error);
  }
}
