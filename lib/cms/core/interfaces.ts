/**
 * CMS Adapter Interfaces
 *
 * すべてのCMS実装が満たすべきインターフェース
 * Dependency Inversion Principleに基づき、アプリケーションはこのインターフェースに依存する
 */

// =============================================================================
// Query Parameters
// =============================================================================

export interface FindParams {
  collection: string;
  where?: WhereCondition;
  limit?: number;
  offset?: number;
  sort?: SortParams[];
  locale?: string;
  organizationId?: string;
  status?: 'draft' | 'published' | 'all';
}

export interface FindByIdParams {
  collection: string;
  id: string;
  locale?: string;
  organizationId?: string;
}

export interface FindBySlugParams {
  collection: string;
  slug: string;
  locale?: string;
  organizationId?: string;
}

export interface CreateParams<T = Record<string, unknown>> {
  collection: string;
  data: T;
  organizationId?: string;
}

export interface UpdateParams<T = Record<string, unknown>> {
  collection: string;
  id: string;
  data: Partial<T>;
  organizationId?: string;
}

export interface DeleteParams {
  collection: string;
  id: string;
  organizationId?: string;
}

export interface SearchParams {
  collection: string;
  query: string;
  fields?: string[];
  limit?: number;
  organizationId?: string;
}

export interface BulkCreateParams<T = Record<string, unknown>> {
  collection: string;
  data: T[];
  organizationId?: string;
}

export interface BulkUpdateParams<T = Record<string, unknown>> {
  collection: string;
  updates: Array<{ id: string; data: Partial<T> }>;
  organizationId?: string;
}

export interface BulkDeleteParams {
  collection: string;
  ids: string[];
  organizationId?: string;
}

export interface RevalidateParams {
  path: string;
  type?: 'page' | 'layout';
}

export interface ExportParams {
  collections: string[];
  organizationId?: string;
}

export interface ImportParams {
  data: Record<string, unknown[]>;
  organizationId?: string;
}

// =============================================================================
// Query Conditions
// =============================================================================

export type WhereCondition = {
  [key: string]: WhereValue | WhereOperator;
};

export type WhereValue = string | number | boolean | null;

export interface WhereOperator {
  equals?: WhereValue;
  not_equals?: WhereValue;
  in?: WhereValue[];
  not_in?: WhereValue[];
  contains?: string;
  not_contains?: string;
  like?: string;
  greater_than?: number;
  greater_than_equal?: number;
  less_than?: number;
  less_than_equal?: number;
  exists?: boolean;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

// =============================================================================
// Response Types
// =============================================================================

export interface CMSResponse<T> {
  data: T;
  meta?: CMSResponseMeta;
}

export interface CMSResponseMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ExportData {
  schema: Record<string, unknown>;
  data: Record<string, unknown[]>;
  version: string;
  exportedAt: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: string[];
}

// =============================================================================
// CMS Adapter Interface
// =============================================================================

/**
 * CMSAdapter - すべてのCMS実装が実装すべきインターフェース
 *
 * 使用例:
 * ```typescript
 * const adapter = getCMSAdapter();
 * const posts = await adapter.find<BlogPost>({ collection: 'blog-posts' });
 * ```
 */
export interface CMSAdapter {
  // Metadata
  readonly name: string;
  readonly version: string;

  // Lifecycle
  initialize(): Promise<void>;
  healthCheck(): Promise<boolean>;

  // CRUD Operations
  find<T>(params: FindParams): Promise<CMSResponse<T[]>>;
  findById<T>(params: FindByIdParams): Promise<CMSResponse<T | null>>;
  findBySlug<T>(params: FindBySlugParams): Promise<CMSResponse<T | null>>;
  create<T>(params: CreateParams): Promise<CMSResponse<T>>;
  update<T>(params: UpdateParams): Promise<CMSResponse<T>>;
  delete(params: DeleteParams): Promise<CMSResponse<void>>;

  // Search
  search<T>(params: SearchParams): Promise<CMSResponse<T[]>>;

  // Bulk Operations
  bulkCreate<T>(params: BulkCreateParams): Promise<CMSResponse<T[]>>;
  bulkUpdate<T>(params: BulkUpdateParams): Promise<CMSResponse<T[]>>;
  bulkDelete(params: BulkDeleteParams): Promise<CMSResponse<void>>;

  // Cache & Revalidation
  revalidate(params: RevalidateParams): Promise<void>;

  // Data Migration
  export(params: ExportParams): Promise<ExportData>;
  import(params: ImportParams): Promise<ImportResult>;
}

// =============================================================================
// Collection Config (for CMS setup)
// =============================================================================

export interface CollectionConfig {
  slug: string;
  labels: {
    singular: string;
    plural: string;
  };
  fields: FieldConfig[];
  access?: AccessConfig;
  hooks?: HooksConfig;
  admin?: AdminConfig;
}

export interface FieldConfig {
  name: string;
  type:
    | 'text'
    | 'textarea'
    | 'richText'
    | 'number'
    | 'email'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'date'
    | 'relationship'
    | 'array'
    | 'group'
    | 'upload';
  label?: string;
  required?: boolean;
  localized?: boolean;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }>;
  relationTo?: string;
  fields?: FieldConfig[]; // for array/group types
  validate?: (value: unknown) => boolean | string;
}

export interface AccessConfig {
  read?: (args: { user?: unknown }) => boolean | WhereCondition;
  create?: (args: { user?: unknown }) => boolean;
  update?: (args: { user?: unknown }) => boolean | WhereCondition;
  delete?: (args: { user?: unknown }) => boolean | WhereCondition;
}

export interface HooksConfig {
  beforeChange?: Array<(args: { data: unknown; operation: string }) => unknown>;
  afterChange?: Array<(args: { doc: unknown; operation: string }) => void>;
  beforeDelete?: Array<(args: { id: string }) => void>;
  afterDelete?: Array<(args: { id: string }) => void>;
}

export interface AdminConfig {
  useAsTitle?: string;
  defaultColumns?: string[];
  listSearchableFields?: string[];
  group?: string;
  hidden?: boolean;
}
