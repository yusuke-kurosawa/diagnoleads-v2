/**
 * Organization Hierarchy React Hooks
 *
 * Phase 2.7: ホールディングス・グループ企業対応
 *
 * Custom hooks for managing organization hierarchy in React components.
 */

'use client';

import type { DataSharingPolicy, OrganizationType } from '@/lib/db/schema';
import { trpc } from '@/lib/trpc/client';

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// =============================================================================
// Hook: useHierarchy
// =============================================================================

/**
 * Hook to get and manage organization hierarchy
 * Automatically disabled for invalid organization IDs (demo mode)
 */
export function useHierarchy(organizationId: string) {
  const utils = trpc.useUtils();
  const isValidOrg = isValidUUID(organizationId);

  // Queries - only enabled for valid UUIDs
  const hierarchyQuery = trpc.hierarchy.getHierarchy.useQuery(
    { organizationId },
    { enabled: !!organizationId && isValidOrg }
  );

  const childrenQuery = trpc.hierarchy.getChildren.useQuery(
    { organizationId },
    { enabled: !!organizationId && isValidOrg }
  );

  const ancestorsQuery = trpc.hierarchy.getAncestors.useQuery(
    { organizationId },
    { enabled: !!organizationId && isValidOrg }
  );

  const groupStatsQuery = trpc.hierarchy.getGroupStats.useQuery(
    { organizationId },
    { enabled: !!organizationId && isValidOrg }
  );

  // Mutations
  const setParentMutation = trpc.hierarchy.setParent.useMutation({
    onSuccess: () => {
      utils.hierarchy.getHierarchy.invalidate({ organizationId });
      utils.hierarchy.getChildren.invalidate({ organizationId });
      utils.hierarchy.getAncestors.invalidate({ organizationId });
      utils.hierarchy.getGroupStats.invalidate({ organizationId });
    },
  });

  const updatePolicyMutation = trpc.hierarchy.updateDataSharingPolicy.useMutation({
    onSuccess: () => {
      utils.hierarchy.getChildren.invalidate({ organizationId });
    },
  });

  const updateTypeMutation = trpc.hierarchy.updateOrganizationType.useMutation({
    onSuccess: () => {
      utils.hierarchy.getHierarchy.invalidate({ organizationId });
      utils.hierarchy.getGroupStats.invalidate({ organizationId });
    },
  });

  return {
    // Data
    hierarchy: hierarchyQuery.data,
    children: childrenQuery.data,
    ancestors: ancestorsQuery.data,
    groupStats: groupStatsQuery.data,

    // Loading states
    isLoading:
      hierarchyQuery.isLoading ||
      childrenQuery.isLoading ||
      ancestorsQuery.isLoading ||
      groupStatsQuery.isLoading,
    isHierarchyLoading: hierarchyQuery.isLoading,
    isChildrenLoading: childrenQuery.isLoading,
    isAncestorsLoading: ancestorsQuery.isLoading,
    isGroupStatsLoading: groupStatsQuery.isLoading,

    // Error states
    error:
      hierarchyQuery.error || childrenQuery.error || ancestorsQuery.error || groupStatsQuery.error,

    // Actions
    setParent: (parentOrganizationId: string | null) =>
      setParentMutation.mutateAsync({ organizationId, parentOrganizationId }),

    updateDataSharingPolicy: (policy: DataSharingPolicy) =>
      updatePolicyMutation.mutateAsync({ organizationId, policy }),

    updateOrganizationType: (organizationType: OrganizationType) =>
      updateTypeMutation.mutateAsync({ organizationId, organizationType }),

    // Mutation states
    isSetParentLoading: setParentMutation.isPending,
    isUpdatePolicyLoading: updatePolicyMutation.isPending,
    isUpdateTypeLoading: updateTypeMutation.isPending,

    // Refetch
    refetch: () => {
      hierarchyQuery.refetch();
      childrenQuery.refetch();
      ancestorsQuery.refetch();
      groupStatsQuery.refetch();
    },
  };
}

// =============================================================================
// Hook: useAccessibleOrganizations
// =============================================================================

/**
 * Hook to get all organizations accessible to the current user
 */
export function useAccessibleOrganizations(options?: {
  includeDescendants?: boolean;
  includeGroup?: boolean;
}) {
  const query = trpc.hierarchy.getAccessibleOrganizations.useQuery({
    includeDescendants: options?.includeDescendants ?? false,
    includeGroup: options?.includeGroup ?? false,
  });

  return {
    organizations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// =============================================================================
// Hook: useDescendants
// =============================================================================

/**
 * Hook to get all descendant organizations
 * Automatically disabled for invalid organization IDs (demo mode)
 */
export function useDescendants(organizationId: string) {
  const isValidOrg = isValidUUID(organizationId);

  const query = trpc.hierarchy.getDescendants.useQuery(
    { organizationId },
    { enabled: !!organizationId && isValidOrg }
  );

  return {
    descendants: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// =============================================================================
// Type Exports
// =============================================================================

export type { DataSharingPolicy, OrganizationType };
