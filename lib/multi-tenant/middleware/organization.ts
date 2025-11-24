import { z } from 'zod';
import { defineAbilitiesFor } from '@/lib/auth/permissions';
import { setCurrentUser } from '@/lib/db/rls';
import { verifyOrganizationMembership } from '../helpers/membership';
import type { ProtectedContext } from '@/lib/trpc/context';
import type { OrganizationContext } from '../types';

/**
 * Organization middleware input schema
 * Requires organizationId UUID and allows additional fields to pass through
 */
export const organizationInputSchema = z
  .object({ organizationId: z.string().uuid() })
  .passthrough();

/**
 * Organization middleware function
 *
 * This middleware:
 * 1. Validates organizationId in input
 * 2. Verifies user is a member of the organization
 * 3. Calculates CASL permissions based on role
 * 4. Sets current user for RLS (all subsequent DB queries respect RLS policies)
 *
 * @param ctx - Protected context (requires authentication)
 * @param input - Must contain organizationId
 * @returns Organization context (organization, membership, ability)
 */
export async function createOrganizationContext(
  ctx: ProtectedContext,
  input: { organizationId: string }
): Promise<OrganizationContext> {
  // 1. Verify organization membership
  const membership = await verifyOrganizationMembership(
    ctx.db,
    ctx.user.id,
    input.organizationId
  );

  // 2. Calculate CASL permissions based on user and membership
  const ability = defineAbilitiesFor(ctx.user as any, membership);

  // 3. Set current user for RLS
  // All subsequent database queries will automatically respect RLS policies
  await setCurrentUser(ctx.db, ctx.user.id);

  return {
    organization: membership.organization,
    membership,
    ability,
  };
}
