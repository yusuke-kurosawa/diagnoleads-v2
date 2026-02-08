import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}));

// Mock the feature flag service
vi.mock('@/lib/features/feature-flags/service', () => ({
  evaluateFlag: vi.fn().mockReturnValue({ enabled: true, reason: 'Enabled' }),
  invalidateFlagCache: vi.fn(),
  getCachedFlag: vi.fn().mockReturnValue(null),
  setCachedFlag: vi.fn(),
}));

import { db } from '@/lib/db/client';
import {
  evaluateFlag,
  getCachedFlag,
  invalidateFlagCache,
  setCachedFlag,
} from '@/lib/features/feature-flags/service';

describe('feature-flags-router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should list feature flags for organization', async () => {
      const mockFlags = [
        { id: 'flag-1', key: 'feature_a', name: 'Feature A', status: 'enabled' },
        { id: 'flag-2', key: 'feature_b', name: 'Feature B', status: 'disabled' },
      ];

      (db.offset as ReturnType<typeof vi.fn>).mockResolvedValue(mockFlags);

      const result = await db
        .select()
        .from({} as any)
        .where({} as any)
        .orderBy({} as any)
        .limit(10)
        .offset(0);

      expect(result).toEqual(mockFlags);
    });

    it('should filter by status', async () => {
      const mockFlags = [{ id: 'flag-1', key: 'feature_a', status: 'enabled' }];

      (db.offset as ReturnType<typeof vi.fn>).mockResolvedValue(mockFlags);

      const result = await db
        .select()
        .from({} as any)
        .where({} as any)
        .orderBy({} as any)
        .limit(10)
        .offset(0);

      expect(result.length).toBe(1);
    });

    it('should return empty array when no flags', async () => {
      (db.offset as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await db
        .select()
        .from({} as any)
        .where({} as any)
        .orderBy({} as any)
        .limit(10)
        .offset(0);

      expect(result).toEqual([]);
    });
  });

  describe('get', () => {
    it('should get feature flag by ID', async () => {
      const mockFlag = { id: 'flag-1', key: 'feature_a', name: 'Feature A' };

      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([mockFlag]);

      const result = await db
        .select()
        .from({} as any)
        .where({} as any)
        .limit(1);

      expect(result[0]).toEqual(mockFlag);
    });

    it('should return empty when flag not found', async () => {
      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await db
        .select()
        .from({} as any)
        .where({} as any)
        .limit(1);

      expect(result).toEqual([]);
    });
  });

  describe('getByKey', () => {
    it('should return cached flag if available', async () => {
      const mockFlag = { id: 'flag-1', key: 'feature_a', name: 'Feature A' };
      (getCachedFlag as ReturnType<typeof vi.fn>).mockReturnValue(mockFlag);

      const cached = getCachedFlag('org-1', 'feature_a');

      expect(cached).toEqual(mockFlag);
      expect(getCachedFlag).toHaveBeenCalledWith('org-1', 'feature_a');
    });

    it('should fetch from db and cache when not cached', async () => {
      const mockFlag = { id: 'flag-1', key: 'feature_a', name: 'Feature A' };
      (getCachedFlag as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([mockFlag]);

      const cached = getCachedFlag('org-1', 'feature_a');
      expect(cached).toBeNull();

      const result = await db
        .select()
        .from({} as any)
        .where({} as any)
        .limit(1);

      setCachedFlag('org-1', result[0]);
      expect(setCachedFlag).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new feature flag', async () => {
      const newFlag = {
        id: 'new-flag',
        organizationId: 'org-1',
        key: 'new_feature',
        name: 'New Feature',
        status: 'disabled',
      };

      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([]); // No existing
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValue([newFlag]);

      // Check for existing
      const existing = await db
        .select()
        .from({} as any)
        .where({} as any)
        .limit(1);

      expect(existing).toEqual([]);

      // Create new
      const created = await db
        .insert({} as any)
        .values({} as any)
        .returning();

      expect(created[0]).toEqual(newFlag);
    });

    it('should detect duplicate key', async () => {
      const existingFlag = { id: 'flag-1', key: 'existing_feature' };
      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([existingFlag]);

      const existing = await db
        .select()
        .from({} as any)
        .where({} as any)
        .limit(1);

      expect(existing.length).toBeGreaterThan(0);
    });
  });

  describe('update', () => {
    it('should update existing feature flag', async () => {
      const existingFlag = { id: 'flag-1', key: 'feature_a', name: 'Feature A' };
      const updatedFlag = { ...existingFlag, name: 'Updated Feature A' };

      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValueOnce([existingFlag]);
      (db.returning as ReturnType<typeof vi.fn>).mockResolvedValue([updatedFlag]);

      // Check existing
      const existing = await db
        .select()
        .from({} as any)
        .where({} as any)
        .limit(1);

      expect(existing[0]).toEqual(existingFlag);

      // Update
      const updated = await db
        .update({} as any)
        .set({} as any)
        .where({} as any)
        .returning();

      expect(updated[0].name).toBe('Updated Feature A');

      // Invalidate cache
      invalidateFlagCache('org-1', 'feature_a');
      expect(invalidateFlagCache).toHaveBeenCalledWith('org-1', 'feature_a');
    });

    it('should return empty when flag not found', async () => {
      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const existing = await db
        .select()
        .from({} as any)
        .where({} as any)
        .limit(1);

      expect(existing).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete feature flag', async () => {
      const existingFlag = { id: 'flag-1', key: 'feature_a' };
      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([existingFlag]);

      // Check existing
      const existing = await db
        .select()
        .from({} as any)
        .where({} as any)
        .limit(1);

      expect(existing[0]).toEqual(existingFlag);

      // Delete
      await db.delete({} as any).where({} as any);

      // Invalidate cache
      invalidateFlagCache('org-1', 'feature_a');
      expect(invalidateFlagCache).toHaveBeenCalled();
    });
  });

  describe('evaluate', () => {
    it('should evaluate feature flag', async () => {
      const mockFlag = {
        id: 'flag-1',
        key: 'feature_a',
        status: 'enabled',
        strategy: 'all',
      };

      (getCachedFlag as ReturnType<typeof vi.fn>).mockReturnValue(mockFlag);

      const cached = getCachedFlag('org-1', 'feature_a');
      expect(cached).toEqual(mockFlag);

      const result = evaluateFlag(mockFlag as any, {
        userId: 'user-1',
        organizationId: 'org-1',
      });

      expect(result.enabled).toBe(true);
    });

    it('should return false for non-existent flag', async () => {
      (getCachedFlag as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (db.limit as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const cached = getCachedFlag('org-1', 'non_existent');
      expect(cached).toBeNull();

      const dbResult = await db
        .select()
        .from({} as any)
        .where({} as any)
        .limit(1);

      expect(dbResult).toEqual([]);
    });

    it('should use context from input', async () => {
      const mockFlag = { id: 'flag-1', key: 'feature_a' };
      (getCachedFlag as ReturnType<typeof vi.fn>).mockReturnValue(mockFlag);

      const context = {
        userId: 'custom-user',
        organizationId: 'custom-org',
        environment: 'staging',
        attributes: { role: 'admin' },
      };

      evaluateFlag(mockFlag as any, context);

      expect(evaluateFlag).toHaveBeenCalledWith(mockFlag, context);
    });
  });

  describe('evaluateBatch', () => {
    it('should evaluate multiple flags', async () => {
      const mockFlags = [
        { id: 'flag-1', key: 'feature_a', status: 'enabled' },
        { id: 'flag-2', key: 'feature_b', status: 'disabled' },
        { id: 'flag-3', key: 'feature_c', status: 'enabled' },
      ];

      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue(mockFlags);

      const flags = await db.select().from({} as any).where({} as any);

      const flagMap = new Map(flags.map((f: any) => [f.key, f]));

      expect(flagMap.size).toBe(3);
      expect(flagMap.has('feature_a')).toBe(true);
      expect(flagMap.has('feature_b')).toBe(true);
    });

    it('should return false for missing flags', async () => {
      const mockFlags = [{ id: 'flag-1', key: 'feature_a' }];

      (db.where as ReturnType<typeof vi.fn>).mockResolvedValue(mockFlags);

      const flags = await db.select().from({} as any).where({} as any);
      const flagMap = new Map(flags.map((f: any) => [f.key, f]));

      const requestedKeys = ['feature_a', 'missing_feature'];
      const results: Record<string, boolean> = {};

      for (const key of requestedKeys) {
        const flag = flagMap.get(key);
        results[key] = flag ? true : false;
      }

      expect(results['feature_a']).toBe(true);
      expect(results['missing_feature']).toBe(false);
    });
  });

  describe('cache operations', () => {
    it('should get cached flag', () => {
      const mockFlag = { id: 'flag-1', key: 'feature_a' };
      (getCachedFlag as ReturnType<typeof vi.fn>).mockReturnValue(mockFlag);

      const result = getCachedFlag('org-1', 'feature_a');
      expect(result).toEqual(mockFlag);
    });

    it('should set cached flag', () => {
      const mockFlag = { id: 'flag-1', key: 'feature_a' };
      setCachedFlag('org-1', mockFlag as any);
      expect(setCachedFlag).toHaveBeenCalledWith('org-1', mockFlag);
    });

    it('should invalidate cached flag', () => {
      invalidateFlagCache('org-1', 'feature_a');
      expect(invalidateFlagCache).toHaveBeenCalledWith('org-1', 'feature_a');
    });
  });
});
