import type { NextRequest } from 'next/server';

/**
 * レート制限の設定
 */
export interface RateLimitConfig {
  /** 期間内の最大リクエスト数 */
  max: number;
  /** 期間（ミリ秒） */
  windowMs: number;
  /** スキップ条件（オプション） */
  skip?: (request: NextRequest) => boolean;
  /** カスタムキー生成（オプション） */
  keyGenerator?: (request: NextRequest) => string;
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
  /** Webhook送信: 50リクエスト/分 */
  webhook: { max: 50, windowMs: 60 * 1000 },
  /** AI機能: 20リクエスト/分 */
  ai: { max: 20, windowMs: 60 * 1000 },
  /** エクスポート: 10リクエスト/分 */
  export: { max: 10, windowMs: 60 * 1000 },
  /** ファイルアップロード: 30リクエスト/分 */
  upload: { max: 30, windowMs: 60 * 1000 },
  /** 検索: 60リクエスト/分 */
  search: { max: 60, windowMs: 60 * 1000 },
  /** 診断フォーム送信: 30リクエスト/分 */
  diagnostic: { max: 30, windowMs: 60 * 1000 },
  /** REST API v2: 200リクエスト/分 */
  restApiV2: { max: 200, windowMs: 60 * 1000 },
  /** GraphQL: 100リクエスト/分 */
  graphql: { max: 100, windowMs: 60 * 1000 },
};

/**
 * エンドポイント別の詳細レート制限マッピング
 */
export const ENDPOINT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // 認証
  '/api/auth/login': { max: 5, windowMs: 60 * 1000 },
  '/api/auth/signup': { max: 3, windowMs: 60 * 1000 },
  '/api/auth/forgot-password': { max: 3, windowMs: 60 * 1000 },
  '/api/auth/reset-password': { max: 3, windowMs: 60 * 1000 },

  // AI機能
  '/api/trpc/ai.scoreLeads': { max: 10, windowMs: 60 * 1000 },
  '/api/trpc/ai.chat': { max: 30, windowMs: 60 * 1000 },
  '/api/trpc/ai.search': { max: 30, windowMs: 60 * 1000 },

  // エクスポート
  '/api/trpc/leads.export': { max: 5, windowMs: 60 * 1000 },
  '/api/trpc/reports.export': { max: 5, windowMs: 60 * 1000 },
  '/api/trpc/auditLogs.export': { max: 3, windowMs: 60 * 1000 },

  // バルク操作
  '/api/trpc/leads.bulkCreate': { max: 10, windowMs: 60 * 1000 },
  '/api/trpc/leads.bulkUpdate': { max: 10, windowMs: 60 * 1000 },
  '/api/trpc/leads.bulkDelete': { max: 5, windowMs: 60 * 1000 },

  // Webhook
  '/api/trpc/webhooks.test': { max: 10, windowMs: 60 * 1000 },

  // REST API v2
  '/api/v2/leads': { max: 200, windowMs: 60 * 1000 },
  '/api/v2/webhooks': { max: 100, windowMs: 60 * 1000 },
  '/api/v2/analytics': { max: 60, windowMs: 60 * 1000 },

  // 診断
  '/api/diagnostic': { max: 30, windowMs: 60 * 1000 },
  '/api/embed/v1/diagnostic': { max: 60, windowMs: 60 * 1000 },
  '/api/embed/v1/lead': { max: 60, windowMs: 60 * 1000 },

  // GraphQL
  '/api/graphql': { max: 100, windowMs: 60 * 1000 },
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
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0] : (realIp ?? 'unknown');
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
  // エンドポイント別の設定をチェック（完全一致）
  if (ENDPOINT_RATE_LIMITS[pathname]) {
    return ENDPOINT_RATE_LIMITS[pathname];
  }

  // パスプレフィックスでマッチング
  for (const [endpoint, config] of Object.entries(ENDPOINT_RATE_LIMITS)) {
    if (pathname.startsWith(endpoint)) {
      return config;
    }
  }

  // 認証エンドポイント
  if (pathname.startsWith('/api/auth')) {
    return DEFAULT_RATE_LIMITS.auth;
  }

  // AI機能
  if (pathname.includes('/ai.') || pathname.includes('/ai/')) {
    return DEFAULT_RATE_LIMITS.ai;
  }

  // エクスポート機能
  if (pathname.includes('export') || pathname.includes('Export')) {
    return DEFAULT_RATE_LIMITS.export;
  }

  // GraphQL
  if (pathname.startsWith('/api/graphql')) {
    return DEFAULT_RATE_LIMITS.graphql;
  }

  // REST API v2
  if (pathname.startsWith('/api/v2')) {
    return DEFAULT_RATE_LIMITS.restApiV2;
  }

  // 診断フォーム
  if (pathname.includes('diagnostic') || pathname.includes('embed')) {
    return DEFAULT_RATE_LIMITS.diagnostic;
  }

  // API エンドポイント
  if (pathname.startsWith('/api')) {
    return DEFAULT_RATE_LIMITS.api;
  }

  // 一般ページ
  return DEFAULT_RATE_LIMITS.page;
}

/**
 * 組織IDを含むレート制限キーを生成
 */
export function getOrganizationRateLimitKey(request: NextRequest, organizationId: string): string {
  const identifier = getIdentifier(request);
  return `org:${organizationId}:${identifier}:${request.nextUrl.pathname}`;
}

/**
 * レート制限結果の型
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * レート制限情報を取得（ヘッダー用）
 */
export function getRateLimitInfo(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}
