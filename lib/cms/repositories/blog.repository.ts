/**
 * Blog Repository
 *
 * ブログ記事のデータアクセスを抽象化
 * CMS実装に依存しないインターフェースを提供
 */

import type { BlogPost, ContentStatus } from '../core/types';
import type { CMSAdapter, SortParams } from '../core/interfaces';
import { getCMSAdapter } from '../adapters/factory';

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

export class BlogRepository {
  private adapter: CMSAdapter;

  constructor(adapter?: CMSAdapter) {
    this.adapter = adapter || getCMSAdapter();
  }

  /**
   * ブログ記事一覧を取得
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

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = { equals: category };
    }

    if (tag) {
      where.tags = { contains: tag };
    }

    const { data, meta } = await this.adapter.find<BlogPost>({
      collection: 'blog-posts',
      where: Object.keys(where).length > 0 ? where : undefined,
      limit,
      offset,
      sort,
      organizationId,
      status: status === 'all' ? 'all' : status,
    });

    return {
      posts: data,
      total: meta?.total || 0,
      hasNextPage: meta?.hasNextPage || false,
    };
  }

  /**
   * スラッグでブログ記事を取得
   */
  async findBySlug(slug: string, organizationId?: string): Promise<BlogPost | null> {
    const { data } = await this.adapter.findBySlug<BlogPost>({
      collection: 'blog-posts',
      slug,
      organizationId,
    });

    return data;
  }

  /**
   * IDでブログ記事を取得
   */
  async findById(id: string, organizationId?: string): Promise<BlogPost | null> {
    const { data } = await this.adapter.findById<BlogPost>({
      collection: 'blog-posts',
      id,
      organizationId,
    });

    return data;
  }

  /**
   * ブログ記事を検索
   */
  async search(query: string, organizationId?: string, limit = 10): Promise<BlogPost[]> {
    const { data } = await this.adapter.search<BlogPost>({
      collection: 'blog-posts',
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
      collection: 'blog-posts',
      data: {
        ...post,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
      organizationId,
    });

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
    const { data } = await this.adapter.update<BlogPost>({
      collection: 'blog-posts',
      id,
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      organizationId,
    });

    return data;
  }

  /**
   * ブログ記事を削除
   */
  async delete(id: string, organizationId?: string): Promise<void> {
    await this.adapter.delete({
      collection: 'blog-posts',
      id,
      organizationId,
    });
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
   * 最新記事を取得
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
   * カテゴリ一覧を取得
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
   * タグ一覧を取得
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
}
