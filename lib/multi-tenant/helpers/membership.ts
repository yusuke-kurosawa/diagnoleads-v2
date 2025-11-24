import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import type { Database } from '@/lib/db/client';
import { organizationMembers } from '@/lib/db/schema';
import type { MembershipWithOrganization } from '../types';

/**
 * Verify that a user is a member of an organization
 * @param db - Database instance
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @returns Membership with organization details
 * @throws TRPCError with FORBIDDEN code if user is not a member
 */
export async function verifyOrganizationMembership(
  db: Database,
  userId: string,
  organizationId: string
): Promise<MembershipWithOrganization> {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.organizationId, organizationId)
    ),
    with: {
      organization: true,
    },
  });

  if (!membership) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'この組織にアクセスする権限がありません',
    });
  }

  return membership;
}

/**
 * Check if a user is a member of an organization (without throwing)
 * @param db - Database instance
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @returns Membership with organization details or null
 */
export async function findOrganizationMembership(
  db: Database,
  userId: string,
  organizationId: string
): Promise<MembershipWithOrganization | null> {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.organizationId, organizationId)
    ),
    with: {
      organization: true,
    },
  });

  return membership ?? null;
}
