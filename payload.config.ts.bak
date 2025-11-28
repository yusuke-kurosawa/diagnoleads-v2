/**
 * PayloadCMS Configuration
 *
 * Phase 4.3: PayloadCMS統合
 *
 * @see https://payloadcms.com/docs/getting-started/installation
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import sharp from 'sharp';

// Collections
import { FAQs } from './lib/cms/collections/FAQs';
import { BlogPosts } from './lib/cms/collections/BlogPosts';
import { AssessmentTemplates } from './lib/cms/collections/AssessmentTemplates';
import { Media } from './lib/cms/collections/Media';
import { Authors } from './lib/cms/collections/Authors';
import { Categories } from './lib/cms/collections/Categories';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  // =============================================================================
  // Admin Configuration
  // =============================================================================
  admin: {
    // Payload Admin UIは /admin パスで提供
    // ただし、本アプリケーションではPayload Admin UIは使用せず、
    // Local APIのみを使用する設計
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' - DiagnoLeads CMS',
      favicon: '/favicon.ico',
      ogImage: '/og-image.png',
    },
  },

  // =============================================================================
  // Database Configuration
  // =============================================================================
  db: postgresAdapter({
    pool: {
      connectionString: process.env.PAYLOAD_DATABASE_URL || process.env.DATABASE_URL || '',
    },
    // PayloadCMS用のテーブルにはプレフィックスを付与
    // 既存のDrizzleテーブルとの衝突を防ぐ
    schemaName: 'payload',
    push: process.env.NODE_ENV === 'development',
  }),

  // =============================================================================
  // Rich Text Editor
  // =============================================================================
  editor: lexicalEditor({}),

  // =============================================================================
  // Collections
  // =============================================================================
  collections: [
    FAQs,
    BlogPosts,
    AssessmentTemplates,
    Media,
    Authors,
    Categories,
  ],

  // =============================================================================
  // Globals (Site-wide settings)
  // =============================================================================
  globals: [],

  // =============================================================================
  // Localization
  // =============================================================================
  localization: {
    locales: [
      {
        label: '日本語',
        code: 'ja',
      },
      {
        label: 'English',
        code: 'en',
      },
    ],
    defaultLocale: 'ja',
    fallback: true,
  },

  // =============================================================================
  // TypeScript Configuration
  // =============================================================================
  typescript: {
    outputFile: path.resolve(dirname, 'lib/cms/payload-types.ts'),
  },

  // =============================================================================
  // Secret
  // =============================================================================
  secret: process.env.PAYLOAD_SECRET || process.env.BETTER_AUTH_SECRET || '',

  // =============================================================================
  // Image Processing
  // =============================================================================
  sharp,

  // =============================================================================
  // Plugins
  // =============================================================================
  plugins: [],

  // =============================================================================
  // GraphQL (disabled - we use tRPC/Local API)
  // =============================================================================
  graphQL: {
    disable: true,
  },

  // =============================================================================
  // CORS (handled by Next.js)
  // =============================================================================
  cors: ['http://localhost:3000'],

  // =============================================================================
  // Debug
  // =============================================================================
  debug: process.env.NODE_ENV === 'development',

  // =============================================================================
  // Telemetry
  // =============================================================================
  telemetry: false,
});
