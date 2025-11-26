/**
 * CMS Core Types
 *
 * CMS実装に依存しないアプリケーション固有のコンテンツ型定義
 * すべてのCMSアダプターはこれらの型に変換する必要がある
 */

// =============================================================================
// Localization Types
// =============================================================================

export interface LocalizedString {
  ja: string;
  en: string;
}

export interface LocalizedRichText {
  ja: RichTextContent;
  en: RichTextContent;
}

/**
 * Portable Text形式のRichTextコンテンツ
 * CMS非依存で、任意のCMSからの変換が可能
 */
export interface RichTextContent {
  type: 'doc';
  content: RichTextNode[];
}

export type RichTextNode =
  | ParagraphNode
  | HeadingNode
  | ListNode
  | CodeNode
  | ImageNode
  | BlockquoteNode;

export interface ParagraphNode {
  type: 'paragraph';
  content?: TextNode[];
}

export interface HeadingNode {
  type: 'heading';
  attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 };
  content?: TextNode[];
}

export interface ListNode {
  type: 'bulletList' | 'orderedList';
  content: ListItemNode[];
}

export interface ListItemNode {
  type: 'listItem';
  content: ParagraphNode[];
}

export interface CodeNode {
  type: 'codeBlock';
  attrs?: { language?: string };
  content?: TextNode[];
}

export interface ImageNode {
  type: 'image';
  attrs: {
    src: string;
    alt?: string;
    title?: string;
  };
}

export interface BlockquoteNode {
  type: 'blockquote';
  content: ParagraphNode[];
}

export interface TextNode {
  type: 'text';
  text: string;
  marks?: TextMark[];
}

export type TextMark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'underline' }
  | { type: 'strike' }
  | { type: 'code' }
  | { type: 'link'; attrs: { href: string; target?: string } };

// =============================================================================
// Content Status & Metadata
// =============================================================================

export type ContentStatus = 'draft' | 'published' | 'archived';

export interface SEOMetadata {
  title?: LocalizedString;
  description?: LocalizedString;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
}

export interface Author {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: LocalizedString;
}

export interface MediaAsset {
  id: string;
  url: string;
  alt?: string;
  mimeType: string;
  width?: number;
  height?: number;
  fileSize?: number;
}

// =============================================================================
// Content Types
// =============================================================================

/**
 * ブログ記事
 */
export interface BlogPost {
  id: string;
  slug: string;
  title: LocalizedString;
  content: LocalizedRichText;
  excerpt?: LocalizedString;
  author: Author;
  coverImage?: MediaAsset;
  publishedAt: Date;
  updatedAt: Date;
  status: ContentStatus;
  seo: SEOMetadata;
  tags?: string[];
  category?: string;
  organizationId?: string;
}

/**
 * FAQ
 */
export interface FAQ {
  id: string;
  question: LocalizedString;
  answer: LocalizedRichText;
  category: string;
  order: number;
  publishedAt: Date;
  organizationId?: string;
}

/**
 * 診断テンプレート
 */
export interface AssessmentTemplate {
  id: string;
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  industry: Industry;
  questions: AssessmentQuestion[];
  scoringRules: ScoringRule[];
  resultMessages: ResultMessage[];
  publishedAt?: Date;
  status: ContentStatus;
  organizationId?: string;
}

export type Industry =
  | 'technology'
  | 'finance'
  | 'healthcare'
  | 'manufacturing'
  | 'retail'
  | 'other';

export interface AssessmentQuestion {
  id: string;
  text: LocalizedString;
  type: 'radio' | 'checkbox' | 'scale' | 'text';
  options?: AssessmentOption[];
  required: boolean;
  order: number;
}

export interface AssessmentOption {
  value: string;
  label: LocalizedString;
  score: number;
}

export interface ScoringRule {
  minScore: number;
  maxScore: number;
  label: LocalizedString;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ResultMessage {
  scoreRange: { min: number; max: number };
  title: LocalizedString;
  message: LocalizedString;
  recommendations?: LocalizedString[];
}

/**
 * ランディングページ（組織カスタマイズ用）
 */
export interface LandingPage {
  id: string;
  organizationId: string;
  hero: {
    headline: LocalizedString;
    subheadline: LocalizedString;
    ctaText: LocalizedString;
    ctaLink: string;
    backgroundImage?: MediaAsset;
  };
  features?: {
    title: LocalizedString;
    description: LocalizedString;
    icon?: string;
  }[];
  testimonials?: {
    quote: LocalizedString;
    author: string;
    company: string;
    avatar?: MediaAsset;
  }[];
  branding: {
    primaryColor?: string;
    logo?: MediaAsset;
    favicon?: MediaAsset;
  };
  seo: SEOMetadata;
  status: ContentStatus;
}

/**
 * 静的ページ（プライバシーポリシー、利用規約など）
 */
export interface StaticPage {
  id: string;
  slug: string;
  title: LocalizedString;
  content: LocalizedRichText;
  seo: SEOMetadata;
  publishedAt: Date;
  updatedAt: Date;
  status: ContentStatus;
}

// =============================================================================
// Email Templates
// =============================================================================

export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: LocalizedString;
  body: LocalizedRichText;
  variables: string[];
  organizationId?: string;
}
