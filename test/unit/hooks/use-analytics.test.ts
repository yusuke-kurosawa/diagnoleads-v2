import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock trpc
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    analytics: {
      getOverview: {
        useQuery: vi.fn(() => ({
          data: { totalLeads: 100, newLeads: 10, convertedLeads: 5 },
          isLoading: false,
          isError: false,
        })),
      },
      getLeadTrend: {
        useQuery: vi.fn(() => ({
          data: [{ date: '2024-01-01', count: 5 }],
          isLoading: false,
          isError: false,
        })),
      },
      getSourceBreakdown: {
        useQuery: vi.fn(() => ({
          data: [{ source: 'web', count: 50 }],
          isLoading: false,
          isError: false,
        })),
      },
      getStatusBreakdown: {
        useQuery: vi.fn(() => ({
          data: [{ status: 'new', count: 30 }],
          isLoading: false,
          isError: false,
        })),
      },
      getConversionFunnel: {
        useQuery: vi.fn(() => ({
          data: { stages: [] },
          isLoading: false,
          isError: false,
        })),
      },
      getScoreDistribution: {
        useQuery: vi.fn(() => ({
          data: [{ range: '0-20', count: 10 }],
          isLoading: false,
          isError: false,
        })),
      },
      getResponseTime: {
        useQuery: vi.fn(() => ({
          data: { average: 3600 },
          isLoading: false,
          isError: false,
        })),
      },
    },
  },
}));

// Import after mocks
import {
  useAnalytics,
  useConversionFunnel,
  useLeadTrend,
  useOverview,
  useResponseTime,
  useScoreDistribution,
  useSourceBreakdown,
  useStatusBreakdown,
} from '@/hooks/use-analytics';

const validOrgId = '550e8400-e29b-41d4-a716-446655440000';
const invalidOrgId = 'invalid-org-id';

describe('useOverview', () => {
  it('should return overview data for valid org ID', () => {
    const { result } = renderHook(() => useOverview(validOrgId));

    expect(result.current).toBeDefined();
    expect(result.current.data).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should accept dateRange parameter', () => {
    const { result } = renderHook(() => useOverview(validOrgId, '7d'));

    expect(result.current).toBeDefined();
  });
});

describe('useLeadTrend', () => {
  it('should return trend data', () => {
    const { result } = renderHook(() => useLeadTrend(validOrgId));

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should accept granularity parameter', () => {
    const { result } = renderHook(() => useLeadTrend(validOrgId, '30d', 'weekly'));

    expect(result.current).toBeDefined();
  });
});

describe('useSourceBreakdown', () => {
  it('should return source breakdown data', () => {
    const { result } = renderHook(() => useSourceBreakdown(validOrgId));

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useStatusBreakdown', () => {
  it('should return status breakdown data', () => {
    const { result } = renderHook(() => useStatusBreakdown(validOrgId));

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useConversionFunnel', () => {
  it('should return funnel data', () => {
    const { result } = renderHook(() => useConversionFunnel(validOrgId));

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useScoreDistribution', () => {
  it('should return score distribution data', () => {
    const { result } = renderHook(() => useScoreDistribution(validOrgId));

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useResponseTime', () => {
  it('should return response time data', () => {
    const { result } = renderHook(() => useResponseTime(validOrgId));

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useAnalytics', () => {
  it('should return composite analytics object', () => {
    const { result } = renderHook(() => useAnalytics(validOrgId));

    expect(result.current).toBeDefined();
    expect(result.current.overview).toBeDefined();
    expect(result.current.leadTrend).toBeDefined();
    expect(result.current.sourceBreakdown).toBeDefined();
    expect(result.current.statusBreakdown).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should accept dateRange parameter', () => {
    const { result } = renderHook(() => useAnalytics(validOrgId, '7d'));

    expect(result.current).toBeDefined();
  });
});
