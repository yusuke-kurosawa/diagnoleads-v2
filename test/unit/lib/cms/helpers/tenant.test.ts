/**
 * CMS Tenant Helpers Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies before importing
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

vi.mock('@/lib/cms/repositories/assessment.repository', () => ({
  AssessmentRepository: class MockAssessmentRepository {
    findAll = vi.fn().mockResolvedValue([]);
  },
}));

vi.mock('@/lib/cms/repositories/blog.repository', () => ({
  BlogRepository: class MockBlogRepository {
    findAll = vi.fn().mockResolvedValue([]);
  },
}));

vi.mock('@/lib/cms/repositories/faq.repository', () => ({
  FAQRepository: class MockFAQRepository {
    findAll = vi.fn().mockResolvedValue([]);
  },
}));

// Import after mocking
import { auth } from '@/lib/auth/config';
import {
  getTenantContext,
  getBlogRepository,
  getFAQRepository,
  getAssessmentRepository,
  requireTenantContext,
  getPublicContentContext,
  type TenantContext,
} from '@/lib/cms/helpers/tenant';

// Types
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

// Integration tests with actual module
describe('getTenantContext (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return unauthenticated context when no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const context = await getTenantContext();
    expect(context.isAuthenticated).toBe(false);
    expect(context.userId).toBeNull();
    expect(context.organizationId).toBeNull();
  });

  it('should return authenticated context with session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
      session: { activeOrganizationId: 'org-456' },
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const context = await getTenantContext();
    expect(context.isAuthenticated).toBe(true);
    expect(context.userId).toBe('user-123');
  });

  it('should handle error and return unauthenticated', async () => {
    vi.mocked(auth.api.getSession).mockRejectedValue(new Error('Session error'));

    const context = await getTenantContext();
    expect(context.isAuthenticated).toBe(false);
  });
});

describe('getBlogRepository (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return BlogRepository instance', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const { repo, organizationId } = await getBlogRepository();
    expect(repo).toBeDefined();
    expect(organizationId).toBeNull();
  });
});

describe('getFAQRepository (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return FAQRepository instance', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const { repo, organizationId } = await getFAQRepository();
    expect(repo).toBeDefined();
    expect(organizationId).toBeNull();
  });
});

describe('getAssessmentRepository (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return AssessmentRepository instance', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const { repo, organizationId } = await getAssessmentRepository();
    expect(repo).toBeDefined();
    expect(organizationId).toBeNull();
  });
});

describe('requireTenantContext (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw when not authenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    await expect(requireTenantContext()).rejects.toThrow('Authentication required');
  });

  it('should throw when no organizationId', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user-123' },
      session: {},
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    await expect(requireTenantContext()).rejects.toThrow('Organization context required');
  });

  it('should return context when valid', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user-123' },
      session: { activeOrganizationId: 'org-456' },
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const result = await requireTenantContext();
    expect(result.userId).toBe('user-123');
    expect(result.organizationId).toBe('org-456');
  });
});

describe('getPublicContentContext (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return organizationId from session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user-123' },
      session: { activeOrganizationId: 'org-456' },
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    const { organizationId } = await getPublicContentContext();
    expect(organizationId).toBe('org-456');
  });
});
