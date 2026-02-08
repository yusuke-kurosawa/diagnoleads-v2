import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock trpc
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    useContext: vi.fn(() => ({
      members: {
        list: { invalidate: vi.fn() },
      },
    })),
    members: {
      list: {
        useQuery: vi.fn(() => ({
          data: {
            members: [{ id: 'member-1', name: 'Test User', role: 'member' }],
            total: 1,
          },
          isLoading: false,
          isError: false,
        })),
      },
      invite: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
      updateRole: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
      remove: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
    },
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import {
  useInviteMember,
  useListMembers,
  useMembers,
  useRemoveMember,
  useUpdateRole,
} from '@/hooks/use-members';

const validOrgId = '550e8400-e29b-41d4-a716-446655440000';
const invalidOrgId = 'invalid-org-id';

describe('useListMembers', () => {
  it('should return members list for valid org ID', () => {
    const { result } = renderHook(() =>
      useListMembers({
        organizationId: validOrgId,
        limit: 10,
        offset: 0,
      })
    );

    expect(result.current).toBeDefined();
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.members).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
  });

  it('should accept pagination parameters', () => {
    const { result } = renderHook(() =>
      useListMembers({
        organizationId: validOrgId,
        limit: 25,
        offset: 10,
      })
    );

    expect(result.current).toBeDefined();
  });
});

describe('useInviteMember', () => {
  it('should return mutation object', () => {
    const { result } = renderHook(() => useInviteMember());

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});

describe('useUpdateRole', () => {
  it('should return mutation object', () => {
    const { result } = renderHook(() => useUpdateRole());

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});

describe('useRemoveMember', () => {
  it('should return mutation object', () => {
    const { result } = renderHook(() => useRemoveMember());

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});

describe('useMembers', () => {
  it('should return composite members object', () => {
    const { result } = renderHook(() => useMembers(validOrgId));

    expect(result.current).toBeDefined();
    expect(result.current.members).toBeDefined();
    expect(result.current.total).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should have invite mutation', () => {
    const { result } = renderHook(() => useMembers(validOrgId));

    expect(result.current.invite).toBeDefined();
    expect(result.current.invite.mutate).toBeDefined();
  });

  it('should have updateRole mutation', () => {
    const { result } = renderHook(() => useMembers(validOrgId));

    expect(result.current.updateRole).toBeDefined();
    expect(result.current.updateRole.mutate).toBeDefined();
  });

  it('should have remove mutation', () => {
    const { result } = renderHook(() => useMembers(validOrgId));

    expect(result.current.remove).toBeDefined();
    expect(result.current.remove.mutate).toBeDefined();
  });
});
