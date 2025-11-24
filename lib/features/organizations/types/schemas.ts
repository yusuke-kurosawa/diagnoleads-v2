import { z } from 'zod';

/**
 * Get organization by ID schema
 */
export const getOrganizationSchema = z.object({
  id: z.string().uuid(),
});
export type GetOrganizationInput = z.infer<typeof getOrganizationSchema>;

/**
 * List user's organizations schema
 */
export const listOrganizationsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});
export type ListOrganizationsInput = z.infer<typeof listOrganizationsSchema>;

/**
 * Update organization schema
 */
export const updateOrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  settings: z.record(z.unknown()).optional(),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

/**
 * Create organization schema
 */
export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  settings: z.record(z.unknown()).default({}).optional(),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
