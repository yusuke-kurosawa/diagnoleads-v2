/**
 * AI Content Generation API for Payload CMS Admin
 *
 * POST /api/cms/ai-generate
 * Generates content using AI for various CMS fields
 */

import { getAIContentGenerator } from '@/lib/cms/ai/content-generator';
import { type NextRequest, NextResponse } from 'next/server';

interface GenerateRequest {
  type: 'blog-idea' | 'faq' | 'seo' | 'translate' | 'diagnostic-questions';
  targetLocale?: 'ja' | 'en';
  sourceContent?: string;
  context?: {
    collectionSlug?: string;
    id?: string;
    topic?: string;
    keywords?: string[];
    count?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { type, targetLocale = 'ja', sourceContent, context } = body;

    // Check if AI is configured
    if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI is not configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY.',
        },
        { status: 503 }
      );
    }

    const generator = getAIContentGenerator();
    let content: unknown;

    switch (type) {
      case 'blog-idea': {
        const topic = context?.topic || sourceContent || 'Lead Generation';
        content = await generator.generateBlogIdea(topic, {
          keywords: context?.keywords,
        });
        break;
      }

      case 'faq': {
        const topic = context?.topic || sourceContent || 'Product Features';
        const faqs = await generator.generateFAQs(topic, context?.count || 5);
        content = faqs;
        break;
      }

      case 'seo': {
        if (!sourceContent) {
          return NextResponse.json(
            { success: false, error: 'Source content is required for SEO optimization' },
            { status: 400 }
          );
        }
        content = await generator.optimizeSEO(
          { title: context?.topic || '', body: sourceContent },
          context?.keywords
        );
        break;
      }

      case 'translate': {
        if (!sourceContent) {
          return NextResponse.json(
            { success: false, error: 'Source content is required for translation' },
            { status: 400 }
          );
        }
        const fromLocale = targetLocale === 'ja' ? 'en' : 'ja';
        content = await generator.translateContent(sourceContent, fromLocale, targetLocale);
        break;
      }

      case 'diagnostic-questions': {
        const topic = context?.topic || sourceContent || 'Business Assessment';
        const questions = await generator.generateDiagnosticQuestions(topic, context?.count || 5);
        content = questions;
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown generation type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'AI generation failed',
      },
      { status: 500 }
    );
  }
}
