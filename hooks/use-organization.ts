'use client';

import { useOrganizationContext } from '@/lib/context/organization-context';
import { trpc } from '@/lib/trpc/client';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

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

/**
 * Hook to access full organization context
 *
 * Provides organization state, data, and management functions
 *
 * @example
 * ```tsx
 * const { organizationId, organization, setOrganization } = useOrganization();
 *
 * // Switch organization
 * setOrganization('new-org-id');
 *
 * // Clear organization
 * clearOrganization();
 * ```
 */
export function useOrganization() {
  const context = useOrganizationContext();
  const urlOrgId = useOrganizationId();

  // Sync URL organization with context
  useEffect(() => {
    if (urlOrgId && urlOrgId !== context.organizationId) {
      context.setOrganization(urlOrgId);
    }
  }, [urlOrgId, context]);

  return context;
}

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Hook to get current organization with data
 *
 * Automatically fetches organization data if not already loaded
 *
 * @returns Organization with loading state
 */
export function useCurrentOrganization() {
  const {
    organizationId,
    organization,
    setOrganization,
    isLoading: contextLoading,
  } = useOrganization();

  // Validate UUID format before making API call
  const isValidOrg = organizationId ? isValidUUID(organizationId) : false;

  // Fetch organization data if we have a valid ID but no data
  const { data, isLoading: queryLoading } = trpc.organizations.getById.useQuery(
    { id: organizationId! },
    {
      enabled: isValidOrg && !organization,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Update context with fetched data
  useEffect(() => {
    if (data && organizationId) {
      setOrganization(organizationId, data);
    }
  }, [data, organizationId, setOrganization]);

  return {
    organization: organization || data || null,
    isLoading: contextLoading || queryLoading,
  };
}
