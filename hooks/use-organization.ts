import { useParams } from 'next/navigation';

/**
 * Hook to get the current organization ID from the URL
 *
 * Expects the organization ID to be in the URL path as [organizationId]
 * Example: /dashboard/[organizationId]/leads
 *
 * @returns The current organization ID or null if not in an organization context
 */
export function useOrganizationId(): string | null {
  const params = useParams();
  const organizationId = params?.organizationId;

  if (typeof organizationId === 'string') {
    return organizationId;
  }

  return null;
}

/**
 * Hook to get the current organization ID (throws if not in organization context)
 *
 * Use this when you're certain the component will always be rendered in an organization context
 *
 * @returns The current organization ID
 * @throws Error if not in an organization context
 */
export function useRequiredOrganizationId(): string {
  const organizationId = useOrganizationId();

  if (!organizationId) {
    throw new Error('This component must be used within an organization context');
  }

  return organizationId;
}
