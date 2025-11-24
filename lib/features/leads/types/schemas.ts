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
