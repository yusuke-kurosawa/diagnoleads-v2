/**
 * Organization Hierarchy React Hooks
 *
 * Phase 2.7: ホールディングス・グループ企業対応
 *
 * Custom hooks for managing organization hierarchy in React components.
 */

'use client';

import { trpc } from '@/lib/trpc/client';
import type { DataSharingPolicy, OrganizationType } from '@/lib/db/schema';

// =============================================================================
// Hook: useHierarchy
// =============================================================================

/**
 * Hook to get and manage organization hierarchy
 */
export function useHierarchy(organizationId: string) {
  const utils = trpc.useUtils();

  // Queries
  const hierarchyQuery = trpc.hierarchy.getHierarchy.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );

  const childrenQuery = trpc.hierarchy.getChildren.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );

  const ancestorsQuery = trpc.hierarchy.getAncestors.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );

  const groupStatsQuery = trpc.hierarchy.getGroupStats.useQuery(
    { organizationId },
    { enabled: !!organizationId }
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
      hierarchyQuery.error ||
      childrenQuery.error ||
      ancestorsQuery.error ||
      groupStatsQuery.error,

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
 */
export function useDescendants(organizationId: string) {
  const query = trpc.hierarchy.getDescendants.useQuery(
    { organizationId },
    { enabled: !!organizationId }
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
