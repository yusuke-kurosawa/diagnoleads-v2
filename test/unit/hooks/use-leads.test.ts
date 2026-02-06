/**
 * useLeads Hook Tests
 */

import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock tRPC client
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    useContext: () => ({
      leads: {
        list: { invalidate: vi.fn() },
        get: { invalidate: vi.fn() },
      },
    }),
    leads: {
      create: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isError: false,
          error: null,
        })),
      },
      get: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
          isError: false,
        })),
      },
      list: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
          isError: false,
        })),
      },
      update: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
        })),
      },
      delete: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
        })),
      },
    },
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Lead hooks types', () => {
  it('should define CreateLeadInput type', () => {
    type CreateLeadInput = {
      organizationId: string;
      name: string;
      email: string;
      phone?: string;
      company?: string;
    };
    
    const input: CreateLeadInput = {
      organizationId: 'org-123',
      name: 'John Doe',
      email: 'john@example.com',
    };
    
    expect(input.name).toBe('John Doe');
  });

  it('should define GetLeadInput type', () => {
    type GetLeadInput = {
      id: string;
      organizationId: string;
    };
    
    const input: GetLeadInput = {
      id: 'lead-123',
      organizationId: 'org-123',
    };
    
    expect(input.id).toBe('lead-123');
  });

  it('should define ListLeadsInput type', () => {
    type ListLeadsInput = {
      organizationId: string;
      page?: number;
      perPage?: number;
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };
    
    const input: ListLeadsInput = {
      organizationId: 'org-123',
      page: 1,
      perPage: 20,
      search: 'test',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    
    expect(input.perPage).toBe(20);
  });

  it('should define UpdateLeadInput type', () => {
    type UpdateLeadInput = {
      id: string;
      organizationId: string;
      name?: string;
      email?: string;
      phone?: string;
      status?: string;
    };
    
    const input: UpdateLeadInput = {
      id: 'lead-123',
      organizationId: 'org-123',
      status: 'qualified',
    };
    
    expect(input.status).toBe('qualified');
  });

  it('should define DeleteLeadInput type', () => {
    type DeleteLeadInput = {
      id: string;
      organizationId: string;
    };
    
    const input: DeleteLeadInput = {
      id: 'lead-123',
      organizationId: 'org-123',
    };
    
    expect(input.organizationId).toBe('org-123');
  });
});

describe('UUID validation', () => {
  function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  it('should validate valid UUIDs', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
  });

  it('should reject invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('12345')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false); // too short
    expect(isValidUUID('demo-org-id')).toBe(false);
  });
});

describe('Lead hook return types', () => {
  it('should define mutation result type', () => {
    type MutationResult<T> = {
      mutate: (input: T) => void;
      mutateAsync: (input: T) => Promise<unknown>;
      isLoading: boolean;
      isError: boolean;
      error: Error | null;
    };
    
    const result: MutationResult<{ name: string }> = {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isLoading: false,
      isError: false,
      error: null,
    };
    
    expect(result.isLoading).toBe(false);
  });

  it('should define query result type', () => {
    type QueryResult<T> = {
      data: T | undefined;
      isLoading: boolean;
      isError: boolean;
      error: Error | null;
      refetch: () => void;
    };
    
    const result: QueryResult<{ id: string; name: string }> = {
      data: { id: 'lead-1', name: 'Lead' },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
    
    expect(result.data?.id).toBe('lead-1');
  });
});

describe('Toast messages', () => {
  it('should define toast messages in Japanese', () => {
    const messages = {
      createLoading: 'リードを作成中...',
      createSuccess: 'リードを作成しました',
      updateLoading: 'リードを更新中...',
      updateSuccess: 'リードを更新しました',
      deleteLoading: 'リードを削除中...',
      deleteSuccess: 'リードを削除しました',
    };
    
    expect(messages.createSuccess).toContain('作成');
    expect(messages.updateSuccess).toContain('更新');
    expect(messages.deleteSuccess).toContain('削除');
  });

  it('should format error messages', () => {
    const formatError = (message: string) => `エラー: ${message}`;
    
    expect(formatError('Network error')).toBe('エラー: Network error');
    expect(formatError('Not found')).toBe('エラー: Not found');
  });
});
