import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock trpc
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      hierarchy: {
        getHierarchy: { invalidate: vi.fn() },
        getChildren: { invalidate: vi.fn() },
        getAncestors: { invalidate: vi.fn() },
        getGroupStats: { invalidate: vi.fn() },
      },
    })),
    hierarchy: {
      getHierarchy: {
        useQuery: vi.fn(() => ({
          data: { id: 'org-1', name: 'Test Org', parentId: null },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        })),
      },
      getChildren: {
        useQuery: vi.fn(() => ({
          data: [{ id: 'child-1', name: 'Child Org' }],
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        })),
      },
      getAncestors: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        })),
      },
      getGroupStats: {
        useQuery: vi.fn(() => ({
          data: { totalOrganizations: 3, totalMembers: 10 },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        })),
      },
      getDescendants: {
        useQuery: vi.fn(() => ({
          data: [{ id: 'desc-1', name: 'Descendant' }],
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        })),
      },
      getAccessibleOrganizations: {
        useQuery: vi.fn(() => ({
          data: [{ id: 'org-1', name: 'Test Org' }],
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        })),
      },
      setParent: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
      updateDataSharingPolicy: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
      updateOrganizationType: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
    },
  },
}));

// Import after mocks
import { useAccessibleOrganizations, useDescendants, useHierarchy } from '@/hooks/use-hierarchy';

const validOrgId = '550e8400-e29b-41d4-a716-446655440000';
const invalidOrgId = 'invalid-org-id';

describe('useHierarchy', () => {
  it('should return hierarchy data', () => {
    const { result } = renderHook(() => useHierarchy(validOrgId));

    expect(result.current).toBeDefined();
    expect(result.current.hierarchy).toBeDefined();
    expect(result.current.children).toBeDefined();
    expect(result.current.ancestors).toBeDefined();
    expect(result.current.groupStats).toBeDefined();
  });

  it('should have loading states', () => {
    const { result } = renderHook(() => useHierarchy(validOrgId));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isHierarchyLoading).toBe(false);
    expect(result.current.isChildrenLoading).toBe(false);
    expect(result.current.isAncestorsLoading).toBe(false);
    expect(result.current.isGroupStatsLoading).toBe(false);
  });

  it('should have error state', () => {
    const { result } = renderHook(() => useHierarchy(validOrgId));

    expect(result.current.error).toBeUndefined();
  });

  it('should have action methods', () => {
    const { result } = renderHook(() => useHierarchy(validOrgId));

    expect(typeof result.current.setParent).toBe('function');
    expect(typeof result.current.updateDataSharingPolicy).toBe('function');
    expect(typeof result.current.updateOrganizationType).toBe('function');
  });

  it('should have mutation loading states', () => {
    const { result } = renderHook(() => useHierarchy(validOrgId));

    expect(result.current.isSetParentLoading).toBe(false);
    expect(result.current.isUpdatePolicyLoading).toBe(false);
    expect(result.current.isUpdateTypeLoading).toBe(false);
  });

  it('should have refetch method', () => {
    const { result } = renderHook(() => useHierarchy(validOrgId));

    expect(typeof result.current.refetch).toBe('function');
  });
});

describe('useAccessibleOrganizations', () => {
  it('should return organizations list', () => {
    const { result } = renderHook(() => useAccessibleOrganizations());

    expect(result.current).toBeDefined();
    expect(result.current.organizations).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should accept options', () => {
    const { result } = renderHook(() =>
      useAccessibleOrganizations({
        includeDescendants: true,
        includeGroup: true,
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should have refetch method', () => {
    const { result } = renderHook(() => useAccessibleOrganizations());

    expect(typeof result.current.refetch).toBe('function');
  });
});

describe('useDescendants', () => {
  it('should return descendants for valid org ID', () => {
    const { result } = renderHook(() => useDescendants(validOrgId));

    expect(result.current).toBeDefined();
    expect(result.current.descendants).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should have refetch method', () => {
    const { result } = renderHook(() => useDescendants(validOrgId));

    expect(typeof result.current.refetch).toBe('function');
  });
});
