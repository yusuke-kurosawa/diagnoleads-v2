/**
 * PayloadCMS Adapter
 *
 * Phase 4.3: PayloadCMS統合
 *
 * PayloadCMS Local APIを使用してCMSAdapterインターフェースを実装
 *
 * @see https://payloadcms.com/docs/local-api/overview
 */

import { revalidatePath } from 'next/cache';
import { type Payload, getPayload } from 'payload';
import type { Where } from 'payload';
import {
  CMSConnectionError,
  CMSNotFoundError,
  CMSOrganizationMismatchError,
} from '../../core/errors';
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
  WhereCondition,
} from '../../core/interfaces';

export class PayloadCMSAdapter implements CMSAdapter {
  readonly name = 'PayloadCMS';
  readonly version = '3.66';

  private payload: Payload | null = null;
  private initPromise: Promise<void> | null = null;

  // =============================================================================
  // Lifecycle
  // =============================================================================

  async initialize(): Promise<void> {
    if (this.payload) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      // Dynamic import to avoid build-time issues
      const config = await import('@payload-config').then((m) => m.default);
      this.payload = await getPayload({ config });
    } catch (error) {
      throw new CMSConnectionError(
        `Failed to initialize PayloadCMS: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      // 簡単なクエリを実行して接続確認
      if (this.payload) {
        await this.payload.find({
          collection: 'faqs',
          limit: 1,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // =============================================================================
  // CRUD Operations
  // =============================================================================

  async find<T>(params: FindParams): Promise<CMSResponse<T[]>> {
    await this.ensureInitialized();

    const where = this.buildWhereQuery(params.where, params.organizationId, params.status);

    const result = await this.payload?.find({
      collection: params.collection,
      where,
      limit: params.limit || 10,
      page: params.offset ? Math.floor(params.offset / (params.limit || 10)) + 1 : 1,
      sort: params.sort ? this.buildSortString(params.sort) : undefined,
      locale: params.locale as 'ja' | 'en' | undefined,
      draft: params.status === 'draft',
    });

    if (!result) {
      return {
        data: [],
        meta: {
          total: 0,
          page: 1,
          pageSize: params.limit || 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    return {
      data: result.docs as T[],
      meta: {
        total: result.totalDocs,
        page: result.page || 1,
        pageSize: result.limit,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    };
  }

  async findById<T>(params: FindByIdParams): Promise<CMSResponse<T | null>> {
    await this.ensureInitialized();

    try {
      const result = await this.payload?.findByID({
        collection: params.collection,
        id: params.id,
        locale: params.locale as 'ja' | 'en' | undefined,
      });

      // organizationIdチェック
      const doc = result as Record<string, unknown>;
      if (params.organizationId && doc.organizationId !== params.organizationId) {
        throw new CMSOrganizationMismatchError();
      }

      return { data: result as T };
    } catch (error) {
      if (error instanceof CMSOrganizationMismatchError) throw error;
      // PayloadCMSはIDが見つからない場合にエラーをスローする
      return { data: null };
    }
  }

  async findBySlug<T>(params: FindBySlugParams): Promise<CMSResponse<T | null>> {
    await this.ensureInitialized();

    const where: Where = {
      slug: {
        equals: params.slug,
      },
    };

    if (params.organizationId) {
      where.organizationId = {
        equals: params.organizationId,
      };
    }

    const result = await this.payload?.find({
      collection: params.collection,
      where,
      limit: 1,
      locale: params.locale as 'ja' | 'en' | undefined,
    });

    if (!result || result.docs.length === 0) {
      return { data: null };
    }

    return { data: result.docs[0] as T };
  }

  async create<T>(params: CreateParams): Promise<CMSResponse<T>> {
    await this.ensureInitialized();

    const data = {
      ...params.data,
      organizationId: params.organizationId,
    };

    const result = await this.payload?.create({
      collection: params.collection,
      data,
    });

    return { data: result as T };
  }

  async update<T>(params: UpdateParams): Promise<CMSResponse<T>> {
    await this.ensureInitialized();

    // organizationIdチェック
    if (params.organizationId) {
      const existing = await this.findById({
        collection: params.collection,
        id: params.id,
        organizationId: params.organizationId,
      });

      if (!existing.data) {
        throw new CMSNotFoundError(params.collection, params.id);
      }
    }

    const result = await this.payload?.update({
      collection: params.collection,
      id: params.id,
      data: params.data,
    });

    return { data: result as T };
  }

  async delete(params: DeleteParams): Promise<CMSResponse<void>> {
    await this.ensureInitialized();

    // organizationIdチェック
    if (params.organizationId) {
      const existing = await this.findById({
        collection: params.collection,
        id: params.id,
        organizationId: params.organizationId,
      });

      if (!existing.data) {
        throw new CMSNotFoundError(params.collection, params.id);
      }
    }

    await this.payload?.delete({
      collection: params.collection,
      id: params.id,
    });

    return { data: undefined };
  }

  // =============================================================================
  // Search
  // =============================================================================

  async search<T>(params: SearchParams): Promise<CMSResponse<T[]>> {
    await this.ensureInitialized();

    // PayloadCMSの全文検索を使用
    // fieldsが指定されている場合は、各フィールドでOR検索
    const searchConditions: Where[] = [];
    const fields = params.fields || ['title', 'name', 'question'];

    for (const field of fields) {
      searchConditions.push({
        [field]: {
          like: params.query,
        },
      });
    }

    const where: Where = {
      or: searchConditions,
    };

    if (params.organizationId) {
      where.organizationId = {
        equals: params.organizationId,
      };
    }

    const result = await this.payload?.find({
      collection: params.collection,
      where,
      limit: params.limit || 10,
    });

    if (!result) {
      return { data: [], meta: { total: 0 } };
    }

    return {
      data: result.docs as T[],
      meta: {
        total: result.totalDocs,
      },
    };
  }

  // =============================================================================
  // Bulk Operations
  // =============================================================================

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

    // PayloadCMS 3.0のbulkDelete APIを使用
    const where: Where = {
      id: {
        in: params.ids,
      },
    };

    if (params.organizationId) {
      where.organizationId = {
        equals: params.organizationId,
      };
    }

    await this.payload?.delete({
      collection: params.collection,
      where,
    });

    return { data: undefined };
  }

  // =============================================================================
  // Cache & Revalidation
  // =============================================================================

  async revalidate(params: RevalidateParams): Promise<void> {
    // Next.js のrevalidatePathを使用
    revalidatePath(params.path, params.type);
  }

  // =============================================================================
  // Data Migration
  // =============================================================================

  async export(params: ExportParams): Promise<ExportData> {
    await this.ensureInitialized();

    const data: Record<string, unknown[]> = {};

    for (const collectionName of params.collections) {
      const where: Where = {};

      if (params.organizationId) {
        where.organizationId = {
          equals: params.organizationId,
        };
      }

      const result = await this.payload?.find({
        collection: collectionName,
        where,
        limit: 1000, // 大量エクスポート用
      });

      data[collectionName] = result?.docs ?? [];
    }

    return {
      schema: {},
      data,
      version: '3.0',
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
  // Private Helpers
  // =============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.payload) {
      await this.initialize();
    }
    if (!this.payload) {
      throw new CMSConnectionError('PayloadCMS is not initialized');
    }
  }

  private buildWhereQuery(
    where?: WhereCondition,
    organizationId?: string,
    status?: 'draft' | 'published' | 'all'
  ): Where {
    const query: Where = {};

    // organizationIdフィルター
    if (organizationId) {
      query.organizationId = {
        equals: organizationId,
      };
    }

    // ステータスフィルター
    if (status && status !== 'all') {
      query._status = {
        equals: status,
      };
    }

    // カスタムwhere条件を変換
    if (where) {
      for (const [key, value] of Object.entries(where)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // WhereOperator型の場合
          const op = value as Record<string, unknown>;
          if ('equals' in op) query[key] = { equals: op.equals };
          else if ('not_equals' in op) query[key] = { not_equals: op.not_equals };
          else if ('contains' in op) query[key] = { contains: op.contains };
          else if ('like' in op) query[key] = { like: op.like };
          else if ('in' in op) query[key] = { in: op.in };
          else if ('not_in' in op) query[key] = { not_in: op.not_in };
          else if ('greater_than' in op) query[key] = { greater_than: op.greater_than };
          else if ('greater_than_equal' in op)
            query[key] = { greater_than_equal: op.greater_than_equal };
          else if ('less_than' in op) query[key] = { less_than: op.less_than };
          else if ('less_than_equal' in op) query[key] = { less_than_equal: op.less_than_equal };
          else if ('exists' in op) query[key] = { exists: op.exists };
        } else {
          // 直接値の場合
          query[key] = { equals: value };
        }
      }
    }

    return query;
  }

  private buildSortString(sort: Array<{ field: string; order: 'asc' | 'desc' }>): string {
    return sort.map((s) => (s.order === 'desc' ? `-${s.field}` : s.field)).join(',');
  }
}
