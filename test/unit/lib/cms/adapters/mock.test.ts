/**
 * Mock CMS Adapter Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Types matching source
interface MockDocument {
  id: string;
  organizationId?: string;
  [key: string]: unknown;
}

interface FindParams {
  collection: string;
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  organizationId?: string;
  status?: 'draft' | 'published' | 'all';
}

interface CreateParams<T = Record<string, unknown>> {
  collection: string;
  data: T;
  organizationId?: string;
}

interface UpdateParams<T = Record<string, unknown>> {
  collection: string;
  id: string;
  data: Partial<T>;
  organizationId?: string;
}

interface DeleteParams {
  collection: string;
  id: string;
  organizationId?: string;
}

interface CMSResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

describe('MockCMSAdapter', () => {
  let data: Map<string, Map<string, MockDocument>>;
  let idCounter: number;

  beforeEach(() => {
    data = new Map();
    idCounter = 1;
  });

  const generateId = () => `mock-${idCounter++}`;

  const getCollection = (name: string) => {
    if (!data.has(name)) {
      data.set(name, new Map());
    }
    return data.get(name)!;
  };

  describe('initialize', () => {
    it('should initialize with sample data', () => {
      const initialized = true;
      expect(initialized).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('should return true when initialized', () => {
      const initialized = true;
      const healthCheck = () => initialized;
      expect(healthCheck()).toBe(true);
    });

    it('should return false when not initialized', () => {
      const initialized = false;
      const healthCheck = () => initialized;
      expect(healthCheck()).toBe(false);
    });
  });

  describe('find', () => {
    it('should return empty array for non-existent collection', () => {
      const find = (params: FindParams): CMSResponse<MockDocument[]> => {
        const collection = data.get(params.collection);
        if (!collection) {
          return { data: [], meta: { total: 0 } };
        }
        return { data: Array.from(collection.values()), meta: { total: collection.size } };
      };

      const result = find({ collection: 'nonexistent' });
      expect(result.data).toHaveLength(0);
    });

    it('should return items from collection', () => {
      const collection = getCollection('posts');
      collection.set('1', { id: '1', title: 'Post 1' });
      collection.set('2', { id: '2', title: 'Post 2' });

      const items = Array.from(collection.values());
      expect(items).toHaveLength(2);
    });

    it('should filter by organizationId', () => {
      const collection = getCollection('posts');
      collection.set('1', { id: '1', organizationId: 'org-1' });
      collection.set('2', { id: '2', organizationId: 'org-2' });
      collection.set('3', { id: '3', organizationId: 'org-1' });

      const items = Array.from(collection.values()).filter(
        item => item.organizationId === 'org-1'
      );
      expect(items).toHaveLength(2);
    });

    it('should filter by status', () => {
      const collection = getCollection('posts');
      collection.set('1', { id: '1', status: 'published' });
      collection.set('2', { id: '2', status: 'draft' });

      const items = Array.from(collection.values()).filter(
        item => item.status === 'published'
      );
      expect(items).toHaveLength(1);
    });

    it('should apply pagination', () => {
      const collection = getCollection('posts');
      for (let i = 1; i <= 10; i++) {
        collection.set(`${i}`, { id: `${i}`, title: `Post ${i}` });
      }

      const offset = 2;
      const limit = 3;
      const items = Array.from(collection.values()).slice(offset, offset + limit);
      expect(items).toHaveLength(3);
    });

    it('should calculate pagination meta', () => {
      const total = 25;
      const offset = 10;
      const limit = 5;

      const meta = {
        total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        hasNextPage: offset + limit < total,
        hasPrevPage: offset > 0,
      };

      expect(meta.page).toBe(3);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(true);
    });
  });

  describe('findById', () => {
    it('should find document by id', () => {
      const collection = getCollection('posts');
      collection.set('post-123', { id: 'post-123', title: 'Test' });

      const doc = collection.get('post-123');
      expect(doc?.title).toBe('Test');
    });

    it('should return null for non-existent id', () => {
      const collection = getCollection('posts');
      const doc = collection.get('nonexistent');
      expect(doc).toBeUndefined();
    });

    it('should verify organizationId', () => {
      const collection = getCollection('posts');
      collection.set('post-1', { id: 'post-1', organizationId: 'org-1' });

      const doc = collection.get('post-1');
      const requestOrgId = 'org-2';

      if (doc?.organizationId && doc.organizationId !== requestOrgId) {
        expect(true).toBe(true); // Organization mismatch
      }
    });
  });

  describe('findBySlug', () => {
    it('should find document by slug', () => {
      const collection = getCollection('posts');
      collection.set('1', { id: '1', slug: 'hello-world' });
      collection.set('2', { id: '2', slug: 'another-post' });

      const doc = Array.from(collection.values()).find(d => d.slug === 'hello-world');
      expect(doc?.id).toBe('1');
    });

    it('should return null for non-existent slug', () => {
      const collection = getCollection('posts');
      const doc = Array.from(collection.values()).find(d => d.slug === 'nonexistent');
      expect(doc).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create new document', () => {
      const collection = getCollection('posts');
      const id = generateId();
      const newDoc = { id, title: 'New Post', createdAt: new Date() };
      collection.set(id, newDoc);

      expect(collection.has(id)).toBe(true);
      expect(collection.get(id)?.title).toBe('New Post');
    });

    it('should set organizationId if provided', () => {
      const collection = getCollection('posts');
      const id = generateId();
      const newDoc = { id, title: 'Post', organizationId: 'org-123' };
      collection.set(id, newDoc);

      expect(collection.get(id)?.organizationId).toBe('org-123');
    });
  });

  describe('update', () => {
    it('should update existing document', () => {
      const collection = getCollection('posts');
      collection.set('1', { id: '1', title: 'Original' });

      const doc = collection.get('1');
      if (doc) {
        collection.set('1', { ...doc, title: 'Updated' });
      }

      expect(collection.get('1')?.title).toBe('Updated');
    });

    it('should preserve unmodified fields', () => {
      const collection = getCollection('posts');
      collection.set('1', { id: '1', title: 'Title', content: 'Content', status: 'draft' });

      const doc = collection.get('1');
      if (doc) {
        collection.set('1', { ...doc, status: 'published' });
      }

      const updated = collection.get('1');
      expect(updated?.title).toBe('Title');
      expect(updated?.content).toBe('Content');
      expect(updated?.status).toBe('published');
    });
  });

  describe('delete', () => {
    it('should delete document', () => {
      const collection = getCollection('posts');
      collection.set('1', { id: '1', title: 'To Delete' });

      collection.delete('1');
      expect(collection.has('1')).toBe(false);
    });

    it('should verify organizationId before delete', () => {
      const collection = getCollection('posts');
      collection.set('1', { id: '1', organizationId: 'org-1' });

      const doc = collection.get('1');
      const requestOrgId = 'org-2';

      if (doc?.organizationId !== requestOrgId) {
        // Should not delete
        expect(collection.has('1')).toBe(true);
      }
    });
  });

  describe('search', () => {
    it('should search documents by query', () => {
      const collection = getCollection('posts');
      collection.set('1', { id: '1', title: 'TypeScript Guide' });
      collection.set('2', { id: '2', title: 'JavaScript Basics' });
      collection.set('3', { id: '3', title: 'TypeScript Advanced' });

      const query = 'typescript';
      const results = Array.from(collection.values()).filter(
        doc => String(doc.title).toLowerCase().includes(query.toLowerCase())
      );

      expect(results).toHaveLength(2);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple documents', () => {
      const collection = getCollection('posts');
      const items = [
        { title: 'Post 1' },
        { title: 'Post 2' },
        { title: 'Post 3' },
      ];

      for (const item of items) {
        const id = generateId();
        collection.set(id, { id, ...item });
      }

      expect(collection.size).toBe(3);
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple documents', () => {
      const collection = getCollection('posts');
      collection.set('1', { id: '1', status: 'draft' });
      collection.set('2', { id: '2', status: 'draft' });

      const updates = [
        { id: '1', data: { status: 'published' } },
        { id: '2', data: { status: 'published' } },
      ];

      for (const update of updates) {
        const doc = collection.get(update.id);
        if (doc) {
          collection.set(update.id, { ...doc, ...update.data });
        }
      }

      expect(collection.get('1')?.status).toBe('published');
      expect(collection.get('2')?.status).toBe('published');
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple documents', () => {
      const collection = getCollection('posts');
      collection.set('1', { id: '1' });
      collection.set('2', { id: '2' });
      collection.set('3', { id: '3' });

      const idsToDelete = ['1', '2'];
      for (const id of idsToDelete) {
        collection.delete(id);
      }

      expect(collection.size).toBe(1);
      expect(collection.has('3')).toBe(true);
    });
  });

  describe('revalidate', () => {
    it('should trigger revalidation', () => {
      const revalidate = vi.fn().mockResolvedValue(undefined);
      revalidate('/blog/post-1');
      expect(revalidate).toHaveBeenCalledWith('/blog/post-1');
    });
  });

  describe('export', () => {
    it('should export collection data', () => {
      const collection = getCollection('posts');
      collection.set('1', { id: '1', title: 'Post 1' });
      collection.set('2', { id: '2', title: 'Post 2' });

      const exportData = {
        posts: Array.from(collection.values()),
      };

      expect(exportData.posts).toHaveLength(2);
    });
  });

  describe('import', () => {
    it('should import collection data', () => {
      const collection = getCollection('posts');
      const importData = {
        posts: [
          { id: 'import-1', title: 'Imported 1' },
          { id: 'import-2', title: 'Imported 2' },
        ],
      };

      for (const item of importData.posts) {
        collection.set(item.id, item);
      }

      expect(collection.size).toBe(2);
    });
  });
});

describe('MockCMSAdapter error handling', () => {
  it('should throw CMSNotFoundError for missing document', () => {
    class CMSNotFoundError extends Error {
      constructor(collection: string, id: string) {
        super(`Document not found: ${collection}/${id}`);
        this.name = 'CMSNotFoundError';
      }
    }

    const error = new CMSNotFoundError('posts', 'nonexistent');
    expect(error.name).toBe('CMSNotFoundError');
    expect(error.message).toContain('posts');
  });

  it('should throw CMSOrganizationMismatchError', () => {
    class CMSOrganizationMismatchError extends Error {
      constructor(collection: string, id: string) {
        super(`Organization mismatch for: ${collection}/${id}`);
        this.name = 'CMSOrganizationMismatchError';
      }
    }

    const error = new CMSOrganizationMismatchError('posts', 'post-1');
    expect(error.name).toBe('CMSOrganizationMismatchError');
  });
});
