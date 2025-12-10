/**
 * Figma Integration for Payload CMS
 *
 * Figma買収後のシナジーを見据えた連携準備
 * - コンポーネントIDとPayloadコレクションのマッピング
 * - デザイントークンの同期
 * - Figma Sitesとの統合準備
 *
 * @see https://uithings.com/blog/figma-acquires-payload/
 */

// =============================================================================
// Types
// =============================================================================

/**
 * FigmaコンポーネントとPayloadコレクションのマッピング
 */
export interface ComponentMapping {
  figmaComponentId: string;
  figmaComponentName: string;
  payloadCollection: string;
  payloadFields: FieldMapping[];
  description?: string;
}

export interface FieldMapping {
  figmaPropertyName: string;
  payloadFieldName: string;
  transform?: 'text' | 'richtext' | 'image' | 'link' | 'date' | 'number';
  localized?: boolean;
}

/**
 * Figmaデザイントークン
 */
export interface DesignToken {
  name: string;
  type: 'color' | 'spacing' | 'typography' | 'shadow' | 'radius';
  value: string | number | Record<string, unknown>;
  figmaVariableId?: string;
}

/**
 * Figma Sitesページ定義
 */
export interface FigmaPage {
  figmaFileId: string;
  figmaNodeId: string;
  payloadCollection: 'landing-pages' | 'blog-posts';
  payloadDocumentId?: string;
  slug: string;
  locale: 'ja' | 'en';
}

// =============================================================================
// Component Registry
// =============================================================================

/**
 * Figmaコンポーネント → Payloadコレクションのマッピングレジストリ
 */
const componentRegistry: Map<string, ComponentMapping> = new Map();

/**
 * コンポーネントマッピングを登録
 */
export function registerComponentMapping(mapping: ComponentMapping): void {
  componentRegistry.set(mapping.figmaComponentId, mapping);
}

/**
 * コンポーネントマッピングを取得
 */
export function getComponentMapping(figmaComponentId: string): ComponentMapping | undefined {
  return componentRegistry.get(figmaComponentId);
}

/**
 * すべてのコンポーネントマッピングを取得
 */
export function getAllComponentMappings(): ComponentMapping[] {
  return Array.from(componentRegistry.values());
}

// =============================================================================
// Default Component Mappings
// =============================================================================

/**
 * DiagnoLeadsのデフォルトコンポーネントマッピングを初期化
 */
export function initializeDefaultMappings(): void {
  // Hero Section → LandingPages.hero
  registerComponentMapping({
    figmaComponentId: 'hero-section',
    figmaComponentName: 'Hero Section',
    payloadCollection: 'landing-pages',
    payloadFields: [
      { figmaPropertyName: 'headline', payloadFieldName: 'hero.heading', localized: true },
      { figmaPropertyName: 'subheadline', payloadFieldName: 'hero.subheading', localized: true },
      { figmaPropertyName: 'badge', payloadFieldName: 'hero.badge', localized: true },
      { figmaPropertyName: 'ctaText', payloadFieldName: 'hero.primaryCta.text', localized: true },
      { figmaPropertyName: 'ctaLink', payloadFieldName: 'hero.primaryCta.link', transform: 'link' },
      {
        figmaPropertyName: 'backgroundImage',
        payloadFieldName: 'hero.backgroundImage',
        transform: 'image',
      },
    ],
    description: 'Landing page hero section with headline, CTA, and background',
  });

  // Blog Card → BlogPosts
  registerComponentMapping({
    figmaComponentId: 'blog-card',
    figmaComponentName: 'Blog Card',
    payloadCollection: 'blog-posts',
    payloadFields: [
      { figmaPropertyName: 'title', payloadFieldName: 'title', localized: true },
      { figmaPropertyName: 'excerpt', payloadFieldName: 'excerpt', localized: true },
      { figmaPropertyName: 'coverImage', payloadFieldName: 'coverImage', transform: 'image' },
      { figmaPropertyName: 'category', payloadFieldName: 'category' },
      { figmaPropertyName: 'publishedAt', payloadFieldName: 'publishedAt', transform: 'date' },
    ],
    description: 'Blog post card component',
  });

  // FAQ Item → FAQs
  registerComponentMapping({
    figmaComponentId: 'faq-item',
    figmaComponentName: 'FAQ Item',
    payloadCollection: 'faqs',
    payloadFields: [
      { figmaPropertyName: 'question', payloadFieldName: 'question', localized: true },
      {
        figmaPropertyName: 'answer',
        payloadFieldName: 'answer',
        transform: 'richtext',
        localized: true,
      },
      { figmaPropertyName: 'category', payloadFieldName: 'category' },
    ],
    description: 'FAQ accordion item',
  });

  // Diagnostic Form → DiagnosticForms
  registerComponentMapping({
    figmaComponentId: 'diagnostic-form',
    figmaComponentName: 'Diagnostic Form',
    payloadCollection: 'diagnostic-forms',
    payloadFields: [
      { figmaPropertyName: 'title', payloadFieldName: 'title', localized: true },
      { figmaPropertyName: 'description', payloadFieldName: 'description', localized: true },
      { figmaPropertyName: 'coverImage', payloadFieldName: 'coverImage', transform: 'image' },
    ],
    description: 'Multi-step diagnostic questionnaire',
  });

  // Question Card → DiagnosticForms.steps.questions
  registerComponentMapping({
    figmaComponentId: 'question-card',
    figmaComponentName: 'Question Card',
    payloadCollection: 'diagnostic-forms',
    payloadFields: [
      {
        figmaPropertyName: 'questionText',
        payloadFieldName: 'steps.questions.questionText',
        localized: true,
      },
      { figmaPropertyName: 'questionType', payloadFieldName: 'steps.questions.questionType' },
      {
        figmaPropertyName: 'placeholder',
        payloadFieldName: 'steps.questions.placeholder',
        localized: true,
      },
    ],
    description: 'Diagnostic form question component',
  });
}

// =============================================================================
// Design Token Sync
// =============================================================================

const designTokens: Map<string, DesignToken> = new Map();

/**
 * デザイントークンを登録
 */
export function registerDesignToken(token: DesignToken): void {
  designTokens.set(token.name, token);
}

/**
 * デザイントークンを取得
 */
export function getDesignToken(name: string): DesignToken | undefined {
  return designTokens.get(name);
}

/**
 * すべてのデザイントークンを取得
 */
export function getAllDesignTokens(): DesignToken[] {
  return Array.from(designTokens.values());
}

/**
 * デザイントークンをCSS変数に変換
 */
export function tokensToCSS(): string {
  const tokens = getAllDesignTokens();
  const cssVars: string[] = [];

  for (const token of tokens) {
    const varName = `--${token.name.replace(/\./g, '-')}`;

    if (typeof token.value === 'string' || typeof token.value === 'number') {
      cssVars.push(`  ${varName}: ${token.value};`);
    }
  }

  return `:root {\n${cssVars.join('\n')}\n}`;
}

// =============================================================================
// Figma API Integration (Future)
// =============================================================================

/**
 * Figma API Response Types
 */
interface FigmaFile {
  name: string;
  lastModified: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponentMeta>;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  characters?: string;
  style?: Record<string, unknown>;
}

interface FigmaComponentMeta {
  key: string;
  name: string;
  description: string;
  documentationLinks?: string[];
}

interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';
  valuesByMode: Record<string, unknown>;
}

interface FigmaVariablesResponse {
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<
      string,
      { id: string; name: string; modes: Array<{ modeId: string; name: string }> }
    >;
  };
}

/**
 * Figma APIクライアント
 * Figma REST APIを使用してファイル、コンポーネント、変数を取得
 */
export class FigmaClient {
  private accessToken: string;
  private baseUrl = 'https://api.figma.com/v1';

  constructor() {
    this.accessToken = process.env.FIGMA_ACCESS_TOKEN || '';
  }

  /**
   * Figma APIが設定されているかチェック
   */
  isConfigured(): boolean {
    return !!this.accessToken;
  }

  /**
   * Figma APIリクエストヘッダーを取得
   */
  private getHeaders(): HeadersInit {
    return {
      'X-Figma-Token': this.accessToken,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Figmaファイルの詳細を取得
   */
  async getFile(fileId: string): Promise<FigmaFile> {
    if (!this.isConfigured()) {
      throw new Error('Figma API is not configured. Set FIGMA_ACCESS_TOKEN.');
    }

    const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Figma API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Figmaファイルからコンポーネントを取得
   */
  async getFileComponents(fileId: string): Promise<FigmaComponentMeta[]> {
    if (!this.isConfigured()) {
      throw new Error('Figma API is not configured. Set FIGMA_ACCESS_TOKEN.');
    }

    const response = await fetch(`${this.baseUrl}/files/${fileId}/components`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Figma API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return Object.values(data.meta?.components || {}) as FigmaComponentMeta[];
  }

  /**
   * 特定のノードのテキストコンテンツを取得
   */
  async getNodeText(fileId: string, nodeId: string): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('Figma API is not configured. Set FIGMA_ACCESS_TOKEN.');
    }

    const response = await fetch(
      `${this.baseUrl}/files/${fileId}/nodes?ids=${encodeURIComponent(nodeId)}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Figma API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const texts: string[] = [];

    // ノード内のテキストを再帰的に抽出
    const extractText = (node: FigmaNode) => {
      if (node.type === 'TEXT' && node.characters) {
        texts.push(node.characters);
      }
      if (node.children) {
        for (const child of node.children) {
          extractText(child);
        }
      }
    };

    const nodes = data.nodes || {};
    for (const nodeData of Object.values(nodes) as Array<{ document: FigmaNode }>) {
      if (nodeData.document) {
        extractText(nodeData.document);
      }
    }

    return texts;
  }

  /**
   * Figma Variablesからデザイントークンを同期
   */
  async syncDesignTokens(fileId: string): Promise<DesignToken[]> {
    if (!this.isConfigured()) {
      throw new Error('Figma API is not configured. Set FIGMA_ACCESS_TOKEN.');
    }

    const response = await fetch(`${this.baseUrl}/files/${fileId}/variables/local`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Figma API error: ${response.status} - ${error}`);
    }

    const data: FigmaVariablesResponse = await response.json();
    const tokens: DesignToken[] = [];

    const variables = data.meta?.variables || {};
    const collections = data.meta?.variableCollections || {};

    for (const variable of Object.values(variables)) {
      const collection = collections[variable.variableCollectionId];
      const defaultModeId = collection?.modes?.[0]?.modeId;
      const value = defaultModeId ? variable.valuesByMode[defaultModeId] : undefined;

      if (value === undefined) continue;

      let tokenType: DesignToken['type'] = 'color';
      switch (variable.resolvedType) {
        case 'COLOR':
          tokenType = 'color';
          break;
        case 'FLOAT':
          tokenType = 'spacing';
          break;
        case 'STRING':
          tokenType = 'typography';
          break;
      }

      const token: DesignToken = {
        name: variable.name,
        type: tokenType,
        value: value as string | number | Record<string, unknown>,
        figmaVariableId: variable.id,
      };

      tokens.push(token);
      registerDesignToken(token);
    }

    return tokens;
  }

  /**
   * 画像をエクスポート
   */
  async exportImages(
    fileId: string,
    nodeIds: string[],
    format: 'png' | 'svg' | 'jpg' = 'png'
  ): Promise<Record<string, string>> {
    if (!this.isConfigured()) {
      throw new Error('Figma API is not configured. Set FIGMA_ACCESS_TOKEN.');
    }

    const ids = nodeIds.join(',');
    const response = await fetch(
      `${this.baseUrl}/images/${fileId}?ids=${encodeURIComponent(ids)}&format=${format}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Figma API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.images || {};
  }
}

// =============================================================================
// Figma Sites Integration (Future)
// =============================================================================

/**
 * Figma Sitesとの統合マネージャー
 * Figma SitesとPayload CMSのコンテンツ同期を管理
 */
export class FigmaSitesManager {
  private pages: Map<string, FigmaPage> = new Map();
  private client: FigmaClient;

  constructor(client?: FigmaClient) {
    this.client = client || figmaClient;
  }

  /**
   * Figma Sitesページを登録
   */
  registerPage(page: FigmaPage): void {
    const key = `${page.figmaFileId}:${page.figmaNodeId}`;
    this.pages.set(key, page);
  }

  /**
   * すべての登録ページを取得
   */
  getAllPages(): FigmaPage[] {
    return Array.from(this.pages.values());
  }

  /**
   * ページを取得
   */
  getPage(figmaFileId: string, figmaNodeId: string): FigmaPage | undefined {
    return this.pages.get(`${figmaFileId}:${figmaNodeId}`);
  }

  /**
   * スラッグでページを検索
   */
  getPageBySlug(slug: string): FigmaPage | undefined {
    for (const page of this.pages.values()) {
      if (page.slug === slug) {
        return page;
      }
    }
    return undefined;
  }

  /**
   * Figma SitesからPayloadにコンテンツを同期
   */
  async syncPageContent(
    page: FigmaPage
  ): Promise<{ texts: string[]; mappings: ComponentMapping[] }> {
    if (!this.client.isConfigured()) {
      throw new Error('Figma API is not configured. Set FIGMA_ACCESS_TOKEN.');
    }

    // 1. Figma APIからページのテキストコンテンツを取得
    const texts = await this.client.getNodeText(page.figmaFileId, page.figmaNodeId);

    // 2. コンポーネントマッピングを取得
    const mappings = getAllComponentMappings().filter(
      (m) => m.payloadCollection === page.payloadCollection
    );

    // 3. Payload Local APIで保存（実際の保存ロジックは呼び出し側で実装）
    // この関数はテキストとマッピングを返すので、呼び出し側がPayload APIを使用して保存

    return { texts, mappings };
  }

  /**
   * コンポーネントマッピングに基づいてデータを変換
   */
  transformToPayloadData(
    texts: string[],
    mappings: ComponentMapping[],
    locale: 'ja' | 'en'
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    // テキストをマッピングに基づいて配置
    for (const mapping of mappings) {
      for (let i = 0; i < mapping.payloadFields.length && i < texts.length; i++) {
        const fieldMapping = mapping.payloadFields[i];
        const value = texts[i];

        if (fieldMapping.localized) {
          // ローカライズフィールドの場合
          const parts = fieldMapping.payloadFieldName.split('.');
          let current = data;
          for (let j = 0; j < parts.length - 1; j++) {
            if (!current[parts[j]]) {
              current[parts[j]] = {};
            }
            current = current[parts[j]] as Record<string, unknown>;
          }
          const lastPart = parts[parts.length - 1];
          if (!current[lastPart]) {
            current[lastPart] = {};
          }
          (current[lastPart] as Record<string, unknown>)[locale] = value;
        } else {
          // 通常フィールドの場合
          const parts = fieldMapping.payloadFieldName.split('.');
          let current = data;
          for (let j = 0; j < parts.length - 1; j++) {
            if (!current[parts[j]]) {
              current[parts[j]] = {};
            }
            current = current[parts[j]] as Record<string, unknown>;
          }
          current[parts[parts.length - 1]] = value;
        }
      }
    }

    return data;
  }

  /**
   * デザイントークンをTailwind設定に変換
   */
  generateTailwindConfig(): string {
    const tokens = getAllDesignTokens();
    const colors: Record<string, string> = {};
    const spacing: Record<string, string> = {};

    for (const token of tokens) {
      if (token.type === 'color' && typeof token.value === 'string') {
        colors[token.name.replace(/\./g, '-')] = token.value;
      } else if (token.type === 'spacing' && typeof token.value === 'number') {
        spacing[token.name.replace(/\./g, '-')] = `${token.value}px`;
      }
    }

    return `// Auto-generated from Figma Variables
// Do not edit manually

export const figmaColors = ${JSON.stringify(colors, null, 2)};

export const figmaSpacing = ${JSON.stringify(spacing, null, 2)};
`;
  }
}

// =============================================================================
// Initialization
// =============================================================================

// デフォルトマッピングを初期化
initializeDefaultMappings();

// シングルトンインスタンス
export const figmaClient = new FigmaClient();
export const figmaSitesManager = new FigmaSitesManager();
