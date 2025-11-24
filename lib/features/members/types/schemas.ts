import { z } from 'zod';

/**
 * Members Zod Schemas
 * Type-safe input validation for member management procedures
 */

/**
 * List members schema
 */
export const listMembersSchema = z.object({
  organizationId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
export type ListMembersInput = z.infer<typeof listMembersSchema>;

/**
 * Invite member schema
 */
export const inviteMemberSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['member', 'admin']).default('member'),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

/**
 * Update role schema
 */
export const updateRoleSchema = z.object({
  organizationId: z.string().uuid(),
  membershipId: z.string().uuid(),
  role: z.enum(['member', 'admin', 'owner']),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

/**
 * Remove member schema
 */
export const removeMemberSchema = z.object({
  organizationId: z.string().uuid(),
  membershipId: z.string().uuid(),
});
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

/**
 * Accept invite schema
 */
export const acceptInviteSchema = z.object({
  token: z.string().min(32),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
