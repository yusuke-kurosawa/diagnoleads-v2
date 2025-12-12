/**
 * Blog Repository
 *
 * ブログ記事のデータアクセスを抽象化
 * CMS実装に依存しないインターフェースを提供
 * キャッシュ機能付き
 */

import { unstable_cache } from 'next/cache';
import { getCMSAdapter } from '../adapters/factory';
import {
  CMS_CACHE_CONFIG,
  getCollectionTag,
  getDocumentTag,
  getSlugTag,
  invalidateBySlug,
  invalidateCollection,
  invalidateDocument,
} from '../core/cache';
import type { CMSAdapter, SortParams, WhereCondition, WhereOperator } from '../core/interfaces';
import type { BlogPost, ContentStatus } from '../core/types';

export interface FindBlogPostsOptions {
  organizationId?: string;
  limit?: number;
  offset?: number;
  status?: ContentStatus | 'all';
  category?: string;
  tag?: string;
  sort?: SortParams[];
}

export interface BlogPostsResult {
  posts: BlogPost[];
  total: number;
  hasNextPage: boolean;
}

const COLLECTION = 'blog-posts';
const REVALIDATE = CMS_CACHE_CONFIG.collections[COLLECTION] || CMS_CACHE_CONFIG.defaultRevalidate;

export class BlogRepository {
  private adapter: CMSAdapter;

  constructor(adapter?: CMSAdapter) {
    this.adapter = adapter || getCMSAdapter();
  }

  /**
   * ブログ記事一覧を取得（キャッシュなし - 管理画面用）
   */
  async findAll(options: FindBlogPostsOptions = {}): Promise<BlogPostsResult> {
    const {
      organizationId,
      limit = 10,
      offset = 0,
      status = 'published',
      category,
      tag,
      sort = [{ field: 'publishedAt', order: 'desc' }],
    } = options;

    const where: WhereCondition = {};

    if (category) {
      where.category = { equals: category } as WhereOperator;
    }

    if (tag) {
      where.tags = { contains: tag } as WhereOperator;
    }

    const { data, meta } = await this.adapter.find<BlogPost>({
      collection: 'blog-posts',
      where: Object.keys(where).length > 0 ? where : undefined,
      limit,
      offset,
      sort,
      organizationId,
      status: status === 'all' ? 'all' : status === 'archived' ? 'draft' : status,
    });

    return {
      posts: data,
      total: meta?.total || 0,
      hasNextPage: meta?.hasNextPage || false,
    };
  }

  /**
   * ブログ記事一覧を取得（キャッシュ付き - 公開ページ用）
   */
  async findAllCached(options: FindBlogPostsOptions = {}): Promise<BlogPostsResult> {
    const cacheKey = `findAll:${JSON.stringify(options)}`;

    const cached = unstable_cache(
      async () => this.findAll(options),
      [`cms:${COLLECTION}:${cacheKey}`],
      {
        revalidate: REVALIDATE,
        tags: [getCollectionTag(COLLECTION)],
      }
    );

    return cached();
  }

  /**
   * スラッグでブログ記事を取得（キャッシュなし）
   */
  async findBySlug(slug: string, organizationId?: string): Promise<BlogPost | null> {
    const { data } = await this.adapter.findBySlug<BlogPost>({
      collection: COLLECTION,
      slug,
      organizationId,
    });

    return data;
  }

  /**
   * スラッグでブログ記事を取得（キャッシュ付き - 公開ページ用）
   */
  async findBySlugCached(slug: string, organizationId?: string): Promise<BlogPost | null> {
    const cached = unstable_cache(
      async () => this.findBySlug(slug, organizationId),
      [`cms:${COLLECTION}:slug:${slug}:${organizationId || 'default'}`],
      {
        revalidate: REVALIDATE,
        tags: [getCollectionTag(COLLECTION), getSlugTag(COLLECTION, slug)],
      }
    );

    return cached();
  }

  /**
   * IDでブログ記事を取得（キャッシュなし）
   */
  async findById(id: string, organizationId?: string): Promise<BlogPost | null> {
    const { data } = await this.adapter.findById<BlogPost>({
      collection: COLLECTION,
      id,
      organizationId,
    });

    return data;
  }

  /**
   * IDでブログ記事を取得（キャッシュ付き）
   */
  async findByIdCached(id: string, organizationId?: string): Promise<BlogPost | null> {
    const cached = unstable_cache(
      async () => this.findById(id, organizationId),
      [`cms:${COLLECTION}:id:${id}:${organizationId || 'default'}`],
      {
        revalidate: REVALIDATE,
        tags: [getCollectionTag(COLLECTION), getDocumentTag(COLLECTION, id)],
      }
    );

    return cached();
  }

  /**
   * ブログ記事を検索
   */
  async search(query: string, organizationId?: string, limit = 10): Promise<BlogPost[]> {
    const { data } = await this.adapter.search<BlogPost>({
      collection: COLLECTION,
      query,
      fields: ['title.ja', 'title.en', 'content.ja', 'content.en', 'excerpt.ja', 'excerpt.en'],
      limit,
      organizationId,
    });

    return data;
  }

  /**
   * ブログ記事を作成
   */
  async create(
    post: Omit<BlogPost, 'id' | 'publishedAt' | 'updatedAt'>,
    organizationId?: string
  ): Promise<BlogPost> {
    const { data } = await this.adapter.create<BlogPost>({
      collection: COLLECTION,
      data: {
        ...post,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
      organizationId,
    });

    // キャッシュを無効化
    await invalidateCollection(COLLECTION);

    return data;
  }

  /**
   * ブログ記事を更新
   */
  async update(
    id: string,
    updates: Partial<Omit<BlogPost, 'id'>>,
    organizationId?: string
  ): Promise<BlogPost> {
    // 既存のスラッグを取得（キャッシュ無効化用）
    const existing = await this.findById(id, organizationId);

    const { data } = await this.adapter.update<BlogPost>({
      collection: COLLECTION,
      id,
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      organizationId,
    });

    // キャッシュを無効化
    await invalidateDocument(COLLECTION, id);
    if (existing?.slug) {
      await invalidateBySlug(COLLECTION, existing.slug);
    }
    if (data.slug && data.slug !== existing?.slug) {
      await invalidateBySlug(COLLECTION, data.slug);
    }

    return data;
  }

  /**
   * ブログ記事を削除
   */
  async delete(id: string, organizationId?: string): Promise<void> {
    // 既存のスラッグを取得（キャッシュ無効化用）
    const existing = await this.findById(id, organizationId);

    await this.adapter.delete({
      collection: COLLECTION,
      id,
      organizationId,
    });

    // キャッシュを無効化
    await invalidateDocument(COLLECTION, id);
    if (existing?.slug) {
      await invalidateBySlug(COLLECTION, existing.slug);
    }
    await invalidateCollection(COLLECTION);
  }

  /**
   * 関連記事を取得
   */
  async findRelated(
    postId: string,
    options: { limit?: number; organizationId?: string } = {}
  ): Promise<BlogPost[]> {
    const { limit = 3, organizationId } = options;

    // 現在の記事を取得
    const currentPost = await this.findById(postId, organizationId);
    if (!currentPost) {
      return [];
    }

    // 同じカテゴリの記事を取得
    const { posts } = await this.findAll({
      organizationId,
      category: currentPost.category,
      limit: limit + 1, // 自分自身を除外するため+1
      status: 'published',
    });

    // 自分自身を除外
    return posts.filter((post) => post.id !== postId).slice(0, limit);
  }

  /**
   * 最新記事を取得（キャッシュなし）
   */
  async findLatest(limit = 5, organizationId?: string): Promise<BlogPost[]> {
    const { posts } = await this.findAll({
      organizationId,
      limit,
      status: 'published',
      sort: [{ field: 'publishedAt', order: 'desc' }],
    });

    return posts;
  }

  /**
   * 最新記事を取得（キャッシュ付き - 公開ページ用）
   */
  async findLatestCached(limit = 5, organizationId?: string): Promise<BlogPost[]> {
    const cached = unstable_cache(
      async () => this.findLatest(limit, organizationId),
      [`cms:${COLLECTION}:latest:${limit}:${organizationId || 'default'}`],
      {
        revalidate: REVALIDATE,
        tags: [getCollectionTag(COLLECTION)],
      }
    );

    return cached();
  }

  /**
   * カテゴリ一覧を取得（キャッシュなし）
   */
  async getCategories(organizationId?: string): Promise<string[]> {
    const { posts } = await this.findAll({
      organizationId,
      limit: 1000, // すべて取得
      status: 'published',
    });

    const categories = new Set<string>();
    for (const post of posts) {
      if (post.category) {
        categories.add(post.category);
      }
    }

    return Array.from(categories);
  }

  /**
   * カテゴリ一覧を取得（キャッシュ付き - 公開ページ用）
   */
  async getCategoriesCached(organizationId?: string): Promise<string[]> {
    const cached = unstable_cache(
      async () => this.getCategories(organizationId),
      [`cms:${COLLECTION}:categories:${organizationId || 'default'}`],
      {
        revalidate: REVALIDATE,
        tags: [getCollectionTag(COLLECTION)],
      }
    );

    return cached();
  }

  /**
   * タグ一覧を取得（キャッシュなし）
   */
  async getTags(organizationId?: string): Promise<string[]> {
    const { posts } = await this.findAll({
      organizationId,
      limit: 1000,
      status: 'published',
    });

    const tags = new Set<string>();
    for (const post of posts) {
      if (post.tags) {
        for (const tag of post.tags) {
          tags.add(tag);
        }
      }
    }

    return Array.from(tags);
  }

  /**
   * タグ一覧を取得（キャッシュ付き - 公開ページ用）
   */
  async getTagsCached(organizationId?: string): Promise<string[]> {
    const cached = unstable_cache(
      async () => this.getTags(organizationId),
      [`cms:${COLLECTION}:tags:${organizationId || 'default'}`],
      {
        revalidate: REVALIDATE,
        tags: [getCollectionTag(COLLECTION)],
      }
    );

    return cached();
  }
}
