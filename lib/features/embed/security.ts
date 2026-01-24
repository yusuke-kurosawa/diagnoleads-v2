import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

// In-memory CSRF token store (for production, use Redis)
const csrfTokenStore = new Map<string, { token: string; expiresAt: number; apiKey: string }>();
const CSRF_TOKEN_TTL = 15 * 60 * 1000; // 15 minutes

// In-memory rate limit store (for production, use Redis)
interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();

  // Clean CSRF tokens
  for (const [key, value] of csrfTokenStore.entries()) {
    if (value.expiresAt < now) {
      csrfTokenStore.delete(key);
    }
  }

  // Clean rate limit entries older than 1 day
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.windowStart < oneDayAgo) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Every minute

/**
 * Generate a secure API key for embed widget authentication
 * Format: dl_embed_{random_32_bytes_hex}
 */
export function generateApiKey(): string {
  const randomPart = randomBytes(32).toString('hex');
  return `dl_embed_${randomPart}`;
}

/**
 * Hash an API key for secure storage using SHA-256
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(apiKey: string, hash: string): boolean {
  const inputHash = hashApiKey(apiKey);
  return inputHash === hash;
}

/**
 * Hash an IP address for privacy-compliant logging
 * Uses SHA-256 with a salt to prevent rainbow table attacks
 */
export function hashIpAddress(ipAddress: string, salt?: string): string {
  const saltValue = salt || process.env.IP_HASH_SALT || 'diagnoleads-default-salt';
  return createHash('sha256').update(`${ipAddress}:${saltValue}`).digest('hex').substring(0, 16);
}

/**
 * Check if an origin matches any of the allowed patterns
 * Supports wildcard subdomains: https://*.example.com
 */
export function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  if (allowedOrigins.length === 0) return false;

  for (const allowed of allowedOrigins) {
    if (allowed === '*') return true;
    if (allowed === origin) return true;

    // Handle wildcard subdomain patterns (e.g., https://*.example.com)
    if (allowed.includes('*')) {
      const escapedPattern: string = allowed
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
        .replace(/\*/g, '[a-zA-Z0-9-]+'); // Replace * with subdomain pattern
      const wildcardRegex: RegExp = new RegExp(`^${escapedPattern}$`);
      if (wildcardRegex.test(origin)) return true;
    }
  }

  return false;
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Generate CSRF token and store it
 * @param apiKey - API key to associate with the token
 * @returns The generated token
 */
export function generateCsrfToken(apiKey?: string): string {
  const token = randomBytes(32).toString('hex');

  if (apiKey) {
    csrfTokenStore.set(token, {
      token,
      expiresAt: Date.now() + CSRF_TOKEN_TTL,
      apiKey,
    });
  }

  return token;
}

/**
 * Validate a CSRF token
 * @param token - The token to validate
 * @param apiKey - The API key that should be associated with this token
 * @returns True if valid, false otherwise
 */
export function validateCsrfToken(token: string | null, apiKey: string): boolean {
  if (!token) return false;

  const stored = csrfTokenStore.get(token);
  if (!stored) return false;

  // Check expiration
  if (stored.expiresAt < Date.now()) {
    csrfTokenStore.delete(token);
    return false;
  }

  // Check API key matches using timing-safe comparison
  try {
    const tokenApiKey = Buffer.from(stored.apiKey, 'utf8');
    const providedApiKey = Buffer.from(apiKey, 'utf8');

    if (tokenApiKey.length !== providedApiKey.length) {
      return false;
    }

    const isValid = timingSafeEqual(tokenApiKey, providedApiKey);

    // Invalidate token after use (one-time use)
    if (isValid) {
      csrfTokenStore.delete(token);
    }

    return isValid;
  } catch {
    return false;
  }
}

/**
 * Get CSRF token store size (for monitoring/testing)
 */
export function getCsrfTokenStoreSize(): number {
  return csrfTokenStore.size;
}

/**
 * Security headers for embed API responses
 */
export function getSecurityHeaders(origin: string | null): Record<string, string> {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...(origin && {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-DiagnoLeads-Key, X-CSRF-Token',
      'Access-Control-Max-Age': '86400',
    }),
  };
}

/**
 * Rate limit key generator
 */
export function getRateLimitKey(embedConfigId: string, type: 'minute' | 'day'): string {
  const now = new Date();
  const timeKey =
    type === 'minute'
      ? `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`
      : `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
  return `embed:ratelimit:${embedConfigId}:${type}:${timeKey}`;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  type: 'minute' | 'day';
}

/**
 * Check and update rate limit
 * Uses sliding window counter algorithm
 * @param embedConfigId - The embed config ID
 * @param limitPerMinute - Maximum requests per minute
 * @param limitPerDay - Maximum requests per day
 * @returns RateLimitResult indicating if request is allowed
 */
export function checkRateLimit(
  embedConfigId: string,
  limitPerMinute: number,
  limitPerDay: number
): RateLimitResult {
  const now = Date.now();
  const minuteKey = getRateLimitKey(embedConfigId, 'minute');
  const dayKey = getRateLimitKey(embedConfigId, 'day');

  // Check minute limit
  const minuteWindow = 60 * 1000; // 1 minute in ms
  const minuteEntry = rateLimitStore.get(minuteKey);

  if (minuteEntry) {
    const windowAge = now - minuteEntry.windowStart;
    if (windowAge < minuteWindow) {
      // Within current window
      if (minuteEntry.count >= limitPerMinute) {
        return {
          allowed: false,
          remaining: 0,
          limit: limitPerMinute,
          resetAt: minuteEntry.windowStart + minuteWindow,
          type: 'minute',
        };
      }
      minuteEntry.count++;
    } else {
      // New window
      minuteEntry.count = 1;
      minuteEntry.windowStart = now;
    }
  } else {
    rateLimitStore.set(minuteKey, { count: 1, windowStart: now });
  }

  // Check day limit
  const dayWindow = 24 * 60 * 60 * 1000; // 24 hours in ms
  const dayEntry = rateLimitStore.get(dayKey);

  if (dayEntry) {
    const windowAge = now - dayEntry.windowStart;
    if (windowAge < dayWindow) {
      // Within current window
      if (dayEntry.count >= limitPerDay) {
        return {
          allowed: false,
          remaining: 0,
          limit: limitPerDay,
          resetAt: dayEntry.windowStart + dayWindow,
          type: 'day',
        };
      }
      dayEntry.count++;
    } else {
      // New window
      dayEntry.count = 1;
      dayEntry.windowStart = now;
    }
  } else {
    rateLimitStore.set(dayKey, { count: 1, windowStart: now });
  }

  // Calculate remaining - entries are guaranteed to exist at this point
  const currentMinuteEntry = rateLimitStore.get(minuteKey);
  const currentDayEntry = rateLimitStore.get(dayKey);

  if (!currentMinuteEntry || !currentDayEntry) {
    // Should never happen, but return safe default
    return {
      allowed: true,
      remaining: limitPerMinute - 1,
      limit: limitPerMinute,
      resetAt: now + 60 * 1000,
      type: 'minute',
    };
  }

  const minuteRemaining = Math.max(0, limitPerMinute - currentMinuteEntry.count);
  const dayRemaining = Math.max(0, limitPerDay - currentDayEntry.count);

  // Return the more restrictive limit info
  if (minuteRemaining <= dayRemaining) {
    return {
      allowed: true,
      remaining: minuteRemaining,
      limit: limitPerMinute,
      resetAt: currentMinuteEntry.windowStart + 60 * 1000,
      type: 'minute',
    };
  }

  return {
    allowed: true,
    remaining: dayRemaining,
    limit: limitPerDay,
    resetAt: currentDayEntry.windowStart + dayWindow,
    type: 'day',
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    'X-RateLimit-Type': result.type,
  };
}

/**
 * Clear rate limit store (for testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
