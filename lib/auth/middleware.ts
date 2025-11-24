import { auth } from './config';
import type { User } from './config';
import { db } from '@/lib/db/client';
import { organizationMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Get user from request headers
 */
export async function getUserFromRequest(headers: Headers): Promise<User | null> {
  try {
    const session = await auth.api.getSession({ headers });
    return session?.user ?? null;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

/**
 * Verify user has access to organization
 */
export async function verifyOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      ),
    });

    return !!membership;
  } catch (error) {
    console.error('Error verifying organization access:', error);
    return false;
  }
}

/**
 * Get user's membership in organization
 */
export async function getUserMembership(userId: string, organizationId: string) {
  try {
    return await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      ),
    });
  } catch (error) {
    console.error('Error getting user membership:', error);
    return null;
  }
}
