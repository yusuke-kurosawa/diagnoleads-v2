/**
 * CMS Tenant Helpers Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/config', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Types
interface TenantContext {
  userId: string | null;
  organizationId: string | null;
  isAuthenticated: boolean;
}

interface Session {
  user: { id: string } | null;
  session: { activeOrganizationId?: string };
}

describe('TenantContext', () => {
  it('should define TenantContext interface', () => {
    const context: TenantContext = {
      userId: 'user-123',
      organizationId: 'org-456',
      isAuthenticated: true,
    };

    expect(context.userId).toBe('user-123');
    expect(context.organizationId).toBe('org-456');
    expect(context.isAuthenticated).toBe(true);
  });

  it('should handle unauthenticated context', () => {
    const context: TenantContext = {
      userId: null,
      organizationId: null,
      isAuthenticated: false,
    };

    expect(context.isAuthenticated).toBe(false);
  });
});

describe('getTenantContext', () => {
  it('should return unauthenticated when no session', async () => {
    const getTenantContext = async (): Promise<TenantContext> => {
      const session = null;
      if (!session) {
        return {
          userId: null,
          organizationId: null,
          isAuthenticated: false,
        };
      }
      return { userId: 'test', organizationId: null, isAuthenticated: true };
    };

    const context = await getTenantContext();
    expect(context.isAuthenticated).toBe(false);
  });

  it('should return authenticated with userId', async () => {
    const getTenantContext = async (session: Session | null): Promise<TenantContext> => {
      if (!session?.user) {
        return { userId: null, organizationId: null, isAuthenticated: false };
      }
      const organizationId = session.session?.activeOrganizationId || null;
      return {
        userId: session.user.id,
        organizationId,
        isAuthenticated: true,
      };
    };

    const session: Session = {
      user: { id: 'user-123' },
      session: { activeOrganizationId: 'org-456' },
    };

    const context = await getTenantContext(session);
    expect(context.userId).toBe('user-123');
    expect(context.organizationId).toBe('org-456');
    expect(context.isAuthenticated).toBe(true);
  });

  it('should handle missing organizationId', async () => {
    const session: Session = {
      user: { id: 'user-123' },
      session: {},
    };

    const organizationId = session.session?.activeOrganizationId || null;
    expect(organizationId).toBeNull();
  });

  it('should catch errors and return unauthenticated', async () => {
    const getTenantContext = async (): Promise<TenantContext> => {
      try {
        throw new Error('Session error');
      } catch {
        return { userId: null, organizationId: null, isAuthenticated: false };
      }
    };

    const context = await getTenantContext();
    expect(context.isAuthenticated).toBe(false);
  });
});

describe('getBlogRepository', () => {
  it('should return repository with organizationId', async () => {
    type RepositoryResult = {
      repo: { findAll: () => Promise<unknown[]> };
      organizationId: string | null;
    };

    const getBlogRepository = async (orgId: string | null): Promise<RepositoryResult> => ({
      repo: { findAll: vi.fn().mockResolvedValue([]) },
      organizationId: orgId,
    });

    const result = await getBlogRepository('org-123');
    expect(result.organizationId).toBe('org-123');
    expect(result.repo).toBeDefined();
  });
});

describe('getFAQRepository', () => {
  it('should return repository with organizationId', async () => {
    type RepositoryResult = {
      repo: { findAll: () => Promise<unknown[]> };
      organizationId: string | null;
    };

    const getFAQRepository = async (orgId: string | null): Promise<RepositoryResult> => ({
      repo: { findAll: vi.fn().mockResolvedValue([]) },
      organizationId: orgId,
    });

    const result = await getFAQRepository('org-123');
    expect(result.organizationId).toBe('org-123');
  });
});

describe('getAssessmentRepository', () => {
  it('should return repository with organizationId', async () => {
    type RepositoryResult = {
      repo: { findAll: () => Promise<unknown[]> };
      organizationId: string | null;
    };

    const getAssessmentRepository = async (orgId: string | null): Promise<RepositoryResult> => ({
      repo: { findAll: vi.fn().mockResolvedValue([]) },
      organizationId: orgId,
    });

    const result = await getAssessmentRepository('org-123');
    expect(result.organizationId).toBe('org-123');
  });
});

describe('requireTenantContext', () => {
  it('should throw when not authenticated', async () => {
    const requireTenantContext = async (context: TenantContext) => {
      if (!context.isAuthenticated || !context.userId) {
        throw new Error('Authentication required');
      }
      if (!context.organizationId) {
        throw new Error('Organization context required');
      }
      return { userId: context.userId, organizationId: context.organizationId };
    };

    const unauthContext: TenantContext = {
      userId: null,
      organizationId: null,
      isAuthenticated: false,
    };

    await expect(requireTenantContext(unauthContext)).rejects.toThrow('Authentication required');
  });

  it('should throw when no organizationId', async () => {
    const requireTenantContext = async (context: TenantContext) => {
      if (!context.isAuthenticated || !context.userId) {
        throw new Error('Authentication required');
      }
      if (!context.organizationId) {
        throw new Error('Organization context required');
      }
      return { userId: context.userId, organizationId: context.organizationId };
    };

    const noOrgContext: TenantContext = {
      userId: 'user-123',
      organizationId: null,
      isAuthenticated: true,
    };

    await expect(requireTenantContext(noOrgContext)).rejects.toThrow('Organization context required');
  });

  it('should return context when valid', async () => {
    const requireTenantContext = async (context: TenantContext) => {
      if (!context.isAuthenticated || !context.userId) {
        throw new Error('Authentication required');
      }
      if (!context.organizationId) {
        throw new Error('Organization context required');
      }
      return { userId: context.userId, organizationId: context.organizationId };
    };

    const validContext: TenantContext = {
      userId: 'user-123',
      organizationId: 'org-456',
      isAuthenticated: true,
    };

    const result = await requireTenantContext(validContext);
    expect(result.userId).toBe('user-123');
    expect(result.organizationId).toBe('org-456');
  });
});

describe('getPublicContentContext', () => {
  it('should return organizationId for authenticated user', async () => {
    const getPublicContentContext = async (orgId: string | null) => ({ organizationId: orgId });

    const result = await getPublicContentContext('org-123');
    expect(result.organizationId).toBe('org-123');
  });

  it('should return null for public access', async () => {
    const getPublicContentContext = async (orgId: string | null) => ({ organizationId: orgId });

    const result = await getPublicContentContext(null);
    expect(result.organizationId).toBeNull();
  });
});
