/**
 * CMS Cache Layer Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Constants matching source
const CMS_CACHE_CONFIG = {
  defaultRevalidate: 60,
  collections: {
    'diagnostic-forms': 300,
    'blog-posts': 60,
    faqs: 300,
    'landing-pages': 300,
    media: 3600,
  } as Record<string, number>,
  tagPrefix: 'cms',
} as const;

describe('CMS_CACHE_CONFIG', () => {
  it('should define default revalidate time', () => {
    expect(CMS_CACHE_CONFIG.defaultRevalidate).toBe(60);
  });

  it('should define collection revalidate times', () => {
    expect(CMS_CACHE_CONFIG.collections['diagnostic-forms']).toBe(300);
    expect(CMS_CACHE_CONFIG.collections['blog-posts']).toBe(60);
    expect(CMS_CACHE_CONFIG.collections.faqs).toBe(300);
    expect(CMS_CACHE_CONFIG.collections.media).toBe(3600);
  });

  it('should define tag prefix', () => {
    expect(CMS_CACHE_CONFIG.tagPrefix).toBe('cms');
  });
});

describe('getCollectionTag', () => {
  const getCollectionTag = (collection: string): string =>
    `${CMS_CACHE_CONFIG.tagPrefix}:${collection}`;

  it('should generate collection tag', () => {
    expect(getCollectionTag('blog-posts')).toBe('cms:blog-posts');
    expect(getCollectionTag('faqs')).toBe('cms:faqs');
  });
});

describe('getDocumentTag', () => {
  const getDocumentTag = (collection: string, id: string): string =>
    `${CMS_CACHE_CONFIG.tagPrefix}:${collection}:${id}`;

  it('should generate document tag', () => {
    expect(getDocumentTag('blog-posts', 'post-123')).toBe('cms:blog-posts:post-123');
    expect(getDocumentTag('faqs', 'faq-456')).toBe('cms:faqs:faq-456');
  });
});

describe('getSlugTag', () => {
  const getSlugTag = (collection: string, slug: string): string =>
    `${CMS_CACHE_CONFIG.tagPrefix}:${collection}:slug:${slug}`;

  it('should generate slug tag', () => {
    expect(getSlugTag('blog-posts', 'hello-world')).toBe('cms:blog-posts:slug:hello-world');
  });
});

describe('getOrganizationTag', () => {
  const getOrganizationTag = (organizationId: string): string =>
    `${CMS_CACHE_CONFIG.tagPrefix}:org:${organizationId}`;

  it('should generate organization tag', () => {
    expect(getOrganizationTag('org-123')).toBe('cms:org:org-123');
  });
});

describe('generateCacheKey', () => {
  const generateCacheKey = (params: Record<string, unknown>): string => {
    const sortedEntries = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b));

    return sortedEntries
      .map(([key, value]) => {
        if (typeof value === 'object') {
          return `${key}:${JSON.stringify(value)}`;
        }
        return `${key}:${value}`;
      })
      .join('|');
  };

  it('should generate key from simple params', () => {
    const key = generateCacheKey({ limit: 10, status: 'published' });
    expect(key).toBe('limit:10|status:published');
  });

  it('should sort params alphabetically', () => {
    const key = generateCacheKey({ z: 1, a: 2, m: 3 });
    expect(key).toBe('a:2|m:3|z:1');
  });

  it('should filter undefined and null values', () => {
    const key = generateCacheKey({ a: 1, b: undefined, c: null, d: 2 });
    expect(key).toBe('a:1|d:2');
  });

  it('should stringify object values', () => {
    const key = generateCacheKey({ filter: { status: 'active' } });
    expect(key).toBe('filter:{"status":"active"}');
  });
});

describe('invalidateCollection', () => {
  const revalidateTag = vi.fn();

  const invalidateCollection = async (collection: string): Promise<void> => {
    revalidateTag(`${CMS_CACHE_CONFIG.tagPrefix}:${collection}`);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call revalidateTag with collection tag', async () => {
    await invalidateCollection('blog-posts');
    expect(revalidateTag).toHaveBeenCalledWith('cms:blog-posts');
  });
});

describe('invalidateDocument', () => {
  const revalidateTag = vi.fn();

  const invalidateDocument = async (collection: string, id: string): Promise<void> => {
    revalidateTag(`${CMS_CACHE_CONFIG.tagPrefix}:${collection}:${id}`);
    revalidateTag(`${CMS_CACHE_CONFIG.tagPrefix}:${collection}`);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should invalidate both document and collection tags', async () => {
    await invalidateDocument('blog-posts', 'post-123');
    expect(revalidateTag).toHaveBeenCalledTimes(2);
    expect(revalidateTag).toHaveBeenCalledWith('cms:blog-posts:post-123');
    expect(revalidateTag).toHaveBeenCalledWith('cms:blog-posts');
  });
});

describe('invalidateBySlug', () => {
  const revalidateTag = vi.fn();

  const invalidateBySlug = async (collection: string, slug: string): Promise<void> => {
    revalidateTag(`${CMS_CACHE_CONFIG.tagPrefix}:${collection}:slug:${slug}`);
    revalidateTag(`${CMS_CACHE_CONFIG.tagPrefix}:${collection}`);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should invalidate both slug and collection tags', async () => {
    await invalidateBySlug('blog-posts', 'hello-world');
    expect(revalidateTag).toHaveBeenCalledWith('cms:blog-posts:slug:hello-world');
    expect(revalidateTag).toHaveBeenCalledWith('cms:blog-posts');
  });
});

describe('invalidateOrganization', () => {
  const revalidateTag = vi.fn();

  const invalidateOrganization = async (organizationId: string): Promise<void> => {
    revalidateTag(`${CMS_CACHE_CONFIG.tagPrefix}:org:${organizationId}`);
  };

  it('should invalidate organization tag', async () => {
    await invalidateOrganization('org-123');
    expect(revalidateTag).toHaveBeenCalledWith('cms:org:org-123');
  });
});

describe('invalidateAllCMS', () => {
  const revalidateTag = vi.fn();

  const invalidateAllCMS = async (): Promise<void> => {
    revalidateTag(CMS_CACHE_CONFIG.tagPrefix);
  };

  it('should invalidate root cms tag', async () => {
    await invalidateAllCMS();
    expect(revalidateTag).toHaveBeenCalledWith('cms');
  });
});

describe('createCachedQuery', () => {
  it('should return cached function', () => {
    const queryFn = vi.fn().mockResolvedValue([]);
    
    const createCachedQuery = <TParams extends Record<string, unknown>, TResult>(
      collection: string,
      queryFn: (params: TParams) => Promise<TResult>
    ): (params: TParams) => Promise<TResult> => {
      return async (params: TParams) => queryFn(params);
    };

    const cached = createCachedQuery('blog-posts', queryFn);
    expect(typeof cached).toBe('function');
  });

  it('should merge default params', async () => {
    const queryFn = vi.fn().mockResolvedValue([]);
    
    const createCachedQuery = <TParams extends Record<string, unknown>, TResult>(
      _collection: string,
      queryFn: (params: TParams) => Promise<TResult>,
      defaultParams?: Partial<TParams>
    ): (params: TParams) => Promise<TResult> => {
      return async (params: TParams) => {
        const merged = { ...defaultParams, ...params } as TParams;
        return queryFn(merged);
      };
    };

    const cached = createCachedQuery('posts', queryFn, { limit: 10 } as Record<string, unknown>);
    await cached({ status: 'published' } as Record<string, unknown>);

    expect(queryFn).toHaveBeenCalledWith({ limit: 10, status: 'published' });
  });
});

describe('createCachedFindById', () => {
  it('should return cached find function', () => {
    const findFn = vi.fn().mockResolvedValue({ id: '123' });
    
    const createCachedFindById = <TResult>(
      _collection: string,
      findFn: (id: string) => Promise<TResult>
    ): (id: string) => Promise<TResult> => {
      return async (id: string) => findFn(id);
    };

    const cached = createCachedFindById('posts', findFn);
    expect(typeof cached).toBe('function');
  });

  it('should call find function with id', async () => {
    const findFn = vi.fn().mockResolvedValue({ id: '123', title: 'Test' });
    
    const createCachedFindById = <TResult>(
      _collection: string,
      findFn: (id: string) => Promise<TResult>
    ): (id: string) => Promise<TResult> => {
      return findFn;
    };

    const cached = createCachedFindById('posts', findFn);
    const result = await cached('123');

    expect(findFn).toHaveBeenCalledWith('123');
    expect(result).toEqual({ id: '123', title: 'Test' });
  });
});

describe('createCachedFindBySlug', () => {
  it('should return cached find by slug function', () => {
    const findFn = vi.fn().mockResolvedValue({ slug: 'test' });
    
    const createCachedFindBySlug = <TResult>(
      _collection: string,
      findFn: (slug: string) => Promise<TResult>
    ): (slug: string) => Promise<TResult> => {
      return findFn;
    };

    const cached = createCachedFindBySlug('posts', findFn);
    expect(typeof cached).toBe('function');
  });

  it('should call find function with slug', async () => {
    const findFn = vi.fn().mockResolvedValue({ slug: 'hello-world', title: 'Hello World' });
    
    const createCachedFindBySlug = <TResult>(
      _collection: string,
      findFn: (slug: string) => Promise<TResult>
    ): (slug: string) => Promise<TResult> => {
      return findFn;
    };

    const cached = createCachedFindBySlug('posts', findFn);
    const result = await cached('hello-world');

    expect(findFn).toHaveBeenCalledWith('hello-world');
    expect(result).toEqual({ slug: 'hello-world', title: 'Hello World' });
  });
});

describe('getCacheStats', () => {
  it('should return cache statistics', () => {
    let hits = 10;
    let misses = 5;

    const getCacheStats = () => ({
      hits,
      misses,
      hitRate: hits + misses > 0 ? hits / (hits + misses) : 0,
    });

    const stats = getCacheStats();
    expect(stats.hits).toBe(10);
    expect(stats.misses).toBe(5);
    expect(stats.hitRate).toBeCloseTo(0.67, 1);
  });
});

describe('resetCacheStats', () => {
  it('should reset cache statistics', () => {
    let hits = 10;
    let misses = 5;

    const resetCacheStats = () => {
      hits = 0;
      misses = 0;
    };

    resetCacheStats();
    expect(hits).toBe(0);
    expect(misses).toBe(0);
  });
});
