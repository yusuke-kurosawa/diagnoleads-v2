import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { buildConfig } from 'payload';
import { ja } from '@payloadcms/translations/languages/ja';
import { en } from '@payloadcms/translations/languages/en';
import sharp from 'sharp';

import { Users, Media, DiagnosticForms, BlogPosts, FAQs, LandingPages } from './cms/collections';

/**
 * Payload CMS Configuration
 * Headless CMS for managing content in DiagnoLeads
 */
export default buildConfig({
  // Admin panel settings
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- DiagnoLeads CMS',
      icons: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          url: '/favicon.ico',
        },
      ],
    },
    // Custom DiagnoLeads branding
    components: {
      graphics: {
        Logo: '/cms/components/Logo#Logo',
        Icon: '/cms/components/Icon#Icon',
      },
      providers: ['/cms/components/StyleProvider#StyleProvider'],
    },
  },

  // Collections
  collections: [Users, Media, DiagnosticForms, BlogPosts, FAQs, LandingPages],

  // Global configuration
  globals: [],

  // Rich text editor
  editor: lexicalEditor(),

  // Secret key
  secret: process.env.PAYLOAD_SECRET || 'your-secret-key-change-in-production',

  // TypeScript output
  typescript: {
    outputFile: 'cms/payload-types.ts',
  },

  // Database adapter - PostgreSQL with separate schema
  // push: true enables automatic schema synchronization during development
  // For production, consider using migrations instead
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    schemaName: 'cms',
    push: true,
  }),

  // Image processing
  sharp,

  // Localization (content languages)
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

  // i18n (admin UI language)
  i18n: {
    supportedLanguages: { ja, en },
    fallbackLanguage: 'ja',
  },

  // Upload settings
  upload: {
    limits: {
      fileSize: 10000000, // 10MB
    },
  },
});
