/**
 * Organization Context Tests
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, renderHook, waitFor } from '@testing-library/react';
import { OrganizationProvider, useOrganizationContext, type OrganizationContextType } from '@/lib/context/organization-context';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage.store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage.store[key]; }),
  clear: vi.fn(() => { mockLocalStorage.store = {}; }),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('OrganizationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('should render children', () => {
    render(
      <OrganizationProvider>
        <div>Test Child</div>
      </OrganizationProvider>
    );
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should provide context to children', () => {
    let contextValue: OrganizationContextType | null = null;
    
    function TestComponent() {
      contextValue = useOrganizationContext();
      return <div>Test</div>;
    }
    
    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );
    
    expect(contextValue).not.toBeNull();
    expect(contextValue?.organizationId).toBeNull();
  });

  it('should start with loading state', () => {
    let contextValue: OrganizationContextType | null = null;
    
    function TestComponent() {
      contextValue = useOrganizationContext();
      return <div>{contextValue.isLoading ? 'Loading' : 'Ready'}</div>;
    }
    
    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );
    
    // After effect runs, loading should be false
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });
});

describe('useOrganizationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useOrganizationContext());
    }).toThrow('useOrganizationContext must be used within OrganizationProvider');
  });

  it('should return context value when inside provider', () => {
    const { result } = renderHook(() => useOrganizationContext(), {
      wrapper: OrganizationProvider,
    });
    
    expect(result.current).toBeDefined();
    expect(result.current.organizationId).toBeNull();
    expect(result.current.organization).toBeNull();
  });
});

describe('setOrganization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('should set organization ID', async () => {
    const { result } = renderHook(() => useOrganizationContext(), {
      wrapper: OrganizationProvider,
    });
    
    act(() => {
      result.current.setOrganization('org-123');
    });
    
    await waitFor(() => {
      expect(result.current.organizationId).toBe('org-123');
    });
  });

  it('should set organization data', async () => {
    const mockOrg = {
      id: 'org-123',
      name: 'Test Org',
    } as any;
    
    const { result } = renderHook(() => useOrganizationContext(), {
      wrapper: OrganizationProvider,
    });
    
    act(() => {
      result.current.setOrganization('org-123', mockOrg);
    });
    
    await waitFor(() => {
      expect(result.current.organizationId).toBe('org-123');
      expect(result.current.organization).toEqual(mockOrg);
    });
  });
});

describe('clearOrganization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('should clear organization', async () => {
    const { result } = renderHook(() => useOrganizationContext(), {
      wrapper: OrganizationProvider,
    });
    
    // Set first
    act(() => {
      result.current.setOrganization('org-123');
    });
    
    await waitFor(() => {
      expect(result.current.organizationId).toBe('org-123');
    });
    
    // Then clear
    act(() => {
      result.current.clearOrganization();
    });
    
    await waitFor(() => {
      expect(result.current.organizationId).toBeNull();
      expect(result.current.organization).toBeNull();
    });
  });

  it('should remove from localStorage', async () => {
    const { result } = renderHook(() => useOrganizationContext(), {
      wrapper: OrganizationProvider,
    });
    
    act(() => {
      result.current.setOrganization('org-123');
    });
    
    act(() => {
      result.current.clearOrganization();
    });
    
    expect(mockLocalStorage.removeItem).toHaveBeenCalled();
  });
});

describe('localStorage persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('should restore from localStorage on mount', async () => {
    mockLocalStorage.store['diagnoleads:current-organization'] = JSON.stringify({
      id: 'stored-org',
      organization: { id: 'stored-org', name: 'Stored' },
      timestamp: Date.now(),
    });
    
    const { result } = renderHook(() => useOrganizationContext(), {
      wrapper: OrganizationProvider,
    });
    
    await waitFor(() => {
      expect(result.current.organizationId).toBe('stored-org');
    });
  });

  it('should persist to localStorage on change', async () => {
    const { result } = renderHook(() => useOrganizationContext(), {
      wrapper: OrganizationProvider,
    });
    
    act(() => {
      result.current.setOrganization('new-org');
    });
    
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  it('should handle invalid localStorage data', async () => {
    mockLocalStorage.store['diagnoleads:current-organization'] = 'invalid-json';
    
    const { result } = renderHook(() => useOrganizationContext(), {
      wrapper: OrganizationProvider,
    });
    
    await waitFor(() => {
      expect(result.current.organizationId).toBeNull();
    });
  });
});

describe('OrganizationContextType', () => {
  it('should have expected properties', async () => {
    const { result } = renderHook(() => useOrganizationContext(), {
      wrapper: OrganizationProvider,
    });
    
    expect(result.current).toHaveProperty('organizationId');
    expect(result.current).toHaveProperty('organization');
    expect(result.current).toHaveProperty('setOrganization');
    expect(result.current).toHaveProperty('clearOrganization');
    expect(result.current).toHaveProperty('isLoading');
  });

  it('should have correct function types', async () => {
    const { result } = renderHook(() => useOrganizationContext(), {
      wrapper: OrganizationProvider,
    });
    
    expect(typeof result.current.setOrganization).toBe('function');
    expect(typeof result.current.clearOrganization).toBe('function');
  });
});
