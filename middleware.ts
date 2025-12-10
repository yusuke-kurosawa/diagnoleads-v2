import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { intlMiddleware, shouldSkipI18nMiddleware, stripLocalePrefix } from './lib/i18n/middleware';
// import { auth } from './lib/auth/config'; // TODO: Edge Runtimeで動作しないため一時的にコメントアウト
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
 * Cache control headers for static assets
 */
function getCacheHeaders(pathname: string): Record<string, string> {
  // Static assets - cache for 1 year
  if (pathname.match(/\.(js|css|woff|woff2|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp|avif)$/)) {
    return {
      'Cache-Control': 'public, max-age=31536000, immutable',
    };
  }

  // API routes - no cache
  if (pathname.startsWith('/api/')) {
    return {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    };
  }

  // HTML pages - short cache with revalidation
  return {
    'Cache-Control': 'public, max-age=0, must-revalidate',
  };
}

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
    font-src 'self' data:;
    connect-src 'self' ws: wss:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `
    : // Production: 厳格な CSP
      `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
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
 * Runs before every request to check i18n, rate limit, authentication, and add security headers
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle i18n (locale routing)
  // Skip i18n for API routes, static files, etc.
  if (!shouldSkipI18nMiddleware(pathname)) {
    const intlResponse = intlMiddleware(request);
    // If i18n middleware returns a redirect, return it immediately
    if (intlResponse && intlResponse.status === 307) {
      return intlResponse;
    }
  }

  // Strip locale prefix for route checking
  // Example: /ja/dashboard -> /dashboard
  const pathnameWithoutLocale = stripLocalePrefix(pathname);

  // 2. Check rate limit
  const rateLimitConfig = getRateLimitConfig(pathnameWithoutLocale);
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

  // 3. Get security headers
  const securityHeaders = getSecurityHeaders(request);

  // 4. Create response (authentication temporarily disabled for i18n testing)
  // TODO: Re-enable authentication after migrating to Node.js Runtime or API Route-based auth
  const response = NextResponse.next();

  // // Allow public routes
  // if (isPublicRoute(pathnameWithoutLocale)) {
  //   response = NextResponse.next();
  // }
  // // Allow public API routes
  // else if (isPublicApiRoute(pathnameWithoutLocale)) {
  //   response = NextResponse.next();
  // }
  // // Check authentication for protected routes
  // else {
  //   try {
  //     const session = await auth.api.getSession({
  //       headers: request.headers,
  //     });

  //     if (!session) {
  //       // Redirect to login page with locale prefix
  //       const loginUrl = new URL(pathname.replace(pathnameWithoutLocale, '/login'), request.url);
  //       loginUrl.searchParams.set('callbackUrl', pathname);
  //       response = NextResponse.redirect(loginUrl);
  //     } else {
  //       response = NextResponse.next();
  //     }
  //   } catch (error) {
  //     console.error('Middleware auth error:', error);
  //     // Redirect to home with locale prefix
  //     const homeUrl = new URL(pathname.replace(pathnameWithoutLocale, '/'), request.url);
  //     response = NextResponse.redirect(homeUrl);
  //   }
  // }

  // 5. Add rate limit headers to response
  setRateLimitHeaders(response.headers, rateLimitResult);

  // 6. Add security headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // 7. Add cache control headers
  const cacheHeaders = getCacheHeaders(pathname);
  Object.entries(cacheHeaders).forEach(([key, value]) => {
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
     * - admin (PayloadCMS admin panel)
     */
    '/((?!_next/static|_next/image|favicon.ico|admin|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
