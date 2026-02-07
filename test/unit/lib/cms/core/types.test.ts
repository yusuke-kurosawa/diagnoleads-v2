/**
 * CMS Core Types Tests
 */

import { describe, expect, it } from 'vitest';
import type {
  LocalizedString,
  LocalizedRichText,
  RichTextContent,
  RichTextNode,
  ParagraphNode,
  HeadingNode,
  ListNode,
  CodeNode,
  ImageNode,
  BlockquoteNode,
  TextNode,
  TextMark,
  ContentStatus,
  SEOMetadata,
  Author,
  MediaAsset,
  BlogPost,
  FAQ,
  AssessmentTemplate,
  Industry,
  AssessmentQuestion,
  AssessmentOption,
  ScoringRule,
  ResultMessage,
  LandingPage,
  StaticPage,
  EmailTemplate,
} from '@/lib/cms/core/types';

describe('LocalizedString', () => {
  it('should define ja and en properties', () => {
    const str: LocalizedString = {
      ja: '日本語テキスト',
      en: 'English text',
    };

    expect(str.ja).toBe('日本語テキスト');
    expect(str.en).toBe('English text');
  });
});

describe('LocalizedRichText', () => {
  it('should define localized rich text content', () => {
    const richText: LocalizedRichText = {
      ja: { type: 'doc', content: [] },
      en: { type: 'doc', content: [] },
    };

    expect(richText.ja.type).toBe('doc');
    expect(richText.en.type).toBe('doc');
  });
});

describe('RichTextContent', () => {
  it('should define doc with content array', () => {
    const content: RichTextContent = {
      type: 'doc',
      content: [],
    };

    expect(content.type).toBe('doc');
    expect(content.content).toEqual([]);
  });
});

describe('RichTextNode types', () => {
  it('should define ParagraphNode', () => {
    const paragraph: ParagraphNode = {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Hello' }],
    };

    expect(paragraph.type).toBe('paragraph');
  });

  it('should define HeadingNode', () => {
    const heading: HeadingNode = {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Title' }],
    };

    expect(heading.type).toBe('heading');
    expect(heading.attrs.level).toBe(1);
  });

  it('should define ListNode', () => {
    const list: ListNode = {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }],
        },
      ],
    };

    expect(list.type).toBe('bulletList');
    expect(list.content).toHaveLength(1);
  });

  it('should define CodeNode', () => {
    const code: CodeNode = {
      type: 'codeBlock',
      attrs: { language: 'typescript' },
      content: [{ type: 'text', text: 'const x = 1;' }],
    };

    expect(code.type).toBe('codeBlock');
    expect(code.attrs?.language).toBe('typescript');
  });

  it('should define ImageNode', () => {
    const image: ImageNode = {
      type: 'image',
      attrs: {
        src: 'https://example.com/image.png',
        alt: 'Example image',
      },
    };

    expect(image.type).toBe('image');
    expect(image.attrs.src).toContain('https://');
  });

  it('should define BlockquoteNode', () => {
    const quote: BlockquoteNode = {
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quote text' }] }],
    };

    expect(quote.type).toBe('blockquote');
  });
});

describe('TextNode and TextMark', () => {
  it('should define plain text node', () => {
    const text: TextNode = {
      type: 'text',
      text: 'Plain text',
    };

    expect(text.type).toBe('text');
    expect(text.text).toBe('Plain text');
  });

  it('should define text with marks', () => {
    const text: TextNode = {
      type: 'text',
      text: 'Styled text',
      marks: [
        { type: 'bold' },
        { type: 'italic' },
        { type: 'link', attrs: { href: 'https://example.com' } },
      ],
    };

    expect(text.marks).toHaveLength(3);
  });

  it('should define all mark types', () => {
    const marks: TextMark[] = [
      { type: 'bold' },
      { type: 'italic' },
      { type: 'underline' },
      { type: 'strike' },
      { type: 'code' },
      { type: 'link', attrs: { href: 'https://example.com', target: '_blank' } },
    ];

    expect(marks).toHaveLength(6);
  });
});

describe('ContentStatus', () => {
  it('should define valid statuses', () => {
    const statuses: ContentStatus[] = ['draft', 'published', 'archived'];
    expect(statuses).toHaveLength(3);
  });
});

describe('SEOMetadata', () => {
  it('should define SEO fields', () => {
    const seo: SEOMetadata = {
      title: { ja: 'タイトル', en: 'Title' },
      description: { ja: '説明', en: 'Description' },
      keywords: ['keyword1', 'keyword2'],
      ogImage: 'https://example.com/og.png',
      noIndex: false,
      canonicalUrl: 'https://example.com/page',
    };

    expect(seo.keywords).toHaveLength(2);
    expect(seo.noIndex).toBe(false);
  });
});

describe('Author', () => {
  it('should define author fields', () => {
    const author: Author = {
      id: 'author-1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.png',
      bio: { ja: '自己紹介', en: 'Bio' },
    };

    expect(author.id).toBe('author-1');
    expect(author.email).toContain('@');
  });
});

describe('MediaAsset', () => {
  it('should define media asset fields', () => {
    const asset: MediaAsset = {
      id: 'asset-1',
      url: 'https://example.com/image.png',
      alt: 'Image description',
      mimeType: 'image/png',
      width: 800,
      height: 600,
      fileSize: 102400,
    };

    expect(asset.mimeType).toBe('image/png');
    expect(asset.width).toBe(800);
  });
});

describe('BlogPost', () => {
  it('should define complete blog post', () => {
    const post: BlogPost = {
      id: 'post-1',
      slug: 'hello-world',
      title: { ja: 'タイトル', en: 'Title' },
      content: {
        ja: { type: 'doc', content: [] },
        en: { type: 'doc', content: [] },
      },
      author: {
        id: 'author-1',
        name: 'Author',
        email: 'author@example.com',
      },
      publishedAt: new Date(),
      updatedAt: new Date(),
      status: 'published',
      seo: {},
      tags: ['blog', 'tech'],
    };

    expect(post.slug).toBe('hello-world');
    expect(post.status).toBe('published');
  });
});

describe('FAQ', () => {
  it('should define FAQ item', () => {
    const faq: FAQ = {
      id: 'faq-1',
      question: { ja: '質問', en: 'Question' },
      answer: {
        ja: { type: 'doc', content: [] },
        en: { type: 'doc', content: [] },
      },
      category: 'general',
      order: 1,
      publishedAt: new Date(),
    };

    expect(faq.category).toBe('general');
    expect(faq.order).toBe(1);
  });
});

describe('AssessmentTemplate', () => {
  it('should define assessment template', () => {
    const template: AssessmentTemplate = {
      id: 'template-1',
      slug: 'security-assessment',
      name: { ja: '診断名', en: 'Assessment Name' },
      description: { ja: '説明', en: 'Description' },
      industry: 'technology',
      questions: [],
      scoringRules: [],
      resultMessages: [],
      status: 'published',
    };

    expect(template.industry).toBe('technology');
  });
});

describe('Industry', () => {
  it('should define valid industries', () => {
    const industries: Industry[] = [
      'technology',
      'finance',
      'healthcare',
      'manufacturing',
      'retail',
      'other',
    ];

    expect(industries).toHaveLength(6);
  });
});

describe('AssessmentQuestion', () => {
  it('should define question with options', () => {
    const question: AssessmentQuestion = {
      id: 'q-1',
      text: { ja: '質問', en: 'Question' },
      type: 'radio',
      options: [
        { value: 'a', label: { ja: 'A', en: 'A' }, score: 1 },
        { value: 'b', label: { ja: 'B', en: 'B' }, score: 2 },
      ],
      required: true,
      order: 1,
    };

    expect(question.type).toBe('radio');
    expect(question.options).toHaveLength(2);
  });
});

describe('ScoringRule', () => {
  it('should define scoring rule', () => {
    const rule: ScoringRule = {
      minScore: 0,
      maxScore: 50,
      label: { ja: '低', en: 'Low' },
      priority: 'low',
    };

    expect(rule.priority).toBe('low');
  });
});

describe('ResultMessage', () => {
  it('should define result message', () => {
    const result: ResultMessage = {
      scoreRange: { min: 0, max: 50 },
      title: { ja: 'タイトル', en: 'Title' },
      message: { ja: 'メッセージ', en: 'Message' },
      recommendations: [
        { ja: '推奨1', en: 'Recommendation 1' },
      ],
    };

    expect(result.scoreRange.min).toBe(0);
    expect(result.recommendations).toHaveLength(1);
  });
});

describe('LandingPage', () => {
  it('should define landing page', () => {
    const page: LandingPage = {
      id: 'lp-1',
      organizationId: 'org-1',
      hero: {
        headline: { ja: '見出し', en: 'Headline' },
        subheadline: { ja: 'サブ見出し', en: 'Subheadline' },
        ctaText: { ja: 'CTA', en: 'CTA' },
        ctaLink: '/signup',
      },
      branding: {
        primaryColor: '#007bff',
      },
      seo: {},
      status: 'published',
    };

    expect(page.organizationId).toBe('org-1');
  });
});

describe('StaticPage', () => {
  it('should define static page', () => {
    const page: StaticPage = {
      id: 'page-1',
      slug: 'privacy-policy',
      title: { ja: 'プライバシーポリシー', en: 'Privacy Policy' },
      content: {
        ja: { type: 'doc', content: [] },
        en: { type: 'doc', content: [] },
      },
      seo: {},
      publishedAt: new Date(),
      updatedAt: new Date(),
      status: 'published',
    };

    expect(page.slug).toBe('privacy-policy');
  });
});

describe('EmailTemplate', () => {
  it('should define email template', () => {
    const template: EmailTemplate = {
      id: 'email-1',
      slug: 'welcome',
      name: 'Welcome Email',
      subject: { ja: 'ようこそ', en: 'Welcome' },
      body: {
        ja: { type: 'doc', content: [] },
        en: { type: 'doc', content: [] },
      },
      variables: ['name', 'email', 'organization'],
    };

    expect(template.variables).toHaveLength(3);
  });
});
