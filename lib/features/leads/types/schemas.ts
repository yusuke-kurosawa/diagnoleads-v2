import { z } from 'zod';

/**
 * Lead status enum
 */
export const leadStatusEnum = z.enum(['new', 'contacted', 'qualified', 'converted']);
export type LeadStatus = z.infer<typeof leadStatusEnum>;

/**
 * Lead source enum
 */
export const leadSourceEnum = z.enum(['website', 'embed', 'api']);
export type LeadSource = z.infer<typeof leadSourceEnum>;

/**
 * Advanced filter operator enum
 */
export const filterOperatorEnum = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'greater_or_equal',
  'less_or_equal',
  'between',
  'is_empty',
  'is_not_empty',
  'in',
  'not_in',
]);
export type FilterOperator = z.infer<typeof filterOperatorEnum>;

/**
 * Advanced filter condition schema
 */
export const filterConditionSchema = z.object({
  field: z.string().min(1),
  operator: filterOperatorEnum,
  value: z.unknown(),
  value2: z.unknown().optional(),
});
export type FilterCondition = z.infer<typeof filterConditionSchema>;

/**
 * Advanced filter group schema (supports nested groups)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const filterGroupSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    logic: z.enum(['and', 'or']),
    conditions: z.array(filterConditionSchema).default([]),
    groups: z.array(filterGroupSchema).optional(),
  })
);
export type FilterGroup = {
  logic: 'and' | 'or';
  conditions: FilterCondition[];
  groups?: FilterGroup[];
};

/**
 * Lead creation schema
 */
export const createLeadSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email('有効なメールアドレスを入力してください'),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  status: leadStatusEnum.default('new'),
  score: z.number().int().min(0).max(100).optional(),
  source: leadSourceEnum.optional(),
  responses: z.record(z.unknown()).default({}),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

/**
 * Lead update schema
 */
export const updateLeadSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  email: z.string().email('有効なメールアドレスを入力してください').optional(),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  status: leadStatusEnum.optional(),
  score: z.number().int().min(0).max(100).optional(),
  source: leadSourceEnum.optional(),
  responses: z.record(z.unknown()).optional(),
});
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

/**
 * Get lead by ID schema
 */
export const getLeadSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});
export type GetLeadInput = z.infer<typeof getLeadSchema>;

/**
 * List leads schema with pagination and filtering
 */
export const listLeadsSchema = z.object({
  organizationId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  status: leadStatusEnum.optional(),
  source: leadSourceEnum.optional(),
  search: z.string().optional(), // Search in name, email, company
  // Advanced filtering
  advancedFilter: filterGroupSchema.optional(),
  // Sort options
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'email', 'score', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  // Date range filter
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  // Score range filter
  scoreMin: z.number().int().min(0).max(100).optional(),
  scoreMax: z.number().int().min(0).max(100).optional(),
  // Tag filter
  tagIds: z.array(z.string().uuid()).optional(),
});
export type ListLeadsInput = z.infer<typeof listLeadsSchema>;

/**
 * Delete lead schema
 */
export const deleteLeadSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});
export type DeleteLeadInput = z.infer<typeof deleteLeadSchema>;

/**
 * Bulk update status schema
 */
export const bulkUpdateStatusSchema = z.object({
  organizationId: z.string().uuid(),
  ids: z.array(z.string().uuid()).min(1, '少なくとも1つのリードを選択してください'),
  status: leadStatusEnum,
});
export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>;

/**
 * Bulk delete schema
 */
export const bulkDeleteSchema = z.object({
  organizationId: z.string().uuid(),
  ids: z.array(z.string().uuid()).min(1, '少なくとも1つのリードを選択してください'),
});
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;

/**
 * Bulk create schema for importing leads
 */
export const bulkCreateSchema = z.object({
  organizationId: z.string().uuid(),
  leads: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        company: z.string().optional(),
        phone: z.string().optional(),
        status: leadStatusEnum.default('new'),
        source: leadSourceEnum.optional(),
        score: z.number().int().min(0).max(100).optional(),
      })
    )
    .min(1, '少なくとも1つのリードを指定してください'),
});
export type BulkCreateInput = z.infer<typeof bulkCreateSchema>;
