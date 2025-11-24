import { Locales, type IntlayerConfig } from 'intlayer';

/**
 * Intlayer Configuration
 *
 * マルチテナントSaaS向けの国際化設定
 * - 日本語（ja）: デフォルトロケール
 * - 英語（en）: セカンダリロケール
 */
const config: IntlayerConfig = {
  /**
   * 対応言語設定
   */
  internationalization: {
    // サポートするロケール
    locales: [Locales.JAPANESE, Locales.ENGLISH],

    // デフォルトロケール（日本市場向けSaaS）
    defaultLocale: Locales.JAPANESE,

    // Strict mode: 翻訳キーが見つからない場合にエラーをスロー（開発時）
    strictMode: process.env.NODE_ENV === 'development' ? 'strict' : 'required_only',
  },

  /**
   * コンテンツディレクトリ設定
   */
  content: {
    // コンテンツファイルの拡張子パターン
    fileExtensions: ['.content.ts', '.content.tsx'],

    // コンテンツファイルの検索パス
    baseDir: process.cwd(),

    // 除外するディレクトリ
    excludedPath: [
      'node_modules',
      '.next',
      '.git',
      'dist',
      'build',
      'coverage',
      'test',
      '__tests__',
    ],

    // マルチテナント対応: テナント別のコンテンツオーバーライドを許可
    dictionaryOutput: ['./locales'],

    // TypeScript型定義の出力先
    typesOutput: ['./types/intlayer.d.ts'],
  },

  /**
   * エディタ設定（Intlayer Visual Editor用）
   */
  editor: {
    // エディタを有効化（開発環境のみ）
    enabled: process.env.NODE_ENV === 'development',

    // エディタのポート
    port: 4000,

    // バックエンドURL（必要に応じて設定）
    backendURL: process.env.INTLAYER_BACKEND_URL,

    // クライアントID（認証用）
    clientId: process.env.INTLAYER_CLIENT_ID,

    // クライアントシークレット（認証用）
    clientSecret: process.env.INTLAYER_CLIENT_SECRET,
  },

  /**
   * Next.js統合設定
   */
  middleware: {
    // URLに自動的にロケールプレフィックスを追加
    prefixDefault: true,

    // ロケール検出の優先順位
    // 1. URLパス (/ja/*, /en/*)
    // 2. Cookie (NEXT_LOCALE)
    // 3. Accept-Language ヘッダー
    // 4. デフォルトロケール
    noPrefix: false,

    // ミドルウェアを適用しないパス
    ignoredPaths: [
      '/api',
      '/_next',
      '/static',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ],
  },
};

export default config;
