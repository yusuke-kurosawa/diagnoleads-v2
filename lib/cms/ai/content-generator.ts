/**
 * AI Content Generator for Payload CMS
 *
 * AIを使用したコンテンツ生成機能
 * - ブログ記事の下書き生成
 * - FAQの自動生成
 * - 診断フォームの質問生成
 * - SEOメタデータの最適化
 */

// =============================================================================
// Types
// =============================================================================

export interface ContentGenerationRequest {
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

export interface GeneratedBlogContent {
  title: { ja: string; en: string };
  excerpt: { ja: string; en: string };
  outline: string[];
  suggestedTags: string[];
}

export interface GeneratedFAQ {
  question: { ja: string; en: string };
  answer: { ja: string; en: string };
  category: string;
}

export interface GeneratedDiagnosticQuestion {
  questionText: { ja: string; en: string };
  questionType: 'single' | 'multiple' | 'scale';
  options?: Array<{
    label: { ja: string; en: string };
    value: string;
    score: number;
  }>;
}

export interface GeneratedSEO {
  metaTitle: { ja: string; en: string };
  metaDescription: { ja: string; en: string };
  keywords: string[];
}

// =============================================================================
// AI Provider Interface
// =============================================================================

export interface AIProvider {
  name: string;
  generateText(prompt: string, options?: { maxTokens?: number }): Promise<string>;
  generateJSON<T>(prompt: string, schema: string): Promise<T>;
}

// =============================================================================
// Anthropic Provider
// =============================================================================

class AnthropicProvider implements AIProvider {
  readonly name = 'Anthropic';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
  }

  async generateText(prompt: string, options?: { maxTokens?: number }): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: options?.maxTokens || 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async generateJSON<T>(prompt: string, _schema: string): Promise<T> {
    const jsonPrompt = `${prompt}\n\nRespond with valid JSON only, no markdown or explanation.`;
    const text = await this.generateText(jsonPrompt);

    // JSONを抽出（マークダウンコードブロックを除去）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
      text.match(/```\s*([\s\S]*?)\s*```/) || [null, text];

    try {
      return JSON.parse(jsonMatch[1] || text);
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }
  }
}

// =============================================================================
// OpenAI Provider (Fallback)
// =============================================================================

class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async generateText(prompt: string, options?: { maxTokens?: number }): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: options?.maxTokens || 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateJSON<T>(prompt: string, _schema: string): Promise<T> {
    const jsonPrompt = `${prompt}\n\nRespond with valid JSON only, no markdown or explanation.`;
    const text = await this.generateText(jsonPrompt);

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
      text.match(/```\s*([\s\S]*?)\s*```/) || [null, text];

    try {
      return JSON.parse(jsonMatch[1] || text);
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }
  }
}

// =============================================================================
// AI Content Generator
// =============================================================================

export class AIContentGenerator {
  private provider: AIProvider;

  constructor(provider?: AIProvider) {
    // 優先順位: Anthropic > OpenAI
    if (provider) {
      this.provider = provider;
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.provider = new AnthropicProvider();
    } else if (process.env.OPENAI_API_KEY) {
      this.provider = new OpenAIProvider();
    } else {
      throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
    }
  }

  /**
   * ブログ記事のアイデア・下書きを生成
   */
  async generateBlogIdea(
    topic: string,
    options?: { keywords?: string[]; targetAudience?: string }
  ): Promise<GeneratedBlogContent> {
    const prompt = `
あなたはB2Bマーケティングのコンテンツライターです。
以下のトピックについて、SEOに最適化されたブログ記事のアイデアを生成してください。

トピック: ${topic}
${options?.keywords ? `キーワード: ${options.keywords.join(', ')}` : ''}
${options?.targetAudience ? `ターゲット読者: ${options.targetAudience}` : ''}

以下のJSON形式で回答してください:
{
  "title": { "ja": "日本語タイトル", "en": "English Title" },
  "excerpt": { "ja": "日本語の要約（100-150文字）", "en": "English excerpt (100-150 chars)" },
  "outline": ["セクション1", "セクション2", "セクション3"],
  "suggestedTags": ["タグ1", "タグ2"]
}
`;

    return this.provider.generateJSON<GeneratedBlogContent>(prompt, 'GeneratedBlogContent');
  }

  /**
   * FAQを自動生成
   */
  async generateFAQs(topic: string, count = 5, category?: string): Promise<GeneratedFAQ[]> {
    const prompt = `
あなたはカスタマーサポートの専門家です。
以下のトピックについて、よくある質問と回答を${count}件生成してください。

トピック: ${topic}
${category ? `カテゴリ: ${category}` : ''}

各FAQは以下のJSON形式の配列で回答してください:
[
  {
    "question": { "ja": "日本語の質問", "en": "English question" },
    "answer": { "ja": "日本語の回答（詳しく）", "en": "English answer (detailed)" },
    "category": "${category || 'general'}"
  }
]
`;

    return this.provider.generateJSON<GeneratedFAQ[]>(prompt, 'GeneratedFAQ[]');
  }

  /**
   * 診断フォームの質問を生成
   */
  async generateDiagnosticQuestions(
    topic: string,
    count = 5,
    questionType: 'single' | 'multiple' | 'scale' = 'single'
  ): Promise<GeneratedDiagnosticQuestion[]> {
    const prompt = `
あなたはビジネスコンサルタントです。
以下のトピックについて、診断フォーム用の質問を${count}件生成してください。

トピック: ${topic}
質問タイプ: ${questionType}

${questionType === 'single' ? '各質問には4つの選択肢を用意し、スコア（0-10）を付けてください。' : ''}
${questionType === 'multiple' ? '各質問には複数選択可能な選択肢を4-6個用意してください。' : ''}
${questionType === 'scale' ? '1-10のスケールで評価する質問を作成してください。' : ''}

以下のJSON形式の配列で回答してください:
[
  {
    "questionText": { "ja": "日本語の質問", "en": "English question" },
    "questionType": "${questionType}",
    ${
      questionType !== 'scale'
        ? `"options": [
      { "label": { "ja": "選択肢1", "en": "Option 1" }, "value": "option1", "score": 5 }
    ]`
        : ''
    }
  }
]
`;

    return this.provider.generateJSON<GeneratedDiagnosticQuestion[]>(
      prompt,
      'GeneratedDiagnosticQuestion[]'
    );
  }

  /**
   * SEOメタデータを最適化
   */
  async optimizeSEO(
    content: { title: string; body: string },
    targetKeywords?: string[]
  ): Promise<GeneratedSEO> {
    const prompt = `
あなたはSEOの専門家です。
以下のコンテンツに対して、最適化されたSEOメタデータを生成してください。

タイトル: ${content.title}
本文（抜粋）: ${content.body.substring(0, 500)}
${targetKeywords ? `ターゲットキーワード: ${targetKeywords.join(', ')}` : ''}

以下の要件を満たしてください:
- metaTitle: 50-60文字
- metaDescription: 120-160文字
- keywords: 5-10個

JSON形式で回答:
{
  "metaTitle": { "ja": "最適化されたタイトル", "en": "Optimized Title" },
  "metaDescription": { "ja": "最適化された説明文", "en": "Optimized description" },
  "keywords": ["keyword1", "keyword2"]
}
`;

    return this.provider.generateJSON<GeneratedSEO>(prompt, 'GeneratedSEO');
  }

  /**
   * 既存コンテンツを改善
   */
  async improveContent(
    content: string,
    improvements: ('clarity' | 'seo' | 'engagement' | 'tone')[]
  ): Promise<string> {
    const improvementInstructions = {
      clarity: '文章をより明確で読みやすくする',
      seo: 'SEOを意識した自然なキーワード配置',
      engagement: '読者のエンゲージメントを高める表現',
      tone: 'プロフェッショナルなトーンに調整',
    };

    const instructions = improvements.map((i) => improvementInstructions[i]).join('\n- ');

    const prompt = `
以下のコンテンツを改善してください。

改善ポイント:
- ${instructions}

元のコンテンツ:
${content}

改善されたコンテンツのみを返してください（説明不要）:
`;

    return this.provider.generateText(prompt, { maxTokens: 2048 });
  }

  /**
   * コンテンツを翻訳
   */
  async translateContent(content: string, from: 'ja' | 'en', to: 'ja' | 'en'): Promise<string> {
    const fromLang = from === 'ja' ? '日本語' : 'English';
    const toLang = to === 'ja' ? '日本語' : 'English';

    const prompt = `
Translate the following ${fromLang} text to ${toLang}.
Maintain the original tone and meaning.
Only return the translated text, no explanations.

Original (${fromLang}):
${content}

Translation (${toLang}):
`;

    return this.provider.generateText(prompt, { maxTokens: 2048 });
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let generatorInstance: AIContentGenerator | null = null;

/**
 * AIコンテンツジェネレーターのインスタンスを取得
 */
export function getAIContentGenerator(): AIContentGenerator {
  if (!generatorInstance) {
    generatorInstance = new AIContentGenerator();
  }
  return generatorInstance;
}

/**
 * テスト用: インスタンスをリセット
 */
export function resetAIContentGenerator(): void {
  generatorInstance = null;
}
