import type { Organization, OrganizationMember } from '@/lib/db/schema';
import type { AppAbility } from '@/lib/auth/permissions';

/**
 * Organization context - available after organizationProcedure middleware
 */
export type OrganizationContext = {
  organization: Organization;
  membership: OrganizationMember;
  ability: AppAbility;
};

/**
 * Organization membership with organization details
 */
export type MembershipWithOrganization = OrganizationMember & {
  organization: Organization;
};
