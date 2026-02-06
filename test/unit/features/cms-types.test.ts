/**
 * CMS Types and Validation Tests
 *
 * Unit tests for CMS type definitions and validation
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Localized content schemas
const localizedStringSchema = z.object({
  ja: z.string(),
  en: z.string().optional(),
});

const richTextNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    type: z.string(),
    children: z.array(z.union([z.object({ text: z.string() }), richTextNodeSchema])).optional(),
  })
);

// Content status enum
const contentStatusSchema = z.enum(['draft', 'published', 'archived', 'scheduled']);

// SEO metadata schema
const seoMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().url().optional(),
  canonical: z.string().url().optional(),
  noIndex: z.boolean().optional(),
});

// Blog post schema
const blogPostSchema = z.object({
  id: z.string(),
  title: localizedStringSchema,
  slug: z.string(),
  excerpt: localizedStringSchema.optional(),
  content: z.unknown(), // Rich text content
  author: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().optional(),
  status: contentStatusSchema,
  publishedAt: z.string().datetime().optional(),
  seo: seoMetadataSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// FAQ schema
const faqSchema = z.object({
  id: z.string(),
  question: localizedStringSchema,
  answer: localizedStringSchema,
  category: z.string(),
  order: z.number().int().min(0),
  status: contentStatusSchema,
});

// Diagnostic form schemas
const diagnosticQuestionTypeSchema = z.enum([
  'single',
  'multiple',
  'scale',
  'text',
  'number',
  'boolean',
]);

const diagnosticOptionSchema = z.object({
  id: z.string(),
  label: localizedStringSchema,
  value: z.string(),
  score: z.number(),
  nextQuestionId: z.string().optional(),
});

const diagnosticQuestionSchema = z.object({
  id: z.string(),
  type: diagnosticQuestionTypeSchema,
  question: localizedStringSchema,
  description: localizedStringSchema.optional(),
  options: z.array(diagnosticOptionSchema).optional(),
  required: z.boolean().default(true),
  weight: z.number().min(0).max(1).default(1),
});

const diagnosticStepSchema = z.object({
  id: z.string(),
  title: localizedStringSchema,
  description: localizedStringSchema.optional(),
  questions: z.array(diagnosticQuestionSchema),
});

const scoringThresholdSchema = z.object({
  min: z.number(),
  max: z.number(),
  label: localizedStringSchema,
  color: z.enum(['red', 'orange', 'yellow', 'green', 'blue']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  message: localizedStringSchema,
});

const diagnosticFormSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: localizedStringSchema,
  description: localizedStringSchema.optional(),
  steps: z.array(diagnosticStepSchema),
  scoring: z.object({
    method: z.enum(['sum', 'average', 'weighted', 'custom']),
    maxScore: z.number().optional(),
    thresholds: z.array(scoringThresholdSchema),
  }),
  settings: z.object({
    showProgressBar: z.boolean().default(true),
    allowBackNavigation: z.boolean().default(true),
    requireEmail: z.boolean().default(true),
    sendResults: z.boolean().default(true),
  }),
  status: contentStatusSchema,
});

describe('CMS Type Validation', () => {
  describe('LocalizedString', () => {
    it('should accept valid localized content', () => {
      const result = localizedStringSchema.parse({
        ja: 'こんにちは',
        en: 'Hello',
      });

      expect(result.ja).toBe('こんにちは');
      expect(result.en).toBe('Hello');
    });

    it('should accept Japanese only (en optional)', () => {
      const result = localizedStringSchema.parse({
        ja: '日本語のみ',
      });

      expect(result.ja).toBe('日本語のみ');
      expect(result.en).toBeUndefined();
    });

    it('should require Japanese content', () => {
      expect(() =>
        localizedStringSchema.parse({
          en: 'English only',
        })
      ).toThrow();
    });
  });

  describe('ContentStatus', () => {
    it('should accept valid statuses', () => {
      expect(contentStatusSchema.parse('draft')).toBe('draft');
      expect(contentStatusSchema.parse('published')).toBe('published');
      expect(contentStatusSchema.parse('archived')).toBe('archived');
      expect(contentStatusSchema.parse('scheduled')).toBe('scheduled');
    });

    it('should reject invalid status', () => {
      expect(() => contentStatusSchema.parse('invalid')).toThrow();
    });
  });

  describe('SEOMetadata', () => {
    it('should accept valid SEO data', () => {
      const result = seoMetadataSchema.parse({
        title: 'Page Title',
        description: 'Page description for search engines',
        keywords: ['keyword1', 'keyword2'],
        ogImage: 'https://example.com/image.jpg',
        canonical: 'https://example.com/page',
        noIndex: false,
      });

      expect(result.title).toBe('Page Title');
      expect(result.keywords).toHaveLength(2);
    });

    it('should accept empty SEO data', () => {
      const result = seoMetadataSchema.parse({});

      expect(result.title).toBeUndefined();
    });

    it('should reject invalid URL for ogImage', () => {
      expect(() =>
        seoMetadataSchema.parse({
          ogImage: 'not-a-url',
        })
      ).toThrow();
    });
  });

  describe('BlogPost', () => {
    it('should accept valid blog post', () => {
      const post = {
        id: 'post-1',
        title: { ja: 'ブログ記事', en: 'Blog Post' },
        slug: 'blog-post',
        excerpt: { ja: '抜粋' },
        content: { type: 'root', children: [] },
        author: 'author-1',
        category: 'tech',
        tags: ['tag1', 'tag2'],
        status: 'published',
        publishedAt: '2026-02-06T00:00:00Z',
        createdAt: '2026-02-05T00:00:00Z',
        updatedAt: '2026-02-06T00:00:00Z',
      };

      const result = blogPostSchema.parse(post);

      expect(result.title.ja).toBe('ブログ記事');
      expect(result.status).toBe('published');
    });

    it('should require mandatory fields', () => {
      expect(() =>
        blogPostSchema.parse({
          id: 'post-1',
          title: { ja: 'Test' },
          // Missing slug, status, createdAt, updatedAt
        })
      ).toThrow();
    });
  });

  describe('FAQ', () => {
    it('should accept valid FAQ', () => {
      const faq = {
        id: 'faq-1',
        question: { ja: 'よくある質問', en: 'FAQ' },
        answer: { ja: '回答です', en: 'Answer' },
        category: 'general',
        order: 1,
        status: 'published',
      };

      const result = faqSchema.parse(faq);

      expect(result.question.ja).toBe('よくある質問');
      expect(result.order).toBe(1);
    });

    it('should reject negative order', () => {
      expect(() =>
        faqSchema.parse({
          id: 'faq-1',
          question: { ja: 'Test' },
          answer: { ja: 'Answer' },
          category: 'general',
          order: -1,
          status: 'published',
        })
      ).toThrow();
    });
  });

  describe('DiagnosticQuestionType', () => {
    it('should accept valid question types', () => {
      expect(diagnosticQuestionTypeSchema.parse('single')).toBe('single');
      expect(diagnosticQuestionTypeSchema.parse('multiple')).toBe('multiple');
      expect(diagnosticQuestionTypeSchema.parse('scale')).toBe('scale');
      expect(diagnosticQuestionTypeSchema.parse('text')).toBe('text');
      expect(diagnosticQuestionTypeSchema.parse('number')).toBe('number');
      expect(diagnosticQuestionTypeSchema.parse('boolean')).toBe('boolean');
    });
  });

  describe('DiagnosticOption', () => {
    it('should accept valid option', () => {
      const option = {
        id: 'opt-1',
        label: { ja: '選択肢1', en: 'Option 1' },
        value: 'option1',
        score: 10,
      };

      const result = diagnosticOptionSchema.parse(option);

      expect(result.score).toBe(10);
    });

    it('should accept option with conditional navigation', () => {
      const option = {
        id: 'opt-1',
        label: { ja: '選択肢1' },
        value: 'option1',
        score: 5,
        nextQuestionId: 'q2',
      };

      const result = diagnosticOptionSchema.parse(option);

      expect(result.nextQuestionId).toBe('q2');
    });
  });

  describe('DiagnosticQuestion', () => {
    it('should accept valid question', () => {
      const question = {
        id: 'q1',
        type: 'single',
        question: { ja: '質問テキスト' },
        options: [
          { id: 'o1', label: { ja: '選択肢1' }, value: 'a', score: 10 },
          { id: 'o2', label: { ja: '選択肢2' }, value: 'b', score: 20 },
        ],
      };

      const result = diagnosticQuestionSchema.parse(question);

      expect(result.options).toHaveLength(2);
      expect(result.required).toBe(true); // default
      expect(result.weight).toBe(1); // default
    });

    it('should reject weight outside valid range', () => {
      expect(() =>
        diagnosticQuestionSchema.parse({
          id: 'q1',
          type: 'single',
          question: { ja: 'Test' },
          weight: 1.5, // Invalid
        })
      ).toThrow();
    });
  });

  describe('ScoringThreshold', () => {
    it('should accept valid threshold', () => {
      const threshold = {
        min: 0,
        max: 30,
        label: { ja: '低', en: 'Low' },
        color: 'red',
        priority: 'urgent',
        message: { ja: '改善が必要です' },
      };

      const result = scoringThresholdSchema.parse(threshold);

      expect(result.color).toBe('red');
      expect(result.priority).toBe('urgent');
    });

    it('should reject invalid color', () => {
      expect(() =>
        scoringThresholdSchema.parse({
          min: 0,
          max: 30,
          label: { ja: '低' },
          color: 'purple', // Invalid
          priority: 'low',
          message: { ja: 'Test' },
        })
      ).toThrow();
    });
  });

  describe('DiagnosticForm', () => {
    it('should accept valid diagnostic form', () => {
      const form = {
        id: 'form-1',
        slug: 'marketing-assessment',
        title: { ja: 'マーケティング診断' },
        description: { ja: '説明文' },
        steps: [
          {
            id: 'step-1',
            title: { ja: 'ステップ1' },
            questions: [
              {
                id: 'q1',
                type: 'single',
                question: { ja: '質問1' },
                options: [
                  { id: 'o1', label: { ja: 'はい' }, value: 'yes', score: 10 },
                  { id: 'o2', label: { ja: 'いいえ' }, value: 'no', score: 0 },
                ],
              },
            ],
          },
        ],
        scoring: {
          method: 'sum',
          maxScore: 100,
          thresholds: [
            {
              min: 0,
              max: 30,
              label: { ja: '初級' },
              color: 'red',
              priority: 'urgent',
              message: { ja: '基礎から始めましょう' },
            },
            {
              min: 31,
              max: 70,
              label: { ja: '中級' },
              color: 'yellow',
              priority: 'medium',
              message: { ja: '改善の余地があります' },
            },
            {
              min: 71,
              max: 100,
              label: { ja: '上級' },
              color: 'green',
              priority: 'low',
              message: { ja: '素晴らしい結果です' },
            },
          ],
        },
        settings: {
          showProgressBar: true,
          allowBackNavigation: true,
          requireEmail: true,
          sendResults: true,
        },
        status: 'published',
      };

      const result = diagnosticFormSchema.parse(form);

      expect(result.steps).toHaveLength(1);
      expect(result.scoring.thresholds).toHaveLength(3);
    });

    it('should accept different scoring methods', () => {
      const baseForm = {
        id: 'form-1',
        slug: 'test',
        title: { ja: 'テスト' },
        steps: [],
        scoring: {
          method: 'average',
          thresholds: [],
        },
        settings: {},
        status: 'draft',
      };

      expect(diagnosticFormSchema.parse({ ...baseForm, scoring: { ...baseForm.scoring, method: 'sum' } }).scoring.method).toBe('sum');
      expect(diagnosticFormSchema.parse({ ...baseForm, scoring: { ...baseForm.scoring, method: 'average' } }).scoring.method).toBe('average');
      expect(diagnosticFormSchema.parse({ ...baseForm, scoring: { ...baseForm.scoring, method: 'weighted' } }).scoring.method).toBe('weighted');
      expect(diagnosticFormSchema.parse({ ...baseForm, scoring: { ...baseForm.scoring, method: 'custom' } }).scoring.method).toBe('custom');
    });
  });
});

describe('CMS Helper Functions', () => {
  describe('Score Calculation', () => {
    function calculateScore(
      answers: Array<{ questionId: string; score: number; weight: number }>,
      method: 'sum' | 'average' | 'weighted'
    ): number {
      if (answers.length === 0) return 0;

      switch (method) {
        case 'sum':
          return answers.reduce((sum, a) => sum + a.score, 0);
        case 'average':
          return answers.reduce((sum, a) => sum + a.score, 0) / answers.length;
        case 'weighted':
          const totalWeight = answers.reduce((sum, a) => sum + a.weight, 0);
          const weightedSum = answers.reduce((sum, a) => sum + a.score * a.weight, 0);
          return totalWeight > 0 ? weightedSum / totalWeight : 0;
        default:
          return 0;
      }
    }

    it('should calculate sum score', () => {
      const answers = [
        { questionId: 'q1', score: 10, weight: 1 },
        { questionId: 'q2', score: 20, weight: 1 },
        { questionId: 'q3', score: 30, weight: 1 },
      ];

      expect(calculateScore(answers, 'sum')).toBe(60);
    });

    it('should calculate average score', () => {
      const answers = [
        { questionId: 'q1', score: 10, weight: 1 },
        { questionId: 'q2', score: 20, weight: 1 },
        { questionId: 'q3', score: 30, weight: 1 },
      ];

      expect(calculateScore(answers, 'average')).toBe(20);
    });

    it('should calculate weighted score', () => {
      const answers = [
        { questionId: 'q1', score: 100, weight: 0.5 },
        { questionId: 'q2', score: 50, weight: 0.3 },
        { questionId: 'q3', score: 0, weight: 0.2 },
      ];

      // (100 * 0.5 + 50 * 0.3 + 0 * 0.2) / 1.0 = 65
      expect(calculateScore(answers, 'weighted')).toBe(65);
    });

    it('should return 0 for empty answers', () => {
      expect(calculateScore([], 'sum')).toBe(0);
      expect(calculateScore([], 'average')).toBe(0);
      expect(calculateScore([], 'weighted')).toBe(0);
    });
  });

  describe('Threshold Matching', () => {
    interface Threshold {
      min: number;
      max: number;
      label: string;
    }

    function findThreshold(score: number, thresholds: Threshold[]): Threshold | null {
      return thresholds.find((t) => score >= t.min && score <= t.max) || null;
    }

    it('should find matching threshold', () => {
      const thresholds: Threshold[] = [
        { min: 0, max: 30, label: 'Low' },
        { min: 31, max: 70, label: 'Medium' },
        { min: 71, max: 100, label: 'High' },
      ];

      expect(findThreshold(25, thresholds)?.label).toBe('Low');
      expect(findThreshold(50, thresholds)?.label).toBe('Medium');
      expect(findThreshold(85, thresholds)?.label).toBe('High');
    });

    it('should return null for score outside thresholds', () => {
      const thresholds: Threshold[] = [
        { min: 0, max: 30, label: 'Low' },
        { min: 31, max: 70, label: 'Medium' },
      ];

      expect(findThreshold(80, thresholds)).toBeNull();
    });

    it('should handle boundary values', () => {
      const thresholds: Threshold[] = [
        { min: 0, max: 50, label: 'Low' },
        { min: 51, max: 100, label: 'High' },
      ];

      expect(findThreshold(50, thresholds)?.label).toBe('Low');
      expect(findThreshold(51, thresholds)?.label).toBe('High');
    });
  });
});
