/**
 * Auth Middleware Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the auth module
vi.mock('@/lib/auth/config', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock the database client
vi.mock('@/lib/db/client', () => ({
  db: {
    query: {
      organizationMembers: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock schema
vi.mock('@/lib/db/schema', () => ({
  organizationMembers: {
    userId: 'userId',
    organizationId: 'organizationId',
  },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => ({ type: 'and', conditions: args })),
  eq: vi.fn((col, val) => ({ type: 'eq', column: col, value: val })),
}));

import { db } from '@/lib/db/client';
import { auth } from '@/lib/auth/config';
import {
  getUserFromRequest,
  getUserMembership,
  verifyOrganizationAccess,
} from '@/lib/auth/middleware';

describe('getUserFromRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user when session exists', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
    };

    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: mockUser,
      session: { id: 'session-123' },
    } as any);

    const headers = new Headers();
    const result = await getUserFromRequest(headers);

    expect(result).toEqual(mockUser);
    expect(auth.api.getSession).toHaveBeenCalledWith({ headers });
  });

  it('should return null when session does not exist', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

    const headers = new Headers();
    const result = await getUserFromRequest(headers);

    expect(result).toBeNull();
  });

  it('should return null when session.user is undefined', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      session: { id: 'session-123' },
    } as any);

    const headers = new Headers();
    const result = await getUserFromRequest(headers);

    expect(result).toBeNull();
  });

  it('should return null and log error when getSession throws', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(auth.api.getSession).mockRejectedValueOnce(new Error('Auth error'));

    const headers = new Headers();
    const result = await getUserFromRequest(headers);

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error getting user from request:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
});

describe('verifyOrganizationAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when user has membership', async () => {
    vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValueOnce({
      id: 'member-123',
      userId: 'user-123',
      organizationId: 'org-123',
      role: 'member',
    } as any);

    const result = await verifyOrganizationAccess('user-123', 'org-123');

    expect(result).toBe(true);
    expect(db.query.organizationMembers.findFirst).toHaveBeenCalled();
  });

  it('should return false when user has no membership', async () => {
    vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValueOnce(null);

    const result = await verifyOrganizationAccess('user-123', 'org-456');

    expect(result).toBe(false);
  });

  it('should return false when membership is undefined', async () => {
    vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValueOnce(undefined);

    const result = await verifyOrganizationAccess('user-123', 'org-456');

    expect(result).toBe(false);
  });

  it('should return false and log error when query throws', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(db.query.organizationMembers.findFirst).mockRejectedValueOnce(
      new Error('Database error')
    );

    const result = await verifyOrganizationAccess('user-123', 'org-123');

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error verifying organization access:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
});

describe('getUserMembership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return membership when found', async () => {
    const mockMembership = {
      id: 'member-123',
      userId: 'user-123',
      organizationId: 'org-123',
      role: 'admin',
      createdAt: new Date(),
    };

    vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValueOnce(mockMembership as any);

    const result = await getUserMembership('user-123', 'org-123');

    expect(result).toEqual(mockMembership);
  });

  it('should return null when membership not found', async () => {
    vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValueOnce(null);

    const result = await getUserMembership('user-123', 'org-999');

    expect(result).toBeNull();
  });

  it('should return null and log error when query throws', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(db.query.organizationMembers.findFirst).mockRejectedValueOnce(
      new Error('Connection lost')
    );

    const result = await getUserMembership('user-123', 'org-123');

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error getting user membership:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('should handle different roles', async () => {
    const mockOwner = {
      id: 'member-1',
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'owner',
    };

    vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValueOnce(mockOwner as any);

    const result = await getUserMembership('user-1', 'org-1');

    expect(result?.role).toBe('owner');
  });
});
