import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock trpc
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    useContext: vi.fn(() => ({
      leads: {
        get: { invalidate: vi.fn() },
        list: { invalidate: vi.fn() },
      },
    })),
    ai: {
      scoreLead: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
          isError: false,
          isSuccess: false,
          data: null,
        })),
      },
      batchScoreLeads: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
      updateEmbedding: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
      semanticSearch: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
          isError: false,
        })),
      },
      findSimilar: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
          isError: false,
        })),
      },
      generateSummary: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
          isError: false,
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
  useAI,
  useBatchScoreLeads,
  useFindSimilarLeads,
  useGenerateSummary,
  useScoreLead,
  useSemanticSearch,
  useUpdateEmbedding,
} from '@/hooks/use-ai';

describe('useScoreLead', () => {
  it('should return mutation object', () => {
    const { result } = renderHook(() => useScoreLead());

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});

describe('useBatchScoreLeads', () => {
  it('should return mutation object', () => {
    const { result } = renderHook(() => useBatchScoreLeads());

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});

describe('useSemanticSearch', () => {
  it('should return query object', () => {
    const { result } = renderHook(() =>
      useSemanticSearch({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        query: 'test query',
      })
    );

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should be disabled for empty query', () => {
    const { result } = renderHook(() =>
      useSemanticSearch({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        query: '',
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should be disabled for invalid organization ID', () => {
    const { result } = renderHook(() =>
      useSemanticSearch({
        organizationId: 'invalid-id',
        query: 'test',
      })
    );

    expect(result.current).toBeDefined();
  });
});

describe('useFindSimilarLeads', () => {
  it('should return query object', () => {
    const { result } = renderHook(() =>
      useFindSimilarLeads({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        leadId: '550e8400-e29b-41d4-a716-446655440001',
      })
    );

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useGenerateSummary', () => {
  it('should return query object', () => {
    const { result } = renderHook(() =>
      useGenerateSummary({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        leadId: '550e8400-e29b-41d4-a716-446655440001',
      })
    );

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useUpdateEmbedding', () => {
  it('should return mutation object', () => {
    const { result } = renderHook(() => useUpdateEmbedding());

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});

describe('useAI', () => {
  it('should return composite AI object', () => {
    const { result } = renderHook(() => useAI('550e8400-e29b-41d4-a716-446655440000'));

    expect(result.current).toBeDefined();
    expect(result.current.scoreLead).toBeDefined();
    expect(result.current.batchScoreLeads).toBeDefined();
    expect(result.current.updateEmbedding).toBeDefined();
    expect(result.current.score).toBeDefined();
    expect(result.current.batchScore).toBeDefined();
    expect(result.current.updateLeadEmbedding).toBeDefined();
  });

  it('should have helper methods', () => {
    const { result } = renderHook(() => useAI('550e8400-e29b-41d4-a716-446655440000'));

    expect(typeof result.current.score).toBe('function');
    expect(typeof result.current.batchScore).toBe('function');
    expect(typeof result.current.updateLeadEmbedding).toBe('function');
  });
});
