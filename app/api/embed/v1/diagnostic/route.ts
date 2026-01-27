import { db } from '@/lib/db';
import { diagnosticTemplates, embedAccessLogs, embedConfigs } from '@/lib/db/schema';
import {
  checkRateLimit,
  generateCsrfToken,
  getRateLimitHeaders,
  getSecurityHeaders,
  hashIpAddress,
  isOriginAllowed,
} from '@/lib/features/embed/security';
import type { EmbedAccessLogEntry, PublicDiagnosticResponse } from '@/lib/features/embed/types';
import { and, eq } from 'drizzle-orm';
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
 * GET /api/embed/v1/diagnostic
 * Fetch diagnostic template for embedding
 *
 * Required headers:
 * - X-DiagnoLeads-Key: API key for authentication
 *
 * Security:
 * - API key validation
 * - Origin whitelist check
 * - Rate limiting
 * - Access logging
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const userAgent = request.headers.get('user-agent');
  const apiKey = request.headers.get('x-diagnoleads-key');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  const logEntry: EmbedAccessLogEntry = {
    embedConfigId: null,
    organizationId: null,
    origin,
    ipAddressHash: hashIpAddress(ip),
    userAgent,
    endpoint: '/api/embed/v1/diagnostic',
    method: 'GET',
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
      with: {
        diagnosticTemplate: true,
        organization: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
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
      logEntry.errorMessage = 'Embed configuration is inactive';
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
      logEntry.errorMessage = 'Embed configuration has expired';
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
      logEntry.errorMessage = `Origin ${requestOrigin} is not in the allowed list`;
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

    // 7. Get diagnostic template
    let template = config.diagnosticTemplate ?? null;
    if (!template) {
      // Get default template for organization
      const defaultTemplate = await db.query.diagnosticTemplates.findFirst({
        where: and(
          eq(diagnosticTemplates.organizationId, config.organizationId),
          eq(diagnosticTemplates.isDefault, true),
          eq(diagnosticTemplates.isActive, true)
        ),
      });
      template = defaultTemplate ?? null;
    }

    if (!template) {
      logEntry.statusCode = 404;
      logEntry.errorCode = 'NO_TEMPLATE';
      logEntry.errorMessage = 'No diagnostic template configured';
      await logAccess(logEntry, startTime);
      return NextResponse.json(
        { error: 'Not Found', code: 'NO_TEMPLATE' },
        { status: 404, headers: getSecurityHeaders(origin) }
      );
    }

    // 8. Generate CSRF token for form submission (associated with API key)
    const csrfToken = generateCsrfToken(apiKey);

    // 9. Build public response (strip internal data)
    const response: PublicDiagnosticResponse = {
      id: template.id,
      title: template.title,
      description: template.description || undefined,
      steps: (template.steps || []).map((step) => ({
        id: step.id,
        title: step.title,
        description: step.description,
        questions: (step.questions || []).map((q) => ({
          id: q.id,
          type: q.type,
          label: q.label,
          description: q.description,
          placeholder: q.placeholder,
          required: q.required,
          options: q.options?.map((o) => ({ id: o.id, label: o.label, value: o.value })),
          validation: q.validation,
          order: q.order,
        })),
        order: step.order,
      })),
      theme: config.themeOverrides ?? template.theme ?? undefined,
      csrfToken,
    };

    // 10. Update usage statistics
    await db
      .update(embedConfigs)
      .set({
        lastUsedAt: new Date(),
        usageCount: (config.usageCount || 0) + 1,
      })
      .where(eq(embedConfigs.id, config.id));

    // 11. Log successful access
    await logAccess(logEntry, startTime);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getSecurityHeaders(origin),
        ...getRateLimitHeaders(rateLimitResult),
        'Cache-Control': 'private, max-age=300', // 5 minute cache
      },
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
      userAgent: entry.userAgent?.substring(0, 500), // Truncate long user agents
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
