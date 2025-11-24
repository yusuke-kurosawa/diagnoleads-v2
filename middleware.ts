import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './lib/auth/config';
import {
  checkRateLimit,
  getRateLimitConfig,
  setRateLimitHeaders,
} from './lib/middleware/rate-limit';

/**
 * Public routes that don't require authentication
 */
const publicRoutes = ['/', '/api/auth'];

/**
 * API routes that should always be accessible
 */
const publicApiRoutes = ['/api/auth', '/api/trpc'];

/**
 * Security headers including CSP
 */
function getSecurityHeaders(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Content Security Policy
  const cspHeader = isDevelopment
    ? // Development: より緩い CSP（Hot Reload 対応）
      `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    : // Production: 厳格な CSP
      `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  return {
    // Content Security Policy
    'Content-Security-Policy': cspHeader.replace(/\s{2,}/g, ' ').trim(),

    // セキュリティヘッダー
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

    // CSP nonce for inline scripts
    'X-Nonce': nonce,
  };
}

/**
 * Check if a route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(route));
}

/**
 * Check if an API route is public
 */
function isPublicApiRoute(pathname: string): boolean {
  return publicApiRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Next.js Middleware
 * Runs before every request to check rate limit, authentication, and add security headers
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check rate limit
  const rateLimitConfig = getRateLimitConfig(pathname);
  const rateLimitResult = checkRateLimit(request, rateLimitConfig);

  if (!rateLimitResult.allowed) {
    // Rate limit exceeded
    const response = NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'レート制限を超過しました。しばらくしてから再度お試しください。',
      },
      { status: 429 }
    );

    setRateLimitHeaders(response.headers, rateLimitResult);
    return response;
  }

  // Get security headers
  const securityHeaders = getSecurityHeaders(request);

  // Create response
  let response: NextResponse;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    response = NextResponse.next();
  }
  // Allow public API routes
  else if (isPublicApiRoute(pathname)) {
    response = NextResponse.next();
  }
  // Check authentication for protected routes
  else {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        // Redirect to login page
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        response = NextResponse.redirect(loginUrl);
      } else {
        response = NextResponse.next();
      }
    } catch (error) {
      console.error('Middleware auth error:', error);
      response = NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Add rate limit headers to response
  setRateLimitHeaders(response.headers, rateLimitResult);

  // Add security headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Configure which routes use this middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
