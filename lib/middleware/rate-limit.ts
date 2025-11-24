import type { NextRequest } from 'next/server';

/**
 * レート制限の設定
 */
export interface RateLimitConfig {
  /** 期間内の最大リクエスト数 */
  max: number;
  /** 期間（ミリ秒） */
  windowMs: number;
}

/**
 * レート制限のデフォルト設定
 */
export const DEFAULT_RATE_LIMITS = {
  /** API リクエスト: 100リクエスト/分 */
  api: { max: 100, windowMs: 60 * 1000 },
  /** 認証リクエスト: 5リクエスト/分（ブルートフォース対策） */
  auth: { max: 5, windowMs: 60 * 1000 },
  /** 一般ページ: 300リクエスト/分 */
  page: { max: 300, windowMs: 60 * 1000 },
};

/**
 * メモリベースのレート制限ストア
 * 注意: 本番環境では Redis や Upstash Redis を使用することを推奨
 */
class MemoryRateLimitStore {
  private store = new Map<
    string,
    {
      count: number;
      resetTime: number;
    }
  >();

  /**
   * クリーンアップ間隔（5分）
   */
  private cleanupInterval = 5 * 60 * 1000;

  constructor() {
    // 定期的に古いエントリをクリーンアップ
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), this.cleanupInterval);
    }
  }

  /**
   * リクエストをカウント
   */
  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // 新しいウィンドウを開始
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }

    // カウントを増やす
    entry.count += 1;
    this.store.set(key, entry);
    return entry;
  }

  /**
   * 古いエントリをクリーンアップ
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * すべてのエントリをクリア（テスト用）
   */
  clear() {
    this.store.clear();
  }
}

// シングルトンインスタンス
const rateLimitStore = new MemoryRateLimitStore();

/**
 * リクエストの識別子を取得
 */
function getIdentifier(request: NextRequest): string {
  // IP アドレスを取得（プロキシ経由の場合も考慮）
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip ?? 'unknown';
  return ip;
}

/**
 * レート制限をチェック
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const identifier = getIdentifier(request);
  const key = `${identifier}:${request.nextUrl.pathname}`;

  const { count, resetTime } = rateLimitStore.increment(key, config.windowMs);

  const allowed = count <= config.max;
  const remaining = Math.max(0, config.max - count);

  return {
    allowed,
    limit: config.max,
    remaining,
    reset: resetTime,
  };
}

/**
 * レート制限ヘッダーを設定
 */
export function setRateLimitHeaders(
  headers: Headers,
  result: ReturnType<typeof checkRateLimit>
): void {
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    headers.set('Retry-After', retryAfter.toString());
  }
}

/**
 * ルートのレート制限設定を取得
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  // 認証エンドポイント
  if (pathname.startsWith('/api/auth')) {
    return DEFAULT_RATE_LIMITS.auth;
  }

  // API エンドポイント
  if (pathname.startsWith('/api')) {
    return DEFAULT_RATE_LIMITS.api;
  }

  // 一般ページ
  return DEFAULT_RATE_LIMITS.page;
}
