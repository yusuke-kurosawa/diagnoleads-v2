/**
 * Mock CMS Adapter
 *
 * テスト用およびPayloadCMS未設定時のフォールバックアダプター
 */

import { CMSNotFoundError, CMSOrganizationMismatchError } from '../../core/errors';
import type {
  BulkCreateParams,
  BulkDeleteParams,
  BulkUpdateParams,
  CMSAdapter,
  CMSResponse,
  CreateParams,
  DeleteParams,
  ExportData,
  ExportParams,
  FindByIdParams,
  FindBySlugParams,
  FindParams,
  ImportParams,
  ImportResult,
  RevalidateParams,
  SearchParams,
  UpdateParams,
} from '../../core/interfaces';

interface MockDocument {
  id: string;
  organizationId?: string;
  [key: string]: unknown;
}

export class MockCMSAdapter implements CMSAdapter {
  readonly name = 'MockCMS';
  readonly version = '1.0.0';

  private data: Map<string, Map<string, MockDocument>> = new Map();
  private initialized = false;
  private idCounter = 1;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // サンプルデータを初期化
    this.initializeSampleData();
    this.initialized = true;
  }

  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }

  async find<T>(params: FindParams): Promise<CMSResponse<T[]>> {
    await this.ensureInitialized();

    const collection = this.data.get(params.collection);
    if (!collection) {
      return { data: [] as T[], meta: { total: 0 } };
    }

    let items = Array.from(collection.values());

    // organizationIdフィルタリング
    if (params.organizationId) {
      items = items.filter((item) => item.organizationId === params.organizationId);
    }

    // statusフィルタリング
    if (params.status && params.status !== 'all') {
      items = items.filter((item) => item.status === params.status);
    }

    // Where条件適用
    if (params.where) {
      items = this.applyWhereCondition(items, params.where);
    }

    // ソート
    if (params.sort && params.sort.length > 0) {
      items = this.applySorting(items, params.sort);
    }

    const total = items.length;

    // ページネーション
    const offset = params.offset || 0;
    const limit = params.limit || 10;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      data: paginatedItems as T[],
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        hasNextPage: offset + limit < total,
        hasPrevPage: offset > 0,
      },
    };
  }

  async findById<T>(params: FindByIdParams): Promise<CMSResponse<T | null>> {
    await this.ensureInitialized();

    const collection = this.data.get(params.collection);
    if (!collection) {
      return { data: null };
    }

    const item = collection.get(params.id);
    if (!item) {
      return { data: null };
    }

    // organizationIdチェック
    if (params.organizationId && item.organizationId !== params.organizationId) {
      throw new CMSOrganizationMismatchError();
    }

    return { data: item as T };
  }

  async findBySlug<T>(params: FindBySlugParams): Promise<CMSResponse<T | null>> {
    await this.ensureInitialized();

    const collection = this.data.get(params.collection);
    if (!collection) {
      return { data: null };
    }

    const items = Array.from(collection.values());
    const item = items.find((i) => i.slug === params.slug);

    if (!item) {
      return { data: null };
    }

    // organizationIdチェック
    if (params.organizationId && item.organizationId !== params.organizationId) {
      throw new CMSOrganizationMismatchError();
    }

    return { data: item as T };
  }

  async create<T>(params: CreateParams): Promise<CMSResponse<T>> {
    await this.ensureInitialized();

    if (!this.data.has(params.collection)) {
      this.data.set(params.collection, new Map());
    }

    const collection = this.data.get(params.collection)!;
    const id = `mock-${this.idCounter++}`;
    const now = new Date();

    const newDoc: MockDocument = {
      id,
      ...params.data,
      organizationId: params.organizationId,
      createdAt: now,
      updatedAt: now,
    };

    collection.set(id, newDoc);

    return { data: newDoc as T };
  }

  async update<T>(params: UpdateParams): Promise<CMSResponse<T>> {
    await this.ensureInitialized();

    const collection = this.data.get(params.collection);
    if (!collection) {
      throw new CMSNotFoundError(params.collection, params.id);
    }

    const existing = collection.get(params.id);
    if (!existing) {
      throw new CMSNotFoundError(params.collection, params.id);
    }

    // organizationIdチェック
    if (params.organizationId && existing.organizationId !== params.organizationId) {
      throw new CMSOrganizationMismatchError();
    }

    const updatedDoc: MockDocument = {
      ...existing,
      ...params.data,
      id: params.id,
      updatedAt: new Date(),
    };

    collection.set(params.id, updatedDoc);

    return { data: updatedDoc as T };
  }

  async delete(params: DeleteParams): Promise<CMSResponse<void>> {
    await this.ensureInitialized();

    const collection = this.data.get(params.collection);
    if (!collection) {
      throw new CMSNotFoundError(params.collection, params.id);
    }

    const existing = collection.get(params.id);
    if (!existing) {
      throw new CMSNotFoundError(params.collection, params.id);
    }

    // organizationIdチェック
    if (params.organizationId && existing.organizationId !== params.organizationId) {
      throw new CMSOrganizationMismatchError();
    }

    collection.delete(params.id);

    return { data: undefined };
  }

  async search<T>(params: SearchParams): Promise<CMSResponse<T[]>> {
    await this.ensureInitialized();

    const collection = this.data.get(params.collection);
    if (!collection) {
      return { data: [] as T[], meta: { total: 0 } };
    }

    let items = Array.from(collection.values());

    // organizationIdフィルタリング
    if (params.organizationId) {
      items = items.filter((item) => item.organizationId === params.organizationId);
    }

    // 検索フィールドで検索
    const searchFields = params.fields || ['title', 'content', 'name'];
    const query = params.query.toLowerCase();

    items = items.filter((item) => {
      return searchFields.some((field) => {
        const value = this.getNestedValue(item, field);
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        if (typeof value === 'object' && value !== null) {
          // LocalizedString対応
          return Object.values(value).some(
            (v) => typeof v === 'string' && v.toLowerCase().includes(query)
          );
        }
        return false;
      });
    });

    const limit = params.limit || 10;

    return {
      data: items.slice(0, limit) as T[],
      meta: { total: items.length },
    };
  }

  async bulkCreate<T>(params: BulkCreateParams): Promise<CMSResponse<T[]>> {
    await this.ensureInitialized();

    const results: T[] = [];
    for (const data of params.data) {
      const result = await this.create<T>({
        collection: params.collection,
        data,
        organizationId: params.organizationId,
      });
      results.push(result.data);
    }

    return { data: results };
  }

  async bulkUpdate<T>(params: BulkUpdateParams): Promise<CMSResponse<T[]>> {
    await this.ensureInitialized();

    const results: T[] = [];
    for (const { id, data } of params.updates) {
      const result = await this.update<T>({
        collection: params.collection,
        id,
        data,
        organizationId: params.organizationId,
      });
      results.push(result.data);
    }

    return { data: results };
  }

  async bulkDelete(params: BulkDeleteParams): Promise<CMSResponse<void>> {
    await this.ensureInitialized();

    for (const id of params.ids) {
      await this.delete({
        collection: params.collection,
        id,
        organizationId: params.organizationId,
      });
    }

    return { data: undefined };
  }

  async revalidate(_params: RevalidateParams): Promise<void> {
    // Mock: 何もしない
  }

  async export(params: ExportParams): Promise<ExportData> {
    await this.ensureInitialized();

    const data: Record<string, unknown[]> = {};

    for (const collectionName of params.collections) {
      const collection = this.data.get(collectionName);
      if (collection) {
        let items = Array.from(collection.values());

        if (params.organizationId) {
          items = items.filter((item) => item.organizationId === params.organizationId);
        }

        data[collectionName] = items.map(({ id, createdAt, updatedAt, ...rest }) => rest);
      }
    }

    return {
      schema: {},
      data,
      version: '1.0',
      exportedAt: new Date().toISOString(),
    };
  }

  async import(params: ImportParams): Promise<ImportResult> {
    await this.ensureInitialized();

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [collectionName, items] of Object.entries(params.data)) {
      for (const item of items as Record<string, unknown>[]) {
        try {
          await this.create({
            collection: collectionName,
            data: item,
            organizationId: params.organizationId,
          });
          imported++;
        } catch (error) {
          failed++;
          errors.push(
            `${collectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    return { success: failed === 0, imported, failed, errors };
  }

  // =============================================================================
  // Test Helpers
  // =============================================================================

  /**
   * テスト用: モックデータを設定
   */
  setMockData(collection: string, id: string, data: MockDocument): void {
    if (!this.data.has(collection)) {
      this.data.set(collection, new Map());
    }
    this.data.get(collection)?.set(id, { ...data, id });
  }

  /**
   * テスト用: データをクリア
   */
  clearData(): void {
    this.data.clear();
    this.idCounter = 1;
  }

  /**
   * テスト用: 初期化状態をリセット
   */
  reset(): void {
    this.clearData();
    this.initialized = false;
  }

  // =============================================================================
  // Private Helpers
  // =============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private initializeSampleData(): void {
    // FAQ サンプルデータ
    this.data.set(
      'faqs',
      new Map([
        [
          'faq-1',
          {
            id: 'faq-1',
            question: { ja: 'DiagnoLeadsとは何ですか？', en: 'What is DiagnoLeads?' },
            answer: {
              ja: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'AIを活用したB2B診断プラットフォームです。' }],
                  },
                ],
              },
              en: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'An AI-powered B2B diagnostic platform.' }],
                  },
                ],
              },
            },
            category: 'features',
            order: 1,
            publishedAt: new Date(),
          },
        ],
        [
          'faq-2',
          {
            id: 'faq-2',
            question: { ja: '料金はいくらですか？', en: 'How much does it cost?' },
            answer: {
              ja: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '無料プランからご利用いただけます。' }],
                  },
                ],
              },
              en: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'We offer a free plan to get started.' }],
                  },
                ],
              },
            },
            category: 'pricing',
            order: 2,
            publishedAt: new Date(),
          },
        ],
      ])
    );

    // Blog サンプルデータ
    this.data.set(
      'blog-posts',
      new Map([
        [
          'post-1',
          {
            id: 'post-1',
            slug: 'getting-started',
            title: { ja: 'DiagnoLeadsの始め方', en: 'Getting Started with DiagnoLeads' },
            content: {
              ja: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'DiagnoLeadsを始めましょう。' }],
                  },
                ],
              },
              en: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: "Let's get started with DiagnoLeads." }],
                  },
                ],
              },
            },
            excerpt: { ja: 'DiagnoLeadsの基本的な使い方', en: 'Basic usage of DiagnoLeads' },
            author: { id: '1', name: 'DiagnoLeads Team', email: 'team@diagnoleads.com' },
            publishedAt: new Date(),
            updatedAt: new Date(),
            status: 'published',
            seo: {},
          },
        ],
      ])
    );
  }

  private applyWhereCondition(
    items: MockDocument[],
    where: Record<string, unknown>
  ): MockDocument[] {
    return items.filter((item) => {
      for (const [key, condition] of Object.entries(where)) {
        const value = this.getNestedValue(item, key);

        if (typeof condition === 'object' && condition !== null) {
          const op = condition as Record<string, unknown>;
          if ('equals' in op && value !== op.equals) return false;
          if ('not_equals' in op && value === op.not_equals) return false;
          if (
            'contains' in op &&
            typeof value === 'string' &&
            !value.includes(op.contains as string)
          )
            return false;
          if ('in' in op && Array.isArray(op.in) && !op.in.includes(value)) return false;
          if (
            'greater_than' in op &&
            typeof value === 'number' &&
            value <= (op.greater_than as number)
          )
            return false;
          if ('less_than' in op && typeof value === 'number' && value >= (op.less_than as number))
            return false;
        } else {
          if (value !== condition) return false;
        }
      }
      return true;
    });
  }

  private applySorting(
    items: MockDocument[],
    sort: Array<{ field: string; order: 'asc' | 'desc' }>
  ): MockDocument[] {
    return [...items].sort((a, b) => {
      for (const { field, order } of sort) {
        const aVal = this.getNestedValue(a, field);
        const bVal = this.getNestedValue(b, field);

        let comparison = 0;
        // Convert to strings for safe comparison of unknown types
        const aStr = String(aVal ?? '');
        const bStr = String(bVal ?? '');
        if (aStr < bStr) comparison = -1;
        if (aStr > bStr) comparison = 1;

        if (comparison !== 0) {
          return order === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }
}
