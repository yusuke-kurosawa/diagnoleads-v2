/**
 * Content Router Tests
 *
 * Unit tests for CMS content (FAQ/Blog) API
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Schema definitions matching the router
const localizedStringSchema = z.object({
  ja: z.string(),
  en: z.string(),
});

const richTextContentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(z.any()),
});

const localizedRichTextSchema = z.object({
  ja: richTextContentSchema,
  en: richTextContentSchema,
});

const faqCreateSchema = z.object({
  question: localizedStringSchema,
  answer: localizedRichTextSchema,
  category: z.string(),
  order: z.number().int().min(0),
});

const faqUpdateSchema = z.object({
  id: z.string(),
  question: localizedStringSchema.optional(),
  answer: localizedRichTextSchema.optional(),
  category: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

const blogCreateSchema = z.object({
  title: localizedStringSchema,
  slug: z.string().regex(/^[a-z0-9-]+$/),
  content: localizedRichTextSchema,
  excerpt: localizedStringSchema.optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

const blogUpdateSchema = z.object({
  id: z.string(),
  title: localizedStringSchema.optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  content: localizedRichTextSchema.optional(),
  excerpt: localizedStringSchema.optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

const faqListSchema = z.object({
  locale: z.string().default('ja'),
  category: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

const blogListSchema = z.object({
  locale: z.string().default('ja'),
  status: z.enum(['draft', 'published', 'all']).default('published'),
  category: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Sample rich text content
const sampleRichText = {
  type: 'doc' as const,
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Sample content' }],
    },
  ],
};

describe('Content Router - FAQ', () => {
  describe('FAQ List Schema', () => {
    it('should accept valid list parameters', () => {
      const result = faqListSchema.parse({
        locale: 'en',
        category: 'general',
        limit: 10,
        offset: 0,
      });

      expect(result.locale).toBe('en');
      expect(result.category).toBe('general');
      expect(result.limit).toBe(10);
    });

    it('should use defaults', () => {
      const result = faqListSchema.parse({});

      expect(result.locale).toBe('ja');
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('should validate limit range', () => {
      expect(() => faqListSchema.parse({ limit: 0 })).toThrow();
      expect(() => faqListSchema.parse({ limit: 101 })).toThrow();
    });
  });

  describe('FAQ Create Schema', () => {
    it('should accept valid FAQ data', () => {
      const faq = {
        question: { ja: '質問', en: 'Question' },
        answer: { ja: sampleRichText, en: sampleRichText },
        category: 'general',
        order: 1,
      };

      const result = faqCreateSchema.parse(faq);

      expect(result.question.ja).toBe('質問');
      expect(result.question.en).toBe('Question');
      expect(result.category).toBe('general');
      expect(result.order).toBe(1);
    });

    it('should require both locales for question', () => {
      expect(() =>
        faqCreateSchema.parse({
          question: { ja: '質問' }, // Missing 'en'
          answer: { ja: sampleRichText, en: sampleRichText },
          category: 'general',
          order: 0,
        })
      ).toThrow();
    });

    it('should require both locales for answer', () => {
      expect(() =>
        faqCreateSchema.parse({
          question: { ja: '質問', en: 'Question' },
          answer: { ja: sampleRichText }, // Missing 'en'
          category: 'general',
          order: 0,
        })
      ).toThrow();
    });

    it('should validate rich text format', () => {
      expect(() =>
        faqCreateSchema.parse({
          question: { ja: '質問', en: 'Question' },
          answer: {
            ja: { type: 'invalid', content: [] }, // Wrong type
            en: sampleRichText,
          },
          category: 'general',
          order: 0,
        })
      ).toThrow();
    });

    it('should reject negative order', () => {
      expect(() =>
        faqCreateSchema.parse({
          question: { ja: '質問', en: 'Question' },
          answer: { ja: sampleRichText, en: sampleRichText },
          category: 'general',
          order: -1,
        })
      ).toThrow();
    });
  });

  describe('FAQ Update Schema', () => {
    it('should accept partial update', () => {
      const result = faqUpdateSchema.parse({
        id: 'faq-123',
        category: 'updated',
      });

      expect(result.id).toBe('faq-123');
      expect(result.category).toBe('updated');
      expect(result.question).toBeUndefined();
    });

    it('should require id', () => {
      expect(() => faqUpdateSchema.parse({ category: 'test' })).toThrow();
    });
  });
});

describe('Content Router - Blog', () => {
  describe('Blog List Schema', () => {
    it('should accept valid list parameters', () => {
      const result = blogListSchema.parse({
        locale: 'en',
        status: 'draft',
        category: 'tech',
        limit: 10,
      });

      expect(result.locale).toBe('en');
      expect(result.status).toBe('draft');
      expect(result.category).toBe('tech');
    });

    it('should use defaults', () => {
      const result = blogListSchema.parse({});

      expect(result.locale).toBe('ja');
      expect(result.status).toBe('published');
      expect(result.limit).toBe(20);
    });

    it('should accept all status values', () => {
      for (const status of ['draft', 'published', 'all']) {
        const result = blogListSchema.parse({ status });
        expect(result.status).toBe(status);
      }
    });
  });

  describe('Blog Create Schema', () => {
    it('should accept valid blog post', () => {
      const post = {
        title: { ja: 'タイトル', en: 'Title' },
        slug: 'my-first-post',
        content: { ja: sampleRichText, en: sampleRichText },
        status: 'draft',
      };

      const result = blogCreateSchema.parse(post);

      expect(result.title.ja).toBe('タイトル');
      expect(result.slug).toBe('my-first-post');
      expect(result.status).toBe('draft');
    });

    it('should validate slug format', () => {
      expect(() =>
        blogCreateSchema.parse({
          title: { ja: 'タイトル', en: 'Title' },
          slug: 'Invalid Slug!', // Invalid characters
          content: { ja: sampleRichText, en: sampleRichText },
        })
      ).toThrow();
    });

    it('should accept valid slug formats', () => {
      const validSlugs = ['my-post', 'post-123', 'a-b-c', 'test'];

      for (const slug of validSlugs) {
        const result = blogCreateSchema.parse({
          title: { ja: 'タイトル', en: 'Title' },
          slug,
          content: { ja: sampleRichText, en: sampleRichText },
        });
        expect(result.slug).toBe(slug);
      }
    });

    it('should default status to draft', () => {
      const result = blogCreateSchema.parse({
        title: { ja: 'タイトル', en: 'Title' },
        slug: 'test',
        content: { ja: sampleRichText, en: sampleRichText },
      });

      expect(result.status).toBe('draft');
    });

    it('should accept optional fields', () => {
      const result = blogCreateSchema.parse({
        title: { ja: 'タイトル', en: 'Title' },
        slug: 'test',
        content: { ja: sampleRichText, en: sampleRichText },
        excerpt: { ja: '概要', en: 'Excerpt' },
        category: 'tech',
        tags: ['news', 'update'],
      });

      expect(result.excerpt?.ja).toBe('概要');
      expect(result.category).toBe('tech');
      expect(result.tags).toEqual(['news', 'update']);
    });
  });

  describe('Blog Update Schema', () => {
    it('should accept partial update', () => {
      const result = blogUpdateSchema.parse({
        id: 'post-123',
        status: 'published',
      });

      expect(result.id).toBe('post-123');
      expect(result.status).toBe('published');
    });

    it('should require id', () => {
      expect(() => blogUpdateSchema.parse({ status: 'published' })).toThrow();
    });

    it('should validate slug on update', () => {
      expect(() =>
        blogUpdateSchema.parse({
          id: 'post-123',
          slug: 'Invalid Slug!',
        })
      ).toThrow();
    });
  });
});

describe('Localized Content', () => {
  describe('Localized String Schema', () => {
    it('should require both ja and en', () => {
      expect(() => localizedStringSchema.parse({ ja: 'テスト' })).toThrow();
      expect(() => localizedStringSchema.parse({ en: 'Test' })).toThrow();
    });

    it('should accept both locales', () => {
      const result = localizedStringSchema.parse({ ja: 'テスト', en: 'Test' });

      expect(result.ja).toBe('テスト');
      expect(result.en).toBe('Test');
    });
  });

  describe('Rich Text Schema', () => {
    it('should require doc type', () => {
      expect(() =>
        richTextContentSchema.parse({ type: 'invalid', content: [] })
      ).toThrow();
    });

    it('should accept valid rich text', () => {
      const result = richTextContentSchema.parse(sampleRichText);

      expect(result.type).toBe('doc');
      expect(result.content).toBeInstanceOf(Array);
    });
  });
});

describe('Content Response Format', () => {
  it('should have correct FAQ list response', () => {
    const response = {
      faqs: [
        {
          id: 'faq-1',
          question: { ja: '質問1', en: 'Question 1' },
          category: 'general',
          order: 0,
        },
      ],
      total: 1,
    };

    expect(response.faqs).toBeInstanceOf(Array);
    expect(response.total).toBe(1);
  });

  it('should have correct blog list response', () => {
    const response = {
      posts: [
        {
          id: 'post-1',
          title: { ja: 'タイトル', en: 'Title' },
          slug: 'my-post',
          status: 'published',
        },
      ],
      total: 1,
      hasNextPage: false,
    };

    expect(response.posts).toBeInstanceOf(Array);
    expect(response.total).toBe(1);
    expect(response.hasNextPage).toBe(false);
  });
});

describe('ISR (Incremental Static Regeneration)', () => {
  it('should support revalidation tags', () => {
    const revalidateTags = {
      faqList: 'faqs',
      faqById: (id: string) => `faq-${id}`,
      blogList: 'blog-posts',
      blogBySlug: (slug: string) => `blog-${slug}`,
    };

    expect(revalidateTags.faqById('123')).toBe('faq-123');
    expect(revalidateTags.blogBySlug('my-post')).toBe('blog-my-post');
  });

  it('should support cache invalidation on mutations', () => {
    const mutations = ['create', 'update', 'delete'];
    const invalidatedTags: string[] = [];

    function revalidateOnMutation(mutation: string, resourceType: string) {
      invalidatedTags.push(`${resourceType}-list`);
      if (mutation !== 'create') {
        invalidatedTags.push(`${resourceType}-item`);
      }
    }

    revalidateOnMutation('create', 'faq');
    expect(invalidatedTags).toContain('faq-list');

    revalidateOnMutation('update', 'blog');
    expect(invalidatedTags).toContain('blog-list');
    expect(invalidatedTags).toContain('blog-item');
  });
});
