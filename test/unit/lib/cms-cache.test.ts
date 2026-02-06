/**
 * CMS Cache Tests
 *
 * Unit tests for CMS cache layer utilities
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  CMS_CACHE_CONFIG,
  getCollectionTag,
  getDocumentTag,
  getSlugTag,
  getOrganizationTag,
  generateCacheKey,
  getCacheStats,
  resetCacheStats,
} from '@/lib/cms/core/cache';

describe('CMS_CACHE_CONFIG', () => {
  it('should have default revalidate time', () => {
    expect(CMS_CACHE_CONFIG.defaultRevalidate).toBe(60);
  });

  it('should have collection-specific revalidate times', () => {
    expect(CMS_CACHE_CONFIG.collections['diagnostic-forms']).toBe(300);
    expect(CMS_CACHE_CONFIG.collections['blog-posts']).toBe(60);
    expect(CMS_CACHE_CONFIG.collections.faqs).toBe(300);
    expect(CMS_CACHE_CONFIG.collections['landing-pages']).toBe(300);
    expect(CMS_CACHE_CONFIG.collections.media).toBe(3600);
  });

  it('should have tag prefix', () => {
    expect(CMS_CACHE_CONFIG.tagPrefix).toBe('cms');
  });
});

describe('getCollectionTag', () => {
  it('should generate collection tag', () => {
    expect(getCollectionTag('blog-posts')).toBe('cms:blog-posts');
    expect(getCollectionTag('faqs')).toBe('cms:faqs');
    expect(getCollectionTag('diagnostic-forms')).toBe('cms:diagnostic-forms');
  });
});

describe('getDocumentTag', () => {
  it('should generate document tag', () => {
    expect(getDocumentTag('blog-posts', 'post-123')).toBe('cms:blog-posts:post-123');
    expect(getDocumentTag('faqs', 'faq-1')).toBe('cms:faqs:faq-1');
  });

  it('should handle different ID formats', () => {
    expect(getDocumentTag('posts', '123')).toBe('cms:posts:123');
    expect(getDocumentTag('posts', 'abc-def-ghi')).toBe('cms:posts:abc-def-ghi');
  });
});

describe('getSlugTag', () => {
  it('should generate slug tag', () => {
    expect(getSlugTag('blog-posts', 'my-post')).toBe('cms:blog-posts:slug:my-post');
    expect(getSlugTag('pages', 'about-us')).toBe('cms:pages:slug:about-us');
  });

  it('should handle complex slugs', () => {
    expect(getSlugTag('posts', 'how-to-use-typescript')).toBe('cms:posts:slug:how-to-use-typescript');
  });
});

describe('getOrganizationTag', () => {
  it('should generate organization tag', () => {
    expect(getOrganizationTag('org-123')).toBe('cms:org:org-123');
    expect(getOrganizationTag('acme-corp')).toBe('cms:org:acme-corp');
  });
});

describe('generateCacheKey', () => {
  it('should generate key from simple params', () => {
    const key = generateCacheKey({ limit: 10, page: 1 });
    expect(key).toContain('limit:10');
    expect(key).toContain('page:1');
  });

  it('should sort params alphabetically', () => {
    const key1 = generateCacheKey({ z: 1, a: 2 });
    const key2 = generateCacheKey({ a: 2, z: 1 });
    expect(key1).toBe(key2);
  });

  it('should filter out undefined and null values', () => {
    const key = generateCacheKey({
      limit: 10,
      page: undefined,
      filter: null,
      sort: 'asc',
    });
    expect(key).toContain('limit:10');
    expect(key).toContain('sort:asc');
    expect(key).not.toContain('page');
    expect(key).not.toContain('filter');
  });

  it('should serialize objects as JSON', () => {
    const key = generateCacheKey({
      filters: { status: 'active' },
    });
    expect(key).toContain('filters:');
    expect(key).toContain('status');
    expect(key).toContain('active');
  });

  it('should handle empty params', () => {
    const key = generateCacheKey({});
    expect(key).toBe('');
  });

  it('should handle string values', () => {
    const key = generateCacheKey({ query: 'test search' });
    expect(key).toBe('query:test search');
  });

  it('should handle boolean values', () => {
    const key = generateCacheKey({ published: true, draft: false });
    expect(key).toContain('draft:false');
    expect(key).toContain('published:true');
  });

  it('should handle array values as JSON', () => {
    const key = generateCacheKey({ tags: ['news', 'tech'] });
    expect(key).toContain('tags:');
  });
});

describe('getCacheStats and resetCacheStats', () => {
  beforeEach(() => {
    resetCacheStats();
  });

  it('should return initial stats', () => {
    const stats = getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.hitRate).toBe(0);
  });

  it('should reset stats', () => {
    // Stats are internal, just verify reset works
    resetCacheStats();
    const stats = getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });
});

describe('Cache configuration validation', () => {
  it('should have reasonable revalidate times', () => {
    // All times should be positive
    expect(CMS_CACHE_CONFIG.defaultRevalidate).toBeGreaterThan(0);
    
    for (const [, time] of Object.entries(CMS_CACHE_CONFIG.collections)) {
      expect(time).toBeGreaterThan(0);
    }
  });

  it('should have longer cache for static content', () => {
    // Media should have longest cache
    expect(CMS_CACHE_CONFIG.collections.media).toBeGreaterThan(
      CMS_CACHE_CONFIG.collections['blog-posts']
    );
  });

  it('should have appropriate tag prefix', () => {
    expect(CMS_CACHE_CONFIG.tagPrefix).toBe('cms');
    expect(typeof CMS_CACHE_CONFIG.tagPrefix).toBe('string');
    expect(CMS_CACHE_CONFIG.tagPrefix.length).toBeGreaterThan(0);
  });
});
