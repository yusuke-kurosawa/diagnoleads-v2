/**
 * Payload CMS Cache Invalidation Hooks
 *
 * コレクション変更時に自動的にキャッシュを無効化するフック
 */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';
import { invalidateCollection, invalidateDocument, invalidateBySlug } from '@/lib/cms/core/cache';

/**
 * ドキュメント作成・更新後にキャッシュを無効化
 */
export const afterChangeInvalidateCache: CollectionAfterChangeHook = async ({
  collection,
  doc,
  operation,
}) => {
  const collectionSlug = collection.slug;

  // ドキュメントのキャッシュを無効化
  if (doc.id) {
    await invalidateDocument(collectionSlug, String(doc.id));
  }

  // スラッグがある場合はスラッグキャッシュも無効化
  if (doc.slug) {
    await invalidateBySlug(collectionSlug, String(doc.slug));
  }

  // 新規作成の場合はコレクション全体のキャッシュも無効化
  if (operation === 'create') {
    await invalidateCollection(collectionSlug);
  }

  console.log(`[CMS Cache] Invalidated: ${collectionSlug}/${doc.id} (${operation})`);

  return doc;
};

/**
 * ドキュメント削除後にキャッシュを無効化
 */
export const afterDeleteInvalidateCache: CollectionAfterDeleteHook = async ({
  collection,
  doc,
}) => {
  const collectionSlug = collection.slug;

  // ドキュメントのキャッシュを無効化
  if (doc.id) {
    await invalidateDocument(collectionSlug, String(doc.id));
  }

  // スラッグがある場合はスラッグキャッシュも無効化
  if (doc.slug) {
    await invalidateBySlug(collectionSlug, String(doc.slug));
  }

  // コレクション全体のキャッシュを無効化
  await invalidateCollection(collectionSlug);

  console.log(`[CMS Cache] Invalidated on delete: ${collectionSlug}/${doc.id}`);

  return doc;
};

/**
 * フックをコレクション設定に追加するヘルパー
 */
export function withCacheInvalidation<T extends { hooks?: Record<string, unknown[]> }>(
  config: T
): T {
  return {
    ...config,
    hooks: {
      ...config.hooks,
      afterChange: [...(config.hooks?.afterChange || []), afterChangeInvalidateCache],
      afterDelete: [...(config.hooks?.afterDelete || []), afterDeleteInvalidateCache],
    },
  } as T;
}
