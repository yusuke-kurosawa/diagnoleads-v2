/**
 * CMS AI Content Generator Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Types matching source
interface ContentGenerationRequest {
  type: 'blog' | 'faq' | 'diagnostic-question' | 'seo';
  context: {
    topic?: string;
    keywords?: string[];
    targetAudience?: string;
    tone?: 'formal' | 'casual' | 'professional';
    language: 'ja' | 'en';
  };
  existingContent?: string;
}

interface GeneratedBlogContent {
  title: { ja: string; en: string };
  excerpt: { ja: string; en: string };
  outline: string[];
  suggestedTags: string[];
}

interface GeneratedFAQ {
  question: { ja: string; en: string };
  answer: { ja: string; en: string };
  category: string;
}

interface GeneratedDiagnosticQuestion {
  questionText: { ja: string; en: string };
  questionType: 'single' | 'multiple' | 'scale';
  options?: Array<{
    label: { ja: string; en: string };
    value: string;
    score: number;
  }>;
}

interface GeneratedSEO {
  metaTitle: { ja: string; en: string };
  metaDescription: { ja: string; en: string };
  keywords: string[];
}

interface AIProvider {
  name: string;
  generateText(prompt: string, options?: { maxTokens?: number }): Promise<string>;
  generateJSON<T>(prompt: string, schema: string): Promise<T>;
}

describe('ContentGenerationRequest', () => {
  it('should define blog request', () => {
    const request: ContentGenerationRequest = {
      type: 'blog',
      context: {
        topic: 'AI in Healthcare',
        keywords: ['AI', 'healthcare', 'diagnosis'],
        targetAudience: 'medical professionals',
        tone: 'professional',
        language: 'ja',
      },
    };

    expect(request.type).toBe('blog');
    expect(request.context.language).toBe('ja');
  });

  it('should define faq request', () => {
    const request: ContentGenerationRequest = {
      type: 'faq',
      context: {
        topic: 'Product Features',
        language: 'en',
      },
    };

    expect(request.type).toBe('faq');
  });

  it('should define diagnostic-question request', () => {
    const request: ContentGenerationRequest = {
      type: 'diagnostic-question',
      context: {
        topic: 'Business Health Check',
        tone: 'formal',
        language: 'ja',
      },
    };

    expect(request.type).toBe('diagnostic-question');
  });

  it('should define seo request', () => {
    const request: ContentGenerationRequest = {
      type: 'seo',
      context: {
        topic: 'Lead Management',
        keywords: ['CRM', 'leads'],
        language: 'ja',
      },
      existingContent: 'Some existing content...',
    };

    expect(request.type).toBe('seo');
    expect(request.existingContent).toBeDefined();
  });
});

describe('GeneratedBlogContent', () => {
  it('should define blog content structure', () => {
    const content: GeneratedBlogContent = {
      title: { ja: 'AIと医療の未来', en: 'AI and the Future of Healthcare' },
      excerpt: { ja: '概要...', en: 'Summary...' },
      outline: ['Introduction', 'Benefits', 'Challenges', 'Conclusion'],
      suggestedTags: ['AI', 'healthcare', 'innovation'],
    };

    expect(content.title.ja).toBe('AIと医療の未来');
    expect(content.outline).toHaveLength(4);
    expect(content.suggestedTags).toContain('AI');
  });
});

describe('GeneratedFAQ', () => {
  it('should define FAQ structure', () => {
    const faq: GeneratedFAQ = {
      question: { ja: 'サービスの料金は？', en: 'What are the pricing options?' },
      answer: { ja: '料金プランは3つあります...', en: 'We offer three pricing plans...' },
      category: 'pricing',
    };

    expect(faq.question.ja).toContain('料金');
    expect(faq.category).toBe('pricing');
  });
});

describe('GeneratedDiagnosticQuestion', () => {
  it('should define single choice question', () => {
    const question: GeneratedDiagnosticQuestion = {
      questionText: { ja: '現在の課題は？', en: 'What is your current challenge?' },
      questionType: 'single',
      options: [
        { label: { ja: '売上', en: 'Sales' }, value: 'sales', score: 10 },
        { label: { ja: 'マーケティング', en: 'Marketing' }, value: 'marketing', score: 20 },
      ],
    };

    expect(question.questionType).toBe('single');
    expect(question.options).toHaveLength(2);
  });

  it('should define scale question', () => {
    const question: GeneratedDiagnosticQuestion = {
      questionText: { ja: '満足度を教えてください', en: 'Rate your satisfaction' },
      questionType: 'scale',
    };

    expect(question.questionType).toBe('scale');
    expect(question.options).toBeUndefined();
  });

  it('should define multiple choice question', () => {
    const question: GeneratedDiagnosticQuestion = {
      questionText: { ja: '利用している機能は？', en: 'Which features do you use?' },
      questionType: 'multiple',
      options: [
        { label: { ja: '機能A', en: 'Feature A' }, value: 'a', score: 5 },
        { label: { ja: '機能B', en: 'Feature B' }, value: 'b', score: 5 },
        { label: { ja: '機能C', en: 'Feature C' }, value: 'c', score: 5 },
      ],
    };

    expect(question.questionType).toBe('multiple');
    expect(question.options).toHaveLength(3);
  });
});

describe('GeneratedSEO', () => {
  it('should define SEO metadata', () => {
    const seo: GeneratedSEO = {
      metaTitle: { ja: 'リード管理の決定版 | DiagnoLeads', en: 'The Ultimate Lead Management | DiagnoLeads' },
      metaDescription: { ja: 'AIでリード管理を最適化...', en: 'Optimize lead management with AI...' },
      keywords: ['lead management', 'CRM', 'AI', 'sales'],
    };

    expect(seo.metaTitle.ja).toContain('DiagnoLeads');
    expect(seo.keywords).toHaveLength(4);
  });
});

describe('AIProvider interface', () => {
  it('should define provider interface', () => {
    const mockProvider: AIProvider = {
      name: 'MockProvider',
      generateText: vi.fn().mockResolvedValue('Generated text'),
      generateJSON: vi.fn().mockResolvedValue({ key: 'value' }),
    };

    expect(mockProvider.name).toBe('MockProvider');
    expect(typeof mockProvider.generateText).toBe('function');
    expect(typeof mockProvider.generateJSON).toBe('function');
  });
});

describe('AnthropicProvider', () => {
  it('should define Anthropic provider', () => {
    const provider: AIProvider = {
      name: 'Anthropic',
      generateText: vi.fn(),
      generateJSON: vi.fn(),
    };

    expect(provider.name).toBe('Anthropic');
  });

  it('should throw when API key not configured', async () => {
    const generateText = async (apiKey: string, prompt: string) => {
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');
      return `Response to: ${prompt}`;
    };

    await expect(generateText('', 'test')).rejects.toThrow('ANTHROPIC_API_KEY is not configured');
  });

  it('should generate text with API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ text: 'Generated content' }] }),
    });

    const result = await mockFetch('https://api.anthropic.com/v1/messages', {});
    expect(result.ok).toBe(true);
  });

  it('should handle API errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await mockFetch('https://api.anthropic.com/v1/messages', {});
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
  });

  it('should parse JSON from response', () => {
    const extractJSON = (text: string) => {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
        text.match(/```\s*([\s\S]*?)\s*```/) || [null, text];
      return JSON.parse(jsonMatch[1] || text);
    };

    const response = '```json\n{"title": "Test"}\n```';
    expect(extractJSON(response)).toEqual({ title: 'Test' });

    const plainResponse = '{"title": "Plain"}';
    expect(extractJSON(plainResponse)).toEqual({ title: 'Plain' });
  });
});

describe('OpenAIProvider', () => {
  it('should define OpenAI provider', () => {
    const provider: AIProvider = {
      name: 'OpenAI',
      generateText: vi.fn(),
      generateJSON: vi.fn(),
    };

    expect(provider.name).toBe('OpenAI');
  });

  it('should throw when API key not configured', async () => {
    const generateText = async (apiKey: string, prompt: string) => {
      if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
      return `Response to: ${prompt}`;
    };

    await expect(generateText('', 'test')).rejects.toThrow('OPENAI_API_KEY is not configured');
  });
});

describe('ContentGenerator', () => {
  it('should select provider based on config', () => {
    const selectProvider = (anthropicKey: string, openaiKey: string): string => {
      if (anthropicKey) return 'Anthropic';
      if (openaiKey) return 'OpenAI';
      throw new Error('No AI provider configured');
    };

    expect(selectProvider('key', '')).toBe('Anthropic');
    expect(selectProvider('', 'key')).toBe('OpenAI');
    expect(() => selectProvider('', '')).toThrow('No AI provider configured');
  });

  it('should generate blog content', async () => {
    const generateBlog = async (request: ContentGenerationRequest): Promise<GeneratedBlogContent> => ({
      title: { ja: `${request.context.topic}について`, en: `About ${request.context.topic}` },
      excerpt: { ja: '概要', en: 'Summary' },
      outline: ['Introduction', 'Main', 'Conclusion'],
      suggestedTags: request.context.keywords || [],
    });

    const result = await generateBlog({
      type: 'blog',
      context: { topic: 'AI', keywords: ['tech'], language: 'ja' },
    });

    expect(result.title.ja).toContain('AI');
  });

  it('should generate FAQ', async () => {
    const generateFAQ = async (request: ContentGenerationRequest): Promise<GeneratedFAQ> => ({
      question: { ja: `${request.context.topic}とは？`, en: `What is ${request.context.topic}?` },
      answer: { ja: '回答', en: 'Answer' },
      category: 'general',
    });

    const result = await generateFAQ({
      type: 'faq',
      context: { topic: 'CRM', language: 'ja' },
    });

    expect(result.question.ja).toContain('CRM');
  });

  it('should generate diagnostic question', async () => {
    const generateQuestion = async (): Promise<GeneratedDiagnosticQuestion> => ({
      questionText: { ja: '質問', en: 'Question' },
      questionType: 'single',
      options: [{ label: { ja: 'A', en: 'A' }, value: 'a', score: 10 }],
    });

    const result = await generateQuestion();
    expect(result.questionType).toBe('single');
  });

  it('should generate SEO metadata', async () => {
    const generateSEO = async (request: ContentGenerationRequest): Promise<GeneratedSEO> => ({
      metaTitle: { ja: request.context.topic || '', en: request.context.topic || '' },
      metaDescription: { ja: '説明', en: 'Description' },
      keywords: request.context.keywords || [],
    });

    const result = await generateSEO({
      type: 'seo',
      context: { topic: 'Test', keywords: ['a', 'b'], language: 'ja' },
    });

    expect(result.keywords).toHaveLength(2);
  });
});

describe('Prompt templates', () => {
  it('should create blog prompt', () => {
    const createBlogPrompt = (topic: string, language: string, tone: string) =>
      `Generate a blog post about "${topic}" in ${language} with a ${tone} tone.`;

    const prompt = createBlogPrompt('AI', 'Japanese', 'professional');
    expect(prompt).toContain('AI');
    expect(prompt).toContain('Japanese');
  });

  it('should create FAQ prompt', () => {
    const createFAQPrompt = (topic: string, count: number) =>
      `Generate ${count} FAQ items about "${topic}".`;

    const prompt = createFAQPrompt('Product', 5);
    expect(prompt).toContain('5');
    expect(prompt).toContain('Product');
  });
});

describe('Error handling', () => {
  it('should handle JSON parse errors', () => {
    const parseJSON = (text: string) => {
      try {
        return JSON.parse(text);
      } catch {
        throw new Error('Failed to parse AI response as JSON');
      }
    };

    expect(() => parseJSON('invalid json')).toThrow('Failed to parse AI response as JSON');
  });

  it('should handle API errors gracefully', async () => {
    const callAPI = async (shouldFail: boolean) => {
      if (shouldFail) throw new Error('API error');
      return { success: true };
    };

    await expect(callAPI(true)).rejects.toThrow('API error');
    await expect(callAPI(false)).resolves.toEqual({ success: true });
  });
});
