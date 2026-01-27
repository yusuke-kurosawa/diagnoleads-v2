/**
 * CMS Cache Layer
 *
 * Next.js 15のunstable_cacheを使用したキャッシュ戦略
 * - タグベースのキャッシュ無効化
 * - 自動再検証
 * - キャッシュキー生成
 */

import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

// =============================================================================
// Cache Configuration
// =============================================================================

export const CMS_CACHE_CONFIG = {
  // デフォルトの再検証時間（秒）
  defaultRevalidate: 60,

  // コレクション別の再検証時間
  collections: {
    'diagnostic-forms': 300, // 5分
    'blog-posts': 60, // 1分
    faqs: 300, // 5分
    'landing-pages': 300, // 5分
    media: 3600, // 1時間
  } as Record<string, number>,

  // キャッシュタグのプレフィックス
  tagPrefix: 'cms',
} as const;

// =============================================================================
// Cache Tags
// =============================================================================

/**
 * コレクション用のキャッシュタグを生成
 */
export function getCollectionTag(collection: string): string {
  return `${CMS_CACHE_CONFIG.tagPrefix}:${collection}`;
}

/**
 * ドキュメント用のキャッシュタグを生成
 */
export function getDocumentTag(collection: string, id: string): string {
  return `${CMS_CACHE_CONFIG.tagPrefix}:${collection}:${id}`;
}

/**
 * スラッグ用のキャッシュタグを生成
 */
export function getSlugTag(collection: string, slug: string): string {
  return `${CMS_CACHE_CONFIG.tagPrefix}:${collection}:slug:${slug}`;
}

/**
 * 組織用のキャッシュタグを生成
 */
export function getOrganizationTag(organizationId: string): string {
  return `${CMS_CACHE_CONFIG.tagPrefix}:org:${organizationId}`;
}

// =============================================================================
// Cache Key Generation
// =============================================================================

/**
 * 検索パラメータからキャッシュキーを生成
 */
export function generateCacheKey(params: Record<string, unknown>): string {
  const sortedEntries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b));

  return sortedEntries
    .map(([key, value]) => {
      if (typeof value === 'object') {
        return `${key}:${JSON.stringify(value)}`;
      }
      return `${key}:${value}`;
    })
    .join('|');
}

// =============================================================================
// Cache Invalidation
// =============================================================================

/**
 * コレクション全体のキャッシュを無効化
 */
export async function invalidateCollection(collection: string): Promise<void> {
  revalidateTag(getCollectionTag(collection));
}

/**
 * 特定のドキュメントのキャッシュを無効化
 */
export async function invalidateDocument(collection: string, id: string): Promise<void> {
  revalidateTag(getDocumentTag(collection, id));
  revalidateTag(getCollectionTag(collection));
}

/**
 * スラッグに基づくキャッシュを無効化
 */
export async function invalidateBySlug(collection: string, slug: string): Promise<void> {
  revalidateTag(getSlugTag(collection, slug));
  revalidateTag(getCollectionTag(collection));
}

/**
 * 組織のコンテンツキャッシュを無効化
 */
export async function invalidateOrganization(organizationId: string): Promise<void> {
  revalidateTag(getOrganizationTag(organizationId));
}

/**
 * すべてのCMSキャッシュを無効化
 */
export async function invalidateAllCMS(): Promise<void> {
  revalidateTag(CMS_CACHE_CONFIG.tagPrefix);
}

// =============================================================================
// Cached Query Wrapper
// =============================================================================

/**
 * キャッシュ付きクエリを作成
 *
 * @example
 * ```typescript
 * const cachedFind = createCachedQuery(
 *   'blog-posts',
 *   async (params) => repository.findAll(params),
 *   { limit: 10 }
 * );
 * const result = await cachedFind({ limit: 10 });
 * ```
 */
export function createCachedQuery<TParams extends Record<string, unknown>, TResult>(
  collection: string,
  queryFn: (params: TParams) => Promise<TResult>,
  defaultParams?: Partial<TParams>
): (params: TParams) => Promise<TResult> {
  const revalidate = CMS_CACHE_CONFIG.collections[collection] || CMS_CACHE_CONFIG.defaultRevalidate;

  return async (params: TParams) => {
    const mergedParams = { ...defaultParams, ...params } as TParams;
    const cacheKey = generateCacheKey(mergedParams as Record<string, unknown>);

    const cached = unstable_cache(
      async () => queryFn(mergedParams),
      [`cms-query:${collection}:${cacheKey}`],
      {
        revalidate,
        tags: [CMS_CACHE_CONFIG.tagPrefix, getCollectionTag(collection)],
      }
    );

    return cached();
  };
}

/**
 * IDによるドキュメント取得のキャッシュラッパー
 */
export function createCachedFindById<TResult>(
  collection: string,
  findFn: (id: string) => Promise<TResult>
): (id: string) => Promise<TResult> {
  const revalidate = CMS_CACHE_CONFIG.collections[collection] || CMS_CACHE_CONFIG.defaultRevalidate;

  return async (id: string) => {
    const cached = unstable_cache(async () => findFn(id), [`cms-doc:${collection}:${id}`], {
      revalidate,
      tags: [
        CMS_CACHE_CONFIG.tagPrefix,
        getCollectionTag(collection),
        getDocumentTag(collection, id),
      ],
    });

    return cached();
  };
}

/**
 * スラッグによるドキュメント取得のキャッシュラッパー
 */
export function createCachedFindBySlug<TResult>(
  collection: string,
  findFn: (slug: string) => Promise<TResult>
): (slug: string) => Promise<TResult> {
  const revalidate = CMS_CACHE_CONFIG.collections[collection] || CMS_CACHE_CONFIG.defaultRevalidate;

  return async (slug: string) => {
    const cached = unstable_cache(async () => findFn(slug), [`cms-slug:${collection}:${slug}`], {
      revalidate,
      tags: [
        CMS_CACHE_CONFIG.tagPrefix,
        getCollectionTag(collection),
        getSlugTag(collection, slug),
      ],
    });

    return cached();
  };
}

// =============================================================================
// Cache Statistics (Development)
// =============================================================================

let cacheHits = 0;
let cacheMisses = 0;

export function getCacheStats() {
  return {
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: cacheHits + cacheMisses > 0 ? cacheHits / (cacheHits + cacheMisses) : 0,
  };
}

export function resetCacheStats() {
  cacheHits = 0;
  cacheMisses = 0;
}

// Note: These stats are primarily for development/debugging
// In production, use monitoring tools like Vercel Analytics
