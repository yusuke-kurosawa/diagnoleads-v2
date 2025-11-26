/**
 * Content Management tRPC Router
 *
 * Phase 4.4: コンテンツ管理UI
 *
 * FAQとBlog記事のCRUD操作を提供
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, publicProcedure, router } from '@/lib/trpc/init';
import { FAQRepository, BlogRepository } from '@/lib/cms';
import type { FAQ, BlogPost } from '@/lib/cms/core/types';

// =============================================================================
// Input Schemas
// =============================================================================

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

// =============================================================================
// FAQ Router
// =============================================================================

const faqsRouter = router({
  /**
   * FAQ一覧取得
   */
  list: publicProcedure
    .input(
      z.object({
        locale: z.string().default('ja'),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const faqRepo = new FAQRepository();

      const result = await faqRepo.findAll({
        locale: input.locale,
        category: input.category,
        limit: input.limit,
        offset: input.offset,
      });

      return {
        faqs: result.faqs,
        total: result.total,
        hasMore: result.hasMore,
      };
    }),

  /**
   * FAQ作成
   */
  create: protectedProcedure
    .input(faqCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const faqRepo = new FAQRepository();

      const faq = await faqRepo.create({
        question: input.question,
        answer: input.answer,
        category: input.category,
        order: input.order,
        publishedAt: new Date(),
        organizationId: ctx.session?.organizationId,
      });

      return { faq };
    }),

  /**
   * FAQ更新
   */
  update: protectedProcedure
    .input(faqUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const faqRepo = new FAQRepository();

      const existing = await faqRepo.findById(input.id);
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'FAQ not found',
        });
      }

      const faq = await faqRepo.update(input.id, {
        question: input.question,
        answer: input.answer,
        category: input.category,
        order: input.order,
      });

      return { faq };
    }),

  /**
   * FAQ削除
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const faqRepo = new FAQRepository();

      const existing = await faqRepo.findById(input.id);
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'FAQ not found',
        });
      }

      await faqRepo.delete(input.id);

      return { success: true };
    }),
});

// =============================================================================
// Blog Router
// =============================================================================

const blogRouter = router({
  /**
   * ブログ記事一覧取得
   */
  list: publicProcedure
    .input(
      z.object({
        locale: z.string().default('ja'),
        status: z.enum(['draft', 'published', 'all']).default('published'),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const blogRepo = new BlogRepository();

      const result = await blogRepo.findAll({
        locale: input.locale,
        status: input.status === 'all' ? undefined : input.status,
        category: input.category,
        limit: input.limit,
        offset: input.offset,
      });

      return {
        posts: result.posts,
        total: result.total,
        hasMore: result.hasMore,
      };
    }),

  /**
   * ブログ記事取得（スラッグ）
   */
  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        locale: z.string().default('ja'),
      })
    )
    .query(async ({ input }) => {
      const blogRepo = new BlogRepository();

      const post = await blogRepo.findBySlug(input.slug, input.locale);
      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      return { post };
    }),

  /**
   * ブログ記事作成
   */
  create: protectedProcedure
    .input(blogCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const blogRepo = new BlogRepository();

      // スラッグの重複チェック
      const existing = await blogRepo.findBySlug(input.slug);
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Slug already exists',
        });
      }

      const post = await blogRepo.create({
        title: input.title,
        slug: input.slug,
        content: input.content,
        excerpt: input.excerpt,
        status: input.status,
        publishedAt: new Date(),
        updatedAt: new Date(),
        organizationId: ctx.session?.organizationId,
        author: {
          id: ctx.user.id,
          name: ctx.user.name || 'Anonymous',
          email: ctx.user.email,
        },
        seo: {},
      });

      return { post };
    }),

  /**
   * ブログ記事更新
   */
  update: protectedProcedure
    .input(blogUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const blogRepo = new BlogRepository();

      const existing = await blogRepo.findById(input.id);
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      // スラッグの重複チェック（変更がある場合）
      if (input.slug && input.slug !== existing.slug) {
        const slugExists = await blogRepo.findBySlug(input.slug);
        if (slugExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Slug already exists',
          });
        }
      }

      const post = await blogRepo.update(input.id, {
        title: input.title,
        slug: input.slug,
        content: input.content,
        excerpt: input.excerpt,
        status: input.status,
        updatedAt: new Date(),
      });

      return { post };
    }),

  /**
   * ブログ記事削除
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const blogRepo = new BlogRepository();

      const existing = await blogRepo.findById(input.id);
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      await blogRepo.delete(input.id);

      return { success: true };
    }),
});

// =============================================================================
// Content Router
// =============================================================================

export const contentRouter = router({
  faqs: faqsRouter,
  blog: blogRouter,
});

export type ContentRouter = typeof contentRouter;
