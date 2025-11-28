/**
 * FAQ Repository
 *
 * FAQのデータアクセスを抽象化
 * CMS実装に依存しないインターフェースを提供
 */

import { getCMSAdapter } from '../adapters/factory';
import type { CMSAdapter, WhereCondition, WhereOperator } from '../core/interfaces';
import type { FAQ } from '../core/types';

export interface FindFAQsOptions {
  organizationId?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface FAQsResult {
  faqs: FAQ[];
  total: number;
}

export interface FAQsByCategory {
  category: string;
  faqs: FAQ[];
}

export class FAQRepository {
  private adapter: CMSAdapter;

  constructor(adapter?: CMSAdapter) {
    this.adapter = adapter || getCMSAdapter();
  }

  /**
   * FAQ一覧を取得
   */
  async findAll(options: FindFAQsOptions = {}): Promise<FAQsResult> {
    const { organizationId, category, limit = 100, offset = 0 } = options;

    const where: WhereCondition = {};

    if (category) {
      where.category = { equals: category } as WhereOperator;
    }

    const { data, meta } = await this.adapter.find<FAQ>({
      collection: 'faqs',
      where: Object.keys(where).length > 0 ? where : undefined,
      limit,
      offset,
      sort: [{ field: 'order', order: 'asc' }],
      organizationId,
    });

    return {
      faqs: data,
      total: meta?.total || 0,
    };
  }

  /**
   * IDでFAQを取得
   */
  async findById(id: string, organizationId?: string): Promise<FAQ | null> {
    const { data } = await this.adapter.findById<FAQ>({
      collection: 'faqs',
      id,
      organizationId,
    });

    return data;
  }

  /**
   * FAQを検索
   */
  async search(query: string, organizationId?: string): Promise<FAQ[]> {
    const { data } = await this.adapter.search<FAQ>({
      collection: 'faqs',
      query,
      fields: ['question.ja', 'question.en', 'answer.ja', 'answer.en'],
      organizationId,
    });

    return data;
  }

  /**
   * カテゴリ別にグループ化されたFAQを取得
   */
  async findByCategories(organizationId?: string): Promise<FAQsByCategory[]> {
    const { faqs } = await this.findAll({ organizationId });

    // カテゴリ別にグループ化
    const grouped = new Map<string, FAQ[]>();

    for (const faq of faqs) {
      const category = faq.category || 'general';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)?.push(faq);
    }

    // カテゴリ順にソート
    const categoryOrder = ['features', 'pricing', 'technical', 'general'];
    const result: FAQsByCategory[] = [];

    for (const category of categoryOrder) {
      if (grouped.has(category)) {
        result.push({
          category,
          faqs: grouped.get(category)!,
        });
      }
    }

    // 残りのカテゴリを追加
    for (const [category, items] of grouped) {
      if (!categoryOrder.includes(category)) {
        result.push({ category, faqs: items });
      }
    }

    return result;
  }

  /**
   * FAQを作成
   */
  async create(faq: Omit<FAQ, 'id' | 'publishedAt'>, organizationId?: string): Promise<FAQ> {
    const { data } = await this.adapter.create<FAQ>({
      collection: 'faqs',
      data: {
        ...faq,
        publishedAt: new Date(),
      },
      organizationId,
    });

    return data;
  }

  /**
   * FAQを更新
   */
  async update(
    id: string,
    updates: Partial<Omit<FAQ, 'id'>>,
    organizationId?: string
  ): Promise<FAQ> {
    const { data } = await this.adapter.update<FAQ>({
      collection: 'faqs',
      id,
      data: updates,
      organizationId,
    });

    return data;
  }

  /**
   * FAQを削除
   */
  async delete(id: string, organizationId?: string): Promise<void> {
    await this.adapter.delete({
      collection: 'faqs',
      id,
      organizationId,
    });
  }

  /**
   * カテゴリ一覧を取得
   */
  async getCategories(organizationId?: string): Promise<string[]> {
    const { faqs } = await this.findAll({ organizationId });

    const categories = new Set<string>();
    for (const faq of faqs) {
      if (faq.category) {
        categories.add(faq.category);
      }
    }

    return Array.from(categories);
  }

  /**
   * 順序を更新（一括）
   */
  async updateOrder(
    updates: Array<{ id: string; order: number }>,
    organizationId?: string
  ): Promise<void> {
    await this.adapter.bulkUpdate({
      collection: 'faqs',
      updates: updates.map(({ id, order }) => ({
        id,
        data: { order },
      })),
      organizationId,
    });
  }
}
